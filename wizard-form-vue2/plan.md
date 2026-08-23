# Wizard Form (Vue 2 + BootstrapVue) — Build Plan & Learning Reference

A 3-step wizard form that lives inside a modal, collects an accident report,
and produces one nested JSON object to send to a backend.

This file is your map. Read it top to bottom once, then use it as a reference
while we build each piece together. Every code file we write will also have
detailed inline comments — this file explains the *big picture*; the comments
explain the *lines*.

---

## 1. What we are building

- **Page** with a single button: "Neuen Unfall melden" (Report new accident).
- Clicking it opens a **modal** containing a **3-step wizard**:
  1. **Unfalldaten** — accident type, date, time, photo(s).
  2. **Beteiligte Daten** — participants (appendable). Each participant has
     injuries (appendable) and first-aid materials (appendable), nested inside.
  3. **Vorschau (Preview)** — read-only summary of steps 1 & 2, including the
     photo preview.
- "Weiter" (Next) on step 1 **validates first** — you cannot advance with a
  missing required field.
- Final "Absenden" (Submit) builds one JSON object and hands it to the page.

**No Vuex / no state-management library.** We move data with plain Vue:
props down, events up, and one shared draft object. Understanding that flow
is the main goal.

---

## 2. The target JSON (the finish line)

Everything we build exists to produce this shape. Note the **three levels of
nesting** — that is the heart of the exercise.

```json
{
  "incidentType": "work_accident",
  "incidentDate": "2026-07-30T10:30:00",
  "incidentLocation": "Warehouse B",

  "incidentPhoto": [
    { "filename": "photo1.jpeg" }
  ],

  "incidentParticipant": [
    {
      "firstName": "Max",
      "lastName": "Mustermann",

      "injury": [
        { "bodyPart": "Hand", "injuryType": "Cut" }
      ],

      "firstAidUsages": [
        { "firstAidMaterial": "Bandage", "amount": 2 }
      ]
    }
  ]
}
```

```
incident
 ├─ incidentPhoto[]          ← appendable   (step 1)
 └─ incidentParticipant[]    ← appendable   (step 2)
     ├─ injury[]             ← appendable, nested inside ONE participant
     └─ firstAidUsages[]     ← appendable, nested inside ONE participant
```

We keep the field list small on purpose (you are learning the *structure*, not
filling a real form). Adding more fields later is trivial once the nesting works.

---

## 3. Component tree

```
App.vue                        the "first page": 1 button + the modal
 └─ WizardModal.vue            OWNS the draft form + which step is showing
     ├─ StepUnfalldaten.vue        step 1: type, date, time, photo
     ├─ StepBeteiligte.vue         step 2: the participant LIST
     │    └─ ParticipantCard.vue   ONE participant; owns its injury[] &
     │                             firstAidUsages[] add/remove buttons
     └─ StepPreview.vue            step 3: read-only preview + image
```

Why split it this way?
- **App** = the page. It owns the *final saved data* and whether the modal is open.
- **WizardModal** = the form's brain. It owns the *draft* (`form`) and the
  *current step number*. Only the modal cares which step is showing.
- **Steps** = dumb-ish views. They receive the shared `form` and read/write it.
- **ParticipantCard** = one reusable row. Splitting it out keeps step 2 readable
  and gives us a clean example of a child talking to its parent.

Rule of thumb: **put state as low as possible, but high enough that everyone who
needs it can reach it.** The draft lives in the modal because all three steps
need it; the "which step" number lives in the modal because only it cares.

---

## 4. The data flow model (read this twice)

### 4a. Props DOWN, events UP

State has **one owner**. The owner passes data **down** as props. A child never
reaches up and edits the owner's variables; it **emits an event up** and lets the
owner decide.

```
   WizardModal  ──:form (prop, down)──▶  StepUnfalldaten / StepBeteiligte / StepPreview
   WizardModal  ◀──@next / @back (event, up)──  the Next/Back buttons

   StepBeteiligte ──:participant (prop, down)──▶ ParticipantCard
   StepBeteiligte ◀──@remove (event, up)──────── ParticipantCard
```

