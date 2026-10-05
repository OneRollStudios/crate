// Wraps an app's root in CrateProvider, using the TypeScript compiler API to
// find the exact place. Only two shapes are edited: <body>{children}</body> in
// a Next.js App Router layout, and the <App /> passed to render() in a Vite
// main file. Anything else is left alone and the caller prints instructions.
import ts from "typescript";

function walk(node, visit) {
  if (visit(node) === false) return;
  ts.forEachChild(node, (child) => walk(child, visit));
}

const tagName = (node) => (ts.isJsxElement(node) ? node.openingElement.tagName.getText() : ts.isJsxSelfClosingElement(node) ? node.tagName.getText() : null);

/** Returns { code, reason } where code is null when the file was not changed. */
export function addProvider(source, { file, kind, importPath, locale }) {
  if (source.includes("CrateProvider")) return { code: null, reason: "already uses CrateProvider" };
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const open = locale ? `<CrateProvider locale="${locale}">` : "<CrateProvider>";
  const close = "</CrateProvider>";
  let edit = null;

  if (kind === "next-app") {
    // Wrap everything inside <body>.
    walk(sf, (node) => {
      if (edit) return false;
      if (ts.isJsxElement(node) && tagName(node) === "body") {
        const children = node.children.filter((child) => !(ts.isJsxText(child) && child.containsOnlyTriviaWhiteSpaces));
        if (!children.length) return false;
        edit = { start: children[0].getStart(sf), end: children.at(-1).getEnd() };
        return false;
      }
    });
  } else if (kind === "vite") {
    // Wrap the <App /> element, wherever it sits inside render(...).
    walk(sf, (node) => {
      if (edit) return false;
      if (ts.isCallExpression(node) && node.expression.getText(sf).endsWith("render")) {
        walk(node, (inner) => {
          if (!edit && tagName(inner) === "App") edit = { start: inner.getStart(sf), end: inner.getEnd() };
        });
        return false;
      }
    });
  }
  if (!edit) return { code: null, reason: "no place found to add CrateProvider" };

  const wrapped = `${source.slice(0, edit.start)}${open}${source.slice(edit.start, edit.end)}${close}${source.slice(edit.end)}`;
  // Add the import after the last import (keeping "use client" or other directives on top).
  const imports = sf.statements.filter(ts.isImportDeclaration);
  const at = imports.length ? imports.at(-1).getEnd() : 0;
  const line = `import { CrateProvider } from "${importPath}";`;
  const code = at ? `${wrapped.slice(0, at)}\n${line}${wrapped.slice(at)}` : `${line}\n${wrapped}`;
  return { code, reason: null };
}

export function providerSnippet({ kind, importPath, locale }) {
  const open = locale ? `<CrateProvider locale="${locale}">` : "<CrateProvider>";
  const where = kind === "next-app" ? "inside <body> in your root layout" : kind === "vite" ? "around <App /> in src/main.tsx" : "around your app's root component";
  return [`import { CrateProvider } from "${importPath}";`, "", `// Wrap ${where}:`, `${open}`, "  {children}", "</CrateProvider>"].join("\n");
}
