// @onerollstudios/crate-elements: importing this module defines every Crate
// element (<crate-thinking>, <crate-agent-state>, ...) and <crate-provider>.
import { defineCrateElement } from "./element";
import { specs } from "./generated/specs";
export { CrateProviderElement } from "./provider";

for (const spec of specs) defineCrateElement(spec);

export { specs };
