// Blueprint-style line drawings for the docs home, one per group: the
// component's outline, dashed guides, dimension lines (W1, H1), and small
// accent tags. Decorative (aria-hidden), static except a gentle pulse that only
// runs when the reader hasn't asked for reduced motion (see docs.css).
import type { ReactNode } from "react";

export type BlueprintKind = "start" | "before" | "while" | "needs" | "done" | "adapters" | "web" | "agents" | "more";

const MONO = "ui-monospace, Menlo, Consolas, monospace";

function Tag({ x, y, text }: { x: number; y: number; text: string }) {
  const width = text.length * 5.6 + 10;
  return (
    <g className="bp-tag">
      <rect x={x} y={y} width={width} height={14} rx={2} />
      <text x={x + 5} y={y + 10} fontFamily={MONO} fontSize={9}>{text}</text>
    </g>
  );
}

// A horizontal dimension line with end ticks and its label tag above it.
function HDim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g className="bp-dim">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text className="bp-dim-label" x={(x1 + x2) / 2} y={y + 16} textAnchor="middle" fontFamily={MONO} fontSize={9}>{label}</text>
    </g>
  );
}

function VDim({ y1, y2, x, label }: { y1: number; y2: number; x: number; label: string }) {
  return (
    <g className="bp-dim">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <text className="bp-dim-label" x={x - 10} y={(y1 + y2) / 2 + 3} textAnchor="end" fontFamily={MONO} fontSize={9}>{label}</text>
    </g>
  );
}

// Dashed guides through the object's edges, across the whole drawing.
function Guides({ xs = [], ys = [] }: { xs?: number[]; ys?: number[] }) {
  return (
    <g className="bp-guide">
      {xs.map((x) => <line key={`x${x}`} x1={x} y1={0} x2={x} y2={260} />)}
      {ys.map((y) => <line key={`y${y}`} x1={0} y1={y} x2={480} y2={y} />)}
    </g>
  );
}

const Line = ({ x, y, w }: { x: number; y: number; w: number }) => <rect className="bp-text-line" x={x} y={y} width={w} height={6} rx={3} />;

