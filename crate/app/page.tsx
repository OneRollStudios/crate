"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AgentPlan, Approval, Done, ErrorState, FileProcessing, Queue, ReasoningTrace, Sources, Stalled, Streaming, Thinking, ToolCall } from "@/components/agent-wait-states";
import { CrateLogo } from "@/components/crate-logo";

const installCommand = "npx shadcn@latest add https://crate.onerollstudios.com/r/all.json";
const sourceItems = [
  { domain: "crate", title: "sources" },
  { domain: "react", title: "streaming" },
  { domain: "shadcn", title: "wait states" },
  { domain: "tailwind", title: "your theme" },
];
const planLabels = ["thinking", "tool call", "streaming", "done"];

type PreviewKey = "thinking" | "queue" | "file-processing" | "reasoning-trace" | "tool-call" | "agent-plan" | "streaming" | "sources" | "approval" | "stalled" | "error" | "done";

const groups: Array<{ title: string; rows: Array<{ key: PreviewKey; name: string; description: string; slug: string }> }> = [
  { title: "before it answers", rows: [
    { key: "thinking", name: "thinking", description: "starts calm, says \"still thinking\" if it takes a while, offers a cancel if it takes too long.", slug: "thinking" },
    { key: "queue", name: "queue", description: "\"you're #3 in line.\" or a real countdown when you hit a rate limit.", slug: "queue" },
    { key: "file-processing", name: "file processing", description: "upload, reading, chunking, ready. you see your file get handled.", slug: "file-processing" },
  ]},
  { title: "while it works", rows: [
    { key: "reasoning-trace", name: "reasoning trace", description: "see the thinking as it happens. it folds away when done.", slug: "reasoning-trace" },
    { key: "tool-call", name: "tool call", description: "searching the web, reading a file. one step or ten.", slug: "tool-call" },
    { key: "agent-plan", name: "agent plan", description: "the agent's to-do list, checking itself off live.", slug: "agent-plan" },
    { key: "streaming", name: "streaming", description: "text arrives with a cursor that knows when to leave.", slug: "streaming" },
    { key: "sources", name: "sources", description: "citations appear as the answer writes itself.", slug: "sources" },
  ]},
  { title: "when it needs you, or breaks", rows: [
    { key: "approval", name: "approval", description: "\"the agent wants to send this email.\" allow or deny before it acts.", slug: "approval" },
    { key: "stalled", name: "stalled", description: "nothing new for 5 seconds? it tells you instead of pretending.", slug: "stalled" },
    { key: "error", name: "error", description: "short, honest, with a retry that actually retries.", slug: "error" },
  ]},
  { title: "when it's done", rows: [
    { key: "done", name: "done", description: "a small check, then it gets out of the way.", slug: "done" },
  ]},
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <button type="button" className="copy-button" onClick={copy} aria-label="copy">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button>;
}

function CircuitArt({ corner = false }: { corner?: boolean }) {
  return <svg className={corner ? "corner-circuit" : "hero-circuit"} viewBox="0 0 760 650" aria-hidden="true">
    <path className="circuit-haze" d="M55 125H250Q270 125 270 145V235Q270 255 290 255H510Q530 255 530 275V420Q530 440 550 440H710" />
    <path className="circuit-line" d="M55 125H250Q270 125 270 145V235Q270 255 290 255H510Q530 255 530 275V420Q530 440 550 440H710" />
    <path className="circuit-haze circuit-secondary" d="M115 570V500Q115 480 135 480H355Q375 480 375 460V90" />
    <path className="circuit-line circuit-secondary" d="M115 570V500Q115 480 135 480H355Q375 480 375 460V90" />
  </svg>;
}

