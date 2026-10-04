// Copies Crate's components and hook into this example, exactly as
// `npx shadcn add .../r/all.json` would, from the registry committed at
// crate/public/r/all.json. Runs before dev and build, so the example always
// uses the current components. It also writes lib/crate-components.json, the
// registry's names and descriptions, for the chat's lookup tool. The copied
// files are gitignored.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = join(root, "../../crate/public/r/all.json");
const item = JSON.parse(await readFile(registry, "utf8"));

for (const file of item.files) {
  const target = join(root, file.target);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, file.content);
}
const index = JSON.parse(await readFile(join(root, "../../crate/registry.json"), "utf8"));
const components = index.items
  .filter((entry) => entry.type !== "registry:item")
  .map(({ name, title, description }) => ({ name, title, description }));
await mkdir(join(root, "lib"), { recursive: true });
await writeFile(join(root, "lib/crate-components.json"), JSON.stringify(components, null, 2) + "\n");

console.log(`Synced ${item.files.length} Crate files from crate/public/r/all.json.`);
