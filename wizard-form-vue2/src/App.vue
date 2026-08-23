<!--
  App.vue — the root component (the "first page").

  App is the ONE OWNER of the saved data (`reports`) — our pretend database.
  It talks to the wizard with props down / events up:
    • DOWN : :visible.sync (is the modal open?) and :incident (which record to edit)
    • UP   : @save-draft and @submit (the wizard hands back a finished payload)

  Persistence: we mirror `reports` into localStorage so drafts survive a page
  refresh — a stand-in for the backend DB. When a real API arrives, only the
  save/load methods here change; the whole prop/event flow stays the same.
-->
<template>
  <div id="app" class="container py-5">
    <h1 class="h3 mb-1">Unfallmeldung</h1>
    <p class="text-muted">Ein 3-Schritte-Assistent (Vue 2 + BootstrapVue).</p>

    <!-- Start a NEW report (no record to edit). -->
    <b-button variant="primary" @click="openNew">
      <i class="bi bi-plus-lg"></i> Neuen Unfall melden
    </b-button>

    <!-- ============ Saved reports (drafts + submitted) ============ -->
    <div class="mt-4">
      <h2 class="h5">Meldungen ({{ reports.length }})</h2>

      <p v-if="!reports.length" class="text-muted">
        Noch keine Meldungen. Erstellen Sie eine neue oder speichern Sie einen Entwurf.
      </p>

      <b-list-group v-else>
        <b-list-group-item
          v-for="report in reports"
          :key="report.id"
          class="d-flex align-items-center"
        >
          <div>
            <strong>#{{ report.id }}</strong>
            · {{ typeText(report.incidentType) || 'Kein Typ' }}
            · {{ report.incidentLocation || 'Kein Ort' }}
            <b-badge
              class="ml-1"
              :variant="report.reportStatus === 'drafted' ? 'secondary' : 'success'"
            >
              {{ report.reportStatus === 'drafted' ? 'Entwurf' : 'Gesendet' }}
            </b-badge>
          </div>

          <div class="ml-auto">
            <b-button size="sm" variant="outline-primary" @click="openEdit(report)">
              <i class="bi bi-pencil"></i> Weiter bearbeiten
            </b-button>
            <b-button size="sm" variant="outline-danger" class="ml-1" @click="removeReport(report)">
              <i class="bi bi-trash"></i>
            </b-button>
          </div>
        </b-list-group-item>
      </b-list-group>
    </div>

    <!-- The wizard. `:incident` says which record to edit (null = new). -->
    <WizardModal
      :visible.sync="showModal"
      :incident="editingReport"
      @save-draft="onSaveDraft"
      @submit="onSubmit"
    />
  </div>
</template>

<script>
import WizardModal from './components/WizardModal.vue'
import { incidentTypeText } from './components/steps/StepUnfalldaten.data.js'

// localStorage key for our pretend DB.
const STORAGE_KEY = 'wizard-form-reports'

export default {
  name: 'App',

  components: { WizardModal },

  data() {
    return {
      showModal: false, // is the wizard open?
      editingReport: null, // the record being edited, or null for a new one
      reports: [], // all saved reports (our pretend DB)
    }
  },

  // Load saved reports once, when the app starts.
  created() {
    this.load()
  },

  methods: {
    // --- open the wizard -----------------------------------------------------
    openNew() {
      this.editingReport = null // nothing to edit -> blank form
      this.showModal = true
    },
    openEdit(report) {
      this.editingReport = report // wizard will load a working COPY of this
      this.showModal = true
    },

    // --- receive finished payloads from the wizard (events UP) ---------------
    onSaveDraft(payload) {
      this.upsert(payload)
    },
    onSubmit(payload) {
      this.upsert(payload)
    },

    // --- the "database" ------------------------------------------------------
    // Insert or update by id: new records (id == null) get a fresh id and are
    // pushed; existing ones replace the matching row. Then persist.
    upsert(record) {
      if (record.id == null) {
        record.id = this.generateId()
        this.reports.push(record)
      } else {
        const i = this.reports.findIndex((r) => r.id === record.id)
        if (i !== -1) this.reports.splice(i, 1, record)
        else this.reports.push(record)
      }
      this.persist()
    },

    removeReport(report) {
      this.reports = this.reports.filter((r) => r.id !== report.id)
      this.persist()
    },

    generateId() {
      return this.reports.length
        ? Math.max(...this.reports.map((r) => r.id)) + 1
        : 1
    },

    // --- persistence (swap these two for real API calls later) ---------------
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports))
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY)
      this.reports = raw ? JSON.parse(raw) : []
    },

    // --- display helper ------------------------------------------------------
    typeText(value) {
      return incidentTypeText(value)
    },
  },
}
</script>