function LivePreview({ kind, tick }: { kind: PreviewKey; tick: number }) {
  const phase = tick % 4;
  const plan = planLabels.map((label, index) => ({ label, state: index < phase ? "complete" as const : index === phase ? "active" as const : "pending" as const }));
  switch (kind) {
    case "thinking": return <Thinking accent elapsedMs={phase > 1 ? 9000 : 800} />;
    case "queue": return <Queue accent position={3} />;
    case "file-processing": return <FileProcessing accent filename="crate #1" size="12 states" stage={["uploading", "reading", "chunking", "ready"][phase] as "uploading" | "reading" | "chunking" | "ready"} progress={[24, 52, 78, 100][phase]} />;
    case "reasoning-trace": return <ReasoningTrace accent text="see the thinking as it happens." done={phase === 3} durationSeconds={12} />;
    case "tool-call": return <ToolCall accent toolName={phase % 2 ? "file" : "search"} label={phase % 2 ? "reading a file…" : "searching the web…"} />;
    case "agent-plan": return <AgentPlan accent steps={plan} />;
    case "streaming": return <Streaming accent text="text arrives" />;
    case "sources": return <Sources accent sources={sourceItems.slice(0, phase + 1)} maxVisible={3} />;
    case "approval": return <Approval accent title="send this email?" preview="the agent wants to send this email." />;
    case "stalled": return <Stalled accent message="still working…" />;
    case "error": return <ErrorState message="something fails." onRetry={() => undefined} />;
    case "done": return <Done accent label="done" />;
  }
}