- **Down** = binding a prop:  `<StepUnfalldaten :form="form" />`
- **Up**   = listening for an event: `<ParticipantCard @remove="removeParticipant" />`
- Inside the child, you fire it with `this.$emit('remove', index)`.

### 4b. The one shared draft object (the deliberate exception)

Normally "don't mutate a prop." But we pass the **same** `form` object to every
step on purpose — like a shared whiteboard. Steps 1 & 2 write into its
properties; step 3 reads them. Because it is ONE object, a change in step 2
(e.g. `form.incidentParticipant.push(...)`) is instantly visible in step 3 with
zero syncing code.

```
✅ Allowed:  form.incidentType = 'work_accident'
✅ Allowed:  form.incidentParticipant.push(newParticipant)
❌ Not OK:  form = somethingElse   // reassigning breaks the shared link
```

We mutate the object's *properties/arrays*; we never *reassign* the whole prop.

### 4c. Three kinds of state — keep them separate in your head

| State                     | Lives in       | What it is                          |
| ------------------------- | -------------- | ----------------------------------- |
| **Saved data**            | `App.vue`      | Reports we've submitted (the future DB) |
| **Draft / in-progress**   | `WizardModal`  | The form being filled right now (`form`) |
| **UI-only state**         | wherever used  | `currentStep`, `showModal`          |

---

## 5. Vue 2 syntax cheat-sheet (what the code will use)

Since we're starting blank, here is the Vue 2 **Options API** vocabulary. Every
component is an object with these sections:

```js
export default {
  name: 'MyComponent',

  components: { ChildComponent },      // child components used in the template

  props: {                             // data received from the PARENT (read-only)
    form: { type: Object, required: true },
  },

  data() {                             // this component's OWN reactive state
    return { currentStep: 1 }          // must be a function that RETURNS an object
  },

  computed: {                          // derived values, auto-recalculate
    isLastStep() { return this.currentStep === 3 },
  },

  methods: {                           // functions; call with @click="doThing"
    doThing() { this.$emit('next') },  // talk to the parent by emitting
  },

  watch: {                             // run code when a value changes
    showModal(newVal) { /* ... */ },
  },
}
```

Key rules you'll meet:
- Inside methods/template, `this.` reaches your data, props, computed, methods.
- `data` **must be a function** (so each instance gets its own copy).
- Change parent data only via `this.$emit('event-name', payload)`.
- `v-model` on a `<b-form-input>` binds a value both ways (read + write).
- `v-for` needs a `:key`.

### BootstrapVue components we'll use

| Component              | For                                    |
| --------------------- | -------------------------------------- |
| `<b-modal>`           | the popup window                       |
| `<b-form-group>`      | label + field + validation message wrapper |
| `<b-form-input>`      | text / date / time inputs              |
| `<b-form-select>`     | dropdown (accident type)               |
| `<b-form-file>`       | photo upload                           |
| `<b-form-invalid-feedback>` | the red error text               |
| `<b-button>`          | buttons                                |
| `<b-card>`            | the participant card container         |

Validation display in BootstrapVue is done with the **`:state`** prop:
`:state="true"` → green, `:state="false"` → red, `:state="null"` → neutral
(not yet validated). We compute that boolean and pass it in.

---

## 6. Build order  ✅ COMPLETE

- [x] **Step 0 — Scaffold.** vue-cli project, Vue 2.6 + BootstrapVue 2.23 (same
      stack as the `yt-bootstrap-vue` examples), blank page via `npm run serve`.
- [x] **Step 1 — App + empty modal.** One button opens/closes a `<b-modal>`,
      controlled from App with `:visible.sync`.
- [x] **Step 2 — The data model.** Instead of one central `models.js`, we
      COLOCATED each step's data logic in a sibling `.data.js` file (factories,
      constants, validation). See section 8 for the final structure.
- [x] **Step 3 — Wizard shell.** Step counter, Back/Next/Submit buttons, and the
      shared `form` live in `WizardModal`. Step views swap with `v-if` on
      `currentStep`.
