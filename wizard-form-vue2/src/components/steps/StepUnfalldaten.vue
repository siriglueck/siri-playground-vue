<!--
  StepUnfalldaten.vue — STEP 1 view: accident type, date, time, location, photos.

  This component is a "view": it does NOT own the data. It receives the shared
  `form` object as a prop and writes into it directly (the shared-whiteboard
  pattern from plan.md 4b). It also receives `errors` and `validated` so it knows
  what to show red and WHEN.

  Its data logic (the dropdown options + validation) lives in the sibling file
  StepUnfalldaten.data.js — see the import in <script> below.
-->
<template>
  <div>
    <h5 class="mb-3">Schritt 1 · Unfalldaten</h5>

    <!--
      <b-form-group> wraps a label + a field + its error message.
      `:state` controls the colour: true=green, false=red, null=neutral.
      We only turn it red once `validated` is true (the user pressed Next),
      so the form isn't red before they've done anything.
    -->

    <!-- Accident type (dropdown) -->
    <b-form-group label="Unfalltyp" :state="stateFor('incidentType')">
      <b-form-select
        v-model="form.incidentType"
        :options="incidentTypes"
        :state="stateFor('incidentType')"
      ></b-form-select>
      <b-form-invalid-feedback>{{ errors.incidentType }}</b-form-invalid-feedback>
    </b-form-group>

    <!-- Date + time side by side using Bootstrap's grid -->
    <div class="row">
      <div class="col-md-6">
        <b-form-group label="Datum" :state="stateFor('incidentDate')">
          <b-form-input
            v-model="form.incidentDate"
            type="date"
            :state="stateFor('incidentDate')"
          ></b-form-input>
          <b-form-invalid-feedback>{{ errors.incidentDate }}</b-form-invalid-feedback>
        </b-form-group>
      </div>
      <div class="col-md-6">
        <b-form-group label="Uhrzeit" :state="stateFor('incidentTime')">
          <b-form-input
            v-model="form.incidentTime"
            type="time"
            :state="stateFor('incidentTime')"
          ></b-form-input>
          <b-form-invalid-feedback>{{ errors.incidentTime }}</b-form-invalid-feedback>
        </b-form-group>
      </div>
    </div>

    <!-- Location -->
    <b-form-group label="Ort" :state="stateFor('incidentLocation')">
      <b-form-input
        v-model="form.incidentLocation"
        placeholder="z. B. Lagerhalle B, Verladerampe"
        :state="stateFor('incidentLocation')"
      ></b-form-input>
      <b-form-invalid-feedback>{{ errors.incidentLocation }}</b-form-invalid-feedback>
    </b-form-group>

    <!-- Photos (optional). <b-form-file> hands us File objects; we keep the
         filename (for the JSON) and a preview URL (for the thumbnail). -->
    <b-form-group label="Fotos (optional)">
      <b-form-file
        multiple
        accept="image/*"
        placeholder="Foto(s) auswählen…"
        @input="onFilesSelected"
      ></b-form-file>

      <!-- Thumbnails of already-added photos -->
      <div v-if="form.incidentPhoto.length" class="d-flex flex-wrap mt-3">
        <div
          v-for="(photo, index) in form.incidentPhoto"
          :key="index"
          class="position-relative border rounded mr-2 mb-2"
          style="width: 90px; height: 90px; overflow: hidden"
        >
          <img
            :src="photo.url"
            :alt="photo.filename"
            style="width: 100%; height: 100%; object-fit: cover"
          />
          <b-button
            size="sm"
            variant="danger"
            class="position-absolute p-0"
            style="top: 2px; right: 2px; width: 20px; height: 20px; line-height: 1"
            @click="removePhoto(index)"
          >×</b-button>
        </div>
      </div>
    </b-form-group>
  </div>
</template>

<script>
/*
  NOTE: this step writes into the shared `form` object (a prop). Normally Vue
  forbids mutating props ("vue/no-mutating-props"), but our no-Vuex design
  (plan.md 4b) is built on ONE shared form object that every step reads/writes —
  like a shared whiteboard. That exception is allowed for step components in the
  ESLint config (package.json > eslintConfig > overrides). Everywhere else, the
  "don't mutate props" discipline still holds.
*/

// Step 1's own data logic (colocated sibling file).
import { INCIDENT_TYPES } from './StepUnfalldaten.data.js'

export default {
  name: 'StepUnfalldaten',

  props: {
    // The shared draft object. We WRITE into its properties (allowed), but we
    // never REASSIGN `form` itself.
    form: { type: Object, required: true },
    // Errors computed by the parent (WizardModal). Keys present = invalid field.
    errors: { type: Object, default: () => ({}) },
    // Only show red after the user pressed Next at least once.
    validated: { type: Boolean, default: false },
  },

  data() {
    return {
      incidentTypes: INCIDENT_TYPES, // feed the dropdown
    }
  },

  methods: {
    // Returns the :state value for one field:
    //   null  -> not validated yet (neutral)
    //   false -> validated AND this field has an error (red)
    //   true  -> validated AND no error (green)
    stateFor(field) {
      if (!this.validated) return null
      return this.errors[field] ? false : true
    },

    // <b-form-file multiple> gives us an array of File objects on @input.
    onFilesSelected(files) {
      if (!files) return
      const list = Array.isArray(files) ? files : [files]
      list.forEach((file) => {
        this.form.incidentPhoto.push({
          filename: file.name,
          url: URL.createObjectURL(file), // temporary in-browser preview URL
        })
      })
    },

    removePhoto(index) {
      const [removed] = this.form.incidentPhoto.splice(index, 1)
      if (removed && removed.url) URL.revokeObjectURL(removed.url) // free memory
    },
  },
}
</script>
