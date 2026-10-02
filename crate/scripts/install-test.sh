#!/usr/bin/env bash
set -euo pipefail

# Run after npm run build. Requires Node 22+, npm, Bash, and curl.
# From crate/: bash scripts/install-test.sh
crate_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$crate_dir"
if [[ ! -f out/r/all.json ]]; then
  echo "Missing out/r/all.json. Run npm run build in crate/ first." >&2
  exit 1
fi

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/crate-install.XXXXXX")"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf -- "$temp_dir"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Let the server choose a free port, then read its readiness message.
PORT=0 node scripts/serve-out.mjs > "$temp_dir/server.log" 2>&1 &
server_pid=$!
port=""
for ((attempt = 0; attempt < 100; attempt++)); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    cat "$temp_dir/server.log" >&2
    exit 1
  fi
  port="$(sed -n 's/^Serving out at http:\/\/127\.0\.0\.1:\([0-9]*\)$/\1/p' "$temp_dir/server.log" | tr -d '\r')"
  if [[ -n "$port" ]] && curl --fail --silent --output /dev/null "http://localhost:$port/r/all.json"; then
    break
  fi
  sleep 0.1
done
if [[ -z "$port" ]] || ! curl --fail --silent --show-error --output /dev/null "http://localhost:$port/r/all.json"; then
  cat "$temp_dir/server.log" >&2
  echo "The registry server did not become ready." >&2
  exit 1
fi

# Use the public CLIs without inheriting dependencies from the Crate app.
export CI=1 NEXT_TELEMETRY_DISABLED=1
npx --yes create-next-app@latest "$temp_dir/consumer" \
  --typescript --tailwind --app --no-src-dir --no-react-compiler \
  --import-alias '@/*' --use-npm --disable-git --yes
cd "$temp_dir/consumer"
npx --yes shadcn@latest init --defaults --yes
npx --yes shadcn@latest add "http://localhost:$port/r/all.json" --yes

# Avoid remote font downloads and compile real imports of the installed API.
cat > app/layout.tsx <<'TSX'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
TSX
cat > app/page.tsx <<'TSX'
"use client";

import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

export default function Page() {
  const status = useAgentStatus({ status: "ready", messages: [] });
  return <AgentState status={status} />;
}
TSX
npm run build
