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
