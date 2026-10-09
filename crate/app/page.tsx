"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ThemeLab } from "./theme-lab";
import { ArrowUpRight, ArrowRight, Check, Copy, Plus, Minus, Pause, Play, RotateCcw, Terminal, Code2, Box, GitBranch, Braces } from "lucide-react";
import { AgentPlan, Approval, Done, ErrorState, FileProcessing, Queue, ReasoningTrace, Sources, Stalled, Streaming, Thinking, ToolCall } from "@/components/agent-wait-states";
import { SITE_URL } from "@/lib/config";

// The prompt names the site, so a coding agent goes straight to Crate.
const AGENT_PROMPT = `Add Crate wait states to my chat (${new URL(SITE_URL).host})`;

const installCommand = "npx shadcn@latest add https://crate.onerollstudios.com/r/all.json";
const sources = [{domain:"crate",title:"Components"},{domain:"react",title:"Streaming"},{domain:"shadcn",title:"Your theme"}];
type Kind = "thinking" | "queue" | "file-processing" | "reasoning-trace" | "tool-call" | "agent-plan" | "streaming" | "sources" | "approval" | "stalled" | "error" | "done";
const groups: { title: string; rows: {key:Kind;name:string;description:string}[] }[] = [
{title:"Before It Answers",rows:[
{key:"thinking",name:"Thinking",description:'Starts calm, says "still thinking" if it takes a while, offers a cancel if it takes too long.'},
{key:"queue",name:"Queue",description:'"You’re #3 in line." Or a real countdown when you hit a rate limit.'},
{key:"file-processing",name:"File Processing",description:"Upload, reading, chunking, ready. You see your file get handled."}]},
{title:"While It Works",rows:[
{key:"reasoning-trace",name:"Reasoning Trace",description:"See the thinking as it happens. It folds away when done."},
{key:"tool-call",name:"Tool Call",description:"Searching the web, reading a file. One step or ten."},
{key:"agent-plan",name:"Agent Plan",description:"The agent’s to-do list, checking itself off live."},
{key:"streaming",name:"Streaming",description:"Text arrives with a cursor that knows when to leave."},
{key:"sources",name:"Sources",description:"Citations appear as the answer writes itself."}]},
{title:"When It Needs You, or Breaks",rows:[
{key:"approval",name:"Approval",description:'"The agent wants to send this email." Allow or deny before it acts.'},
{key:"stalled",name:"Stalled",description:"Nothing new for 5 seconds? It tells you instead of pretending."},
{key:"error",name:"Error",description:"Short, honest, with a retry that actually retries."}]},
{title:"When It’s Done",rows:[{key:"done",name:"Done",description:"A small check, then it gets out of the way."}]}];

