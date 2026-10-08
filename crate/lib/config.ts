export const SITE_URL = "https://crate.onerollstudios.com";
export const DISCOVERY_URL =
  "https://www.cal.eu/onerollstudios/discovery?utm_source=packs";
export const STUDIO_URL = "https://onerollstudios.com";

export function registryUrl(name: string) {
  return `${SITE_URL}/r/${name}.json`;
}

export function installCommand(name: string) {
  return `npx shadcn@latest add ${registryUrl(name)}`;
}

// The vote form for the next crate. The landing page's "Notify Me" bar opens it
// with ?email=...&picks=Voice,Generative%20UI (Tally: add hidden fields named
// "email" and "picks"). Placeholder until the form exists: replace with the
// form's URL. While it points at this site, the bar sends nothing and says so.
export const NEXT_CRATE_FORM_URL = "#vote-next-crate";
