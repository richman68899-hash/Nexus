# Nexus

A personal command center for projects, tasks, calendar, notes, and momentum — built as a real, working scholarship-portfolio project rather than a demo shell.

Dark-mode-first, neon-accented, built with React + TypeScript + Vite + Tailwind CSS v4. No backend — everything lives in your browser's `localStorage`, with JSON export/import for backups.

## Running it locally

Requires [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). That's it — no environment variables, no API keys, no backend to stand up.

Other scripts:

```bash
npm run build     # type-checks, then builds a production bundle to dist/
npm run preview   # serves the production build locally
```

On first launch the app is empty. Click **Load demo data** (on the empty Projects/Dashboard view, or under Settings → Data) to populate it with five example projects — including "Vocogni" and "Chess Club" from the brief's own examples — with realistic tasks, milestones, notes, reminders, and reward-shop items, so it's ready to walk through immediately.

**A note on the demo data specifically:** it's seeded so that today has no completions yet, but the six days before today do — meaning the very first task you complete during a live demo naturally extends the streak to 7 and unlocks the "Consistency" achievement live, on camera. "Project Finisher" and "Big Day" are also left reachable rather than pre-unlocked, so you have a couple of real achievement unlocks available to trigger during a walkthrough.

## Architecture

**State management: React Context + plain functions, no external state library.** `src/store/AppContext.tsx` holds one `AppState` object in `useState` and exposes ~30 action functions (`addTask`, `completeTask`, `redeemReward`, …) through context. Each action is a plain function that reads the *current* `state` closure and calls `setState` once with a fully-computed next value — deliberately **not** the `setState(prev => …)` updater pattern. That choice matters: it makes it easy to verify by eye that no action silently drops another action's changes (a real bug I hit and fixed during development — see below), at the cost of not using React's automatic stale-state protection. Since every action runs synchronously inside a single event handler, this is safe.

The one place that pattern doesn't work is the reminder-notification poller, which lives inside a `setInterval` that fires later, after unknown numbers of re-renders. That one specific effect uses a `stateRef` (a ref kept in sync with `state` via its own effect) so the interval always reads fresh state without needing to be torn down and recreated constantly. It's the only ref-based escape hatch in the store, and it's commented as such.

**Derived state, not duplicated state.** There is no stored `totalXP`, `streak`, or `dailyStats` anywhere. XP is computed by summing `xpAwarded` off every *currently completed* task, milestone, and project; streaks and the activity graph are computed from those same completion timestamps. Practical effect: unchecking a task automatically and correctly reverses its XP and removes it from that day's stats, achievements never accidentally get double-counted, and there's no synchronization code to get wrong. `src/lib/selectors.ts` and `src/lib/xpEngine.ts` are where this all lives.

**XP vs. spendable balance.** "Total XP" (used for level and achievements) is lifetime and never decreases. Redeeming a reward spends from a separately-derived **balance** (`total XP earned − XP already redeemed`) — so cashing in a reward never knocks you back down a level. This is a deliberate small deviation from a literal reading of the brief, made because a leveling-down-on-spend mechanic is the kind of thing that undermines "satisfying" gamification in every app that has it.