export default function Home() {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<PreviewKey | null>("thinking");
  useEffect(() => { const timer = window.setInterval(() => setTick((value) => value + 1), 2400); return () => window.clearInterval(timer); }, []);
  const active = tick % 4;
  const toolLabel = active % 2 ? "reading file…" : "searching the web…";
  const heroPlan = useMemo(() => planLabels.map((label, index) => ({ label, state: index < Math.min(3, active + 1) ? "complete" as const : index === Math.min(3, active + 1) ? "active" as const : "pending" as const })), [active]);

  return <main>
    <nav className="site-nav" aria-label="crate">
      <a href="#top" className="nav-logo"><CrateLogo variant="mark" /></a>
      <div className="nav-pill"><a href="#crates">crates</a><a href="#install">docs</a><a href="https://github.com/onerollstudios" target="_blank" rel="noreferrer">github</a></div>
      <a className="primary-button nav-install" href="#install">install crate #1</a>
    </nav>

    <section className="hero ors-dot-grid" id="top">
      <div className="section-shell hero-grid">
        <div className="hero-copy">
          <h1><span>ui</span><span className="headline-chip thinking-chip"><Thinking accent /></span><span>your ai</span><span className="headline-chip stream-chip"><Streaming accent text="your ai" /></span><span>can build with.</span></h1>
          <p className="hero-subline">ready-made components for ai products. install them yourself, or just ask your coding agent.</p>
          <div className="hero-actions"><a className="outline-button" href="#problem">see it in action</a><a className="primary-button" href="#install">install crate #1</a></div>
          <div className="command-box hero-install"><code>{installCommand}</code><CopyButton text={installCommand} /></div>
          <p className="agent-prompt">or tell your agent: "add crate wait states to my chat"</p>
          <div className="facts" aria-label="crate #1"><div><strong>12</strong><span>states in crate #1</span></div><div><strong>1</strong><span>command to install</span></div><div><strong>2</strong><span>lines of setup</span></div></div>
        </div>

        <div className="hero-network" data-network-phase={active}>
          <CircuitArt />
          <span className="travel-pulse" aria-hidden="true" />
          <span className="particle particle-one" aria-hidden="true" /><span className="particle particle-two" aria-hidden="true" /><span className="particle particle-three" aria-hidden="true" />
          <div className={"float-card card-one " + (active === 0 ? "is-active" : "")}><span className="card-label">thinking</span><Thinking accent elapsedMs={active > 0 ? 9000 : 700} /></div>
          <div className={"float-card card-two " + (active === 1 ? "is-active" : "")}><span className="card-label">tool call</span><ToolCall accent toolName="search" label={toolLabel} /></div>
          <div className={"float-card card-three " + (active === 2 ? "is-active" : "")}><span className="card-label">agent plan</span><AgentPlan accent steps={heroPlan} /></div>
          <div className={"float-card card-four " + (active === 3 ? "is-active" : "")}><span className="card-label">approval</span><Approval accent title="send this email?" preview="the agent wants to send this email." /></div>
        </div>
      </div>
    </section>

    <section className="problem dark-section" id="problem">
      <CircuitArt corner />
      <div className="section-shell problem-inner">
        <h2>the better ai products feel better because someone sweated the small moments.</h2>
        <div className="moment-list">
          <div className="moment-row"><h3>how thinking looks.</h3><div className="light-preview"><Thinking accent elapsedMs={800} /></div></div>
          <div className="moment-row"><h3>what shows up when a tool runs.</h3><div className="light-preview"><ToolCall accent label="searching the web…" toolName="search" /></div></div>
          <div className="moment-row"><h3>how sources appear.</h3><div className="light-preview"><Sources accent sources={sourceItems.slice(0, Math.min(4, active + 1))} maxVisible={3} /></div></div>
          <div className="moment-row"><h3>what happens when something fails.</h3><div className="light-preview"><ErrorState message="something fails." onRetry={() => undefined} /></div></div>
        </div>
        <p className="closing-line"><span className="plain-spinner" aria-hidden="true" />getting those right takes weeks. so most teams ship a spinner and move on.</p>
      </div>
    </section>

    <section className="fix light-section ors-dot-grid">
      <div className="section-shell fix-grid">
        <div><h2>crate gives you those moments, ready to drop in.</h2><p>they read your ai stream and switch on their own.</p></div>
        <div className="state-timeline" data-timeline-phase={tick % 6}>
          <span className="timeline-line" aria-hidden="true" /><span className="timeline-pulse" aria-hidden="true" />
          {["thinking", "tool call", "streaming", "stalled", "error", "done"].map((state, index) => <div key={state} className={"timeline-state " + (tick % 6 === index ? "is-active" : "")}><span>{state}</span></div>)}
        </div>
        <pre className="setup-code"><code>const status = useAgentStatus(chat){"\n"}&lt;AgentState status=&#123;status&#125; /&gt;</code></pre>
      </div>
    </section>

    <section className="crates light-section ors-dot-grid" id="crates">
      <div className="section-shell">
        <div className="crate-heading"><div><span className="mono-label">crate #1</span><h2>wait states</h2></div><div><a className="primary-button" href="#install">install all of crate #1</a><p>or pick single pieces below.</p></div></div>
        <div className="component-groups">
          {groups.map((group) => <section className="component-group" key={group.title}><h3>{group.title}</h3>
            {group.rows.map((row) => { const expanded = open === row.key; const command = "npx shadcn@latest add https://crate.onerollstudios.com/r/" + row.slug + ".json"; return <div className={"component-row " + (expanded ? "is-open" : "")} key={row.key}>
              <div className="row-trigger"><button type="button" className="row-copy" onClick={() => setOpen(expanded ? null : row.key)} aria-expanded={expanded}><strong>{row.name}</strong><span>{row.description}</span></button><span className="row-preview"><LivePreview kind={row.key} tick={tick} /></span></div>
              <div className="row-command"><code>{command}</code><CopyButton text={command} /></div>
            </div>; })}
          </section>)}
        </div>
      </div>
    </section>

    <section className="install light-section ors-dot-grid" id="install">
      <div className="section-shell"><h2>install it yourself, or ask your coding agent.</h2>
        <div className="install-cards"><article><h3>by hand</h3><div className="command-box"><code>{installCommand}</code><CopyButton text={installCommand} /></div></article><article><h3>by agent</h3><div className="agent-card"><span>›</span> add crate wait states to my chat</div></article></div>
        <div className="install-facts"><span>react + tailwind + shadcn.</span><span>uses your theme: your colors, your fonts.</span></div>
      </div>
    </section>

    <section className="coming light-section ors-dot-grid">
      <div className="section-shell"><h2>this is crate #1. more are on the way.</h2><div className="coming-grid"><article className="active-crate">crate #1 · wait states</article><article>crate #2 · soon</article><article>crate #3 · soon</article></div></div>
    </section>

    <section className="end-cta dark-section"><CrateLogo variant="full" /><h2>skip the weeks.</h2><a className="primary-button" href="#install">install crate #1</a></section>
    <footer><p>crate. made by <a href="https://onerollstudios.com">one roll studios.</a></p></footer>
  </main>;
}
