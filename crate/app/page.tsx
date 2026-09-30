"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, PackageOpen, RotateCcw } from "lucide-react";
import {
  AgentState,
  AgentPlan,
  Approval,
  Done,
  FileProcessing,
  Queue,
  ReasoningTrace,
  Sources,
  ErrorState,
  Stalled,
  Streaming,
  Thinking,
  ToolCall,
  type AgentStatus,
} from "@/components/agent-wait-states";
import { DISCOVERY_URL, STUDIO_URL, installCommand } from "@/lib/config";

const STREAM_TEXT =
  "I found three patterns worth carrying into the next release: shorter prompts, visible tool progress, and calmer recovery states.";

const phases: Array<{ state: AgentStatus; duration: number; label: string }> = [
  { state: "thinking", duration: 2300, label: "Thinking" },
  { state: "tool", duration: 3000, label: "Using tools" },
  { state: "streaming", duration: 4300, label: "Streaming" },
  { state: "stalled", duration: 2200, label: "Stream paused" },
  { state: "error", duration: 2500, label: "Recovering" },
  { state: "thinking", duration: 1700, label: "Retrying" },
  { state: "done", duration: 2600, label: "Done" },
];

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button className="copy-button" type="button" onClick={copy} aria-label={`${label}: ${value}`}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

function InstallPill({ name, compact = false }: { name: string; compact?: boolean }) {
  const command = installCommand(name);
  return (
    <div className={compact ? "install-pill compact" : "install-pill"}>
      <code>{command}</code>
      <CopyButton value={command} />
    </div>
  );
}

function SimulatedChat() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [streamed, setStreamed] = useState("");
  const phase = phases[phaseIndex];

  useEffect(() => {
    setStreamed(phase.state === "stalled" ? STREAM_TEXT.slice(0, 61) : "");
    const next = window.setTimeout(
      () => setPhaseIndex((index) => (index + 1) % phases.length),
      phase.duration,
    );
    return () => window.clearTimeout(next);
  }, [phase.duration, phase.state, phaseIndex]);

  useEffect(() => {
    if (phase.state !== "streaming") return;
    let index = 0;
    const stream = window.setInterval(() => {
      index += 2;
      setStreamed(STREAM_TEXT.slice(0, index));
      if (index >= STREAM_TEXT.length) window.clearInterval(stream);
    }, 56);
    return () => window.clearInterval(stream);
  }, [phase.state, phaseIndex]);

  const retry = useCallback(() => setPhaseIndex(5), []);
  const steps = useMemo(
    () => [
      { label: "Searching the web…", toolName: "search", state: "complete" as const },
      { label: "Reading product notes…", toolName: "read_file", state: "active" as const },
    ],
    [],
  );

  return (
    <div className="chat-card" aria-label="Simulated AI conversation">
      <div className="chat-topline">
        <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span>live simulation</span>
        <span className="phase-label"><i />{phase.label}</span>
      </div>
      <div className="chat-body">
        <div className="message user-message">What should we improve before launch?</div>
        <div className="assistant-row">
          <div className="assistant-mark" aria-hidden="true"><PackageOpen /></div>
          <div className="assistant-content">
            {phase.state === "stalled" ? (
              <>
                <p className="partial-copy">{streamed}</p>
                <AgentState status="stalled" accent />
              </>
            ) : (
              <AgentState
                status={phase.state}
                accent
                text={streamed}
                steps={phase.state === "tool" ? steps : undefined}
                errorMessage="The stream dropped. Your prompt is safe."
                onRetry={retry}
              />
            )}
          </div>
        </div>
      </div>
      <div className="timeline" aria-hidden="true">
        {phases.map((item, index) => (
          <span key={`${item.label}-${index}`} className={index === phaseIndex ? "active" : index < phaseIndex ? "past" : ""} />
        ))}
      </div>
    </div>
  );
}

type ComponentCard = {
  name: string;
  slug: string;
  description: string;
  preview: React.ReactNode;
  snippet: string;
};

