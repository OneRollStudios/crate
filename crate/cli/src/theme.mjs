// Finds the theme variables Crate's components read that the app's CSS does not
// define, and builds one clearly marked block that adds only those. Existing
// variables are never changed.

export const COLOR_VARS = ["background", "foreground", "primary", "primary-foreground", "muted", "muted-foreground", "border", "destructive"];
export const THEME_VARS = [...COLOR_VARS, "radius"];

// shadcn's default neutral theme, used only for variables the app has no value for.
const DEFAULTS = {
  light: {
    background: "oklch(1 0 0)", foreground: "oklch(0.145 0 0)", primary: "oklch(0.205 0 0)",
    "primary-foreground": "oklch(0.985 0 0)", muted: "oklch(0.97 0 0)", "muted-foreground": "oklch(0.556 0 0)",
    border: "oklch(0.922 0 0)", destructive: "oklch(0.577 0.245 27.325)", radius: "0.625rem",
  },
  dark: {
    background: "oklch(0.145 0 0)", foreground: "oklch(0.985 0 0)", primary: "oklch(0.922 0 0)",
    "primary-foreground": "oklch(0.205 0 0)", muted: "oklch(0.269 0 0)", "muted-foreground": "oklch(0.708 0 0)",
    border: "oklch(1 0 0 / 10%)", destructive: "oklch(0.704 0.191 22.216)",
  },
};

export const MARKER = "/* Added by crate init:";

// Variables declared inside every block whose selector matches (comments stripped).
function declared(css, selector) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const names = new Map();
  let found = false;
  for (const match of text.matchAll(/([^{}]+)\{/g)) {
    // The selector is the last statement before the brace.
    if (!selector.test(match[1].split(";").pop().trim())) continue;
    found = true;
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (i < text.length && depth > 0) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      i++;
    }
    for (const v of text.slice(start, i - 1).matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) names.set(v[1], v[2].trim());
  }
  return { found, names };
}

export function planTheme(css) {
  if (css.includes(MARKER)) return { missing: [], block: "", notes: ["The theme block crate init added earlier is already there."] };
  const root = declared(css, /^:root$/);
  const dark = declared(css, /^\.dark$/);
  const theme = declared(css, /^@theme(\s+inline)?$/);

  const rootLines = [];
  const darkLines = [];
  const themeLines = [];
  const notes = [];
  for (const name of THEME_VARS) {
    if (root.names.has(name)) continue;
    const own = theme.names.get(`color-${name}`) ?? (name === "radius" ? theme.names.get("radius-lg") : undefined);
    if (own && !own.includes(`var(--${name})`)) {
      const source = name === "radius" ? "radius-lg" : `color-${name}`;
      rootLines.push(`  --${name}: var(--${source});`);
      notes.push(`--${name}: from the app's --${source}`);
    } else {
      rootLines.push(`  --${name}: ${DEFAULTS.light[name]};`);
      notes.push(`--${name}: shadcn's default (the app had no value for it)`);
    }
  }
  if (dark.found) {
    for (const name of COLOR_VARS) {
      if (dark.names.has(name)) continue;
      darkLines.push(`  --${name}: ${DEFAULTS.dark[name]};`);
      notes.push(`--${name} in .dark: shadcn's dark default`);
    }
  }
  // Tailwind utilities (bg-primary, text-muted-foreground) need --color-* names.
  for (const name of COLOR_VARS) {
    if (!theme.names.has(`color-${name}`)) themeLines.push(`  --color-${name}: var(--${name});`);
  }

  const parts = [];
  if (rootLines.length) parts.push(`:root {\n${rootLines.join("\n")}\n}`);
  if (darkLines.length) parts.push(`.dark {\n${darkLines.join("\n")}\n}`);
  if (themeLines.length) parts.push(`@theme inline {\n${themeLines.join("\n")}\n}`);
  const missing = [...rootLines, ...darkLines, ...themeLines].map((line) => line.trim().split(":")[0]);
  const block = parts.length ? `\n${MARKER} theme variables Crate's components read that this app did not define. */\n${parts.join("\n\n")}\n` : "";
  return { missing, block, notes };
}