const drawings: Record<BlueprintKind, ReactNode> = {
  // AgentState: one wrapper, the states stacked inside it, fed by the hook.
  start: (
    <>
      <Guides xs={[170, 410]} ys={[70, 200]} />
      <rect className="bp-obj" x={194} y={86} width={196} height={98} rx={8} />
      <rect className="bp-obj" x={182} y={78} width={196} height={98} rx={8} />
      <rect className="bp-obj" x={170} y={70} width={196} height={130} rx={8} />
      <circle className="bp-accent bp-pulse" cx={194} cy={96} r={5} />
      <circle className="bp-accent bp-pulse bp-pulse-2" cx={210} cy={96} r={5} />
      <circle className="bp-accent bp-pulse bp-pulse-3" cx={226} cy={96} r={5} />
      <Line x={190} y={122} w={140} />
      <Line x={190} y={138} w={104} />
      <Line x={190} y={154} w={122} />
      <path className="bp-arrow" d="M84 135 H160 M152 129 L160 135 L152 141" />
      <circle className="bp-obj" cx={70} cy={135} r={12} />
      <Tag x={336} y={60} text="n = 12" />
      <HDim x1={170} x2={366} y={222} label="W1" />
      <VDim y1={70} y2={200} x={430} label="H1" />
    </>
  ),
  // Thinking: the dots in a pill.
  before: (
    <>
      <Guides xs={[140, 340]} ys={[104, 156]} />
      <rect className="bp-obj" x={140} y={104} width={200} height={52} rx={26} />
      <circle className="bp-accent bp-pulse" cx={172} cy={130} r={6} />
      <circle className="bp-accent bp-pulse bp-pulse-2" cx={192} cy={130} r={6} />
      <circle className="bp-accent bp-pulse bp-pulse-3" cx={212} cy={130} r={6} />
      <Line x={232} y={127} w={84} />
      <HDim x1={140} x2={340} y={180} label="W1" />
      <VDim y1={104} y2={156} x={118} label="H1" />
      <Tag x={300} y={96} text="n = 3" />
    </>
  ),
  // ToolCall: steps, one running, two done.
  while: (
    <>
      <Guides xs={[120, 360]} ys={[64, 196]} />
      <rect className="bp-obj" x={120} y={64} width={240} height={132} rx={8} />
      <path className="bp-accent-line" d="M138 94 l5 5 l9 -10" />
      <Line x={164} y={91} w={120} />
      <path className="bp-accent-line" d="M138 128 l5 5 l9 -10" />
      <Line x={164} y={125} w={96} />
      <circle className="bp-guide-circle" cx={145} cy={162} r={8} />
      <path className="bp-accent-line bp-spin" d="M145 154 a8 8 0 0 1 8 8" />
      <Line x={164} y={159} w={138} />
      <HDim x1={120} x2={360} y={216} label="W1" />
      <VDim y1={64} y2={196} x={98} label="H1" />
      <Tag x={318} y={56} text="n = 3" />
    </>
  ),
  // Approval: a request with Deny and Allow.
  needs: (
    <>
      <Guides xs={[110, 370]} ys={[56, 206]} />
      <rect className="bp-obj" x={110} y={56} width={260} height={150} rx={8} />
      <path className="bp-accent-line" d="M138 74 l12 5 v9 c0 7 -6 11 -12 13 c-6 -2 -12 -6 -12 -13 v-9 z" />
      <Line x={162} y={80} w={120} />
      <rect className="bp-inset" x={128} y={110} width={224} height={42} rx={4} />
      <Line x={140} y={122} w={160} />
      <Line x={140} y={136} w={110} />
      <rect className="bp-obj" x={238} y={166} width={52} height={26} rx={4} />
      <rect className="bp-accent" x={298} y={166} width={54} height={26} rx={4} />
      <HDim x1={110} x2={370} y={226} label="W1" />
      <VDim y1={56} y2={206} x={88} label="H1" />
      <Tag x={330} y={48} text="n = 2" />
    </>
  ),
  // Done: a check in a circle.
  done: (
    <>
      <Guides xs={[194, 286]} ys={[84, 176]} />
      <circle className="bp-guide-circle" cx={240} cy={130} r={72} />
      <circle className="bp-obj" cx={240} cy={130} r={46} />
      <path className="bp-accent-line bp-thick" d="M220 131 l13 13 l27 -29" />
      <HDim x1={194} x2={286} y={222} label="W1" />
      <VDim y1={84} y2={176} x={150} label="H1" />
      <Tag x={268} y={84} text="r = 46" />
    </>
  ),
  // Adapters: a server's events streamed to the client hook.
  adapters: (
    <>
      <Guides xs={[50, 170, 310, 430]} ys={[96, 166]} />
      <rect className="bp-obj" x={50} y={96} width={120} height={70} rx={8} />
      <Line x={66} y={116} w={80} />
      <Line x={66} y={132} w={60} />
      <rect className="bp-obj" x={310} y={96} width={120} height={70} rx={8} />
      <Line x={326} y={116} w={84} />
      <Line x={326} y={132} w={54} />
      <path className="bp-arrow bp-dashed" d="M178 120 H300 M292 114 L300 120 L292 126" />
      <path className="bp-arrow bp-dashed" d="M178 144 H300 M292 138 L300 144 L292 150" />
      <Tag x={224} y={94} text="n = 3" />
      <HDim x1={50} x2={170} y={190} label="W1" />
      <HDim x1={310} x2={430} y={190} label="W2" />
    </>
  ),
  // Web Components: a custom element tag.
  web: (
    <>
      <Guides xs={[120, 360]} ys={[86, 174]} />
      <rect className="bp-obj" x={120} y={86} width={240} height={88} rx={8} />
      <path className="bp-accent-line bp-thick" d="M170 108 l-22 22 l22 22 M310 108 l22 22 l-22 22 M256 104 l-32 52" />
      <HDim x1={120} x2={360} y={200} label="W1" />
      <VDim y1={86} y2={174} x={98} label="H1" />
      <Tag x={318} y={78} text="n = 13" />
    </>
  ),
  // Coding agents: a terminal.
  agents: (
    <>
      <Guides xs={[110, 370]} ys={[60, 200]} />
      <rect className="bp-obj" x={110} y={60} width={260} height={140} rx={8} />
      <line className="bp-obj-line" x1={110} y1={86} x2={370} y2={86} />
      <circle className="bp-obj" cx={126} cy={73} r={4} />
      <circle className="bp-obj" cx={140} cy={73} r={4} />
      <circle className="bp-obj" cx={154} cy={73} r={4} />
      <path className="bp-accent-line" d="M128 108 l8 7 l-8 7" />
      <Line x={146} y={112} w={150} />
      <Line x={128} y={138} w={190} />
      <Line x={128} y={158} w={140} />
      <rect className="bp-accent bp-pulse" x={128} y={176} width={10} height={12} />
      <HDim x1={110} x2={370} y={222} label="W1" />
      <VDim y1={60} y2={200} x={88} label="H1" />
      <Tag x={330} y={52} text="n = 3" />
    </>
  ),
  more: (
    <>
      <Guides xs={[150, 330]} ys={[80, 180]} />
      <rect className="bp-obj" x={150} y={80} width={180} height={100} rx={8} />
      <Line x={170} y={108} w={120} />
      <Line x={170} y={126} w={90} />
      <HDim x1={150} x2={330} y={204} label="W1" />
    </>
  ),
};

export function Blueprint({ kind }: { kind: BlueprintKind }) {
  return (
    <svg className="blueprint" viewBox="0 0 480 260" aria-hidden="true" focusable="false">
      {drawings[kind]}
    </svg>
  );
}
