<!--
  WizardModal.vue — the wizard's BRAIN.

  It OWNS two things (plan.md section 3):
    • `form`        the draft the user is filling in  (draft state)
    • `currentStep` which step is showing 1/2/3        (UI-only state)

  It passes `form` DOWN to each step, and listens for the Back/Next/Submit
  buttons to move between steps. Validation is enforced HERE (in `next()`), so a
  step can't be advanced while required fields are empty.

  Visibility is controlled by the PARENT (App.vue): App owns whether the modal is
  open, passes it in as the `visible` prop, and we emit `update:visible` when
  BootstrapVue tells us the modal opened/closed. That pairing is what makes
  `:visible.sync` work in App.
-->
<template>
  <b-modal
    :visible="visible"
    size="lg"
    :title="modalTitle"
    no-close-on-backdrop
    scrollable
    @change="onVisibleChange"
    @show="resetForm"
  >
    <!-- Small progress hint at the top -->
    <p class="text-muted small mb-4">Schritt {{ currentStep }} von 3</p>

    <!-- Only ONE step is rendered at a time (v-if / v-else-if on currentStep).
         Each step receives the SAME `form` object — that's the shared whiteboard.
         Steps 2 & 3 are placeholders for now; we build them next. -->
    <StepUnfalldaten
      v-if="currentStep === 1"
      :form="form"
      :errors="step1Errors"
      :validated="validated"
    />
    <StepBeteiligte
      v-else-if="currentStep === 2"
      :form="form"
      :errors="step2Errors"
      :validated="validated"
    />
    <StepPreview v-else-if="currentStep === 3" :form="form" />

    <!-- Custom footer: we replace BootstrapVue's default OK/Cancel with our own
         wizard buttons so we control navigation. -->
    <template #modal-footer>
      <b-button variant="outline-secondary" @click="close">Abbrechen</b-button>

      <!-- Save draft: available on EVERY step, and deliberately skips validation
           (a draft is allowed to be incomplete). -->
      <b-button variant="outline-primary" @click="saveDraft">
        <i class="bi bi-save"></i> Entwurf speichern
      </b-button>

      <div class="ml-auto">
        <b-button v-if="currentStep > 1" class="mr-2" @click="back">Zurück</b-button>
        <b-button v-if="currentStep < 3" variant="primary" @click="next">
          Weiter
        </b-button>
        <b-button v-if="currentStep === 3" variant="success" @click="submit">
          Absenden
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script>
import StepUnfalldaten from './steps/StepUnfalldaten.vue'
import StepBeteiligte from './steps/StepBeteiligte.vue'
import StepPreview from './steps/StepPreview.vue'
import { createIncident, recordToForm, buildPayload } from './WizardModal.data.js'
import { validateStep1 } from './steps/StepUnfalldaten.data.js'
import { validateStep2, participantHasError } from './steps/StepBeteiligte.data.js'

export default {
  name: 'WizardModal',

  components: { StepUnfalldaten, StepBeteiligte, StepPreview },

  props: {
    // Whether the modal is open. Owned by App.vue, passed down.
    visible: { type: Boolean, default: false },
    // The record to EDIT, or null for a new report. When set, resetForm() loads
    // a working COPY of it into `form` (see recordToForm).
    incident: { type: Object, default: null },
  },

  data() {
    return {
      currentStep: 1, // 1, 2, or 3
      validated: false, // have we tried to advance? gates showing red errors
      form: createIncident(), // the draft (a fresh blank form)
    }
  },

  computed: {
    modalTitle() {
      const titles = {
        1: 'Unfall melden · Unfalldaten',
        2: 'Unfall melden · Beteiligte Daten',
        3: 'Unfall melden · Vorschau',
      }
      return titles[this.currentStep]
    },

    // Recomputes automatically whenever the form changes. We pass it down to
    // step 1 so it can show which fields are invalid.
    step1Errors() {
      return validateStep1(this.form)
    },

    // ARRAY of error objects, one per participant. Passed down to step 2.
    step2Errors() {
      return validateStep2(this.form)
    },
  },

  methods: {
    // BootstrapVue emits `change` with the new visibility. We forward it up so
    // App's `:visible.sync` stays in step with the real modal state (e.g. when
    // the user presses Esc or the X).
    onVisibleChange(nextVisible) {
      this.$emit('update:visible', nextVisible)
    },

    close() {
      this.$emit('update:visible', false)
    },

    // Runs every time the modal opens (@show). If we were given a record to
    // edit, load a WORKING COPY of it; otherwise start blank. Either way `form`
    // is a fresh object, so editing never mutates the stored record.
    resetForm() {
      this.form = this.incident ? recordToForm(this.incident) : createIncident()
      this.currentStep = 1
      this.validated = false
    },

    // Advance — but validate the current step first.
    next() {
      if (this.currentStep === 1) {
        const errors = validateStep1(this.form)
        if (Object.keys(errors).length > 0) {
          this.validated = true // unlock the red messages and stop here
          return
        }
      }
      if (this.currentStep === 2) {
        // validateStep2 returns an array; the step is invalid if ANY
        // participant has an error — including a nested injury/first-aid row.
        const perParticipant = validateStep2(this.form)
        const hasError = perParticipant.some(participantHasError)
        if (hasError) {
          this.validated = true
          return
        }
      }
      this.validated = false
      this.currentStep += 1
    },

    back() {
      this.validated = false
      this.currentStep -= 1
    },

    // Save an incomplete draft: NO validation, status 'drafted'. App stores it.
    saveDraft() {
      const payload = buildPayload(this.form, 'drafted')
      this.$emit('save-draft', payload)
      this.close()
    },

    submit() {
      // Translate the draft into the backend JSON, then send it UP to App.
      // App owns "what happens with saved data" — the wizard just hands it off.
      const payload = buildPayload(this.form, 'submitted')
      this.$emit('submit', payload)
      this.close() // hide the modal (App flips showModal to false via .sync)
    },
  },
}
</script>
