"use client";

import { useState } from "react";
import * as Crate from "@/components/agent-wait-states";

export type PlaygroundProp = { name: string; type: string; optional: boolean; literals: string[] | null; default: string | null };
type Value = string | number | boolean | undefined;

// Props that never get a control: styling hooks, and labels (see CrateProvider).
const SKIP = new Set(["className", "labels"]);
const isCallback = (prop: PlaygroundProp) => prop.type.includes("=>");
const controlFor = (prop: PlaygroundProp) =>
  prop.literals ? "select" : prop.type === "boolean" ? "toggle" : prop.type === "string" ? "text" : prop.type === "number" ? "number" : null;

// A default as written in the source ("false", "\"line\"", "0") as a control value.
function parseDefault(value: string | null): Value {
  if (value === null) return undefined;
  if (value === "true" || value === "false") return value === "true";
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const quoted = value.match(/^["'](.*)["']$/);
  return quoted ? quoted[1] : undefined;
}

function jsx(title: string, values: Record<string, Value>, data: string[], callbacks: string[]) {
  const attrs = Object.entries(values).flatMap(([name, value]) => {
    if (value === undefined || value === "" || value === false) return [];
    if (value === true) return [name];
    return [typeof value === "number" ? `${name}={${value}}` : `${name}=${JSON.stringify(value)}`];
  });
  attrs.push(...data.map((name) => `${name}={${name}}`), ...callbacks.map((name) => `${name}={() => {}}`));
  if (!attrs.length) return `<${title} />`;
  return attrs.join(" ").length > 50 ? `<${title}\n  ${attrs.join("\n  ")}\n/>` : `<${title} ${attrs.join(" ")} />`;
}

export function Playground({ title, props, sample }: { title: string; props: PlaygroundProp[]; sample: Record<string, unknown> }) {
  const Component = (Crate as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[title];
  const controls = props.filter((prop) => !SKIP.has(prop.name) && controlFor(prop));
  const callbacks = props.filter((prop) => !SKIP.has(prop.name) && isCallback(prop)).map((prop) => prop.name);
  const data = Object.keys(sample).filter((name) => !controls.some((prop) => prop.name === name));
  const [values, setValues] = useState<Record<string, Value>>(() =>
    Object.fromEntries(controls.map((prop) => [prop.name, (sample[prop.name] as Value) ?? parseDefault(prop.default)])),
  );
  const [events, setEvents] = useState<string[]>([]);
  if (!Component) return null;

  const handlers = Object.fromEntries(callbacks.map((name) => [name, () => setEvents((list) => [`${name}()`, ...list].slice(0, 3))]));
  const dataProps = Object.fromEntries(data.map((name) => [name, sample[name]]));
  const set = (name: string, value: Value) => setValues((current) => ({ ...current, [name]: value }));

  return (
    <div className="playground">
      <div className="playground-stage" aria-label={`${title} preview`}>
        <Component {...dataProps} {...values} {...handlers} />
      </div>
      <div className="playground-controls">
        {controls.map((prop) => {
          const id = `prop-${prop.name}`;
          const value = values[prop.name];
          const kind = controlFor(prop);
          return (
            <div className="playground-control" key={prop.name}>
              <label htmlFor={id}><code>{prop.name}</code></label>
              {kind === "select" ? (
                <select id={id} value={String(value ?? "")} onChange={(event) => set(prop.name, event.target.value || undefined)}>
                  {prop.optional && !prop.default ? <option value="">Not set</option> : null}
                  {prop.literals!.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : kind === "toggle" ? (
                <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => set(prop.name, event.target.checked)} />
              ) : kind === "number" ? (
                <input id={id} type="number" value={value === undefined ? "" : String(value)} onChange={(event) => set(prop.name, event.target.value === "" ? undefined : Number(event.target.value))} />
              ) : (
                <input id={id} type="text" value={String(value ?? "")} onChange={(event) => set(prop.name, event.target.value || undefined)} />
              )}
            </div>
          );
        })}
      </div>
      {data.length ? <p className="playground-note">Sample data for {data.map((name, index) => <span key={name}>{index ? ", " : ""}<code>{name}</code></span>)}.</p> : null}
      {callbacks.length ? (
        <p className="playground-note" aria-live="polite">
          {events.length ? <>Called: {events.map((event, index) => <span key={index}>{index ? ", " : ""}<code>{event}</code></span>)}</> : <>Callbacks ({callbacks.map((name, index) => <span key={name}>{index ? ", " : ""}<code>{name}</code></span>)}) are logged here when the component calls them.</>}
        </p>
      ) : null}
      <pre className="docs-code"><code>{jsx(title, values, data, callbacks)}</code></pre>
    </div>
  );
}