const componentCards: ComponentCard[] = [
  {
    name: "Thinking",
    slug: "thinking",
    description: "A quiet signal for the gap before the first token arrives.",
    preview: <Thinking accent elapsedMs={9000} />,
    snippet: `<Thinking accent elapsedMs={elapsedMs} />`,
  },
  {
    name: "Streaming",
    slug: "streaming",
    description: "Text arrives with a soft cursor that stays out of the way.",
    preview: <Streaming accent text="Here’s what I found" />,
    snippet: `<Streaming text={content} accent />`,
  },
  {
    name: "ToolCall",
    slug: "tool-call",
    description: "One tool or a full sequence, with active and completed steps.",
    preview: (
      <ToolCall accent steps={[
        { label: "Searching the web…", toolName: "search", state: "complete" },
        { label: "Reading file…", toolName: "read_file", state: "active" },
      ]} />
    ),
    snippet: `<ToolCall steps={steps} accent />`,
  },
  {
    name: "Stalled",
    slug: "stalled",
    description: "Reassures people when a live response goes quiet for five seconds.",
    preview: <Stalled accent />,
    snippet: `<Stalled message="Still working…" />`,
  },
  {
    name: "Error",
    slug: "error",
    description: "A compact recovery state with a retry action built in.",
    preview: <ErrorState message="The stream dropped." onRetry={() => undefined} />,
    snippet: `<ErrorState message={error.message} onRetry={retry} />`,
  },
  {
    name: "Done",
    slug: "done",
    description: "A quiet confirmation that acknowledges completion, then recedes.",
    preview: <Done accent />,
    snippet: `<Done accent />`,
  },
  {
    name: "ReasoningTrace",
    slug: "reasoning-trace",
    description: "Streams reasoning in a panel, then collapses to the time spent.",
    preview: <ReasoningTrace accent text="Checking the constraints and comparing the options…" />,
    snippet: `<ReasoningTrace text={reasoning} done={done} accent />`,
  },
  {
    name: "Sources",
    slug: "sources",
    description: "Citation chips arrive with the answer and keep overflow tidy.",
    preview: <Sources accent sources={[{ domain: "example.com", title: "Useful source" }, { domain: "docs.ai", title: "API reference" }, { domain: "paper.dev", title: "Research notes" }, { domain: "news.test", title: "Latest update" }]} />,
    snippet: `<Sources sources={sources} accent />`,
  },
  {
    name: "AgentPlan",
    slug: "agent-plan",
    description: "A step list that marks progress, active work, and failures.",
    preview: <AgentPlan accent steps={[{ label: "Read the brief", state: "complete" }, { label: "Draft the answer", state: "active" }, { label: "Check the facts", state: "pending" }]} />,
    snippet: `<AgentPlan steps={steps} accent />`,
  },
  {
    name: "Approval",
    slug: "approval",
    description: "A clear human checkpoint before an agent takes action.",
    preview: <Approval accent preview="To: hello@example.com · Subject: quick follow-up" expiresIn={30} />,
    snippet: `<Approval preview={action} onAllow={allow} onDeny={deny} />`,
  },
  {
    name: "Queue",
    slug: "queue",
    description: "A live place in line or a rate-limit countdown.",
    preview: <Queue accent position={3} />,
    snippet: `<Queue position={3} accent />`,
  },
  {
    name: "FileProcessing",
    slug: "file-processing",
    description: "Tracks a file from upload through reading, chunking, and ready.",
    preview: <FileProcessing accent filename="research.pdf" size="2.4 MB" stage="chunking" progress={72} />,
    snippet: `<FileProcessing filename="research.pdf" size="2.4 MB" stage="chunking" progress={72} />`,
  },
  {
    name: "AgentState",
    slug: "agent-state",
    description: "The wrapper that chooses the right wait state and transitions it smoothly.",
    preview: <AgentState status="tool" toolName="search" accent />,
    snippet: `<AgentState status={status} text={content} onRetry={retry} />`,
  },
];