- [x] **Step 4 — StepUnfalldaten (step 1 view)** + "validate before Next".
- [x] **Step 5 — StepBeteiligte + ParticipantCard** with nested appendable
      injuries and first-aid rows, live participant name in the card header, and
      nested validation.
- [x] **Step 6 — StepPreview (step 3 view)** + photo thumbnails, value→label
      mapping (`work_accident` → "Arbeitsunfall").
- [x] **Step 7 — Assemble & emit the final JSON.** `buildPayload()` translates
      the draft into the backend shape; the wizard emits `submit`; `App` receives
      and displays it.

### What changed from the original plan (and why)

- **`models.js` → per-step `.data.js` files.** We colocated each feature's logic
  with its component (feature-folder convention). The overall form factory sits
  in `WizardModal.data.js` because the wizard owns the form.
- **ESLint override for step files.** Our shared-form design mutates a prop,
  which the default `vue/no-mutating-props` rule forbids. We turned it off for
  `src/components/steps/*.vue` only (see `package.json` > eslintConfig >
  overrides). Everywhere else the "don't mutate props" rule still applies.
- **Nested validation.** The step-2 error object mirrors the data shape
  (`errors.injury[i]`, `errors.firstAidUsages[i]`). Because those arrays are
  always present, "is this participant valid?" needed a real helper
  (`participantHasError`) instead of counting keys.

---

## 7. Glossary (quick reminders)

- **prop** — data passed from a parent into a child. Read-only in the child.
- **emit** — how a child sends a message (event) up to its parent.
- **v-model** — two-way binding on a form field (read the value AND write it back).
- **v-for** — repeat an element for each item in an array (needs `:key`).
- **v-if** — render an element only when a condition is true.
- **computed** — a value derived from other data; recalculates automatically.
- **factory function** — a small function that returns a fresh blank object
  (e.g. `createParticipant()`), so we never hand-write the same shape twice.
- **working copy** — when editing, we edit a *clone* so Cancel can throw it away
  without touching the saved data.

---

## 8. Final file structure (what we actually built)

```
wizard-form-vue2/
├─ package.json               deps + scripts + ESLint override for step files
├─ babel.config.js
├─ jsconfig.json
├─ plan.md                    ← this file
├─ public/
│  └─ index.html              the single page; Vue mounts into <div id="app">
└─ src/
   ├─ main.js                 entry point: CSS + Vue.use(BootstrapVue) + mount App
   ├─ App.vue                 the page: owns `reports` (pretend DB), list + localStorage,
   │                          hosts modal, handles @save-draft / @submit
   └─ components/
      ├─ WizardModal.vue      the BRAIN: owns form draft + currentStep + nav + save-draft
      ├─ WizardModal.data.js  createIncident(), combineDateTime()/splitDateTime(),
      │                       buildPayload() (form→record), recordToForm() (record→form)
      └─ steps/
         ├─ StepUnfalldaten.vue       step 1 UI (type, date, time, location, photos)
         ├─ StepUnfalldaten.data.js   INCIDENT_TYPES + validateStep1()
         ├─ StepBeteiligte.vue        step 2 UI: owns the participant LIST
         ├─ StepBeteiligte.data.js    create* factories + validateStep2() + participantHasError()
         ├─ ParticipantCard.vue       ONE participant: its own injury[] & firstAidUsages[]
         └─ StepPreview.vue           step 3 UI: read-only summary + photo thumbnails
```

Convention recap: each feature colocates `Component.vue` (UI) with
`Component.data.js` (plain-data logic: factories, constants, validation). The
`.vue` file touches Vue/`this`/DOM; the `.data.js` file never does.

---

## 9. Build history (GitHub)

Repo: `siriglueck/siri-playground-vue` · branch `main`

