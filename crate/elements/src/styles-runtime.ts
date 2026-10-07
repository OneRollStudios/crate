import { properties, styles } from "./generated/styles";

let sheet: CSSStyleSheet | undefined;

/** The one stylesheet every Crate element adopts into its shadow root. */
export function crateSheet(): CSSStyleSheet {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    // Registered @property rules apply everywhere, but only take effect from a
    // document-level stylesheet, never from inside a shadow root.
    const global = new CSSStyleSheet();
    global.replaceSync(properties);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global];
  }
  return sheet;
}
