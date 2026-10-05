// crate init against fixture apps. A fake runner stands in for npx, so no
// network is needed; CI's install test runs the real thing. Each run's output
// is compared with test/expected/<name>.txt. To accept a deliberate change to
// what crate init prints, run: UPDATE=1 npm test
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { init } from "../src/init.mjs";
import { buildWiring } from "../scripts/wiring.mjs";

const VARS = ["background", "foreground", "primary", "primary-foreground", "muted", "muted-foreground", "border", "destructive"];
const fullTheme = (values = {}) => [
  '@import "tailwindcss";',
  "",
  "@theme inline {",
  ...VARS.map((v) => `  --color-${v}: var(--${v});`),
  "}",
  "",
  ":root {",
  "  --radius: 0.625rem;",
  ...VARS.map((v) => `  --${v}: ${values[v] ?? "oklch(0.5 0 0)"};`),
  "}",
  "",
].join("\n");

const nextLayout = (lang = "en") => `import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="${lang}">
      <body>{children}</body>
    </html>
  );
}
`;

function app(files, deps = {}) {
  const dir = mkdtempSync(join(tmpdir(), "crate-init-"));
  const all = {
    "package.json": JSON.stringify({ dependencies: { react: "19", tailwindcss: "4", ...deps } }),
    ...files,
  };
  for (const [file, text] of Object.entries(all)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  return dir;
}

const componentsJson = (css = "app/globals.css") => JSON.stringify({ tailwind: { css }, aliases: { components: "@/components" } });

async function runInit(dir, name, options = {}) {
  const lines = [];
  const commands = [];
  const run = (command, args, cwd) => {
    commands.push([command, ...args].join(" "));
    // shadcn init creates its config and a default theme.
    if (args.includes("init")) {
      writeFileSync(join(cwd, "components.json"), componentsJson());
      mkdirSync(join(cwd, "app"), { recursive: true });
      writeFileSync(join(cwd, "app/globals.css"), fullTheme());
    }
  };
  const result = await init({ cwd: dir, yes: true, registry: "https://crate.test", log: (line) => lines.push(line), run, ...options });
  const output = lines.join("\n") + "\n";
  const expectedFile = new URL(`./expected/${name}.txt`, import.meta.url);
  if (process.env.UPDATE) writeFileSync(expectedFile, output);
  assert.equal(output, readFileSync(expectedFile, "utf8"), `output changed for ${name}; run UPDATE=1 npm test if that is deliberate`);
  return { ...result, commands, read: (file) => readFileSync(join(dir, file), "utf8") };
}

test("Next.js with default shadcn: AI SDK detected, provider added, theme unchanged", async () => {
  const css = fullTheme();
  const dir = app({ "components.json": componentsJson(), "app/globals.css": css, "app/layout.tsx": nextLayout() }, { next: "16", ai: "5", "@ai-sdk/react": "2" });
  const { commands, read } = await runInit(dir, "next-default");
  assert.deepEqual(commands, ["npx --yes shadcn@latest add https://crate.test/r/all.json --yes --overwrite"]);
  assert.equal(read("app/globals.css"), css);
  assert.match(read("app/layout.tsx"), /<body><CrateProvider>\{children\}<\/CrateProvider><\/body>/);
  assert.match(read("app/layout.tsx"), /import \{ CrateProvider \} from "@\/components\/agent-wait-states\/crate-provider";/);
});

test("Next.js with its own theme: the theme is left exactly as it is", async () => {
  const css = fullTheme({ primary: "oklch(0.52 0.24 300)", background: "oklch(0.97 0.02 85)" });
  const dir = app({ "components.json": componentsJson(), "app/globals.css": css, "app/layout.tsx": nextLayout() }, { next: "16" });
  const { read } = await runInit(dir, "next-themed");
  assert.equal(read("app/globals.css"), css);
});

test("Vite + React: src/main.tsx wrapped, locale from index.html", async () => {
  const main = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
  const dir = app(
    { "components.json": componentsJson("src/index.css"), "src/index.css": fullTheme(), "src/main.tsx": main, "index.html": '<!doctype html><html lang="de"><body></body></html>' },
    { vite: "8", "@openai/agents": "0.18" },
  );
  const { commands, read } = await runInit(dir, "vite");
  assert.deepEqual(commands, ["npx --yes shadcn@latest add https://crate.test/r/all.json https://crate.test/r/openai-agents-adapter.json --yes --overwrite"]);
  assert.match(read("src/main.tsx"), /<CrateProvider locale="de"><App \/><\/CrateProvider>/);
});

test("Missing theme variables: one marked block added, existing ones untouched, and a second run changes nothing", async () => {
  const css = '@import "tailwindcss";\n\n@theme {\n  --color-primary: #7c3aed;\n}\n\n:root {\n  --background: #fffdf7;\n}\n';
  const dir = app({ "components.json": componentsJson(), "app/globals.css": css, "app/layout.tsx": nextLayout() }, { next: "16", "@langchain/core": "1" });
  const first = await runInit(dir, "missing-vars");
  const after = first.read("app/globals.css");
  assert.ok(after.startsWith(css.trimEnd()), "existing CSS must stay unchanged");
  assert.match(after, /\/\* Added by crate init:/);
  assert.match(after, /--primary: var\(--color-primary\);/);
  assert.doesNotMatch(after, /--background: oklch/);
  assert.doesNotMatch(after, /--color-primary: var\(--primary\)/);
  assert.match(first.commands[0], /langchain-adapter\.json/);
  const second = await runInit(dir, "missing-vars-again");
  assert.equal(second.read("app/globals.css"), after);
});

test("A root layout in an unknown shape is left alone and the lines to add are printed", async () => {
  const layout = `import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
`;
  const dir = app({ "components.json": componentsJson(), "app/globals.css": fullTheme(), "app/layout.tsx": layout }, { next: "16" });
  const { read } = await runInit(dir, "unknown-shape");
  assert.equal(read("app/layout.tsx"), layout);
});

test("No shadcn: runs shadcn init first, then installs and checks the new theme", async () => {
  const dir = app({ "app/layout.tsx": nextLayout("fr") }, { next: "16" });
  const { commands, read } = await runInit(dir, "no-shadcn");
  assert.deepEqual(commands, [
    "npx --yes shadcn@latest init --defaults --yes",
    "npx --yes shadcn@latest add https://crate.test/r/all.json https://crate.test/r/agent-stream.json --yes --overwrite",
  ]);
  assert.match(read("app/layout.tsx"), /<CrateProvider locale="fr">/);
});

test("--dry-run and answering no change nothing", async () => {
  const layout = nextLayout();
  const dir = app({ "components.json": componentsJson(), "app/globals.css": fullTheme(), "app/layout.tsx": layout }, { next: "16" });
  const dry = await runInit(dir, "dry-run", { yes: false, dryRun: true });
  assert.deepEqual(dry.commands, []);
  const declined = await runInit(dir, "declined", { yes: false, ask: async () => false });
  assert.deepEqual(declined.commands, []);
  assert.equal(declined.read("app/layout.tsx"), layout);
});

test("An app without React or Tailwind gets a clear error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "crate-init-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "19" } }));
  await assert.rejects(init({ cwd: dir, yes: true, log: () => {}, run: () => {} }), /Tailwind CSS/);
  assert.ok(!existsSync(join(dir, "components.json")));
});

test("src/wiring.json matches the README examples", () => {
  const committed = JSON.parse(readFileSync(new URL("../src/wiring.json", import.meta.url), "utf8"));
  assert.deepEqual(committed, buildWiring(), "run npm run wiring in crate/cli");
});
