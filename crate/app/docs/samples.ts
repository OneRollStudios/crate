// Starting values for the docs playground. Simple props get controls generated
// from their types (lib/docs.generated.json); props that take data, like lists
// of steps or sources, use these samples. The content is neutral demo text.
const sources = [
  { title: "Crate for coding agents", url: "https://crate.onerollstudios.com/llms.txt" },
  { title: "All Crate components", url: "https://crate.onerollstudios.com/r/all.json" },
  { title: "Crate on GitHub", url: "https://github.com/OneRollStudios/crate" },
  { title: "The Crate CLI", url: "https://www.npmjs.com/package/@onerollstudios/crate" },
];
const planSteps = [
  { label: "Read the request", state: "complete" },
  { label: "Search the docs", state: "complete" },
  { label: "Draft the answer", state: "active" },
  { label: "Check the sources", state: "pending" },
];

export const samples: Record<string, Record<string, unknown>> = {
  thinking: {},
  streaming: { text: "Here is what I found in the docs" },
  "tool-call": { toolName: "searchDocs" },
  stalled: { text: "Here is what I found so far" },
  error: { message: "The connection dropped before the answer finished." },
  done: {},
  "reasoning-trace": { text: "The user wants a loading state for a chat. I should check which components fit before suggesting one." },
  sources: { sources },
  "agent-plan": { steps: planSteps },
  approval: { title: "Send this email?", preview: "The agent wants to reply to the thread with a summary.", expiresIn: 30 },
  queue: { position: 3, retryIn: 20 },
  "file-processing": { filename: "report.pdf", size: "2.4 MB", stage: "reading", progress: 40 },
  "agent-state": {
    status: "tool",
    toolName: "searchDocs",
    text: "Here is what I found in the docs",
    reasoning: "The user wants a loading state for a chat.",
    sources,
    planSteps,
    errorMessage: "The connection dropped before the answer finished.",
  },
};
