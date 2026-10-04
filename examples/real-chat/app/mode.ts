// The chat talks to a real model only when a key is set and mock mode is off.
export function isMock() {
  return process.env.CRATE_MOCK === "1" || !process.env.ANTHROPIC_API_KEY;
}

export const model = process.env.CRATE_MODEL || "claude-opus-5-5";