function ComponentSection({ item, index }: { item: ComponentCard; index: number }) {
  return (
    <article className="component-row" id={item.slug}>
      <div className="component-copy">
        <span className="component-number">{String(index + 1).padStart(2, "0")}</span>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <InstallPill name={item.slug} compact />
        <pre className="usage-code"><code>{item.snippet}</code></pre>
      </div>
      <div className="component-stage">
        <span className="stage-label">live preview</span>
        <div className="preview-center">{item.preview}</div>
      </div>
    </article>
  );
}

export default function Home() {
  const allCommand = installCommand("all");
  return (
    <main>
      <header className="site-nav">
        <a className="brand" href="#top" aria-label="Crate home">
          <span className="brand-mark"><PackageOpen /></span>Crate
        </a>
        <nav aria-label="Primary navigation">
          <a href="#components">Components</a>
          <a href="#how-it-works">How it works</a>
          <a href="#footer">About</a>
        </nav>
        <a className="nav-install" href="#components">Open the crate <ArrowRight /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-blob" aria-hidden="true" />
        <div className="eyebrow"><i />Open source · React · AI SDK ready</div>
        <h1>AI wait states that <span>handle themselves.</span></h1>
        <p>
          Drop in one wrapper. It follows the stream from first thought to final token—tools,
          stalls, recovery and all.
        </p>
        <div className="hero-command">
          <span className="prompt">$</span>
          <code>{allCommand}</code>
          <CopyButton value={allCommand} label="Copy" />
        </div>
        <div className="hero-meta">
          <span>7 components</span><i />
          <span>1 smart hook</span><i />
          <span>MIT licensed</span>
        </div>
      </section>

      <section className="demo-section section-wrap" aria-labelledby="demo-title">
        <div className="section-intro">
          <span className="kicker">A whole response, handled</span>
          <h2 id="demo-title">Every awkward pause gets a useful state.</h2>
          <p>This fake conversation loops through thinking, tools, streaming, a stall, an error, retry and done.</p>
        </div>
        <SimulatedChat />
      </section>

      <section className="components-section section-wrap" id="components" aria-labelledby="components-title">
        <div className="section-intro compact-intro">
          <span className="kicker">Inside the crate</span>
          <h2 id="components-title">Use the wrapper. Or take exactly what you need.</h2>
        </div>
        <div className="component-list">
          {componentCards.map((item, index) => <ComponentSection item={item} index={index} key={item.slug} />)}
        </div>
      </section>

      <section className="how-section section-wrap" id="how-it-works" aria-labelledby="how-title">
        <div className="how-copy">
          <span className="kicker">How it works</span>
          <h2 id="how-title">Your stream already knows the state.</h2>
          <p><code>useAgentStatus</code> reads AI SDK v5 status, text and tool parts, then handles timing and stalled streams for you.</p>
        </div>
        <div className="two-line-code">
          <div><span>1</span><code>const status = useAgentStatus(chat);</code></div>
          <div><span>2</span><code>&lt;AgentState status={`{status}`} /&gt;</code></div>
          <CopyButton value={`const status = useAgentStatus(chat);\n<AgentState status={status} />`} />
        </div>
      </section>

      <section className="care-cta section-wrap">
        <div>
          <span className="kicker">One Roll Studios</span>
          <h2>Want something built with this much care?</h2>
          <p>One Roll Studios builds it.</p>
        </div>
        <a href={DISCOVERY_URL} target="_blank" rel="noreferrer">Start a project <ArrowRight /></a>
      </section>

      <footer id="footer">
        <div className="footer-brand"><span className="brand-mark"><PackageOpen /></span><strong>Crate</strong><span>AI wait states that handle themselves.</span></div>
        <div className="footer-cta">
          <span>Want something built with this much care? One Roll Studios builds it.</span>
          <a href={DISCOVERY_URL} target="_blank" rel="noreferrer">Let’s talk <ArrowRight /></a>
        </div>
        <div className="footer-bottom">
          <span>MIT licensed · made by <a href={STUDIO_URL}>One Roll Studios</a></span>
          <a href={STUDIO_URL}>onerollstudios.com</a>
        </div>
      </footer>
    </main>
  );
}
