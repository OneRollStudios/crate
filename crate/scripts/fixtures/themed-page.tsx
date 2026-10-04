"use client";

// Test page for scripts/install-test.sh themed: every Crate component in a
// host app whose shadcn theme differs from the default on colors, radius, and
// font. scripts/theme-check.mjs checks that each one uses the host's theme.
import {
  AgentPlan, Approval, Done, ErrorState, FileProcessing, Queue, ReasoningTrace,
  Sources, Stalled, Streaming, Thinking, ToolCall,
} from "@/components/agent-wait-states";

const noop = () => {};

const states: Array<[string, React.ReactNode]> = [
  ["thinking", <Thinking key="thinking" accent elapsedMs={21000} onCancel={noop} />],
  ["reasoning", <ReasoningTrace key="reasoning" accent text="Comparing the two options before answering." />],
  ["sources", <Sources key="sources" accent sources={[
    { title: "Theming", url: "https://example.com/docs/theming" },
    { title: "Components", url: "https://example.org/components" },
    { title: "Changelog", url: "https://example.net/changelog" },
    { title: "Guide", url: "https://example.com/guide" },
  ]} />],
  ["tool", <ToolCall key="tool" accent steps={[
    { label: "Search the docs", toolName: "searchDocs", state: "complete" },
    { label: "Read the file", toolName: "readFile", state: "active" },
    { label: "Write the answer", state: "pending" },
  ]} />],
  ["plan", <AgentPlan key="plan" accent steps={[
    { label: "Find the files", state: "complete" },
    { label: "Make the change", state: "active" },
    { label: "Run the tests", state: "pending" },
    { label: "Deploy", state: "failed" },
  ]} />],
  ["approval", <Approval key="approval" accent title="Send the email?" preview="To: team@example.com" onAllow={noop} onDeny={noop} expiresIn={30} />],
  ["queue", <Queue key="queue" accent position={3} />],
  ["rate-limit", <Queue key="rate-limit" accent variant="rate-limit" retryIn={20} />],
  ["file", <FileProcessing key="file" accent filename="report.pdf" size="2.4 MB" stage="chunking" progress={72} />],
  ["streaming", <Streaming key="streaming" accent text="Here is the answer, streaming in" />],
  ["stalled", <Stalled key="stalled" accent />],
  ["error", <ErrorState key="error" message="The model did not respond." onRetry={noop} />],
  ["done", <Done key="done" accent />],
];

export default function Page() {
  return (
    <main style={{ display: "grid", gap: 24, padding: 24, gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
      {states.map(([state, element]) => (
        <section key={state} data-crate-state={state} style={{ padding: 16 }}>
          <h2 style={{ fontSize: 12, marginBottom: 12 }}>{state}</h2>
          <div data-crate-root>{element}</div>
        </section>
      ))}
    </main>
  );
}
