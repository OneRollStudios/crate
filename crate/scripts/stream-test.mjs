// Drives the consumer app built by install-test.sh through a mocked AI SDK
// stream and checks that AgentState shows the right component for each state.
// Usage: node scripts/stream-test.mjs http://localhost:3000
import { chromium } from "playwright";

const baseURL = process.argv[2];
if (!baseURL) {
  console.error("Usage: node scripts/stream-test.mjs <consumer app URL>");
  process.exit(1);
}

// One visible marker per component. Only one should be present at a time.
const markers = {
  thinking: '[aria-label="Thinking…"], [aria-label="Still thinking…"]',
  tool: '[aria-label="Agent tool activity"]',
  streaming: '[aria-label="Response streaming"]',
  stalled: 'text="Still working…"',
  error: '[role="status"]:has(button:text-is("Retry"))',
  done: 'span:text-is("Done")',
};

const results = [];

async function visibleStates(page) {
  const found = [];
  for (const [state, selector] of Object.entries(markers)) {
    if (await page.locator(selector).first().isVisible()) found.push(state);
  }
  return found;
}

async function expectState(page, expected, step) {
  const deadline = Date.now() + 5000;
  let found = [];
  while (Date.now() < deadline) {
    found = await visibleStates(page);
    if (found.length === 1 && found[0] === expected) {
      results.push(`PASS ${step}: ${expected}`);
      return;
    }
    await page.waitForTimeout(50);
  }
  const chatStatus = await page.getByTestId("chat-status").textContent();
  throw new Error(`${step}: expected only "${expected}", saw [${found.join(", ")}] (chat status "${chatStatus}")`);
}

const push = (page, chunk) => page.evaluate((c) => window.__crateMock.push(c), chunk);
const close = (page) => page.evaluate(() => window.__crateMock.close());

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => console.error(`[page] ${error.message}`));
    await page.goto(baseURL);
    await page.waitForFunction(() => Boolean(window.__crateMock));

    // 1. Submitted, nothing streamed yet: thinking.
    await page.getByRole("button", { name: "Send" }).click();
    await expectState(page, "thinking", "submitted");

    // 2. A tool call starts: tool call, with the tool's name.
    await push(page, { type: "start" });
    await push(page, { type: "start-step" });
    await push(page, { type: "tool-input-start", toolCallId: "call-1", toolName: "searchDocs" });
    await push(page, { type: "tool-input-available", toolCallId: "call-1", toolName: "searchDocs", input: { query: "docs" } });
    await expectState(page, "tool", "tool call");
    if (!(await page.getByText("searchDocs").first().isVisible())) throw new Error("tool call: tool name not shown");

    // 3. The tool finishes and text arrives: streaming.
    await push(page, { type: "tool-output-available", toolCallId: "call-1", output: { hits: 1 } });
    await push(page, { type: "finish-step" });
    await push(page, { type: "start-step" });
    await push(page, { type: "text-start", id: "text-1" });
    await push(page, { type: "text-delta", id: "text-1", delta: "Here is what I found" });
    await expectState(page, "streaming", "text streaming");

    // 4. No new content for longer than stallAfterMs (1500 ms): stalled.
    await page.waitForTimeout(1800);
    await expectState(page, "stalled", "no content for 1.8s");

    // 5. The stream fails: error, with a Retry button. The SDK ends the stream
    // itself on an error chunk, so there is nothing left to close.
    await push(page, { type: "error", errorText: "Mock stream failed" });
    await expectState(page, "error", "stream error");

    // 6. Retry sends a new request: thinking again.
    await page.getByRole("button", { name: "Retry" }).click();
    await expectState(page, "thinking", "retry");
    const requests = await page.evaluate(() => window.__crateMock.requests);
    if (requests !== 2) throw new Error(`retry: expected 2 requests, saw ${requests}`);

    // 7. The retried stream completes: done.
    await push(page, { type: "start" });
    await push(page, { type: "start-step" });
    await push(page, { type: "text-start", id: "text-2" });
    await push(page, { type: "text-delta", id: "text-2", delta: "All set." });
    await expectState(page, "streaming", "retry streaming");
    await push(page, { type: "text-end", id: "text-2" });
    await push(page, { type: "finish-step" });
    await push(page, { type: "finish" });
    await close(page);
    await expectState(page, "done", "finished");

    console.log(results.join("\n"));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.log(results.join("\n"));
  console.error(error);
  process.exitCode = 1;
});
