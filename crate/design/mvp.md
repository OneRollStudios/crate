# Crate — MVP Brief

_A marketplace of ready-to-import UI & agent packs. Vendor: **ORS**._
_Last updated: 2026-09-28_

## What it is

**Crate** is a marketplace where developers buy reusable, importable UI and agent
components — sold as **packs (“crates”)** and also installable as **Skills**.
It is not a single component library; the marketplace itself is the product.
Morphicons (morphicons.com) is one pack done well; Crate is the store that sells fifty.

## The story we're selling

Not "components" — **relief.** Every team rebuilds the same fiddly, animation-heavy UI
(spinners, streaming states, cards, heroes) over and over. The promise:

> **You shouldn't have to build this again. We already did — beautifully.
> Open a crate, drop it in, ship.**

That maps to the three feelings the design must sell:
- **Comfort** — relief from the grind (airy, calm, soft).
- **Ease** — one import / one skill install.
- **Tech** — production-grade: typed, accessible, animated.

## Business model

- **Packs (crates):** priced per crate (e.g. $19–$39).
- **Freemium:** a few **free "tasters"** in every crate → pay to unpack the full crate.
- **All-access:** one membership ($149/yr) — every crate, every piece, every new drop.
- **Skills:** each pack category is also installable as a (paid/freemium) Skill.

## Product categories (packs)

Launch set / roadmap — "so much could be sold":
- **AI Components** (pack #1) — streaming, reasoning traces, tool calls, citations, guardrails, token meters
- **Preloaders** — loaders & skeletons for AI agents
- **Animated Cards** — lift / tilt / reveal / flip presets
- **Hero Sections** — fully composed, drop-in heroes
- **Agent States** — thinking / running / waiting / done, visualized
- (more categories over time)

## Brand & visual system (LOCKED)

- **Name:** Crate (alternative still on the table: **Pantry** — one-word swap).
  Both beat earlier "Latent" / "Kitchen" because they say *already made, just grab it.*
- **Palette:** airy near-white + soft **lilac→sky duotone**.
  - paper `#F7F8FC` · surface `#FFFFFF` · sunk `#EEF0F8`
  - ink `#1B1B24` · muted `#6A6C7E` · faint `#A9ABC2`
  - duotone `#9E8CF2` (lilac) → `#6FB6F0` (sky); accent/indigo `#6C63FF`
  - green "free" badge `#2F8F5E`
- **Type:** Bricolage Grotesque (display) · Hanken Grotesk (body) · JetBrains Mono (code/labels).
  Signature move: the accent word set in **duotone gradient text**.
- **Form:** rounded corners (~16px), soft cool-tinted shadows, generous whitespace.
- **Motion:** gentle — drifting duotone blob, live-animated pack previews (spinners,
  tilt cards, pulsing states), soft fade-up on load. All `prefers-reduced-motion` safe.
- **Fonts are embedded as base64 data-URIs** (Artifact CSP blocks font CDNs).

## Where we are

- ✅ Foundations locked (name, palette, type, story, model).
- ✅ **Homepage v1 built** — hero + "On the shelf" pack grid (6 crates incl. All-access).
  File: `latent-page.html` history superseded by `crate.html`.
  Published artifact: https://claude.ai/code/artifact/756917f2-f403-4409-9feb-29a271369642

## Open decisions / next steps

1. Crate vs Pantry (final call).
2. Duotone softness/hues — confirm or tune.
3. Build out: full homepage sections (how-it-works: *import ↔ skill*, real pricing,
   a live playground à la morphicons), **and/or** a **crate detail page** (what you see
   when you open "AI Components").

## Reference sites studied

- **morphicons.com** — the comfort+ease+tech north star (soft pastel + live playground + `npm install` hero).
- **stripe.com** — problem→purpose→benefit narrative, section rhythm, two-tone headlines.
- **proofmode.org / yotpo.com** — warm-editorial register, serif display, product-truth overlays.

## Working files (in this folder)

- `crate.html` — current homepage (source of truth).
- `latent-foundations.html` — earlier style-tile (superseded palette).
- `latent-page.html`, `latent-hero.html`, `latent-redesign.html` — earlier "Latent" explorations (archived).
