// Generates machine-readable docs for coding agents, from source, on every build:
//   public/llms.txt          index of crate and every registry item (llmstxt.org format)
//   public/llms/<item>.md    one doc per item: purpose, install, import, props, states,
//                            labels, types, example
// Sources: registry.json (names, purpose), the component TypeScript (props, defaults,
// states, labels), and README.md (intro and examples). The script fails if an item
// has no README example or no props type, so the docs cannot silently go stale.
// Run: node scripts/llms.mjs (part of npm run build)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Forward slashes on Windows too, so paths match the TypeScript program's file names.
const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/");
// Normalize line endings: a Windows checkout (git autocrlf) has CRLF files.
const read = (file) => readFileSync(`${root}${file}`, "utf8").replace(/\r\n?/g, "\n");
const registry = JSON.parse(read("registry.json"));
const readme = read("README.md");
const siteUrl = read("lib/config.ts").match(/SITE_URL = "([^"]+)"/)[1];
const fence = "```";

// ---------- README ----------
const readmeTitle = readme.match(/^# (.+)$/m)[1];
const readmeIntro = readme.split("\n## ")[0].split("\n").slice(1).join("\n").trim();
function readmeSection(heading) {
  const start = readme.indexOf(`\n## ${heading}\n`);
  if (start < 0) return "";
  const rest = readme.slice(start + heading.length + 5);
  const end = rest.indexOf("\n## ");
  return end < 0 ? rest : rest.slice(0, end);
}
function codeBlocks(text) {
  return [...text.matchAll(/```(\w*)\n([\s\S]*?)```/g)].map((m) => ({ lang: m[1], code: m[2].trimEnd() }));
}
const componentExamples = codeBlocks(readmeSection("Components")).flatMap((block) => block.code.split("\n"));
const usageBlock = codeBlocks(readmeSection("AI SDK usage")).find((block) => block.lang === "tsx");
const providerExample = codeBlocks(readmeSection("Labels and languages")).find((block) => block.lang === "tsx");
const adapterBlocks = codeBlocks(readmeSection("Stream Adapters")).filter((block) => block.lang === "ts" || block.lang === "tsx");

// ---------- TypeScript ----------
const sourceFiles = [...new Set(registry.items.flatMap((item) => item.files.map((file) => `${root}${file.path}`)))];
const program = ts.createProgram(sourceFiles, {
  jsx: ts.JsxEmit.Preserve,
  strict: true,
  skipLibCheck: true,
  baseUrl: root,
  paths: { "@/*": ["./*"] },
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
});
const checker = program.getTypeChecker();
const sourceOf = (path) => program.getSourceFile(`${root}${path}`);

function exportedFunctions(sf) {
  return sf.statements.filter((s) => ts.isFunctionDeclaration(s) && s.name && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
}
function typeAlias(sf, name) {
  return sf.statements.find((s) => (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) && s.name.text === name);
}
function clean(text) {
  return text.replace(/\s+/g, " ").replace(/ \| undefined$/, "").trim();
}
function propsOf(decl) {
  const type = checker.getTypeAtLocation(decl.name);
  return checker.getPropertiesOfType(type).map((prop) => {
    const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
    const nonNull = checker.getNonNullableType(propType);
    const literals = nonNull.isUnion() && nonNull.types.every((t) => t.isStringLiteral()) ? nonNull.types.map((t) => t.value) : null;
    return {
      name: prop.name,
      optional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
      type: clean(checker.typeToString(propType, decl, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)),
      doc: ts.displayPartsToString(prop.getDocumentationComment(checker)).replace(/\s+/g, " ").trim(),
      literals,
    };
  });
}
function defaultsOf(fn) {
  const param = fn?.parameters[0];
  const defaults = {};
  if (param && ts.isObjectBindingPattern(param.name)) {
    for (const element of param.name.elements) {
      if (element.initializer) defaults[(element.propertyName ?? element.name).getText()] = element.initializer.getText();
    }
  }
  return defaults;
}
function exportedTypes(sf, skip) {
  return sf.statements
    .filter((s) => ts.isTypeAliasDeclaration(s) && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && !skip.has(s.name.text))
    .map((s) => s.getText(sf));
}

// Labels a component reads (l.someLabel / labels.someLabel) and their English defaults.
const providerSf = sourceOf("components/agent-wait-states/crate-provider.tsx");
const defaultLabelText = {};
for (const statement of providerSf.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const d of statement.declarationList.declarations) {
    if (d.name.getText(providerSf) !== "defaultLabels" || !d.initializer || !ts.isObjectLiteralExpression(d.initializer)) continue;
    for (const p of d.initializer.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      defaultLabelText[p.name.getText(providerSf)] = ts.isStringLiteral(p.initializer) ? JSON.stringify(p.initializer.text) : p.initializer.getText(providerSf).replace(/\s+/g, " ");
    }
  }
}
function labelsUsed(text) {
  // Direct reads (l.done) plus keys named as strings for lookups (l[item.label]).
  const direct = [...text.matchAll(/\b(?:l|labels)\.(\w+)/g)].map((m) => m[1]);
  const named = [...text.matchAll(/\blabel:\s*"(\w+)"/g)].map((m) => m[1]);
  return [...new Set([...direct, ...named])].filter((key) => key in defaultLabelText);
}

// ---------- Doc blocks ----------
// Each doc is built once as sections of blocks, then written two ways: Markdown for
// agents (public/llms) and JSON for the docs pages (lib/docs.generated.json).
// A table cell is plain text or { code } for inline code.
const text = (value) => ({ type: "text", text: value });
const codeBlock = (lang, value) => ({ type: "code", lang, code: value });
const table = (head, rows) => ({ type: "table", head, rows });
const list = (items) => ({ type: "list", items });
const subheading = (value) => ({ type: "h3", text: value });
const inline = (value) => ({ code: String(value) });

function propsBlock(props, defaults) {
  if (!props.length) return text("None.");
  return table(["Prop", "Type", "Required", "Default", "Notes"], props.map((p) => [
    inline(p.name), inline(p.type), p.optional ? "no" : "yes", defaults[p.name] ? inline(defaults[p.name]) : "", p.doc,
  ]));
}
function labelsBlock(keys) {
  return table(["Label", "English default"], keys.map((k) => [inline(k), inline(defaultLabelText[k])]));
}
function docOf(node) {
  const symbol = node.name && checker.getSymbolAtLocation(node.name);
  return symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)).replace(/\s+/g, " ").trim() : "";
}
function signatureOf(fn, sf) {
  const params = fn.parameters.map((p) => p.getText(sf).replace(/\s+/g, " ")).join(", ");
  return `${fn.name.text}(${params})${fn.type ? `: ${fn.type.getText(sf)}` : ""}`;
}
const installCommand = (name) => `npx shadcn@latest add ${siteUrl}/r/${name}.json`;
const docUrl = (name) => `${siteUrl}/llms/${name}.md`;

