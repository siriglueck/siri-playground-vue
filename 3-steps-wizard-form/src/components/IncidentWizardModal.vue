<script setup>
// ===========================================================================
// IncidentWizardModal.vue — owns the FORM's temporary state
// ---------------------------------------------------------------------------
// Key idea: the wizard edits its OWN private copy of the incident (`model`),
// NOT the row in the table. This is deliberate:
//   • The user can type, add participants, change their mind, and Cancel —
//     and the table stays untouched because we never edited it directly.
//   • Only when they Save/Submit do we emit the data UP to App, which then
//     commits it into the real `incidents` list.
// So there are TWO kinds of state:
//   1. App's `incidents` = the committed, saved truth.
//   2. This modal's `model` = the in-progress draft being edited.
// ===========================================================================
import { computed, reactive, ref, watch } from 'vue'
import {
  createIncident,
  cloneIncident,
  combineDateTime2,
  validateStep1,
  validateStep2,
  isStep1Valid,
  isStep2Valid,
} from '../incidents.js'
import StepIncidentInfo from './steps/StepIncidentInfo.vue'
import StepParticipants from './steps/StepParticipants.vue'
import StepSummary from './steps/StepSummary.vue'

// --- PROPS: data flowing DOWN from App (read-only from here) -----------------
const props = defineProps({
  show: { type: Boolean, default: false },
  // When provided, the wizard edits a COPY of this incident (e.g. a draft).
  // Props must be treated as read-only — that's why we clone it below.
  incident: { type: Object, default: null },
})

// --- EMITS: the events we send UP to App to request state changes ------------
const emit = defineEmits(['close', 'save-draft', 'submit'])

const STEPS = [
  { number: 1, label: 'Incident' },
  { number: 2, label: 'People' },
  { number: 3, label: 'Summary' },
]

// Which wizard step is visible (1, 2, or 3). Local UI state — App doesn't care.
const currentStep = ref(1)

// THE WORKING COPY. This one reactive object is shared with all three step
// components (passed down as the `model` prop). When a step mutates it, the
// summary step and the footer see the change instantly — because it's the
// same reactive object, not a copy.
const model = reactive(createIncident())

// Load/reset the form every time the modal opens (when `show` flips to true).
// We watch `props.show` instead of doing this once, because the same modal
// instance is reused for every open — so we must refresh its contents.
watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return
    currentStep.value = 1
    // Editing? Clone the incoming incident so we edit a detached copy and never
    // mutate App's data. Creating? Start from a blank incident.
    const source = props.incident ? cloneIncident(props.incident) : createIncident()
    // Reset `model` in place: wipe old keys, then copy the source in. We mutate
    // the existing object (rather than reassign) so the steps keep their
    // reactive link to it.
    Object.keys(model).forEach((key) => delete model[key])
    Object.assign(model, source)
    validated.value = false // start each open with a clean (no-errors) form
  },
)

const isEditing = computed(() => !!props.incident)

// --- VALIDATION STATE --------------------------------------------------------
// `validated` gates whether error messages are shown. It flips to true the
// moment the user tries to advance/submit, so the form isn't red before they've
// done anything. It resets to false whenever we move to a fresh step.
const validated = ref(false)

// Live error results, recomputed whenever `model` changes (computed = derived
// state). We pass these DOWN to the step components so they can render messages.
const step1Errors = computed(() => validateStep1(model))
const step2Errors = computed(() => validateStep2(model))

// Is the step currently on screen valid?
function currentStepValid() {
  if (currentStep.value === 1) return isStep1Valid(model)
  if (currentStep.value === 2) return isStep2Valid(model)
  return true
}

function next() {
  validated.value = true // reveal any errors for the current step
  if (!currentStepValid()) return // block advancing while invalid
  if (currentStep.value < STEPS.length) currentStep.value++
  validated.value = false // next step starts clean
}
function back() {
  if (currentStep.value > 1) currentStep.value--
  validated.value = false
}
function goToStep(step) {
  // Going backward is always allowed. Going forward is only allowed if every
  // step in between is valid — otherwise reveal the errors and stay put.
  if (step <= currentStep.value) {
    currentStep.value = step
    validated.value = false
    return
  }
  validated.value = true
  if (currentStepValid()) currentStep.value = step
}

