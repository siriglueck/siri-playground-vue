# 3-Step Incident Wizard — Vue 3 + Bootstrap 5

A learning demo that reports workplace incidents through a **3-step wizard form**
shown in a modal. Built to practice Vue 3 fundamentals: component structure,
**state management**, **props-down / events-up** data flow, and **form
validation**.

> 📚 For a deep dive on how state moves through the app, read
> [`DATA-FLOW.md`](./DATA-FLOW.md). The source files are heavily commented to
> match it.

---

## Features

- **Incident list** — a Bootstrap table on the main page with type, place, time,
  people, injured count, and a Draft/Submitted status badge.
- **3-step wizard** in a modal:
  1. **Incident info** — type (work / on-the-way / near-miss), where, separate
     **date** and **time** inputs, description, and multi-image upload with
     thumbnail previews.
  2. **People involved** — 1-to-many participants shown as a collapsible
     **accordion**, each with an *injured* toggle that reveals injury details
     and first-aid checkboxes.
  3. **Summary** — a read-only recap of steps 1 and 2 before submitting.
- **Save draft** — persist an incomplete report at any step (validation skipped).
- **Submit** — enforces validation across all steps first.
- **Edit** — reopen any row; the wizard edits a *copy*, so the list is untouched
  until you save.
- **Custom theme** — Bootstrap recompiled with a deep-wine-red primary color.

---

## Tech stack

| Tool                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| **Vue 3**           | UI framework (Composition API, `<script setup>`) |
| **Vite**            | Dev server + build tool                        |
| **Bootstrap 5**     | Styling (compiled from SCSS for theming)       |
| **Bootstrap Icons** | Icons                                          |
| **Sass**            | Compiles our custom Bootstrap theme            |

No Bootstrap JS is used — the modal and wizard are driven entirely by Vue state.

---

## Getting started

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
npm run build   # production build into dist/
npm run preview # preview the production build
```

Requires Node.js 18+.

---

## Project structure

```
3-steps-wizard-form/
├── index.html                     # app entry HTML
├── src/
│   ├── main.js                    # mounts the app; imports theme + icons
│   ├── incidents.js               # domain data, factories, VALIDATION rules
│   ├── App.vue                    # ⭐ state hub: owns the incidents list
│   ├── styles/
│   │   └── custom.scss            # overrides $primary, then imports Bootstrap
│   └── components/
│       ├── IncidentTable.vue      # the list on the main page
│       ├── IncidentWizardModal.vue# modal shell: stepper, nav, draft/submit
│       └── steps/
│           ├── StepIncidentInfo.vue   # step 1
│           ├── StepParticipants.vue   # step 2
│           └── StepSummary.vue        # step 3
├── DATA-FLOW.md                   # study notes on state & data flow
└── README.md
```

---

## How state & data flow works (short version)

The app follows **"props down, events up"** with a single source of truth.

- **`App.vue`** owns the real data (`incidents`) and the UI flags
  (`showModal`, `editingIncident`). It's the only place that commits changes.
- Data flows **down** as props (`:incidents`, `:show`, `:incident`).
- Changes flow **up** as events (`@edit`, `@save-draft`, `@submit`, `@close`).
- The **modal edits a private copy** (`model`) of the incident, so nothing in
  the table changes until the user saves.
- The **three steps share that same reactive `model`**, so edits in step 2 are
  instantly visible in the step 3 summary.

See [`DATA-FLOW.md`](./DATA-FLOW.md) for diagrams and a full traced example.

---

## Dates & the storage shape (DATETIME2)

The form and the stored record deliberately have **different shapes** for the
date/time — a small but real-world lesson.

- The form uses **two inputs**: `occurredDate` (`<input type="date">` → `YYYY-MM-DD`)
  and `occurredTime` (`<input type="time">` → `HH:mm`).
- At save time the wizard combines them with `combineDateTime2()` into a single
  `occurredAt` value shaped for **SQL Server `DATETIME2`**:
  `YYYY-MM-DDTHH:mm:ss` (ISO 8601). See `buildPayload()` in
  `IncidentWizardModal.vue`.

```
 occurredDate: "2026-07-22"  ┐
                             ├─ combineDateTime2 ─▶ occurredAt: "2026-07-22T14:30:00"
 occurredTime: "14:30"       ┘                     (stored as DATETIME2 later)
```

This combine happens at the **data boundary** (when data leaves the form and
becomes a record), so inputs stay convenient while storage stays clean.

---

## Form validation

Validation lives as **pure functions** in `src/incidents.js`
(`validateStep1`, `validateParticipant`, `validateStep2`) — no Vue or DOM, so
they're easy to reuse and test.

**Rules**

| Step | Field           | Rule                                          |
| ---- | --------------- | --------------------------------------------- |
| 1    | Type            | required                                      |
| 1    | Where           | required                                      |
| 1    | Date            | required                                      |
| 1    | Time            | required                                      |
| 2    | Name            | required for every participant                |
| 2    | Injury details  | required **only when** the person is injured  |

> When Submit finds an error in a collapsed participant panel, the accordion
> auto-expands that panel so the message isn't hidden.

**Behavior**

- **Save draft** skips validation — an incomplete report can always be saved.
- **Next** validates the current step; if invalid it reveals the errors and
  blocks advancing.
- **Submit** validates everything; if a step is invalid it jumps you to the
  first broken step and shows the errors.
- Errors stay hidden until you try to advance/submit (a `validated` flag),
  using Bootstrap's `.is-invalid` + `.invalid-feedback` styling.

---

## Theming (changing the color)

The primary color is set in `src/styles/custom.scss` **before** Bootstrap is
imported, so the whole framework recompiles with it:

```scss
$primary: #781e2a;            // deep wine red
@import 'bootstrap/scss/bootstrap';
```

Change that one value (e.g. `#0d6efd` for the classic blue) and everything —
buttons, badges, the stepper, links — updates.

---

## Roadmap / next steps

- [ ] Persist data to a **backend + database** (replaces the in-memory array in
      `App.vue`; the prop/event flow stays the same).
- [ ] Save drafts to `localStorage` so they survive a page refresh.
- [ ] Real image upload to storage instead of in-memory object URLs.
- [ ] Unit tests for the validation functions.

---

## Notes

- All data is currently **in-memory** — refreshing the page clears the list.
- The `DEPRECATION WARNING` messages during build come from Bootstrap 5.3's own
  SCSS on newer Sass versions; they're harmless and don't affect output.
