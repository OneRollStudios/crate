"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AgentState, CrateProvider, type AgentStatus, type AgentStatusSnapshot, type CrateLabels } from "@/components/agent-wait-states";

type Look = { name: string; label: string; font: string; radius: string; bg: string; fg: string; primary: string; muted: string; quiet: string; border: string };

// Three fixed example design systems, shown after the live panel built from the controls.
const presets: Look[] = [
  { name: "Studio", label: "Example: Sharp and Minimal", font: '"Inter", sans-serif', radius: "2px", bg: "#f6f4ed", fg: "#0a0e1a", primary: "#607913", muted: "#eaece0", quiet: "#58624d", border: "#cfd5c2" },
  { name: "Editorial", label: "Example: Editorial Serif", font: "Georgia, serif", radius: "0px", bg: "#fff0e7", fg: "#422818", primary: "#994027", muted: "#f4e0d3", quiet: "#755546", border: "#ddc3b1" },
  { name: "Midnight", label: "Example: Dark and Rounded", font: '"Inter", sans-serif', radius: "12px", bg: "#171b2b", fg: "#f4f2ff", primary: "#b6acff", muted: "#292e45", quiet: "#b7bdd1", border: "#454963" },
];

const fonts = [
  { name: "Sans", css: "system-ui, sans-serif", code: "system-ui" },
  { name: "Serif", css: "Georgia, serif", code: "Georgia, serif" },
  { name: "Rounded", css: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif', code: "ui-rounded" },
];

const languages: { code: string; name: string; reply: string; tool: string; labels?: Partial<CrateLabels> }[] = [
  { code: "en", name: "English", reply: "Here is what I found.", tool: "search" },
  {
    code: "fr",
    name: "Français",
    reply: "Voici ce que j’ai trouvé.",
    tool: "recherche",
    labels: {
      thinking: "Réflexion…",
      stillThinking: "Toujours en réflexion…",
      runningTool: (toolName) => `Exécution de ${toolName}…`,
      runningToolUnnamed: "Exécution d’un outil…",
      usedTool: (toolName) => `Outil utilisé\u00a0: ${toolName}`,
      usedToolUnnamed: "Outil utilisé",
      toolActivity: "Activité de l’outil",
      responseStreaming: "Réponse en cours",
      done: "Terminé",
    },
  },
];

// The states every panel cycles through, driven by the page's demo clock.
const cycle: AgentStatus[] = ["thinking", "tool", "streaming", "done"];

function lookStyle(look: Look): CSSProperties {
  return {
    "--background": look.bg,
    "--foreground": look.fg,
    "--primary": look.primary,
    "--primary-foreground": look.bg,
    "--muted": look.muted,
    "--muted-foreground": look.quiet,
    "--border": look.border,
    "--radius": look.radius,
    fontFamily: look.font,
    background: look.bg,
    color: look.fg,
  } as CSSProperties;
}

export function ThemeLab({ tick }: { tick: number }) {
  const [color, setColor] = useState("#2563eb");
  const [radius, setRadius] = useState(8);
  const [fontIndex, setFontIndex] = useState(0);
  const [languageIndex, setLanguageIndex] = useState(0);
  // Briefly highlights the live panel after any control changes, so it's clear what reacts.
  const [changed, setChanged] = useState(false);
  const changeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(changeTimer.current), []);
  function flag() {
    setChanged(true);
    clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => setChanged(false), 900);
  }
  const font = fonts[fontIndex];
  const language = languages[languageIndex];

  const yours: Look = { name: "Yours", label: "Your Theme", font: font.css, radius: `${radius}px`, bg: "#ffffff", fg: "#18181b", primary: color, muted: "#f4f4f5", quiet: "#52525b", border: "#e4e4e7" };
  const status: AgentStatusSnapshot = { state: cycle[tick % cycle.length], sources: [], elapsedMs: 3000, showCancel: false, label: "" };

  return (
    <div className="theme-lab">
      <div className="lab-controls">
        <label className="lab-control">
          <span>Color</span>
          <input type="color" value={color} onChange={(event) => { setColor(event.target.value); flag(); }} />
        </label>
        <label className="lab-control lab-range">
          <span>Corners <output>{radius}px</output></span>
          <input type="range" min={0} max={20} step={1} value={radius} onChange={(event) => { setRadius(Number(event.target.value)); flag(); }} />
        </label>
        <div className="lab-control">
          <span id="lab-font">Font</span>
          <div className="lab-segments" role="group" aria-labelledby="lab-font">
            {fonts.map((item, index) => <button key={item.name} type="button" aria-pressed={fontIndex === index} onClick={() => { setFontIndex(index); flag(); }}>{item.name}</button>)}
          </div>
        </div>
        <div className="lab-control">
          <span id="lab-language">Language</span>
          <div className="lab-segments" role="group" aria-labelledby="lab-language">
            {languages.map((item, index) => <button key={item.code} type="button" lang={item.code} aria-pressed={languageIndex === index} onClick={() => { setLanguageIndex(index); flag(); }}>{item.name}</button>)}
          </div>
        </div>
      </div>

      <p className="lab-note">Your Theme follows the controls above. The examples show the same component in other apps&rsquo; themes.</p>

      <CrateProvider locale={language.code} labels={language.labels}>
        <div className="lab-panels" lang={language.code}>
          {[yours, ...presets].map((look) => (
            <div key={look.name} className={look === yours ? "lab-panel lab-panel-yours" : "lab-panel"} data-changed={look === yours && changed ? "" : undefined} style={lookStyle(look)}>
              <span className="lab-panel-name">{look.label}</span>
              <AgentState accent status={status} toolName={language.tool} text={language.reply} />
            </div>
          ))}
        </div>
      </CrateProvider>

      <pre className="lab-code" aria-label="Your theme"><code>{`:root {
  --primary: ${color};
  --radius: ${radius}px;
  font-family: ${font.code};
}`}{language.labels ? `

<CrateProvider locale="${language.code}" labels={${language.code}}>` : ""}</code></pre>
    </div>
  );
}
