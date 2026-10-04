// Drives examples/real-chat in mock mode: sends a message through the real
// Next.js route, useChat, and useAgentStatus, and checks that AgentState shows
// each state of the scripted stream in order. Saves a screenshot per state.
// Usage: node scripts/real-chat-test.mjs http://localhost:3000
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.argv[2];
if (!baseURL) {
  console.error("Usage: node scripts/real-chat-test.mjs <real-chat URL>");
  process.exit(1);
}
const screenshotDir = process.env.SCREENSHOT_DIR ?? "screenshots";

// One visible marker per component. Only one should be present at a time.
const markers = {
  thinking: '[aria-label="Thinking…"], [aria-label="Still thinking…"]',
  reasoning: 'button:has-text("Show thinking")',
  sources: '[aria-label="Sources"]',
  tool: '[aria-label="Agent tool activity"]',
  streaming: '[aria-label="Response streaming"]',
  stalled: 'text="Still working…"',
  done: 'span:text-is("Done")',
};
const expected = ["thinking", "reasoning", "sources", "tool", "streaming", "stalled", "streaming", "done"];

async function visibleStates(page) {
  const found = [];
  for (const [state, selector] of Object.entries(markers)) {
    if (await page.locator(selector).first().isVisible()) found.push(state);
  }
  return found;
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseURL);
    const mode = await page.getByTestId("mode").textContent();
    if (!mode?.startsWith("Mock mode")) throw new Error(`Expected mock mode, page says: ${mode}`);

    await page.getByLabel("Message").fill("Which component fits a stream that goes quiet?");
    await page.getByRole("button", { name: "Send" }).click();

    // Follow the stream; each expected state must appear on its own, in order.
    for (const [index, state] of expected.entries()) {
      const deadline = Date.now() + 10000;
      let found = [];
      while (Date.now() < deadline) {
        found = await visibleStates(page);
        if (found.length === 1 && found[0] === state) break;
        await page.waitForTimeout(50);
      }
      if (!(found.length === 1 && found[0] === state)) {
        throw new Error(`step ${index + 1}: expected only "${state}", saw [${found.join(", ")}]`);
      }
      await page.screenshot({ path: `${screenshotDir}/real-chat-${index + 1}-${state}.png` });
      results.push(`PASS step ${index + 1}: ${state}`);
    }

    const reply = await page.locator("li").last().textContent();
    if (!reply?.includes("useAgentStatus switches to it")) throw new Error(`final reply missing: ${reply}`);
    results.push("PASS final reply rendered");
    if (errors.length) throw new Error(`page errors: ${errors.join(" | ")}`);
    console.log(results.join("\n"));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
