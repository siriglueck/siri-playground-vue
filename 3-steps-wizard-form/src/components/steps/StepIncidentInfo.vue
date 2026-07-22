<script setup>
import { INCIDENT_TYPES } from '../../incidents.js'

// `model` is the shared incident object passed down from the wizard.
// We mutate its properties directly — Vue keeps everything reactive.
const props = defineProps({
  model: { type: Object, required: true },
  // Errors flow DOWN from the wizard (computed there). `validated` says whether
  // we're allowed to show them yet — so the form isn't red before the user acts.
  errors: { type: Object, default: () => ({}) },
  validated: { type: Boolean, default: false },
})

// Turn selected files into preview entries. In this UI-only phase we keep an
// object URL so we can show a thumbnail; later this is where you'd upload.
function onFilesSelected(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    props.model.images.push({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    })
  }
  // Reset the input so selecting the same file again still fires `change`.
  event.target.value = ''
}

function removeImage(index) {
  const [removed] = props.model.images.splice(index, 1)
  if (removed?.url) URL.revokeObjectURL(removed.url)
}
</script>

<template>
  <div>
    <h6 class="text-uppercase text-muted fw-bold small mb-3">
      Step 1 · Incident information
    </h6>

    <!-- Incident type: card-style radio buttons -->
    <label class="form-label fw-semibold">What kind of incident?</label>
    <div class="row g-2 mb-4">
      <div v-for="type in INCIDENT_TYPES" :key="type.value" class="col-12 col-md-4">
        <input
          :id="`type-${type.value}`"
          v-model="model.type"
          class="btn-check"
          type="radio"
          name="incident-type"
          :value="type.value"
        />
        <label
          :for="`type-${type.value}`"
          class="btn btn-outline-primary w-100 h-100 text-start p-3"
        >
          <i :class="['bi', type.icon, 'fs-4', 'd-block', 'mb-2']"></i>
          <span class="fw-semibold d-block">{{ type.label }}</span>
          <small class="text-body-secondary">{{ type.description }}</small>
        </label>
      </div>
      <!-- Type error (radios can't use Bootstrap's .invalid-feedback, so we
           render the message ourselves). -->
      <div v-if="validated && errors.type" class="col-12">
        <div class="text-danger small">{{ errors.type }}</div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Where -->
      <!--
        Bootstrap's validation-display pattern (used on every field below):
          1. Add `.is-invalid` to the input to turn it red. We do this with a
             dynamic class: `:class="{ 'is-invalid': validated && errors.x }"`
             — only when errors are unlocked (`validated`) AND this field errored.
          2. Put a sibling `.invalid-feedback` element with the message. Bootstrap
             hides it by default and reveals it only when the input above has
             `.is-invalid`. So we always render it; CSS controls visibility.
        `errors` and `validated` both arrive as props from the wizard.
      -->
      <div class="col-12 col-md-6">
        <label for="location" class="form-label fw-semibold">Where did it happen?</label>
        <input
          id="location"
          v-model="model.location"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': validated && errors.location }"
          placeholder="e.g. Warehouse B, loading dock"
        />
        <div class="invalid-feedback">{{ errors.location }}</div>
      </div>

      <!-- When: split into separate DATE and TIME inputs. They bind to two
           model fields; the wizard combines them into one DATETIME2 value when
           saving. Each input shows its own validation message. -->
      <div class="col-6 col-md-3">
        <label for="occurredDate" class="form-label fw-semibold">Date</label>
        <input
          id="occurredDate"
          v-model="model.occurredDate"
          type="date"
          class="form-control"
          :class="{ 'is-invalid': validated && errors.occurredDate }"
        />
        <div class="invalid-feedback">{{ errors.occurredDate }}</div>
      </div>
      <div class="col-6 col-md-3">
        <label for="occurredTime" class="form-label fw-semibold">Time</label>
        <input
          id="occurredTime"
          v-model="model.occurredTime"
          type="time"
          class="form-control"
          :class="{ 'is-invalid': validated && errors.occurredTime }"
        />
        <div class="invalid-feedback">{{ errors.occurredTime }}</div>
      </div>

      <!-- Description -->
      <div class="col-12">
        <label for="description" class="form-label fw-semibold">
          What happened? <span class="text-body-secondary fw-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          v-model="model.description"
          class="form-control"
          rows="3"
          placeholder="Describe the incident briefly…"
        ></textarea>
      </div>

      <!-- Image upload -->
      <div class="col-12">
        <label for="images" class="form-label fw-semibold">
          Incident photos <span class="text-body-secondary fw-normal">(optional)</span>
        </label>
        <input
          id="images"
          type="file"
          class="form-control"
          accept="image/*"
          multiple
          @change="onFilesSelected"
        />

        <div v-if="model.images.length" class="d-flex flex-wrap gap-2 mt-3">
          <div
            v-for="(img, index) in model.images"
            :key="index"
            class="position-relative border rounded overflow-hidden"
            style="width: 96px; height: 96px"
          >
            <img :src="img.url" :alt="img.name" class="w-100 h-100 object-fit-cover" />
            <button
              type="button"
              class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 lh-1"
              style="width: 20px; height: 20px"
              title="Remove"
              @click="removeImage(index)"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* When a type card is selected, its background turns primary (deep wine red),
   so force ALL text inside it white — the title, icon, and the muted
   description (which otherwise keeps its grey `text-body-secondary` color). */
.btn-check:checked + label,
.btn-check:checked + label * {
  color: #fff !important;
}
</style>