function CopyButton({text}: {text:string}) {
 const [status,setStatus]=useState("Copy");
 async function copy(){try{await navigator.clipboard.writeText(text);setStatus("Copied");}catch{setStatus("Select to copy");}window.setTimeout(()=>setStatus("Copy"),2500);}
 return <button className="copy-button" onClick={copy} aria-label={status} title={status}>{status==="Copied"?<Check size={16}/>:<Copy size={16}/>}<span className="sr-only" role="status">{status}</span></button>;
}
function Command({text=installCommand}:{text?:string}){return <div className="command"><Terminal size={16} aria-hidden="true"/><code>{text}</code><CopyButton text={text}/></div>}
function DemoApproval(){const [decision,setDecision]=useState<string|null>(null);return decision?<div className="decision"><Check size={18}/><span>{decision} in demo</span><button onClick={()=>setDecision(null)} aria-label="Reset approval demo"><RotateCcw size={15}/></button></div>:<Approval accent title="Send this email?" preview="The agent wants to send this email." onAllow={()=>setDecision("Allowed")} onDeny={()=>setDecision("Denied")}/>}
function RetryDemo(){const [retry,setRetry]=useState(false);return retry?<div className="decision"><Done accent label="Retry complete"/><button onClick={()=>setRetry(false)} aria-label="Reset error demo"><RotateCcw size={15}/></button></div>:<ErrorState message="Connection interrupted." onRetry={()=>setRetry(true)}/>}
function Preview({kind,tick}:{kind:Kind;tick:number}){
const phase=tick%4;
switch(kind){
 case "thinking":return <Thinking accent elapsedMs={phase>1?9000:3000}/>;
 case "queue":return <Queue accent position={Math.max(1,3-phase)}/>;
 case "file-processing":return <FileProcessing accent filename="document.pdf" size="Demo file" stage={(["uploading","reading","chunking","ready"] as const)[phase]} progress={[24,52,78,100][phase]}/>;
 case "reasoning-trace":return <ReasoningTrace accent text="Reading the request. Choosing the next step." done={phase===3} durationSeconds={12}/>;
 case "tool-call":return <ToolCall accent toolName="search" label="Searching the web…"/>;
 case "agent-plan":return <AgentPlan accent steps={["Read the request","Run the tools","Write the answer"].map((label,i)=>({label,state:i<phase?"complete":i===phase?"active":"pending"}))}/>;
 case "streaming":return <Streaming accent text={"A little polish goes a long way.".slice(0,9+phase*8)}/>;
 case "sources":return <Sources accent sources={sources.slice(0,phase+1)} maxVisible={3}/>;
 case "approval":return <DemoApproval/>;
 case "stalled":return <Stalled accent message="No new activity. Still waiting."/>;
 case "error":return <RetryDemo/>;
 case "done":return <Done accent label="All done"/>;
}}
function Logo({large=false}:{large?:boolean}){return <span className={large?"logo logo-large":"logo"}>crate<span className="logo-period">.</span><span className="logo-rays" aria-hidden="true">{Array.from({length:29},(_,i)=><i key={i} style={{height:`${35+(i*29)%90}%`,animationDelay:`-${i%7}s`}}/>)}</span></span>}