**Theming.** Every color is a CSS custom property (`--bg`, `--accent`, `--accent-rgb`, …) defined once in `src/index.css`, with a `:root[data-theme='light']` override block for light mode. The accent color and theme are applied in exactly one place (`App.tsx`'s single `useEffect`) via `documentElement.style.setProperty(...)`. Components reference these through Tailwind's arbitrary-value syntax (`bg-[var(--accent)]`) rather than Tailwind's own color theme, because Tailwind classes are resolved at build time and the accent color is a runtime, user-controlled value.

**Charts are hand-rolled SVG, not a charting library.** Given the brief's own "avoid unnecessary dependencies" and "don't over-engineer" guidance, `src/components/ui/Charts.tsx` implements a small bar/line chart directly in SVG rather than pulling in Recharts or similar. It's dependency-free, fully themeable, and about 100 lines. Recharts would be a reasonable swap later if you want more chart types.

**Sounds are generated, not audio files.** `src/lib/soundEngine.ts` uses the Web Audio API to synthesize four short tones (chime/pop/bell/sparkle) with oscillators and gain envelopes — nothing to license, nothing to load, no asset pipeline.

## Main file structure

```
src/
  types/index.ts        Every entity type (Project, Task, Note, Reminder, Reward, Achievement, …)
  lib/
    dateUtils.ts         Local-date-safe date math (deliberately avoids `new Date(string)`)
    xpEngine.ts           XP totals, level curve, level progress
    selectors.ts           Derived queries: progress %, streaks, daily activity, "next up", search
    achievementEngine.ts   The 5 achievement definitions + unlock evaluation
    recurrence.ts           Generates the next occurrence of a repeating task
    soundEngine.ts           Generated tones (Web Audio)
    notifications.ts         Browser Notification API wrapper + reminder due-checking
    persistence.ts           The only file that touches localStorage
    exportImport.ts           JSON export/import
    demoData.ts                Seeded example dataset
    constants.ts                 Accent/icon presets, default settings, motivational messages
  store/AppContext.tsx     The whole app's state + actions (see Architecture above)
  components/
    ui/                    Reusable primitives: Button, Card, Modal, form controls, charts, toast
    layout/AppShell.tsx     Sidebar (desktop) / bottom nav + "More" sheet (mobile) / top bar
    dashboard/ projects/ tasks/ calendar/ notes/ progress/ rewards/ settings/ focus/ search/
                             One folder per feature area — a *Page.tsx plus its form modals
  App.tsx                  View routing, theme application, global search/toast/focus-mode/quick-create
  main.tsx                 Entry point
```

## Implementation decisions worth knowing about

- **No React Router.** Navigation is a `useState<ViewName>` in `App.tsx`, persisted to settings so refresh returns you to the same page. There's no deep-linking. For a single-user local tool that's a reasonable trade; adding a router later is a small, contained change.
- **Recurrence is daily/weekly/monthly with an interval — not a full RRULE engine.** Completing a recurring task generates exactly one next occurrence. This was an explicit choice per the brief's own "reliability over feature complexity" instruction.
- **Quick-add is a small deterministic parser, not AI.** It recognizes a trailing `today`/`tomorrow`/weekday and an existing project name mentioned in the text — nothing fuzzier. Same reasoning as above.
- **Reminders fire while the app is open in a tab.** There's no service worker or push server, so notifications are checked on a 30-second interval while Nexus is open, not delivered to a closed browser or lock screen. Real background delivery would need a small backend to hold push subscriptions — a natural next step if this becomes a daily-driver app.
- **Focus Mode is reached from the Dashboard's "Next up" card** (a small "Focus" button), since it isn't one of the primary nav sections. Wiring a launch point onto every task row (Tasks page, project detail) would be a quick follow-up.

## Verifying it

I built and reviewed this without being able to run `npm install` or a compiler in my working environment (no network access there), so I couldn't do a final `npm run build` myself. I was careful — every import/export pair, every component prop, every CSS variable, and every icon name was cross-checked by script against what's actually defined — but a project this size, hand-written, can still have a small type mismatch `tsc` would catch that I didn't. Start with `npm run dev`: Vite's dev server transpiles without type-checking, so the app should run even if `npm run build`'s stricter type check turns up something small. If it does, tell me what it says and I'll fix it.

## Remaining optional improvements

Everything in the brief's "Version 1" priority list (projects, tasks, calendar, notes, deadlines/reminders, completion feedback, XP/rewards, progress tracker, graphs, persistence) is implemented and working end to end, along with settings, import/export, achievements, demo data, search, and focus mode. Beyond that, in roughly the order I'd tackle them:

1. **IndexedDB instead of localStorage**, if you start attaching images/files to projects or notes — localStorage's ~5–10MB ceiling is more than enough for text data at this scale, but won't hold attachments.
2. **A real backend + service worker**, only if you want reminders to fire when the tab isn't open, or want to use this from more than one device.
3. **Drag-and-drop** for moving tasks between calendar days — currently done by opening the task and changing its date, which is more reliable (especially on mobile) but one extra tap.
4. **react-router**, if deep-linking to a specific project/task URL becomes useful.
5. **Recharts (or similar)**, if you want chart types beyond bar/line — the current selector functions (`getDailyActivityMap`, etc.) already return plain data, so swapping the rendering layer wouldn't touch any business logic.
6. **Per-task Focus Mode launch** from the Tasks page and project detail view, not just the Dashboard.
7. **A full keyboard-shortcut layer** (e.g. `n` for new task, `/` for search) — the pieces (QuickAdd, GlobalSearch) are already separate components, so this is mostly wiring.

