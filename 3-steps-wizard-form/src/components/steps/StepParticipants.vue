<script setup>
import { ref, watch } from 'vue'
import { createParticipant, FIRST_AID_OPTIONS } from '../../incidents.js'

// This step receives the wizard's shared `model` as a prop. Normally you don't
// mutate props — but here `model` is a reactive OBJECT the parent deliberately
// shares so every step reads/writes the same data. Mutating its *properties*
// (model.participants) is fine and intended; what we must not do is *reassign*
// the prop itself (model = ...). Think of the object as a shared whiteboard.
const props = defineProps({
  model: { type: Object, required: true },
  // `errors` is an ARRAY parallel to model.participants: errors[i] holds the
  // error object for participant i. `validated` gates whether we show them.
  errors: { type: Array, default: () => [] },
  validated: { type: Boolean, default: false },
})

// --- Accordion state ---------------------------------------------------------
// We show participants as collapsible panels. `openIndex` is the index of the
// one panel currently expanded (-1 = all collapsed). This is pure LOCAL UI
// state — the wizard/App don't care which panel is open, so it lives here.
// We drive Bootstrap's `.collapse`/`.show` and `.collapsed` classes ourselves
// with Vue, so no Bootstrap JS is needed.
const openIndex = ref(0)

function isOpen(index) {
  return openIndex.value === index
}

// Clicking a header toggles that panel: open it, or close it if already open.
function toggle(index) {
  openIndex.value = isOpen(index) ? -1 : index
}

// True when participant `index` currently has any validation error.
function hasError(index) {
  const e = props.errors[index]
  return !!e && Object.keys(e).length > 0
}

// Adding a participant pushes into the shared array, then opens the new panel
// so the user can fill it in right away.
function addParticipant() {
  props.model.participants.push(createParticipant())
  openIndex.value = props.model.participants.length - 1
}

function removeParticipant(index) {
  props.model.participants.splice(index, 1)
  // Keep `openIndex` pointing at a panel that still exists.
  if (openIndex.value >= props.model.participants.length) {
    openIndex.value = props.model.participants.length - 1
  }
}

// When the user tries to advance/submit and errors appear, auto-expand the
// first participant that has an error — otherwise its message would stay hidden
// inside a collapsed panel.
watch(
  () => props.validated,
  (isValidated) => {
    if (!isValidated) return
    const firstBad = props.errors.findIndex(
      (e) => e && Object.keys(e).length > 0,
    )
    if (firstBad !== -1) openIndex.value = firstBad
  },
)
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="text-uppercase text-muted fw-bold small mb-0">
        Step 2 · People involved
      </h6>
      <button type="button" class="btn btn-sm btn-outline-primary" @click="addParticipant">
        <i class="bi bi-plus-lg"></i> Add participant
      </button>
    </div>

    <p v-if="!model.participants.length" class="text-body-secondary fst-italic">
      No participants added yet.
    </p>

    <!-- Accordion: one collapsible panel per participant. -->
    <div class="accordion">
      <div
        v-for="(participant, index) in model.participants"
        :key="index"
        class="accordion-item"
      >
        <!-- Header stays visible even when collapsed, so it summarises the
             participant: number, name, injured badge, and an error flag. -->
        <h2 class="accordion-header">
          <button
            type="button"
            class="accordion-button"
            :class="{ collapsed: !isOpen(index) }"
            :aria-expanded="isOpen(index)"
            @click="toggle(index)"
          >
            <span class="d-flex align-items-center gap-2 w-100 pe-3">
              <i class="bi bi-person-fill"></i>
              <span class="fw-semibold">
                Participant {{ index + 1 }}
                <span v-if="participant.name" class="fw-normal">
                  — {{ participant.name }}
                </span>
              </span>
              <span
                class="badge ms-auto"
                :class="participant.injured ? 'text-bg-danger' : 'text-bg-secondary'"
              >
                {{ participant.injured ? 'Injured' : 'Not injured' }}
              </span>
              <i
                v-if="validated && hasError(index)"
                class="bi bi-exclamation-circle-fill text-danger"
                title="This participant has errors"
              ></i>
            </span>
          </button>
        </h2>

        <!-- Body: Bootstrap hides `.collapse` and reveals it when `.show` is
             present. We toggle `show` with Vue instead of Bootstrap's JS. -->
        <div class="accordion-collapse collapse" :class="{ show: isOpen(index) }">
          <div class="accordion-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Name</label>
                <!--
                  `errors` is an array parallel to `participants`, so participant
                  at `index` uses `errors[index]`. The `?.` (optional chaining)
                  guards the moment a row exists but its error slot hasn't been
                  computed yet, avoiding a crash on `undefined.name`.
                -->
                <input
                  v-model="participant.name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': validated && errors[index]?.name }"
                  placeholder="Full name"
                />
                <div class="invalid-feedback">{{ errors[index]?.name }}</div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">
                  Role <span class="text-body-secondary fw-normal">(optional)</span>
                </label>
                <input
                  v-model="participant.role"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Operator, witness"
                />
              </div>

              <!-- Injured toggle -->
              <div class="col-12">
                <div class="form-check form-switch">
                  <input
                    :id="`injured-${index}`"
                    v-model="participant.injured"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                  />
                  <label :for="`injured-${index}`" class="form-check-label fw-semibold">
                    This person was injured
                  </label>
                </div>
              </div>

              <!-- Injury details + first aid only when injured -->
              <template v-if="participant.injured">
                <div class="col-12">
                  <label class="form-label fw-semibold">Injury details</label>
                  <input
                    v-model="participant.injuryDetails"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validated && errors[index]?.injuryDetails }"
                    placeholder="e.g. Cut on left hand"
                  />
                  <div class="invalid-feedback">{{ errors[index]?.injuryDetails }}</div>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold">First aid applied</label>
                  <div class="row g-2">
                    <div
                      v-for="option in FIRST_AID_OPTIONS"
                      :key="option"
                      class="col-12 col-sm-6"
                    >
                      <div class="form-check">
                        <input
                          :id="`aid-${index}-${option}`"
                          v-model="participant.firstAid"
                          class="form-check-input"
                          type="checkbox"
                          :value="option"
                        />
                        <label :for="`aid-${index}-${option}`" class="form-check-label">
                          {{ option }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Remove sits in the body (not the header button, since buttons
                   can't nest). Disabled when it's the only participant. -->
              <div class="col-12 text-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="model.participants.length === 1"
                  @click="removeParticipant(index)"
                >
                  <i class="bi bi-trash"></i> Remove participant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
