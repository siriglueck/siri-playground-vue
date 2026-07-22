<script setup>
// ===========================================================================
// App.vue — THE STATE HUB ("single source of truth")
// ---------------------------------------------------------------------------
// This is the top of the component tree. All the *shared* state lives here and
// nowhere else. Child components never own this data — they only:
//   • RECEIVE it going DOWN, through props   (e.g. :incidents, :show)
//   • REQUEST changes going UP, through events (e.g. @save-draft, @edit)
//
// This one-way pattern is called "props down, events up". Because the data has
// exactly one owner, it's always clear who is allowed to change it (only App),
// which makes the app easy to reason about and debug.
//
//        App.vue  (owns: incidents, showModal, editingIncident)
//        │  props ▼                    ▲ events
//        ├─ IncidentTable   :incidents │ @edit
//        └─ IncidentWizardModal :show :incident │ @save-draft @submit @close
// ===========================================================================
import { ref } from 'vue'
import IncidentTable from './components/IncidentTable.vue'
import IncidentWizardModal from './components/IncidentWizardModal.vue'

// --- STATE (reactive: any change here re-renders the parts that use it) ------

// The list of all incidents. This is the real data of the app. `ref([])` makes
// the array reactive, so the table updates automatically when we push/replace.
// Later, this in-memory array is exactly what we'll swap for real DB calls.
const incidents = ref([])
let nextId = 1 // simple id generator; the DB will assign real ids later

// UI state: is the modal open, and which incident (if any) are we editing?
// `editingIncident = null` means "creating a new one".
const showModal = ref(false)
const editingIncident = ref(null)

// UI state for the debug panel that prints the stored data as raw JSON.
const showJson = ref(false)

// --- ACTIONS (the ONLY functions allowed to change the state above) ----------

// Open the modal in "create" mode.
function openNew() {
  editingIncident.value = null // no existing record → blank form
  showModal.value = true
}

// Open the modal in "edit" mode. `incident` arrives UP from the table's @edit
// event. We store a reference to the row the user clicked so the modal can
// pre-fill from it.
function openEdit(incident) {
  editingIncident.value = incident
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingIncident.value = null
}

// The heart of the state update: insert a new incident or replace an existing
// one. `data` is the finished form, handed UP from the modal via its events.
function upsert(data) {
  if (data.id) {
    // Editing: find the row with this id and replace it. Assigning a fresh
    // object ({ ...data }) keeps our stored copy separate from the modal's.
    const index = incidents.value.findIndex((i) => i.id === data.id)
    if (index !== -1) incidents.value[index] = { ...data }
  } else {
    // Creating: stamp an id + timestamp, then push. Pushing to a reactive
    // ref array is what makes the table show the new row instantly.
    incidents.value.push({ ...data, id: nextId++, createdAt: new Date().toISOString() })
  }
}

// Event handlers wired to the modal. Both save the data, then close. The only
// difference is the `status` the modal already stamped ('draft' vs 'submitted').
function onSaveDraft(data) {
  upsert(data)
  // Peek at exactly what gets stored. Open the browser DevTools console to see
  // it. `toRaw`/JSON keeps the log readable (strips Vue's reactive proxy).
  console.log('💾 Saved draft:', JSON.parse(JSON.stringify(data)))
  closeModal()
}

function onSubmit(data) {
  upsert(data)
  console.log('✅ Submitted incident:', JSON.parse(JSON.stringify(data)))
  closeModal()
}
</script>

<template>
  <div class="min-vh-100 bg-body-tertiary">
    <!-- Navbar -->
    <nav class="navbar navbar-dark bg-primary shadow-sm">
      <div class="container">
        <span class="navbar-brand mb-0 h1">
          <i class="bi bi-clipboard2-pulse me-2"></i> Incident Reports
        </span>
      </div>
    </nav>

    <main class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 class="h4 mb-0">Reported incidents</h1>
          <small class="text-body-secondary">
            {{ incidents.length }} total
          </small>
        </div>
        <button type="button" class="btn btn-primary" @click="openNew">
          <i class="bi bi-plus-lg me-1"></i> Report incident
        </button>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <!-- DOWN: we pass the incidents array as a prop (:incidents).
               UP:   the table asks us to open a row via the @edit event,
                     which runs openEdit(incident). -->
          <IncidentTable :incidents="incidents" @edit="openEdit" />
        </div>
      </div>

      <!-- Debug panel: shows the raw stored data. Because `incidents` is
           reactive, this JSON re-renders automatically on every save/edit —
           a live window into the app's state. `JSON.stringify(_, null, 2)`
           pretty-prints with 2-space indentation. -->
      <div class="card shadow-sm mt-3">
        <div
          class="card-header d-flex justify-content-between align-items-center"
          role="button"
          @click="showJson = !showJson"
        >
          <span class="fw-semibold">
            <i class="bi bi-braces me-1"></i> Stored data (raw JSON)
            <span class="badge text-bg-secondary ms-1">{{ incidents.length }}</span>
          </span>
          <i class="bi" :class="showJson ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </div>
        <div v-show="showJson" class="card-body p-0">
          <pre
            class="mb-0 p-3 small bg-body-tertiary"
            style="max-height: 24rem; overflow: auto"
          >{{ JSON.stringify(incidents, null, 2) }}</pre>
        </div>
      </div>
    </main>

    <!-- DOWN: :show controls visibility, :incident is the row to edit (or null).
         UP:   the modal reports back with @close / @save-draft / @submit.
               Note App never reaches *into* the modal — it only hands data down
               and reacts to events coming back up. -->
    <IncidentWizardModal
      :show="showModal"
      :incident="editingIncident"
      @close="closeModal"
      @save-draft="onSaveDraft"
      @submit="onSubmit"
    />
  </div>
</template>
