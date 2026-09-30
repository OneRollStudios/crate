"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";
import {
  AgentPlan, AgentState, Approval, Done, ErrorState, FileProcessing, Queue,
  ReasoningTrace, Sources, Stalled, Streaming, Thinking, ToolCall,
  type AgentStatus,
} from "@/components/agent-wait-states";
import { DISCOVERY_URL, STUDIO_URL, installCommand } from "@/lib/config";

const reply = "give me a second. i’m checking the useful bits.";
const streamReply = "found it. the short version is surprisingly sensible.";
const sourceItems = [
  { domain: "docs.ai", title: "streaming reference" },
  { domain: "patterns.dev", title: "interface notes" },
  { domain: "example.com", title: "product brief" },
  { domain: "status.test", title: "service status" },
  { domain: "paper.dev", title: "research summary" },
  { domain: "news.test", title: "recent update" },
];
const planSteps = [
  { label: "read the request", state: "complete" as const },
  { label: "check the sources", state: "active" as const },
  { label: "write the answer", state: "pending" as const },
];
const stateLabels: Record<AgentStatus, string> = {
  thinking: "thinking", reasoning: "reasoning", sources: "sources", tool: "tool call",
  plan: "planning", approval: "approval", queue: "queued", file: "reading file",
  streaming: "streaming", stalled: "stalled", error: "error", done: "done",
};
type BoardRow = { number: number; prompt: string; status: string; startedAt: number };
type Mode = "without" | "with";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="copy-button" aria-label="copy install command" onClick={async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}<span>{copied ? "copied" : "copy"}</span></button>;
}

function SplitStatus({ value }: { value: string }) {
  return <span className="flap-status" key={value} aria-label={value}>
    {value.split("").map((letter, index) => <span className="flap-letter" key={index} aria-hidden="true">{letter === " " ? " " : letter}</span>)}
  </span>;
}

function SignalStrip({ state, plain }: { state: AgentStatus; plain: boolean }) {
  const signalState = plain ? "waiting" : state;
  return <div className={"signal-strip signal-" + signalState} aria-label={"token signal: " + signalState}>
    {Array.from({ length: 42 }, (_, index) => <i key={index} style={{ "--bar": index } as React.CSSProperties} />)}
  </div>;
}

function StatePreview({ slug }: { slug: string }) {
  if (slug === "thinking") return <Thinking accent elapsedMs={9000} />;
  if (slug === "streaming") return <Streaming accent text="here it comes, one useful token at a time." />;
  if (slug === "tool-call") return <ToolCall accent steps={[{ label: "searching the web…", toolName: "search", state: "complete" }, { label: "reading the useful part…", toolName: "read_file", state: "active" }]} />;
  if (slug === "stalled") return <Stalled accent />;
  if (slug === "error") return <ErrorState message="the stream dropped." onRetry={() => undefined} />;
  if (slug === "done") return <Done accent />;
  if (slug === "reasoning-trace") return <ReasoningTrace accent text="checking assumptions and ruling out the weird options…" />;
  if (slug === "sources") return <Sources accent sources={sourceItems} />;
  if (slug === "agent-plan") return <AgentPlan accent steps={planSteps} />;
  if (slug === "approval") return <Approval accent preview="to: studio@example.com · subject: quick follow-up" expiresIn={30} />;
  if (slug === "queue") return <Queue accent position={3} />;
  return <FileProcessing accent filename="research.pdf" size="2.4 mb" stage="chunking" progress={72} />;
}

const catalogue = [
  ["thinking", "thinking", "the quiet gap before the first token."],
  ["streaming", "streaming", "text arrives with a live cursor."],
  ["tool-call", "tool call", "shows one tool or a sequence of tools."],
  ["stalled", "stalled", "steps in after five seconds without a token."],
  ["error", "error", "keeps the failure short and gives retry a clear place."],
  ["done", "done", "a small check that acknowledges completion."],
  ["reasoning-trace", "reasoning trace", "opens while reasoning streams, then folds away."],
  ["sources", "sources", "citations arrive as compact source chips."],
  ["agent-plan", "agent plan", "tracks active, complete, and failed steps."],
  ["approval", "approval", "asks a person before the agent acts."],
  ["queue", "queue", "counts down a place in line or a rate limit."],
  ["file-processing", "file processing", "follows a file from upload to ready."],
] as const;

