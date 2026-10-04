#!/usr/bin/env bash
# Checks the deployed site the way a visitor, a coding agent, and a developer
# installing Crate would meet it:
#   1. the homepage loads
#   2. /r/all.json is valid JSON
#   3. /llms.txt loads and every link in it loads
#   4. a real install from /r/all.json into a fresh Next.js + shadcn app builds
#
# Usage: bash scripts/verify-live.sh [site-url]
# The site defaults to https://crate.onerollstudios.com. Pass a preview URL to
# check a preview instead; llms.txt links to the live domain are then checked
# on that preview. Needs Node 22+, npm, curl, and internet access.
# Prints one PASS or FAIL line per check and exits 1 if any check failed.

set -u

LIVE_URL="https://crate.onerollstudios.com"
SITE_URL="${1:-${SITE_URL:-$LIVE_URL}}"
SITE_URL="${SITE_URL%/}"
REGISTRY_URL="${SITE_URL}/r/all.json"
FAILED=0
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/crate-live.XXXXXX")"

pass() { printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1"; FAILED=1; }
cleanup() { rm -rf -- "${TEMP_ROOT}"; }
trap cleanup EXIT

# Prints the HTTP status of a GET (000 if the request failed), saving the body.
fetch() {
  curl --silent --location --retry 2 --retry-all-errors --max-time 30 \
    --output "$2" --write-out '%{http_code}' "$1" || true
}

# Runs a command with its output in a log; on failure prints the log's tail.
run_logged() {
  local log="$1"
  shift
  if "$@" >"${log}" 2>&1; then
    return 0
  fi
  printf -- '--- last 40 lines of: %s\n' "$*"
  tail -n 40 "${log}"
  printf -- '---\n'
  return 1
}

echo "Checking ${SITE_URL}"

# 1. Homepage
code="$(fetch "${SITE_URL}/" "${TEMP_ROOT}/home.html")"
if [[ "${code}" == "200" ]]; then
  pass "homepage returns HTTP 200"
else
  fail "homepage returned HTTP ${code}"
fi

# 2. Registry
code="$(fetch "${REGISTRY_URL}" "${TEMP_ROOT}/all.json")"
if [[ "${code}" == "200" ]] && node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))' "${TEMP_ROOT}/all.json" 2>/dev/null; then
  pass "all.json returns valid JSON"
else
  fail "all.json returned HTTP ${code} or invalid JSON"
fi

# 3. llms.txt and every Markdown link in it
code="$(fetch "${SITE_URL}/llms.txt" "${TEMP_ROOT}/llms.txt")"
if [[ "${code}" == "200" && -s "${TEMP_ROOT}/llms.txt" ]]; then
  pass "llms.txt returns HTTP 200"
  links="$(grep -oE '\]\(https?://[^)[:space:]]+\)' "${TEMP_ROOT}/llms.txt" | sed -e 's/^](//' -e 's/)$//' | sort -u)"
  total=0
  broken=0
  for link in ${links}; do
    url="${link}"
    [[ "${url}" == "${LIVE_URL}"* ]] && url="${SITE_URL}${url#"$LIVE_URL"}"
    total=$((total + 1))
    code="$(fetch "${url}" "${TEMP_ROOT}/link")"
    if [[ "${code}" != "200" || ! -s "${TEMP_ROOT}/link" ]]; then
      fail "llms.txt link ${url} returned HTTP ${code}"
      broken=$((broken + 1))
    fi
  done
  if [[ "${total}" -eq 0 ]]; then
    fail "llms.txt contains no links"
  elif [[ "${broken}" -eq 0 ]]; then
    pass "all ${total} llms.txt links return HTTP 200"
  fi
else
  fail "llms.txt returned HTTP ${code} or was empty"
fi

# 4. Real install from the live registry into a fresh app, then a production
# build that imports the installed components and hook.
export CI=1 NEXT_TELEMETRY_DISABLED=1
APP="${TEMP_ROOT}/consumer"
if run_logged "${TEMP_ROOT}/create.log" npx --yes create-next-app@latest "${APP}" \
    --typescript --tailwind --app --no-src-dir --no-react-compiler \
    --import-alias '@/*' --use-npm --disable-git --yes \
  && cd "${APP}" \
  && run_logged "${TEMP_ROOT}/init.log" npx --yes shadcn@latest init --defaults --yes \
  && run_logged "${TEMP_ROOT}/add.log" npx --yes shadcn@latest add "${REGISTRY_URL}" --yes; then
  pass "all.json installs into a fresh Next.js + shadcn app"
  # Skip remote font downloads; render a component and use the hook.
  cat > app/layout.tsx <<'TSX'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
TSX
  cat > app/page.tsx <<'TSX'
"use client";

import { AgentState, CrateProvider } from "@/components/agent-wait-states";
import { useAgentStatus } from "@/hooks/use-agent-status";

export default function Page() {
  const status = useAgentStatus({ status: "submitted", messages: [] });
  return (
    <CrateProvider>
      <AgentState status={status} />
    </CrateProvider>
  );
}
TSX
  if run_logged "${TEMP_ROOT}/build.log" npm run build; then
    pass "the installed app builds"
  else
    fail "the installed app failed to build"
  fi
else
  fail "all.json failed to install into a fresh Next.js + shadcn app"
fi

if [[ "${FAILED}" -eq 0 ]]; then
  printf 'PASS: all live checks passed\n'
else
  printf 'FAIL: one or more live checks failed\n'
fi
exit "${FAILED}"
