#!/usr/bin/env bash
set -euo pipefail

# Run after npm run build. Requires Node 22+, npm, Bash, curl, and Playwright's
# Chromium (npx playwright install chromium, or set CHROMIUM_PATH).
# From crate/: bash scripts/install-test.sh
crate_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$crate_dir"
if [[ ! -f out/r/all.json ]]; then
  echo "Missing out/r/all.json. Run npm run build in crate/ first." >&2
  exit 1
fi

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/crate-install.XXXXXX")"
server_pid=""
app_pid=""
cleanup() {
  for pid in "$server_pid" "$app_pid"; do
    if [[ -n "$pid" ]]; then
      kill "$pid" 2>/dev/null || true
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
# Drive useAgentStatus with a real useChat and a mocked AI SDK stream.
npm install ai @ai-sdk/react
cat > app/page.tsx <<'TSX'
"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

// A mocked AI SDK stream: no server, no API key. Each request opens a stream
// that the test feeds one chunk at a time through window.__crateMock.
type CrateMock = {
  requests: number;
  push: (chunk: UIMessageChunk) => void;
  close: () => void;
};

declare global {
  interface Window {
    __crateMock?: CrateMock;
  }
}

let controller: ReadableStreamDefaultController<UIMessageChunk> | undefined;
const mock: CrateMock = {
  requests: 0,
  push: (chunk) => controller?.enqueue(chunk),
  close: () => controller?.close(),
};
if (typeof window !== "undefined") window.__crateMock = mock;

const transport: ChatTransport<UIMessage> = {
  async sendMessages() {
    mock.requests += 1;
    return new ReadableStream<UIMessageChunk>({
      start(next) {
        controller = next;
      },
    });
  },
  async reconnectToStream() {
    return null;
  },
};

export default function Page() {
  const chat = useChat({ transport });
  const status = useAgentStatus(chat, { stallAfterMs: 1500 });

  return (
    <main>
      <button type="button" onClick={() => chat.sendMessage({ text: "Find the docs" })}>
        Send
      </button>
      <p data-testid="chat-status">{chat.status}</p>
      <AgentState
        status={status}
        errorMessage={chat.error?.message}
        onRetry={() => chat.regenerate()}
      />
    </main>
  );
}
TSX
npm run build

# Serve the consumer app and check every state in a browser.
app_port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
npx next start -p "$app_port" > "$temp_dir/app.log" 2>&1 &
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
node "$crate_dir/scripts/stream-test.mjs" "http://localhost:$app_port"