export default function Home() {
  const allCommand = installCommand("all");
  const [mode, setMode] = useState<Mode>("with");
  const [status, setStatus] = useState<AgentStatus>("thinking");
  const [streamed, setStreamed] = useState("");
  const [ticketNumber, setTicketNumber] = useState(42);
  const [printedTicket, setPrintedTicket] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [peopleLeft, setPeopleLeft] = useState(0);
  const [breakStreak, setBreakStreak] = useState(0);
  const [openState, setOpenState] = useState<string>("thinking");
  const runTimers = useRef<number[]>([]);
  const [rows, setRows] = useState<BoardRow[]>([
    { number: 39, prompt: "summarize the research", status: "done", startedAt: 58 },
    { number: 40, prompt: "compare the options", status: "tool call", startedAt: 34 },
    { number: 41, prompt: "write the short version", status: "thinking", startedAt: 9 },
  ]);

  const clearRun = useCallback(() => {
    runTimers.current.forEach((timer) => window.clearTimeout(timer));
    runTimers.current = [];
  }, []);

  const setScenario = useCallback((next: AgentStatus, resetBreak = true) => {
    clearRun();
    if (resetBreak) setBreakStreak(0);
    setStatus(next);
    setStreamed(next === "streaming" ? streamReply : "");
  }, [clearRun]);

  const startRequest = useCallback(() => {
    clearRun();
    const nextNumber = ticketNumber + 1;
    setTicketNumber(nextNumber);
    setPrintedTicket(nextNumber);
    setBreakStreak(0);
    setStatus("thinking");
    setStreamed("");
    setRows((current) => [{ number: nextNumber, prompt: "make this wait feel better", status: "thinking", startedAt: 0 }, ...current].slice(0, 4));
    const sequence: Array<[number, AgentStatus]> = [[2200, "reasoning"], [4700, "tool"], [7200, "streaming"], [9800, "sources"], [12200, "done"]];
    runTimers.current = sequence.map(([delay, next]) => window.setTimeout(() => {
      setStatus(next);
      if (next === "streaming") setStreamed(streamReply);
    }, delay));
  }, [clearRun, ticketNumber]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow((count) => count + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (mode !== "without") return;
    const timer = window.setInterval(() => setPeopleLeft((count) => count + 1), 3000);
    return () => window.clearInterval(timer);
  }, [mode]);
  useEffect(() => {
    setRows((current) => current.map((row, index) => index === 0 ? { ...row, status: mode === "without" ? "waiting" : stateLabels[status] } : row));
  }, [mode, status]);
  useEffect(() => () => clearRun(), [clearRun]);

  const activeMessage = useMemo(() => breakStreak >= 3 ? "okay, now you're just doing this on purpose." : reply, [breakStreak]);
  const triggerBreak = () => {
    clearRun();
    setBreakStreak((count) => count + 1);
    setStatus("error");
  };
  const elapsed = (time: number) => {
    const total = Math.max(0, time + now);
    return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  };

  return <main>
    <header className="site-header">
      <a href="#top" className="wordmark">crate</a>
      <a href="#states">12 wait states</a>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <h1>your ai is thinking. your users are leaving.</h1>
        <p>12 free wait states for ai apps. they switch on their own. one command.</p>
        <div className="hero-command"><code>{allCommand}</code><CopyButton value={allCommand} /></div>
      </div>

      <div className="waiting-room" data-agent-state={mode === "without" ? "waiting" : status}>
        <div className="departure-board">
          <div className="board-head"><span>request</span><span>prompt</span><span>status</span><span>elapsed</span></div>
          <div className="board-rows" aria-live="polite">
            {rows.map((row) => <div className="board-row" key={row.number}>
              <span className="request-number">{String(row.number).padStart(3, "0")}</span>
              <span className="board-prompt">{row.prompt}</span>
              <SplitStatus value={row.status} />
              <time>{elapsed(row.startedAt)}</time>
            </div>)}
          </div>
        </div>

        <div className="mode-switch" role="group" aria-label="compare wait states">
          <button type="button" className={mode === "without" ? "active" : ""} onClick={() => setMode("without")}>without crate</button>
          <button type="button" className={mode === "with" ? "active" : ""} onClick={() => setMode("with")}>with crate</button>
          {mode === "without" ? <span className="left-count" aria-live="polite">people who left: {peopleLeft}</span> : null}
        </div>

        <div className="playground">
          <div className="chat-line user-line">make this wait feel better.</div>
          <div className="response-zone">
            {mode === "without" ? <div className="plain-wait"><i aria-hidden="true" />waiting</div> : <>
              {status === "stalled" ? <p className="partial-answer">i was getting somewhere. probably.</p> : null}
              {status === "error" ? <p className="error-reply">{activeMessage}</p> : null}
              <AgentState status={status} accent text={streamed} reasoning="checking the request, the sources, and whether this is secretly three questions…" sources={sourceItems} steps={[{ label: "searching the web…", toolName: "search", state: "active" }]} planSteps={planSteps} approvalTitle="the agent wants to send this email" approvalPreview="to: studio@example.com · subject: the useful answer" approvalExpiresIn={30} queuePosition={3} filename="research.pdf" fileSize="2.4 mb" fileStage="reading" fileProgress={46} errorMessage="the stream tripped over its own shoelaces." onRetry={() => setScenario("thinking")} />
            </>}
          </div>
          <SignalStrip state={status} plain={mode === "without"} />
        </div>

        <div className="controls">
          <button type="button" onClick={() => setScenario("stalled")}>slow it down</button>
          <button type="button" onClick={() => setScenario("stalled")}>cut the stream</button>
          <button type="button" onClick={triggerBreak}>break it</button>
          <button type="button" onClick={() => setScenario("tool")}>call a tool</button>
          <button type="button" onClick={() => setScenario("approval")}>ask permission</button>
          <button type="button" onClick={() => setScenario("queue")}>join the queue</button>
        </div>

        <div className="ticket-row">
          <button type="button" className="take-number" onClick={startRequest}><Ticket aria-hidden="true" />take a number</button>
          {printedTicket ? <div className="paper-ticket" aria-live="polite"><span>your number</span><strong>{String(printedTicket).padStart(3, "0")}</strong></div> : null}
        </div>
      </div>
    </section>

    <section className="states-section" id="states">
      <h2>every way an ai makes you wait</h2>
      <div className="timetable">
        {catalogue.map(([slug, name, description]) => {
          const open = openState === slug;
          const command = installCommand(slug);
          return <article className={"state-row" + (open ? " open" : "")} key={slug}>
            <button type="button" className="state-summary" aria-expanded={open} onClick={() => setOpenState(open ? "" : slug)}>
              <strong>{name}</strong><span>{description}</span><code>{command}</code><i aria-hidden="true">{open ? "−" : "+"}</i>
            </button>
            {open ? <div className="inline-preview"><StatePreview slug={slug} /></div> : null}
          </article>;
        })}
      </div>
    </section>

    <section className="setup-section">
      <h2>two lines. that's the setup.</h2>
      <div className="setup-code"><code>const status = useAgentStatus(chat);</code><code>{"<AgentState status={status} />"}</code></div>
    </section>

    <section className="studio-cta">
      <h2>we make waiting feel good. imagine what we do with the rest.</h2>
      <a href={DISCOVERY_URL} target="_blank" rel="noreferrer">book a call with one roll studios</a>
    </section>

    <footer><p>free forever. mit licensed. made by <a href={STUDIO_URL}>one roll studios.</a></p></footer>
  </main>;
}