// Send the working copy UP to App. We spread `{ ...model }` to hand over a
// plain snapshot (App will store its own copy) and stamp the status. Notice we
// don't save anything ourselves — we just *ask* App to, keeping App the single
// owner of the committed data.

// Build the payload we hand UP to App: a snapshot of the working copy, plus the
// combined DATETIME2 value derived from the two date/time inputs, plus status.
// This is the boundary where the form shape becomes the storage shape.
function buildPayload(status) {
  return {
    ...model,
    occurredAt: combineDateTime2(model.occurredDate, model.occurredTime),
    status,
  }
}

// Drafts are allowed to be incomplete — no validation, save whatever exists.
function onSaveDraft() {
  emit('save-draft', buildPayload('draft'))
}

// Submitting enforces every rule. If a step is invalid, jump the user to the
// first broken step and show the errors instead of emitting.
function onSubmit() {
  validated.value = true
  if (!isStep1Valid(model)) {
    currentStep.value = 1
    return
  }
  if (!isStep2Valid(model)) {
    currentStep.value = 2
    return
  }
  emit('submit', buildPayload('submitted'))
}
</script>

<template>
  <!-- Rendered only when `show` is true. Bootstrap classes give us the look;
       Vue controls open/close, so no Bootstrap JS is needed. -->
  <template v-if="show">
    <div class="modal fade show d-block" tabindex="-1" @click.self="emit('close')">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditing ? 'Edit incident report' : 'New incident report' }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" @click="emit('close')"></button>
          </div>

          <!-- Stepper -->
          <div class="px-4 pt-3">
            <div class="d-flex align-items-center justify-content-between">
              <template v-for="(step, i) in STEPS" :key="step.number">
                <button
                  type="button"
                  class="d-flex align-items-center gap-2 bg-transparent border-0 p-0"
                  @click="goToStep(step.number)"
                >
                  <span
                    class="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style="width: 32px; height: 32px"
                    :class="
                      currentStep >= step.number
                        ? 'bg-primary text-white'
                        : 'bg-light text-body-secondary border'
                    "
                  >
                    <i v-if="currentStep > step.number" class="bi bi-check-lg"></i>
                    <span v-else>{{ step.number }}</span>
                  </span>
                  <span
                    class="small fw-semibold d-none d-sm-inline"
                    :class="currentStep >= step.number ? 'text-primary' : 'text-body-secondary'"
                  >
                    {{ step.label }}
                  </span>
                </button>
                <div
                  v-if="i < STEPS.length - 1"
                  class="flex-grow-1 mx-2"
                  style="height: 2px"
                  :class="currentStep > step.number ? 'bg-primary' : 'bg-light border-top'"
                ></div>
              </template>
            </div>
          </div>

          <!-- Body: the active step.
               All three steps receive the SAME `model` object as a prop. Steps
               1 & 2 write into it; step 3 only reads from it. Because it's one
               shared reactive object, edits in step 2 are already visible when
               you reach the step 3 summary — no copying or syncing needed.
               (We use v-show, not v-if, so each step keeps its state while
               hidden instead of being destroyed and rebuilt.) -->
          <div class="modal-body">
            <StepIncidentInfo
              v-show="currentStep === 1"
              :model="model"
              :errors="step1Errors"
              :validated="validated"
            />
            <StepParticipants
              v-show="currentStep === 2"
              :model="model"
              :errors="step2Errors"
              :validated="validated"
            />
            <StepSummary v-show="currentStep === 3" :model="model" />
          </div>

          <!-- Footer: navigation + draft/submit -->
          <div class="modal-footer justify-content-between">
            <div>
              <button
                type="button"
                class="btn btn-link text-decoration-none"
                @click="onSaveDraft"
              >
                <i class="bi bi-save me-1"></i> Save draft
              </button>
            </div>

            <div class="d-flex gap-2">
              <button
                v-if="currentStep > 1"
                type="button"
                class="btn btn-outline-secondary"
                @click="back"
              >
                <i class="bi bi-arrow-left"></i> Back
              </button>
              <button
                v-if="currentStep < STEPS.length"
                type="button"
                class="btn btn-primary"
                @click="next"
              >
                Next <i class="bi bi-arrow-right"></i>
              </button>
              <button
                v-else
                type="button"
                class="btn btn-success"
                @click="onSubmit"
              >
                <i class="bi bi-check-lg"></i> Submit report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Dimmed backdrop behind the modal -->
    <div class="modal-backdrop fade show"></div>
  </template>
</template>
