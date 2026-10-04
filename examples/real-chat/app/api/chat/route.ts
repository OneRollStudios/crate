import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import components from "@/lib/crate-components.json";
import { isMock, model } from "../../mode";
import { mockChatStream } from "./mock";

export const maxDuration = 60;

// A real tool, so the chat shows Crate's tool-call state: it looks up Crate's
// components in the registry.
const lookupComponent = tool({
  description: "Look up Crate wait-state components by name or keyword. Returns names and descriptions.",
  inputSchema: z.object({ query: z.string().describe("A component name or keyword, for example 'stalled' or 'approval'.") }),
  execute: async ({ query }) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = components.filter((component) =>
      words.some((word) => `${component.name} ${component.title} ${component.description}`.toLowerCase().includes(word)),
    );
    return matches.length ? matches : components;
  },
});

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  if (isMock()) return createUIMessageStreamResponse({ stream: mockChatStream() });

  const result = streamText({
    model: anthropic(model),
    system:
      "You help developers pick Crate wait-state components for their AI app. " +
      "Use the lookupComponent tool to check what exists before you recommend anything. Keep answers short.",
    messages: await convertToModelMessages(messages),
    tools: { lookupComponent },
    stopWhen: stepCountIs(4),
    // Stream a readable summary of the model's thinking, so the reasoning
    // state has text to show.
    providerOptions: { anthropic: { thinking: { type: "adaptive", display: "summarized" } } },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true, sendSources: true });
}
