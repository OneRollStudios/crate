import { useEffect, useState, type ReactNode } from 'react'
import './site/site.css'
import {
  AgentTimeline,
  AttachButton,
  Citations,
  CommandPalette,
  ConversationThread,
  DiffSuggestion,
  Feedback,
  Guardrail,
  Message,
  ModelPicker,
  PromptComposer,
  ReasoningTrace,
  StreamingReply,
  TokenMeter,
  ToolCall,
  useCommandPalette,
  useTheme,
} from '@latent'

const HERO_REPLY =
  'Q3 shows strong momentum, but two reputational risks stand out: delayed ' +
  'disclosure on the supply-chain audit, and sentiment softening after the ' +
  'pricing change.'

const go = (hash: string) => () => {
  location.hash = hash
}
const Arw = () => <span className="arw" aria-hidden>→</span>

/* ---------- hero ---------- */
function Hero({ onToggle, onCmd }: { onToggle: () => void; onCmd: () => void }) {
  const [model, setModel] = useState('opus')
  return (
    <section className="hero" id="top">
      <div className="hero__tiles" aria-hidden>
        {Array.from({ length: 88 }, (_, i) => <i key={i} />)}
      </div>
      <div className="hero__in">
        <nav className="hnav">
          <a className="brand" href="#top"><span className="mk" /> Latent</a>
          <div className="links">
            <a href="#catalogue">Components</a>
            <a href="#spec">Specification</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="r">
            <button className="tgl" onClick={onCmd} aria-label="Command palette">⌘K</button>
            <button className="tgl" onClick={onToggle} aria-label="Toggle theme">◐</button>
          </div>
        </nav>

        <div className="hgrid">
          <div className="hero__text">
            <span className="hpill">◆ AI UI Kit · v1.0</span>
            <h1 className="disp">Design the interface layer of intelligence.</h1>
            <p className="hsub">
              A React component library of AI-native primitives — the parts generic
              kits skip, shipped as real typed components.
            </p>
            <div className="hmeta">
              <div><b>Primitives</b><span>128 · live</span></div>
              <div><b>Stack</b><span>React · TS</span></div>
              <div><b>Modes</b><span>Light · Dark</span></div>
            </div>
            <div className="hcta">
              <button className="pill pill--white" onClick={go('#pricing')}>
                Get Latent — $59 <Arw />
              </button>
              <button className="pill pill--ghost" onClick={go('#catalogue')}
                style={{ background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>
                Explore the catalogue <span className="arw" style={{ background: 'rgba(255,255,255,.25)' }} aria-hidden>→</span>
              </button>
            </div>
          </div>

          <div>
            <div className="gcard">
              <ConversationThread
                path="latent://playground"
                footer={
                  <>
                    <div style={{ padding: '0 16px 8px' }}>
                      <PromptComposer
                        placeholder="Ask anything…"
                        toolbar={
                          <>
                            <AttachButton label="attach" />
                            <ModelPicker value={model} onChange={setModel} models={[
                              { id: 'opus', name: 'Opus' },
                              { id: 'sonnet', name: 'Sonnet' },
                              { id: 'haiku', name: 'Haiku' },
                            ]} />
                          </>
                        }
                      />
                    </div>
                    <div style={{ padding: '0 16px 14px' }}>
                      <TokenMeter used={1240} max={8000} cost="$0.04" />
                    </div>
                  </>
                }
              >
                <Message role="user">Summarize the Q3 board deck and flag risks.</Message>
                <Message role="ai">
                  <ReasoningTrace summary="reasoning · reading 42 slides" live
                    steps={[{ label: 'Read 42 slides', duration: '0.6s' }, { label: 'Cross-check risk log', duration: '0.3s' }]} />
                  <ToolCall name="retrieve" args={'"q3_board_deck.pdf"'} state="done" />
                  <StreamingReply text={HERO_REPLY} loop />
                  <Citations items={[
                    { label: 'board-deck.pdf · p.14', preview: 'Audit disclosed 6 days late vs. policy.' },
                    { label: 'risk-log.csv', preview: 'Sentiment −8% after the pricing change.' },
                  ]} />
                  <Feedback onRegenerate={() => {}} onCopy={() => {}} />
                </Message>
              </ConversationThread>
              <div className="gcard__cap">CMP-001 · conversation.thread · live</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- orbit ---------- */
const NODES = [
  { icon: '⌨', pos: { top: '9%', left: '50%' } },
  { icon: '◷', pos: { top: '30%', left: '86%' } },
  { icon: '⚙', pos: { top: '72%', left: '80%' } },
  { icon: '❝', pos: { top: '89%', left: '44%' } },
  { icon: '▤', pos: { top: '66%', left: '15%' } },
  { icon: '↻', pos: { top: '27%', left: '16%' } },
]
function Orbit() {
  return (
    <section className="sec"><div className="wrapc orbit-sec">
      <div className="orbit" aria-hidden>
        <div className="orbit__glow" />
        <div className="orbit__ring r3" /><div className="orbit__ring r2" /><div className="orbit__ring r1" />
        <div className="orbit__spin">
          {NODES.map((n, i) => (
            <div className="orbit__node" key={i} style={n.pos}><span>{n.icon}</span></div>
          ))}
        </div>
        <div className="orbit__core">✦</div>
      </div>
      <div className="orbit-txt">
        <span className="eb">One system</span>
        <h2 className="disp disp--m">Every primitive orbits a single core.</h2>
        <p>All 128 components share one token layer, one type scale and one set of states. Retheme with three variables and the whole system moves together — light, dark, and your brand.</p>
        <button className="pill" onClick={go('#spec')}>See the specification <Arw /></button>
      </div>
    </div></section>
  )
}

/* ---------- catalogue ---------- */
interface Card { code: string; cat: string; name: string; desc: string; viz: ReactNode }
function Catalogue({ onCmd }: { onCmd: () => void }) {
  const [model, setModel] = useState('opus')
  const cards: Card[] = [
    { code: 'CMP-004', cat: 'Input', name: 'Prompt composer', desc: 'Multiline input with attachments and send/stop.',
      viz: <PromptComposer placeholder="Ask anything…" toolbar={<AttachButton label="attach" />} /> },
    { code: 'CMP-011', cat: 'Output', name: 'Streaming reply', desc: 'Token-by-token text with a caret.',
      viz: <StreamingReply text="Drafting a summary of the Q3 board deck…" loop /> },
    { code: 'CMP-018', cat: 'Reasoning', name: 'Reasoning trace', desc: 'Collapsible chain-of-thought with timing.',
      viz: <ReasoningTrace summary="thinking · 3 steps" defaultOpen steps={[{ label: 'plan', duration: '0.2s' }, { label: 'retrieve', duration: '0.6s' }, { label: 'draft', duration: '0.4s' }]} /> },
    { code: 'CMP-023', cat: 'Actions', name: 'Tool call', desc: 'Args, run-state and payload preview.',
      viz: <ToolCall name="search" args={'query:"q3 risks"'} state="done" payload="→ 4 hits" /> },
    { code: 'CMP-027', cat: 'Sources', name: 'Citations', desc: 'Inline source chips with hover previews.',
      viz: <Citations items={[{ label: 'source.pdf', preview: 'Page 14 — supply-chain audit.' }, { label: 'notes.md', preview: 'Analyst call transcript.' }]} /> },
    { code: 'CMP-031', cat: 'Routing', name: 'Model picker', desc: 'Provider selector with context & pricing.',
      viz: <ModelPicker value={model} onChange={setModel} models={[{ id: 'opus', name: 'Opus', meta: '200K' }, { id: 'sonnet', name: 'Sonnet', meta: '200K' }, { id: 'haiku', name: 'Haiku', meta: '200K' }]} /> },
    { code: 'CMP-038', cat: 'Usage', name: 'Token meter', desc: 'Context fill, cost and rate-limit states.',
      viz: <TokenMeter used={4960} max={8000} cost="$0.04" /> },
    { code: 'CMP-066', cat: 'Eval', name: 'Feedback', desc: 'Thumbs, regenerate and copy.',
      viz: <Feedback onRegenerate={() => {}} onCopy={() => {}} /> },
    { code: 'CMP-044', cat: 'Agents', name: 'Agent timeline', desc: 'Plan, actions and outcomes with status.',
      viz: <AgentTimeline steps={[{ title: 'plan', meta: 'decompose the request', status: 'done' }, { title: 'retrieve', meta: 'q3_board_deck.pdf', status: 'done' }, { title: 'draft', meta: 'compose the summary', status: 'active' }]} /> },
    { code: 'CMP-052', cat: 'Editing', name: 'Diff / suggestion', desc: 'Accept-reject blocks for AI edits.',
      viz: <DiffSuggestion title="strategy" lines={[{ type: 'del', text: 'reactive strategy' }, { type: 'add', text: 'proactive strategy' }]} /> },
    { code: 'CMP-061', cat: 'Safety', name: 'Guardrail', desc: 'On-brand refusal with a recovery path.',
      viz: <Guardrail title="Can't help with that" onRetry={() => {}}>That request is outside policy — here's a safer way to ask.</Guardrail> },
    { code: 'CMP-057', cat: 'Command', name: 'Command palette', desc: '⌘K launcher with keyboard nav.',
      viz: (
        <button onClick={onCmd} className="mono" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,.5)', border: '1px solid var(--lt-line-2)', borderRadius: 10, padding: '11px 12px', width: '100%', cursor: 'pointer', color: 'var(--lt-muted)', fontSize: 12 }}>
          <span className="lt-kbd">⌘</span><span className="lt-kbd">K</span><span style={{ marginLeft: 4 }}>summon anything</span>
        </button>
      ) },
  ]
  return (
    <section className="sec" id="catalogue"><div className="wrapc">
      <div className="sec__head">
        <span className="eb">Catalogue</span>
        <h2 className="disp disp--m two-tone">Explore the Latent <span className="g">ecosystem.</span></h2>
        <p>Not mockups — every card holds the real React component from the kit, running live.</p>
      </div>
      <div className="cards">
        {cards.map((c) => (
          <article className="card" key={c.code}>
            <span className="card__arw" aria-hidden>↗</span>
            <span className="card__eb">{c.cat}</span>
            <span className="card__name">{c.name}</span>
            <span className="card__desc">{c.desc}</span>
            <div className="card__viz">{c.viz}</div>
            <span className="card__foot">{c.code}</span>
          </article>
        ))}
      </div>
    </div></section>
  )
}

/* ---------- specification ---------- */
function Spec() {
  const rows: [string, string][] = [
    ['Components', '128'], ['Variants & states', '460+'], ['Color modes', 'Light + Dark'],
    ['Theming', 'CSS variables'], ['Type system', 'Fluid scale'], ['Accessibility', 'WCAG AA'],
    ['Bundle', 'ESM · tree-shakeable'], ['Retheme in', '3 variables'], ['Icon set', '240 glyphs'],
    ['Format', 'React · TypeScript'],
  ]
  return (
    <section className="sec" id="spec"><div className="wrapc">
      <div className="sec__head">
        <span className="eb">Specification</span>
        <h2 className="disp disp--m">Built like an instrument.</h2>
        <p>Systematic tokens, typed props and documentation. Drop it in, retheme with three variables, ship.</p>
      </div>
      <div className="specs">
        {rows.map(([k, v]) => (
          <div className="spec-row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
        ))}
      </div>
    </div></section>
  )
}

/* ---------- pricing ---------- */
interface Tier { name: string; price: string; reco?: boolean; tag?: string; cta: string; features: string[] }
function Pricing() {
  const tiers: Tier[] = [
    { name: 'Solo', price: '$59', cta: 'Get Solo', features: ['1 seat', 'Personal & client work', '128 components, all variants', 'Light + dark, variables', '12 months of updates'] },
    { name: 'Team', price: '$179', reco: true, tag: 'Most teams', cta: 'Get Team', features: ['Up to 5 seats', 'Everything in Solo', 'Shared team library file', 'Priority updates', 'Private npm access'] },
    { name: 'Studio', price: '$399', cta: 'Get Studio', features: ['Unlimited seats', 'Everything in Team', 'Source tokens + JSON export', 'Roadmap input', 'Lifetime updates'] },
  ]
  return (
    <section className="sec" id="pricing"><div className="wrapc">
      <div className="sec__head">
        <span className="eb">Pricing</span>
        <h2 className="disp disp--m two-tone">Buy once. <span className="g">Use everywhere.</span></h2>
        <p>Unlimited personal and client projects. Twelve months of updates on every tier.</p>
      </div>
      <div className="tiers">
        {tiers.map((t) => (
          <div className={t.reco ? 'tier tier--reco' : 'tier'} key={t.name}>
            <div className="tier__name"><span>{t.name}</span>{t.tag && <span className="tier__tag">{t.tag}</span>}</div>
            <div className="tier__price">{t.price} <small>/ one-time</small></div>
            <ul>{t.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <button className={`pill tier__buy ${t.reco ? '' : 'pill--ghost'}`}>{t.cta} <Arw /></button>
          </div>
        ))}
      </div>
      <div className="join"><button className="pill" onClick={go('#pricing')}>Join the network <Arw /></button></div>
    </div></section>
  )
}

/* ---------- footer ---------- */
function Footer() {
  return (
    <footer className="footer" id="footer"><div className="wrapc">
      <div className="footer__top">
        <div>
          <a className="brand" href="#top"><span className="mk" /> Latent</a>
          <p className="footer__state">The interface layer <span className="g">for AI-native products.</span></p>
          <div className="footer__acts">
            <button className="pill">Work with us <Arw /></button>
            <button className="pill pill--ghost">Contact</button>
          </div>
        </div>
        <div className="fcol"><h4>Explore</h4><a href="#catalogue">Components</a><a href="#spec">Specification</a><a href="#pricing">Pricing</a><a href="#footer">Docs</a></div>
        <div className="fcol"><h4>More</h4><a href="#">Changelog</a><a href="#">License</a><a href="#">npm</a><a href="#">GitHub</a></div>
        <div className="fcol">
          <h4>Newsletter</h4>
          <div className="news"><input placeholder="Enter your email" aria-label="Email" /><button aria-label="Subscribe">→</button></div>
          <p>Occasional updates on new components and releases. No spam.</p>
        </div>
      </div>
      <div className="socials">
        <a className="social" href="#">✕ Twitter</a>
        <a className="social" href="#">✈ Telegram</a>
        <a className="social" href="#">◈ Discord</a>
        <a className="social" href="#">⌥ GitHub</a>
      </div>
      <div className="footer__bar">
        <span>© 2026 Latent · made for the age of AI</span>
        <div className="fl"><a href="#">Privacy</a><a href="#">Terms</a><a href="#top">Back to top ↑</a></div>
      </div>
    </div></footer>
  )
}

export default function App() {
  const { toggle, setTheme } = useTheme()
  const palette = useCommandPalette()
  useEffect(() => {
    if (!localStorage.getItem('latent-theme')) setTheme('light')
  }, [setTheme])

  return (
    <div className="page">
      <div className="shell">
        <Hero onToggle={toggle} onCmd={() => palette.setOpen(true)} />
        <div className="sheet">
          <Orbit />
          <Catalogue onCmd={() => palette.setOpen(true)} />
          <Spec />
          <Pricing />
        </div>
        <Footer />
      </div>
      <CommandPalette
        open={palette.open}
        onClose={palette.close}
        commands={[
          { id: 'buy', label: 'Get Latent', group: 'Actions', hint: '$59', run: go('#pricing') },
          { id: 'cat', label: 'Browse the catalogue', group: 'Actions', run: go('#catalogue') },
          { id: 'theme', label: 'Toggle theme', group: 'Actions', icon: '◐', run: toggle },
          { id: 'spec', label: 'Specification', group: 'Navigate', run: go('#spec') },
          { id: 'pricing', label: 'Pricing', group: 'Navigate', run: go('#pricing') },
        ]}
      />
    </div>
  )
}
