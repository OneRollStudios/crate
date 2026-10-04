import { createUIMessageStream } from "ai";
import components from "@/lib/crate-components.json";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A scripted stream in the AI SDK's UI message format, used when no API key is
// set. It walks through every state useAgentStatus reads from a chat, with
// pauses long enough to see each one: thinking, reasoning, sources, tool call,
// streaming, stalled (no content for 6.5 seconds), streaming again, and done.
export function mockChatStream() {
  return createUIMessageStream({
    async execute({ writer }) {
      await wait(1500);
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });

      writer.write({ type: "reasoning-start", id: "reasoning-1" });
      for (const delta of ["The user wants a wait state. ", "I should check which components exist ", "before I suggest one."]) {
        writer.write({ type: "reasoning-delta", id: "reasoning-1", delta });
        await wait(500);
      }
      writer.write({ type: "reasoning-end", id: "reasoning-1" });

      writer.write({
        type: "source-url",
        sourceId: "source-1",
        url: "https://crate.onerollstudios.com/llms.txt",
        title: "Crate llms.txt",
      });
      await wait(1500);

      writer.write({ type: "tool-input-start", toolCallId: "call-1", toolName: "lookupComponent" });
      writer.write({ type: "tool-input-available", toolCallId: "call-1", toolName: "lookupComponent", input: { query: "stalled" } });
      await wait(1500);
      writer.write({
        type: "tool-output-available",
        toolCallId: "call-1",
        output: components.filter((component) => component.name === "stalled"),
      });
      writer.write({ type: "finish-step" });

      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "text-1" });
      for (const delta of ["This is the mock stream. ", "For a stream that goes quiet, ", "use Stalled. "]) {
        writer.write({ type: "text-delta", id: "text-1", delta });
        await wait(400);
      }
      await wait(6500);
      for (const delta of ["useAgentStatus switches to it on its own ", "after five seconds without new content."]) {
        writer.write({ type: "text-delta", id: "text-1", delta });
        await wait(400);
      }
      writer.write({ type: "text-end", id: "text-1" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });
}
