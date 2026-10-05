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

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => readFileSync(`${root}${file}`, "utf8");
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
const labelsBlock = codeBlocks(readmeSection("Labels and languages")).find((block) => block.lang === "tsx");
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

// ---------- Markdown helpers ----------
const cell = (text) => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
// Inline code that may itself contain backticks (template-string labels).
const code = (text) => (String(text).includes("`") ? `\`\` ${cell(text)} \`\`` : `\`${cell(text)}\``);
function propsTable(props, defaults) {
  if (!props.length) return "None.";
  const rows = props.map((p) => `| \`${p.name}\` | ${code(p.type)} | ${p.optional ? "no" : "yes"} | ${defaults[p.name] ? code(defaults[p.name]) : ""} | ${cell(p.doc)} |`);
  return ["| Prop | Type | Required | Default | Notes |", "| --- | --- | --- | --- | --- |", ...rows].join("\n");
}
function labelsTable(keys) {
  return ["| Label | English default |", "| --- | --- |", ...keys.map((k) => `| \`${k}\` | ${code(defaultLabelText[k])} |`)].join("\n");
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

// ---------- Per item ----------
const docs = [];
const problems = [];
for (const item of registry.items) {
  if (item.type === "registry:item") continue; // "all" bundle, listed in llms.txt only
  if (item.type === "registry:lib") {
    // Stream adapters: functions, not components. Document every export of the
    // item's own files, and the README examples that use them.
    const ownFiles = item.files.filter((file, index) => index === 0 || file.type === "registry:hook");
    const lines = [`# ${item.title}`, "", `> ${item.description}`, ""];
    lines.push("## Install", "", `${fence}bash`, installCommand(item.name), fence, "");
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
      for (const fn of fns) functions.push(`### ${fn.name.text}`, "", `${fence}ts`, signatureOf(fn, sf), fence, "", docOf(fn), "");
      types.push(...exportedTypes(sf, new Set()));
    }
    lines.push("## Import", "", `${fence}ts`, ...imports, fence, "");
    lines.push("## Functions", "", ...functions);
    if (types.length) lines.push("## Types", "", `${fence}ts`, types.join("\n\n"), fence, "");
    const examples = adapterBlocks.filter((block) => names.some((name) => new RegExp(`\\b${name}\\(`).test(block.code)));
    if (!examples.length) { problems.push(`${item.name}: no example in the README's Stream Adapters section`); continue; }
    lines.push("## Example", "", ...examples.flatMap((block) => [`${fence}${block.lang}`, block.code, fence, ""]));
    docs.push({ item, exportName: item.title, markdown: lines.join("\n").replace(/\n{3,}/g, "\n\n") });
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
  const lines = [`# ${exportName}`, "", `> ${item.description}`, ""];
  lines.push("## Install", "", `${fence}bash`, installCommand(item.name), fence, "");
  lines.push("## Import", "", `${fence}tsx`, `import { ${exportName} } from "${importPath}";`, fence, "");

  const skipTypes = new Set();
  let example = null;

  if (item.type === "registry:hook") {
    const optionsAlias = typeAlias(sf, "UseAgentStatusOptions");
    if (!optionsAlias) problems.push(`${item.name}: no UseAgentStatusOptions type`);
    skipTypes.add("UseAgentStatusOptions");
    const signature = `${exportName}(${fn.parameters.map((p) => p.getText(sf).replace(/\s*=\s*\{\}$/, "")).join(", ")}): ${fn.type?.getText(sf) ?? "unknown"}`;
    lines.push("## Signature", "", `${fence}ts`, signature, fence, "");
    lines.push("## Options", "", optionsAlias ? propsTable(propsOf(optionsAlias), {}) : "None.", "");
    const snapshot = typeAlias(sourceOf("components/agent-wait-states/types.ts"), "AgentStatusSnapshot");
    const status = typeAlias(sourceOf("components/agent-wait-states/types.ts"), "AgentStatus");
    lines.push("## Returns", "", `${fence}ts`, status.getText(), "", snapshot.getText(), fence, "");
    const used = labelsUsed(sourceText);
    if (used.length) lines.push("## Labels", "", "Read from the nearest `CrateProvider`.", "", labelsTable(used), "");
    example = usageBlock?.code;
  } else {
    const propsName = `${exportName}Props`;
    const alias = typeAlias(sf, propsName);
    if (!alias) { problems.push(`${item.name}: no exported ${propsName} type`); continue; }
    skipTypes.add(propsName);
    const props = propsOf(alias);
    lines.push("## Props", "", propsTable(props, defaultsOf(fn)), "");

    const states = props.filter((p) => p.literals);
    if (exportName === "AgentState") {
      const map = [...sourceText.matchAll(/state === "(\w+)" \? <(\w+)/g)].map((m) => `| \`${m[1]}\` | \`${m[2]}\` |`);
      lines.push("## States", "", "`status` is an `AgentStatus` string or the snapshot from `useAgentStatus`. Each state renders one component:", "", "| State | Renders |", "| --- | --- |", ...map, "");
    } else if (states.length) {
      lines.push("## States", "", ...states.map((p) => `- \`${p.name}\`: ${p.literals.map((v) => `\`${v}\``).join(", ")}`), "");
    }

    if (exportName === "CrateProvider") {
      lines.push("## Labels", "", "Every label key, with its English default. Labels with a number are functions that receive the value and a locale formatter (`f.number`, `f.seconds`, `f.plural`).", "", labelsTable(Object.keys(defaultLabelText)), "");
      example = labelsBlock?.code;
    } else if (exportName === "AgentState") {
      lines.push("## Labels", "", "Pass `labels` to override labels for whichever state is showing. See the CrateProvider doc for every key.", "");
      example = usageBlock?.code;
    } else {
      const used = labelsUsed(sourceText);
      if (used.length) lines.push("## Labels", "", "Override with the `labels` prop or a `CrateProvider`.", "", labelsTable(used), "");
      example = componentExamples.filter((line) => line.trim().startsWith(`<${exportName} `) || line.trim().startsWith(`<${exportName}>`)).join("\n");
    }
  }

  const extraTypes = exportedTypes(sf, skipTypes);
  if (extraTypes.length) lines.push("## Types", "", `${fence}ts`, extraTypes.join("\n\n"), fence, "");
  if (!example) { problems.push(`${item.name}: no example for ${exportName} in README.md`); continue; }
  lines.push("## Example", "", `${fence}tsx`, example, fence, "");
  docs.push({ item, exportName, markdown: lines.join("\n") });
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
  "## Registry",
  "",
  `- [${all.title}](${siteUrl}/r/${all.name}.json): ${all.description}`,
  ...registry.items.filter((item) => item.type !== "registry:item").map((item) => `- [${item.name}](${siteUrl}/r/${item.name}.json)`),
  "",
].join("\n");

rmSync(`${root}public/llms`, { recursive: true, force: true });
mkdirSync(`${root}public/llms`, { recursive: true });
for (const d of docs) writeFileSync(`${root}public/llms/${d.item.name}.md`, d.markdown);
writeFileSync(`${root}public/llms.txt`, index);
console.log(`llms: wrote public/llms.txt and ${docs.length} docs in public/llms/`);