```
b2623c5  learn: add save-draft & resume feature (localStorage, upsert, working copy)
63713ca  learn: assemble & emit final JSON payload (step 7)
53efc1f  learn: build step 3 preview (read-only summary + photos)
33dbdf1  learn: build step 2 (participants) with nested appendable rows
3f4865e  learn: scaffold Vue2 + BootstrapVue wizard (modal + validated step 1)
```

| Commit    | Covers        | What landed                                                        |
| --------- | ------------- | ----------------------------------------------------------------- |
| `3f4865e` | Steps 0–4     | Scaffold, `:visible.sync` modal, wizard shell, validated step 1   |
| `33dbdf1` | Step 5        | Participants + `ParticipantCard`, nested rows, live header, validation |
| `53efc1f` | Step 6        | Read-only preview, value→label mapping, photo thumbnails          |
| `63713ca` | Step 7        | `buildPayload()`, `submit` event up to `App`, JSON displayed      |
| `b2623c5` | Feature       | Save draft & resume: localStorage DB, upsert by id, working-copy edit |

---

## 10. Where this goes next

- **POST to the backend.** Replace `App.persist()` / `App.load()` (currently
  localStorage) with `await api.post('/incidents', payload)` / `api.get(...)`.
  Only those two methods change — the whole prop/event flow stays the same.
- ~~**Edit an existing report.**~~ ✅ Done in section 11 (the "working copy" /
  resume flow).
- **More fields.** The nesting is done; adding fields is just more inputs bound
  into the same `form` and mapped in `buildPayload()` / `recordToForm()`.
- **Draft validation on submit.** A resumed draft could still be incomplete;
  `Absenden` already re-validates each step via `next()`, but you could also
  block submit from step 3 if any earlier step is invalid.

---

## 11. Feature: Save draft & resume

Lets the user save an **incomplete** form, leave, and come back to finish it.
Drafts persist in `localStorage` (a stand-in for the backend DB).

### Two shapes, two translators (the key idea)

The **form** shape (good for editing) is NOT the **record** shape (good for
storing). We translate in both directions instead of forcing one shape to do
both jobs:

```
   form (edit shape)                        record (stored/backend shape)
   • incidentDate 'YYYY-MM-DD'   buildPayload →  • incidentDate 'YYYY-MM-DDThh:mm:00'
   • incidentTime 'hh:mm'        ───────────→    • reportStatus 'drafted'|'submitted'
   • photo { filename, url }                     • photo { filename }   (url stripped)
   • id                          recordToForm ←   • id
                                 ───────────→
```

- `buildPayload(form, status)` — form → record (combine date+time, stamp status,
  strip photo `url`, carry `id`).
- `recordToForm(record)` — record → form (split datetime back, rebuild fields).
  It also deep-copies everything, so it doubles as the **working copy**.

### The working-copy pattern

Reopening a draft loads a *fresh deep copy* into `form` (that's what
`recordToForm` returns). So editing never touches the stored row — **Cancel is
always safe**, and only Save writes back (via the emitted payload → `upsert`).

### Upsert by id (no duplicates)

`App.upsert(record)`: if `id == null` → assign a new id and push; else replace
the matching row. One function does both create and update, so re-saving a draft
(or later submitting it) updates the same `#id` instead of duplicating it.

### Data flow

```
App (owns `reports` + localStorage)
 │  :incident (record to edit, or null)     ▼ down
 │  :visible.sync                            ▼ down
WizardModal
 │  @save-draft(payload)  (no validation, status 'drafted')   ▲ up
 │  @submit(payload)      (validated,     status 'submitted') ▲ up
 └─ resetForm(): form = incident ? recordToForm(incident) : createIncident()
```

- **Save draft** is on every step and **skips validation** — a draft may be
  incomplete on purpose.
- **The storage seam is tiny:** `App.persist()` / `App.load()` are the only two
  methods that touch localStorage. Swap them for API calls and nothing else
  changes.

### Known limitation: photos

A draft stores only the photo `filename` (a browser blob `url` can't survive a
refresh). So a *reloaded* draft shows the filename as text, not a thumbnail. A
real backend would return an image URL to show instead; the templates guard both
cases (`v-if="photo.url"`).