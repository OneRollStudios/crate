# Crate roadmap

Where crate is heading, and the rules for getting there. Use this to judge
whether a task moves crate forward. AGENTS.md says how to work; this file says
which direction.

## Vision

A developer tells their coding agent "make my AI app feel premium", and crate:

1. inspects the app,
2. matches its design system,
3. installs the right components,
4. wires them to the AI stream,
5. verifies they work.

From weeks of work to one prompt.

## Stages

Each stage builds on the one before. Issues carry the milestone label shown.

### 1. v1: launch crate #1 (`m0-ship-v1`)
Crate #1, wait states, plus the landing page, shipped and launched.

### 2. Agent-native (`m1-agent-native`)
Make crate easy for coding agents to find, understand, and install:
- llms.txt and machine-readable docs per component
- crate MCP server or agent skill
- stream adapters, so components plug into common AI streaming setups
- `crate init`: detect the app's theme and set up automatically

### 3. Breadth (`m2-breadth`)
- Docs site: one page per component, with a playground
- Crate #2, chosen from launch feedback
- Paid tier

### 4. Everywhere
- Framework-agnostic components (Web Components), so crate works beyond React
- Figma token import, so components match a design system from the source

### 5. Many crates
Each a separate crate, solving one problem every AI product has:
- Input and composer
- Human-in-the-loop
- Voice
- Generative UI
- Artifacts and canvas
- Feedback and evals
- Usage and cost

This list is a set of candidates, not a fixed order. See the rules below.

## Rules

- Crate #1 stays free, under the MIT license.
- Paid crates get their own license.
- Each crate solves one problem every AI product has.
- Pick each next crate from real user demand, not guesses.
