#!/usr/bin/env bash
set -euo pipefail

# Builds this example and drives it in Chromium in mock mode (no API key, no
# model calls) with crate/scripts/real-chat-test.mjs. Run from anywhere after
# `npm install` in crate/ (the test uses crate's Playwright):
#   bash examples/real-chat/scripts/ci-test.sh
example_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
crate_dir="$(cd -- "$example_dir/../../crate" && pwd)"
cd "$example_dir"

export CRATE_MOCK=1 NEXT_TELEMETRY_DISABLED=1
unset ANTHROPIC_API_KEY
npm install --no-audit --no-fund
npm run build

port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
log="$(mktemp)"
npx next start -p "$port" > "$log" 2>&1 &
app_pid=$!
trap 'kill "$app_pid" 2>/dev/null || true; wait "$app_pid" 2>/dev/null || true; rm -f "$log"' EXIT

for ((attempt = 0; attempt < 100; attempt++)); do
  if curl --fail --silent --output /dev/null "http://localhost:$port"; then
    break
  fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$log" >&2
    exit 1
  fi
  sleep 0.2
done

cd "$crate_dir"
node scripts/real-chat-test.mjs "http://localhost:$port"
