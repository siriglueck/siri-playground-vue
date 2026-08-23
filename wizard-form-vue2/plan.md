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

## 6. Build order (we do these together, one at a time)

- [ ] **Step 0 — Scaffold.** Create the vue-cli project, install Vue 2.6 +
      BootstrapVue 2.23 (same stack as your `yt-bootstrap-vue` examples), get a
      blank page running with `npm run serve`.
- [ ] **Step 1 — App + empty modal.** One button that opens/closes a `<b-modal>`.
      Learn modal open/close and `v-model` on the modal.
- [ ] **Step 2 — The data model (`models.js`).** Factory functions that create a
      blank incident / participant / injury / first-aid row. One place that
      defines our JSON shape.
- [ ] **Step 3 — Wizard shell.** Put the step counter, the Back/Next/Submit
      buttons, and the shared `form` inside `WizardModal`. Swap step views with
      `v-if` on `currentStep`.
- [ ] **Step 4 — StepUnfalldaten (step 1 view)** + "validate before Next".
- [ ] **Step 5 — StepBeteiligte + ParticipantCard** with nested appendable
      injuries and first-aid rows. (The big one.)
- [ ] **Step 6 — StepPreview (step 3 view)** + image preview.
- [ ] **Step 7 — Assemble & emit the final JSON** up to `App`, and log it /
      show it so you can see the finished object.

Each step: I write the file(s) with heavy comments, then explain what's new and
*why*. You read, ask, we move on.

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
```