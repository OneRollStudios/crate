#!/usr/bin/env bash

set -u

SITE_URL="https://crate.onerollstudios.com"
REGISTRY_URL="${SITE_URL}/r/all.json"
FAILED=0
TEMP_ROOT=""

pass() { printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1"; FAILED=1; }
cleanup() { if [[ -n "${TEMP_ROOT}" && -d "${TEMP_ROOT}" ]]; then rm -rf -- "${TEMP_ROOT}"; fi; }
trap cleanup EXIT

HOME_CODE="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' "${SITE_URL}" || true)"
if [[ "${HOME_CODE}" == "200" ]]; then
  pass "homepage returns HTTP 200"
else
  fail "homepage returned HTTP ${HOME_CODE:-request-error}"
fi

REGISTRY_FILE="$(mktemp)"
REGISTRY_CODE="$(curl --silent --show-error --location --output "${REGISTRY_FILE}" --write-out '%{http_code}' "${REGISTRY_URL}" || true)"
if [[ "${REGISTRY_CODE}" == "200" ]] && node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))' "${REGISTRY_FILE}" >/dev/null 2>&1; then
  pass "all.json returns valid JSON"
else
  fail "all.json is unavailable or invalid"
fi
rm -f -- "${REGISTRY_FILE}"

TEMP_ROOT="$(mktemp -d)"
TEST_APP="${TEMP_ROOT}/crate-registry-check"
if npx create-next-app@latest "${TEST_APP}" --ts --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm --yes --disable-git >/dev/null 2>&1 \
  && cd "${TEST_APP}" \
  && npx shadcn@latest init -d >/dev/null 2>&1 \
  && npx shadcn@latest add "${REGISTRY_URL}" -y >/dev/null 2>&1; then
  pass "all registry item installs in a fresh Next.js + shadcn project"
else
  fail "all registry item failed to install in a fresh project"
fi

if [[ "${FAILED}" -eq 0 ]]; then
  printf 'PASS: all live verification checks completed\n'
else
  printf 'FAIL: one or more live verification checks failed\n'
fi

exit "${FAILED}"
