# Data Flow & State Management — Study Notes

A study reference for how state moves through this Vue 3 app. Read it alongside
the commented code in `src/`.

---

## 1. The one big idea: "Props down, events up"

State has **one owner**. That owner passes data **down** to children as props,
and children ask for changes by sending **events up**. A child never edits the
owner's data directly — it just *requests* a change, and the owner decides.

```
                        ┌───────────────────────────┐
                        │          App.vue           │
                        │  OWNS the real state:       │
                        │   • incidents  (saved data) │
                        │   • showModal  (UI)         │
                        │   • editingIncident (UI)    │
                        └───────────────────────────┘
                    props ▼ (down)          ▲ events (up)
        ┌───────────────────────┐   ┌───────────────────────────────┐
        │     IncidentTable      │   │      IncidentWizardModal       │
        │  :incidents            │   │  :show   :incident             │
        │                        │   │                                │
        │  emits ▲ @edit         │   │  emits ▲ @close                │
        └───────────────────────┘   │        @save-draft  @submit    │
                                     └───────────────────────────────┘
                                          props ▼ (model, shared)
                                     ┌───────────────────────────────┐
                                     │  StepIncidentInfo (writes)     │
                                     │  StepParticipants (writes)     │
                                     │  StepSummary      (reads)      │
                                     └───────────────────────────────┘
```

- **Down** = binding a prop:  `<IncidentTable :incidents="incidents" />`
- **Up**   = listening for an event: `<IncidentTable @edit="openEdit" />`
- Inside the child, the event is fired with `emit('edit', incident)`.

---

## 2. The three kinds of state

Not all state is the same. Keep them separate in your head:

| State                        | Lives in                  | What it is                          | Example                    |
| ---------------------------- | ------------------------- | ----------------------------------- | -------------------------- |
| **Committed / saved data**   | `App.vue`                 | The real records (future "database")| `incidents`                |
| **Draft / in-progress**      | `IncidentWizardModal.vue` | The form being edited right now     | `model`                    |
| **UI-only state**            | wherever it's used        | View bookkeeping, not real data     | `currentStep`, `showModal` |

Rule of thumb: **put state as low as possible, but high enough that everyone
who needs it can reach it.** `incidents` sits in App because both the table and
(indirectly) the modal touch it. `currentStep` sits in the modal because only
the modal cares which step is showing.

---

## 3. The "working copy" pattern (the most important part)

When you open the wizard to **edit** an incident, the modal does **not** edit
the table's row. It clones it first:

```js
// IncidentWizardModal.vue
const source = props.incident
  ? cloneIncident(props.incident)   // EDIT: copy, so the table stays untouched
  : createIncident()                // CREATE: start blank
Object.assign(model, source)        // load the copy into our working object
```

Why clone?

- The user can type, add participants, change their mind, then **Cancel** — and
  the table is unchanged, because we only ever edited the copy.
- The table's data only changes when the user **Saves**, at which point the
  modal emits the copy up and App commits it.

```
 EDIT flow:

   table row ──clone──▶ model (working copy) ──user edits──▶ model changed
                                                              │
                                          Cancel ◀────────────┤
                                          (table row unchanged)│
                                                              │ Save/Submit
                                                              ▼
                                           emit('save-draft', {...model})
                                                              │  (up to App)
                                                              ▼
                                            App.upsert() replaces the row
```

Props are **read-only**. Cloning is also how we respect that rule: we never
write back into `props.incident`.

---

## 4. The shared reactive object (the deliberate exception)

The three step components all receive the **same** `model` object:

```html
<StepIncidentInfo  :model="model" />
<StepParticipants  :model="model" />
<StepSummary       :model="model" />
```

Normally "don't mutate props" — but here `model` is a reactive **object** the
parent shares on purpose, like a shared whiteboard. Steps 1 & 2 write into its
properties; step 3 reads them. Because it's one reactive object:

- `model.participants.push(...)` in step 2 instantly updates the count in step 3.
- No copying or syncing between steps is needed.

✅ Allowed:  `model.location = 'Dock B'`  ·  `model.participants.push(...)`
❌ Not allowed: `model = somethingElse` (reassigning the prop breaks the link)

We keep the link alive even when resetting the form by mutating in place:

```js
Object.keys(model).forEach((k) => delete model[k]) // clear old keys
Object.assign(model, source)                        // copy new data IN
```

(We *mutate* `model` instead of doing `model = source`, so the steps keep
pointing at the same reactive object.)

---

## 5. Reactivity in one sentence

`ref()` and `reactive()` wrap your data so Vue can **watch** it. When you change
a wrapped value, Vue automatically re-renders only the parts of the screen that
used it — that's why pushing to `incidents` makes a new table row appear with no
manual DOM work.

- `ref(x)`      → for single values / arrays; access with `.value` in JS.
- `reactive({})`→ for objects; access properties directly (no `.value`).
- `computed()`  → derived value that recalculates when its inputs change
  (e.g. `injuredCount` in the summary).

---

## 6. Trace one full action: "Save a new incident as draft"

1. User clicks **Report incident** → `openNew()` sets `editingIncident = null`,
   `showModal = true`.  *(App state changes)*
2. `:show` prop becomes `true` → modal's `watch` runs → loads a **blank**
   `model`.  *(down)*
3. User fills fields across steps → each keystroke mutates the shared reactive
   `model`.  *(local draft state)*
4. User clicks **Save draft** → modal runs `emit('save-draft', {...model})`.
   *(up)*
5. App's `onSaveDraft(data)` runs `upsert(data)` → pushes a new record into
   `incidents` (with a fresh id).  *(committed state changes)*
6. `incidents` is reactive → `IncidentTable` re-renders with the new row.
7. App calls `closeModal()` → `showModal = false` → modal hides.

Every arrow is either a **prop down** or an **event up**. That's the whole model.

---

## 7. Where this goes next (DB)

Right now `incidents` is just an in-memory array and `upsert()` mutates it
directly. When we add a backend, **only `App.vue`'s actions change** — they'll
`await` API calls instead of pushing to the array. The prop/event flow and the
working-copy pattern stay exactly the same. That's the payoff of keeping one
clear owner: swapping the storage doesn't ripple through every component.