const stateOptions: {kind:Kind;label:string;event:string}[] = [
 {kind:"thinking",label:"Thinking",event:'chat.status = "submitted"'},
 {kind:"tool-call",label:"Tool Call",event:'part.type = "tool-search"'},
 {kind:"streaming",label:"Streaming",event:'chat.status = "streaming"'},
 {kind:"stalled",label:"Stalled",event:'No new content for 5 seconds'},
 {kind:"error",label:"Error",event:'chat.status = "error"'},
 {kind:"done",label:"Done",event:'chat.status = "ready"'},
];
function SetupDemo({tick}:{tick:number}){
 const [selected,setSelected]=useState(1);const state=stateOptions[selected];
 return <div className="setup-demo"><div className="setup-editor"><div className="panel-bar"><span><Code2 size={16}/> Your Chat Component</span><CopyButton text={'const status = useAgentStatus(chat)\n<AgentState status={status} />'}/></div><div className="code-lines"><div><span>1</span><code><em>const</em> status = <b>useAgentStatus</b>(chat)</code></div><div><span>2</span><code>&lt;<b>AgentState</b> status=&#123;status&#125; /&gt;</code></div></div><div className="code-caption"><Braces size={18}/><p>The hook reads the stream.<br/>The wrapper renders the matching state.</p></div></div><div className="setup-output"><div className="panel-bar"><span><span className="live-dot"/> What Your User Sees</span><span className="demo-label">Demo</span></div><div className="output-component"><Preview kind={state.kind} tick={tick}/></div><div className="event-caption"><span>Stream event</span><code>{state.event}</code></div></div><div className="setup-switches"><span>Try a state</span><div role="group" aria-label="Choose a demo state">{stateOptions.map((s,i)=><button key={s.kind} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s.label}</button>)}</div></div></div>
}
export default function Home(){
 const [tick,setTick]=useState(0);const [playing,setPlaying]=useState(true);const [open,setOpen]=useState<Kind|null>(null);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");if(media.matches)setPlaying(false);const change=()=>{if(media.matches)setPlaying(false)};media.addEventListener("change",change);return()=>media.removeEventListener("change",change)},[]);
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setTick(v=>v+1),2600);return()=>window.clearInterval(timer)},[playing]);
 return <><main className={playing?"":"paused"}>
 <a className="skip-link" href="#crates">Skip to Components</a>
 <header className="nav"><a href="#top" aria-label="Crate home"><Logo/></a><nav aria-label="Main navigation"><a href="#crates">Components</a><a href="/docs/">Docs</a><a href="https://github.com/OneRollStudios/crate" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14}/></a></nav><a className="button primary nav-cta" href="#install">Install Crate #1 <ArrowUpRight size={17}/></a></header>
 <section className="hero" id="top"><div className="shell hero-grid"><div className="hero-copy">
 <h1>Your AI Builds the Product.<br/><span className="hero-promise">Crate Brings the UI.</span></h1>
 <p className="hero-definition">Ready-made components<br className="wide-break"/> for AI products.</p>
 <p className="hero-description">Thinking, tool calls, approvals, and everything in between. Install them yourself, or just ask your coding agent.</p>
 <div className="hero-actions"><a className="button primary" href="#crates">Explore the Components <ArrowRight size={17}/></a><a className="text-button" href="#setup">See the Setup <ArrowUpRight size={17}/></a></div>
 <Command/><p className="agent-hint">Or ask your agent: <span>“{AGENT_PROMPT}”</span></p>
 </div><div className="demo-board"><div className="board-heading"><span><Box size={17}/> Crate #1 / Wait States</span><button onClick={()=>setPlaying(v=>!v)} aria-label={playing?"Pause demo animations":"Play demo animations"}>{playing?<Pause size={14}/>:<Play size={14}/>}<span>{playing?"Pause Demos":"Play Demos"}</span></button></div><div className="network network-single" aria-label="Interactive component demos"><article className="demo-card approval-card"><div className="card-caption"><span>Approval</span><span>01</span></div><DemoApproval/></article></div><div className="board-foot"><span className="live-dot"/><span>Live components. Try the approval buttons.</span></div></div></div>
 <div className="shell"><div className="hero-facts"><div className="fact"><span className="fact-number">12</span><span>UI states<br/><small>in the first crate</small></span></div><div className="fact"><span className="fact-number">1</span><span>install command<br/><small>for the whole collection</small></span></div><a className="fact" href="#setup"><span className="fact-number">2</span><span>lines of setup<br/><small>to connect your chat</small></span><ArrowUpRight size={17}/></a><a className="release" href="https://github.com/OneRollStudios/crate" target="_blank" rel="noreferrer"><GitBranch size={23}/><span><strong>Free & open source.</strong><small>Crate #1 · MIT licensed</small></span><ArrowUpRight size={18}/></a></div></div></section>
 <section className="problem dark-section" id="problem"><div className="shell problem-grid problem-grid-single"><div className="problem-copy"><h2>The Better AI Products Feel Better Because Someone <span>Sweated the Small Moments.</span></h2><p>What’s it doing? Did it stop? Can I try again?<br/>Your interface should have an answer.</p><div className="problem-cost"><span className="plain-spinner"/><div><h3>Getting Those Right Takes Work.</h3><p>A spinner is easy to ship.<br/>It leaves your users guessing.</p></div></div></div></div></section>
 <section className="setup section" id="setup"><div className="shell"><div className="setup-heading"><div className="setup-numeral" aria-hidden="true">2<span>lines</span></div><div><h2>Two Lines of Setup.<br/><span>The Right UI for Every State.</span></h2><p>Connect your existing chat. Crate follows the AI stream and switches the interface as the work changes.</p></div></div><SetupDemo tick={tick}/><div className="setup-notes"><span><Check size={17}/> Automatic state detection with the Vercel AI SDK</span><span><Check size={17}/> Using another stack? Pass the status yourself.</span></div></div></section>
 <section className="make-it-yours dark-section section" id="theme"><div className="shell"><div className="lab-heading"><h2>Looks Like Your App,<br/><span>Not Ours.</span></h2><p>Crate reads your theme. Change your colors, corners, fonts, or language, and every state follows.</p></div><ThemeLab tick={tick}/><div className="lab-footer"><div className="ownership"><Braces size={24}/><div><h3>The Components Live in Your Codebase.</h3><p>Read them. Change them. Make them yours.</p></div></div><div className="stack-tags"><span>React</span><span>Tailwind</span><span>shadcn</span></div></div></div></section>
 <section className="crates section" id="crates"><div className="shell"><div className="crate-heading"><div><span className="collection-label"><Box size={19}/> Crate #1</span><h2>Wait States.</h2><p>Every moment between a request and a response.</p></div><div><a className="button primary" href="#install">Install All 12 Components <ArrowUpRight size={17}/></a><p>Or pick the pieces you need.</p></div></div><div className="component-stack">{groups.map((g,gi)=><section className={`category-card category-${gi}`} style={{"--card-index":gi} as CSSProperties} key={g.title}><header className="category-heading"><div><span className="category-number">0{gi+1}</span><h3>{g.title}</h3></div><span className="category-count">{g.rows.length} {g.rows.length===1?"component":"components"}</span></header><div className="category-body">{g.rows.map(row=><article className={open===row.key?"component-row is-open":"component-row"} key={row.key}><div className="row-main"><button className="row-info" aria-expanded={open===row.key} aria-controls={`install-${row.key}`} onClick={()=>setOpen(open===row.key?null:row.key)}><span className="row-name">{row.name}{open===row.key?<Minus size={16}/>:<Plus size={16}/>}</span><span className="row-description">{row.description}</span></button><div className="row-preview"><Preview kind={row.key} tick={tick}/></div></div><div className="row-command" id={`install-${row.key}`} hidden={open!==row.key}><Command text={`npx shadcn@latest add https://crate.onerollstudios.com/r/${row.key}.json`}/><a className="row-docs" href={`/docs/${row.key}/`}>Props, States, and Playground <ArrowRight size={15}/></a></div></article>)}</div>{gi===3?<div className="done-graphic"><div className="done-check"><Check strokeWidth={1.3}/></div><p>The work is done.<br/><span>Let the answer take over.</span></p></div>:null}</section>)}</div></div></section>
 <section className="install dark-section section" id="install"><div className="shell"><div className="install-heading"><h3>Bring Crate Into Your Next Build.</h3><span>Crate #1 is free & open source.</span></div><div className="install-cards"><article><div className="install-card-title"><Terminal size={23}/><h4>Install It Yourself</h4></div><Command/></article><article><div className="install-card-title"><Code2 size={23}/><h4>Ask Your Coding Agent</h4></div><div className="agent-command"><span>›</span> {AGENT_PROMPT} <CopyButton text={AGENT_PROMPT}/></div></article></div></div></section>
 <section className="coming section"><div className="shell coming-layout"><h2>One Crate Today.<br/><span>More on the Way.</span></h2><div className="crate-shelf"><a href="#crates"><span>01</span><strong>Wait States</strong><span className="available">Available now <ArrowUpRight size={15}/></span></a><div><span>02</span><strong>Next Crate</strong><span>Soon</span></div><div><span>03</span><strong>Next Crate</strong><span>Soon</span></div></div></div></section>
 <footer className="site-footer"><div className="shell"><div className="footer-cta"><div><h2>Build the Product.<br/><span>We’ve Packed the Details.</span></h2><p>Start with 12 ready-made wait states.</p></div><a href="#install" className="footer-install" aria-label="Install Crate #1"><ArrowUpRight strokeWidth={1.3}/><span>Install Crate #1</span></a></div><div className="footer-links"><div><span>Crate #1</span><strong>Free. Open source. Yours.</strong></div><nav aria-label="Footer navigation"><a href="#crates">Components <ArrowUpRight size={15}/></a><a href="/docs/">Documentation <ArrowRight size={15}/></a><a href="https://github.com/OneRollStudios/crate" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={15}/></a></nav></div><div className="footer-wordmark" aria-label="Crate">crate<span>.</span><div className="wordmark-grid" aria-hidden="true"/></div><div className="footer-bottom"><a href="https://onerollstudios.com" target="_blank" rel="noreferrer">Made by One Roll Studios <ArrowUpRight size={15}/></a><span>React components for AI products.</span><a href="#top">Back to Top ↑</a></div></div></footer>
 </main></>
}