// ---------- Markdown ----------
const cell = (value) => String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
// Inline code that may itself contain backticks (template-string labels).
const mdCode = (value) => (String(value).includes("`") ? `\`\` ${cell(value)} \`\`` : `\`${cell(value)}\``);
const mdCell = (value) => (typeof value === "object" ? mdCode(value.code) : cell(value));
function mdBlock(block) {
  if (block.type === "text") return block.text;
  if (block.type === "h3") return `### ${block.text}`;
  if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
  if (block.type === "code") return `${fence}${block.lang}\n${block.code}\n${fence}`;
  return [`| ${block.head.join(" | ")} |`, `| ${block.head.map(() => "---").join(" | ")} |`, ...block.rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`)].join("\n");
}
function markdownOf(doc) {
  const lines = [`# ${doc.title}`, "", `> ${doc.description}`, ""];
  for (const section of doc.sections) {
    lines.push(`## ${section.heading}`, "");
    for (const block of section.blocks) lines.push(mdBlock(block), "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

// ---------- Per item ----------
const docs = [];
const problems = [];
for (const item of registry.items) {
  if (item.type === "registry:item") continue; // "all" bundle, listed in llms.txt only
  const install = { heading: "Install", blocks: [codeBlock("bash", installCommand(item.name))] };
  if (item.type === "registry:file") {
    // The agent skill: files for coding agents, not code.
    const readers = { ".claude/": "Claude Code (a skill)", ".cursor/": "Cursor (a rule)", ".agents/": "Codex and other agents: add a line to `AGENTS.md` pointing to this file" };
    const rows = item.files.map((file) => {
      const reader = Object.entries(readers).find(([prefix]) => file.target.startsWith(prefix));
      if (!reader) problems.push(`${item.name}: no known agent reads ${file.target}`);
      return [inline(file.target), reader?.[1] ?? ""];
    });
    const sections = [install, { heading: "Files", blocks: [table(["File", "For"], rows), text(`The skill itself: ${siteUrl}/r/${item.name}.json`)] }];
    docs.push({ item, exportName: item.title, sections });
    continue;
  }
  if (item.type === "registry:lib") {
    // Stream adapters: functions, not components. Document every export of the
    // item's own files, and the README examples that use them.
    const ownFiles = item.files.filter((file, index) => index === 0 || file.type === "registry:hook");
    const names = [];
    const imports = [];
    const functions = [];
    const types = [];
    for (const file of ownFiles) {
      const sf = sourceOf(file.path);
      const fns = exportedFunctions(sf);
      if (!fns.length) problems.push(`${item.name}: no exported function in ${file.path}`);
      names.push(...fns.map((fn) => fn.name.text));
      if (fns.length) imports.push(`import { ${fns.map((fn) => fn.name.text).join(", ")} } from "@/${file.path.replace(/\.tsx?$/, "")}";`);
      for (const fn of fns) {
        functions.push(subheading(fn.name.text), codeBlock("ts", signatureOf(fn, sf)));
        const doc = docOf(fn);
        if (doc) functions.push(text(doc));
      }
      types.push(...exportedTypes(sf, new Set()));
    }
    const sections = [install, { heading: "Import", blocks: [codeBlock("ts", imports.join("\n"))] }, { heading: "Functions", blocks: functions }];
    if (types.length) sections.push({ heading: "Types", blocks: [codeBlock("ts", types.join("\n\n"))] });
    const examples = adapterBlocks.filter((block) => names.some((name) => new RegExp(`\\b${name}\\(`).test(block.code)));
    if (!examples.length) { problems.push(`${item.name}: no example in the README's Stream Adapters section`); continue; }
    sections.push({ heading: "Example", blocks: examples.map((block) => codeBlock(block.lang, block.code)) });
    docs.push({ item, exportName: item.title, sections });
    continue;
  }
  const mainFile = item.files[0].path;
  const sf = sourceOf(mainFile);
  const sourceText = sf.getFullText();
  const key = item.name.replace(/-/g, "");
  const fn = exportedFunctions(sf).find((f) => f.name.text.toLowerCase().startsWith(key)) ?? exportedFunctions(sf).find((f) => f.name.text.toLowerCase().startsWith(item.name.split("-")[0]));
  if (!fn) { problems.push(`${item.name}: no exported function found in ${mainFile}`); continue; }
  const exportName = fn.name.text;
  const importPath = `@/${mainFile.replace(/\.(tsx?|ts)$/, "")}`;
  const sections = [install, { heading: "Import", blocks: [codeBlock("tsx", `import { ${exportName} } from "${importPath}";`)] }];

  const skipTypes = new Set();
  let example = null;
  let playground = null;

  if (item.type === "registry:hook") {
    const optionsAlias = typeAlias(sf, "UseAgentStatusOptions");
    if (!optionsAlias) problems.push(`${item.name}: no UseAgentStatusOptions type`);
    skipTypes.add("UseAgentStatusOptions");
    const signature = `${exportName}(${fn.parameters.map((p) => p.getText(sf).replace(/\s*=\s*\{\}$/, "")).join(", ")}): ${fn.type?.getText(sf) ?? "unknown"}`;
    sections.push({ heading: "Signature", blocks: [codeBlock("ts", signature)] });
    sections.push({ heading: "Options", blocks: [optionsAlias ? propsBlock(propsOf(optionsAlias), {}) : text("None.")] });
    const snapshot = typeAlias(sourceOf("components/agent-wait-states/types.ts"), "AgentStatusSnapshot");
    const status = typeAlias(sourceOf("components/agent-wait-states/types.ts"), "AgentStatus");
    sections.push({ heading: "Returns", blocks: [codeBlock("ts", `${status.getText()}\n\n${snapshot.getText()}`)] });
    const used = labelsUsed(sourceText);
    if (used.length) sections.push({ heading: "Labels", blocks: [text("Read from the nearest `CrateProvider`."), labelsBlock(used)] });
    example = usageBlock?.code;
  } else {
    const propsName = `${exportName}Props`;
    const alias = typeAlias(sf, propsName);
    if (!alias) { problems.push(`${item.name}: no exported ${propsName} type`); continue; }
    skipTypes.add(propsName);
    const props = propsOf(alias);
    const defaults = defaultsOf(fn);
    sections.push({ heading: "Props", blocks: [propsBlock(props, defaults)] });

    const states = props.filter((p) => p.literals);
    if (exportName === "AgentState") {
      const map = [...sourceText.matchAll(/state === "(\w+)" \? <(\w+)/g)];
      sections.push({ heading: "States", blocks: [
        text("Pass a `status` (an `AgentStatus` string, or the snapshot from `useAgentStatus`), and AgentState shows the matching component for each state:"),
        table(["State", "Renders"], map.map((m) => [inline(m[1]), inline(m[2])])),
      ] });
      // The playground offers every state AgentState renders.
      const status = props.find((p) => p.name === "status");
      if (status) status.literals = map.map((m) => m[1]);
    } else if (states.length) {
      const names = states.map((p) => `\`${p.name}\``).join(" and ");
      sections.push({ heading: "States", blocks: [
        text(`${exportName} shows a different state for each value of ${names}:`),
        list(states.map((p) => `\`${p.name}\`: ${p.literals.map((v) => `\`${v}\``).join(", ")}`)),
      ] });
    }

    if (exportName === "CrateProvider") {
      sections.push({ heading: "Labels", blocks: [
        text("Every label key, with its English default. Labels with a number are functions that receive the value and a locale formatter (`f.number`, `f.seconds`, `f.plural`)."),
        labelsBlock(Object.keys(defaultLabelText)),
      ] });
      example = providerExample?.code;
    } else {
      if (exportName === "AgentState") {
        sections.push({ heading: "Labels", blocks: [text("Pass `labels` to override labels for whichever state is showing. See the CrateProvider doc for every key.")] });
        example = usageBlock?.code;
      } else {
        const used = labelsUsed(sourceText);
        if (used.length) sections.push({ heading: "Labels", blocks: [text("Override with the `labels` prop or a `CrateProvider`."), labelsBlock(used)] });
        example = componentExamples.filter((line) => line.trim().startsWith(`<${exportName} `) || line.trim().startsWith(`<${exportName}>`)).join("\n");
      }
      playground = props.map((p) => ({ name: p.name, type: p.type, optional: p.optional, literals: p.literals, default: defaults[p.name] ?? null }));
    }
  }

  const extraTypes = exportedTypes(sf, skipTypes);
  if (extraTypes.length) sections.push({ heading: "Types", blocks: [codeBlock("ts", extraTypes.join("\n\n"))] });
  if (!example) { problems.push(`${item.name}: no example for ${exportName} in README.md`); continue; }
  sections.push({ heading: "Example", blocks: [codeBlock("tsx", example)] });
  docs.push({ item, exportName, sections, playground });
}

if (problems.length) {
  console.error(`llms: cannot generate docs:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

// ---------- llms.txt ----------
const isComponent = (d) => d.item.type === "registry:ui" && !["AgentState", "CrateProvider"].includes(d.exportName);
const entry = (d) => `- [${d.exportName}](${docUrl(d.item.name)}): ${d.item.description}`;
const all = registry.items.find((item) => item.type === "registry:item");
const index = [
  `# ${readmeTitle}`,
  "",
  `> ${readmeIntro.split("\n\n")[0]}`,
  "",
  readmeIntro.split("\n\n").slice(1).join("\n\n"),
  "",
  `Install everything: \`${installCommand(all.name)}\``,
  "",
  "## Start Here",
  "",
  ...["use-agent-status", "agent-state", "crate-provider"].map((name) => docs.find((d) => d.item.name === name)).filter(Boolean).map(entry),
  "",
  "## Components",
  "",
  ...docs.filter(isComponent).map(entry),
  "",
  "## Stream Adapters",
  "",
  ...docs.filter((d) => d.item.type === "registry:lib").map(entry),
  "",
  "## For Coding Agents",
  "",
  ...docs.filter((d) => d.item.type === "registry:file").map(entry),
  "",
  "## Registry",
  "",
  `- [${all.title}](${siteUrl}/r/${all.name}.json): ${all.description}`,
  ...registry.items.filter((item) => item.type !== "registry:item").map((item) => `- [${item.name}](${siteUrl}/r/${item.name}.json)`),
  "",
].join("\n");

rmSync(`${root}public/llms`, { recursive: true, force: true });
mkdirSync(`${root}public/llms`, { recursive: true });
for (const d of docs) writeFileSync(`${root}public/llms/${d.item.name}.md`, markdownOf({ title: d.exportName, description: d.item.description, sections: d.sections }));
writeFileSync(`${root}public/llms.txt`, index);
// The same docs for the site's /docs pages, grouped as in llms.txt.
const groupOf = (d) => (["use-agent-status", "agent-state", "crate-provider"].includes(d.item.name) ? "start"
  : d.item.type === "registry:lib" ? "adapters" : d.item.type === "registry:file" ? "agents" : "components");
const siteDocs = docs.map((d) => ({
  name: d.item.name,
  title: d.exportName,
  description: d.item.description,
  group: groupOf(d),
  sections: d.sections,
  playground: d.playground ?? null,
}));
writeFileSync(`${root}lib/docs.generated.json`, JSON.stringify(siteDocs, null, 2) + "\n");
console.log(`llms: wrote public/llms.txt, ${docs.length} docs in public/llms/, and lib/docs.generated.json`);
