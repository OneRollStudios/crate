# Proposal: An Honest Minimum Display Time (#79)

Status: proposal, waiting for approval. Nothing here is built yet.

## Problem

A real agent test showed `tool` (and other short states) on screen for under
half a second. The state is real, but it disappears before anyone can read it:

- The enter animation in `AgentState` alone takes 260 ms, so a 150 ms tool
  call is replaced before it has finished fading in.
- `aria-live` announces every state, so a burst of short states is a burst of
  announcements a screen reader user can't follow.

## Rules

1. **Nothing fake.** A state is only shown if it really happened. No made-up
   steps, no progress that isn't there, no artificial delay before the answer.
2. **What is on screen is true.** If a state is kept on screen after it has
   ended, it must say that it ended. A tool call that finished shows as
   finished ("Ran search_docs", with a check), never as "Running search_docs…".
3. **Important states never wait.** `error`, `approval`, and `stalled` replace
   whatever is showing at once.
4. **A hold is short and bounded.** A state is kept at most `minDisplayMs` from
   the moment it first appeared, so the next state (the reply streaming in,
   for example) waits at most that long, and usually less. Only what
   `AgentState` shows is affected; the hook's snapshot and the app's own UI
   always get the real state at once.

## Proposal

`AgentState` gets a `minDisplayMs` prop, default **600 ms**, and `0` turns it
off. When the status changes:

| From | To | What happens |
| --- | --- | --- |
| A state shown for at least `minDisplayMs` | anything | Switch at once, as today |
| `tool`, `sources`, or `reasoning` shown for less | another in-progress state, `streaming`, or `done` | Keep the current state until it has been shown for `minDisplayMs`, in its **finished** form, then switch to the latest status |
| anything | `error`, `approval`, `stalled` | Switch at once |

If the status changes several times during a hold, only the latest one is shown
when the hold ends: the hold never queues up a backlog of old states.

What the finished forms are:

| State | While held after it ended |
| --- | --- |
| `tool` | The step with a check: "Ran search_docs" (new label `ranTool`, overridable through `CrateProvider` like every label) |
| `sources` | The source list as it was (sources don't change once found) |
| `reasoning` | The reasoning trace with `done` set |

`thinking` is never held: it ends when content arrives, and that content should show at once.

So in practice the hold covers the case the test hit: a tool call that starts
and ends within a fraction of a second stays readable, marked as done, for at
most 600 ms in total.

### Why 600 ms

It covers the 260 ms enter animation plus enough time to read a short label. It
is a starting point to tune by eye on the preview, not a researched number,
which is why it's a prop.

### Where It Lives

In `AgentState`, not in `useAgentStatus`. The hook keeps reporting exactly what
is happening right now (apps that build their own UI from the snapshot still
get the real state at once). `AgentState` only decides how long a finished
state stays readable.

Reduced motion: the hold is about reading time, not animation, so it applies
with `prefers-reduced-motion` too.

## How It Would Be Tested

The install test's mocked stream (`scripts/stream-test.mjs`) gets new cases:

- A tool call that starts and ends 100 ms apart, followed by text: the tool
  state appears, switches to its finished form ("Ran …"), stays at least
  600 ms in total, then streaming shows.
- An error during a hold: the error shows at once.
- A tool call longer than 600 ms: no change from today (no extra wait after it
  ends).
- `minDisplayMs={0}`: today's behavior exactly.

## Questions for Review

1. Is 600 ms the right default, or should it be shorter (400 ms)?
2. Should `sources` and `reasoning` be held too, or only `tool`?
3. Wording of the finished tool label: "Ran search_docs" or "Used search_docs"?
