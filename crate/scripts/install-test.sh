#!/usr/bin/env bash
set -euo pipefail

# Run after npm run build. Requires Node 22+, npm, Bash, curl, and Playwright's
# Chromium (npx playwright install chromium, or set CHROMIUM_PATH).
# From crate/: bash scripts/install-test.sh [next|vite|themed]
#   next    install into a fresh Next.js app and drive every state (default)
#   vite    the same in a fresh Vite + React app
#   themed  install into a Next.js app with a non-default shadcn theme
#           (colors, radius, font) and check every component uses that theme
mode="${1:-next}"
case "$mode" in
  next | themed) framework="next" ;;
  vite) framework="vite" ;;
  *)
    echo "Usage: bash scripts/install-test.sh [next|vite|themed]" >&2
    exit 2
    ;;
esac
crate_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$crate_dir"
if [[ ! -f out/r/all.json ]]; then
  echo "Missing out/r/all.json. Run npm run build in crate/ first." >&2
  exit 1
fi

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/crate-install.XXXXXX")"
server_pid=""
app_pid=""
# Give each background server its own process group, so cleanup can stop the
# whole tree: npx starts next start, which starts next-server.
set -m
cleanup() {
  for pid in "$server_pid" "$app_pid"; do
    if [[ -n "$pid" ]]; then
      kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
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
app_dir="$temp_dir/consumer"

if [[ "$framework" == "next" ]]; then
  npx --yes create-next-app@latest "$app_dir" \
    --typescript --tailwind --app --no-src-dir --no-react-compiler \
    --import-alias '@/*' --use-npm --disable-git --yes
  cd "$app_dir"
else
  # A Vite + React app set up the way shadcn's Vite guide describes: Tailwind
  # through @tailwindcss/vite, and an @ alias for src/ in Vite and TypeScript.
  # create-vite treats an absolute target as relative, so pass a bare name.
  (cd "$temp_dir" && npx --yes create-vite@latest consumer --template react-ts --no-interactive)
  cd "$app_dir"
  npm install
  npm install tailwindcss @tailwindcss/vite
  echo '@import "tailwindcss";' > src/index.css
  cat > vite.config.ts <<'TS'
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
TS
  # Both tsconfig files need the alias (tsconfig.app.json may hold comments).
  node -e '
    const fs = require("node:fs");
    const root = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
    root.compilerOptions = { ...root.compilerOptions, paths: { "@/*": ["./src/*"] } };
    fs.writeFileSync("tsconfig.json", JSON.stringify(root, null, 2) + "\n");
    const app = fs.readFileSync("tsconfig.app.json", "utf8");
    if (!app.includes("\"compilerOptions\": {")) throw new Error("Unexpected tsconfig.app.json");
    fs.writeFileSync("tsconfig.app.json",
      app.replace("\"compilerOptions\": {", "\"compilerOptions\": {\n    \"paths\": { \"@/*\": [\"./src/*\"] },"));
  '
fi

npx --yes shadcn@latest init --defaults --yes
if [[ "$mode" == "themed" ]]; then
  # Make it an existing app with its own look before Crate arrives.
  cat "$crate_dir/scripts/fixtures/host-theme.css" >> app/globals.css
fi
npx --yes shadcn@latest add "http://localhost:$port/r/all.json" --yes

if [[ "$mode" == "next" ]]; then
  # The @crate namespace and the agent skill, as the README sets them up.
  npx --yes shadcn@latest registry add "@crate=http://localhost:$port/r/{name}.json"
  npx --yes shadcn@latest search @crate > "$temp_dir/search.txt"
  grep -q "@crate/thinking" "$temp_dir/search.txt"
  npx --yes shadcn@latest view @crate/use-agent-status > /dev/null
  npx --yes shadcn@latest add @crate/crate-skill --yes
  for pair in \
    "agent-skill/dist/claude/SKILL.md:.claude/skills/crate/SKILL.md" \
    "agent-skill/dist/cursor/crate.mdc:.cursor/rules/crate.mdc" \
    "agent-skill/dist/agents/crate.md:.agents/crate.md"; do
    if ! cmp -s "$crate_dir/${pair%%:*}" "${pair#*:}"; then
      echo "Agent skill file missing or different: ${pair#*:}" >&2
      exit 1
    fi
  done
  echo "PASS @crate namespace: search, view, and the agent skill for Claude Code, Cursor, and Codex"
fi

if [[ "$framework" == "next" ]]; then
  # Avoid remote font downloads.
  cat > app/layout.tsx <<'TSX'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
TSX
fi
if [[ "$mode" == "themed" ]]; then
  # Every component, side by side.
  cp "$crate_dir/scripts/fixtures/themed-page.tsx" app/page.tsx
else
  # Drive useAgentStatus with a real useChat and a mocked AI SDK stream.
  npm install ai @ai-sdk/react
  if [[ "$framework" == "next" ]]; then
    cp "$crate_dir/scripts/fixtures/mock-chat.tsx" app/page.tsx
  else
    cp "$crate_dir/scripts/fixtures/mock-chat.tsx" src/App.tsx
  fi
fi
npm run build

# Serve the consumer app and check every state in a browser.
app_port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
if [[ "$framework" == "next" ]]; then
  npx next start -p "$app_port" > "$temp_dir/app.log" 2>&1 &
else
  npx vite preview --host 127.0.0.1 --port "$app_port" --strictPort > "$temp_dir/app.log" 2>&1 &
fi
app_pid=$!
for ((attempt = 0; attempt < 100; attempt++)); do
  if curl --fail --silent --output /dev/null "http://localhost:$app_port"; then
    break
  fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$temp_dir/app.log" >&2
    exit 1
  fi
  sleep 0.2
done
# Run the checks from crate/ so screenshots land in crate's SCREENSHOT_DIR.
cd "$crate_dir"
if [[ "$mode" == "themed" ]]; then
  node "$crate_dir/scripts/theme-check.mjs" "http://localhost:$app_port"
else
  node "$crate_dir/scripts/stream-test.mjs" "http://localhost:$app_port"
fi
