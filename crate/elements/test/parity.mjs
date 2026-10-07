// Parity: every component, rendered by React and by preact/compat (what the
// elements use) with the same props, must give the same markup: the same
// elements, text, roles, aria attributes, and buttons. Run after npm run build.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const crateRoot = fileURLToPath(new URL("../..", import.meta.url));
const preact = (path) => `${root}node_modules/preact/${path}`;
mkdirSync(`${root}build`, { recursive: true });

async function render(name, alias) {
  const outfile = `${root}build/parity-${name}.mjs`;
  await build({
    entryPoints: [`${root}test/parity-entry.tsx`], outfile, bundle: true, platform: "node", format: "esm",
    jsx: "automatic", tsconfig: `${crateRoot}tsconfig.json`, alias, logLevel: "error",
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  });
  return JSON.parse(execFileSync(process.execPath, [outfile], { encoding: "utf8" }));
}

// Markup with attributes sorted, so attribute order alone never counts as a difference.
function normalize(html) {
  return html
    .replace(/<!-- -->/g, "")
    .replace(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*(\/?)>/g, (_, tag, attrs, self) => {
      // Serialization only: preact ends inline styles with ";" and leaves out an empty class.
      const list = [...attrs.matchAll(/([^\s=>]+)(?:="([^"]*)")?/g)]
        .map((m) => [m[1], m[1] === "style" ? (m[2] ?? "").replace(/;$/, "") : m[2] ?? ""])
        .filter(([name, value]) => !(name === "class" && value === ""))
        .map(([name, value]) => `${name}="${value}"`)
        .sort();
      return `<${tag}${list.length ? " " + list.join(" ") : ""}${self ? " /" : ""}>`;
    });
}

const react = await render("react", {});
const compat = await render("preact", {
  react: preact("compat/dist/compat.module.js"),
  "react-dom": preact("compat/dist/compat.module.js"),
  "react-dom/server": preact("compat/server.mjs"),
  "react/jsx-runtime": preact("jsx-runtime/dist/jsxRuntime.module.js"),
});

const failures = [];
for (const [key, html] of Object.entries(react)) {
  const a = normalize(html);
  const b = normalize(compat[key] ?? "");
  if (a !== b) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    failures.push(`${key}: differs at ${i}\n  react:  …${a.slice(Math.max(0, i - 60), i + 80)}\n  preact: …${b.slice(Math.max(0, i - 60), i + 80)}`);
  }
}
if (failures.length) {
  console.error(`FAIL parity: ${failures.length} of ${Object.keys(react).length} renders differ\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`PASS parity: ${Object.keys(react).length} renders match between React and preact/compat`);
