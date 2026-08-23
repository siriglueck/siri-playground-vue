<!--
  ParticipantCard.vue — ONE participant (a reusable child of StepBeteiligte).

  This is the clearest example of component communication in the project:

    • It RECEIVES one `participant` object as a prop (down).
    • It WRITES into that participant's OWN nested arrays (injury,
      firstAidUsages) directly — same shared-whiteboard rule as the steps,
      one level deeper. Adding/removing injuries lives HERE because those rows
      belong to this participant.
    • But it CANNOT remove ITSELF: the list of participants belongs to the
      PARENT (StepBeteiligte). So to be deleted, the card EMITS `remove` UP and
      lets the parent splice the array. "You don't own the list, so you ask."

  (This file is under components/steps/, so the ESLint override that allows
   mutating the shared form applies here too — see package.json.)
-->
<template>
  <b-card class="mb-3" no-body>
    <!-- Header: title on the left, "remove this participant" on the right. -->
    <b-card-header class="d-flex align-items-center">
      <strong>
        Teilnehmer {{ index + 1 }}<span v-if="fullName">: {{ fullName }}</span>
      </strong>
      <b-button
        size="sm"
        variant="outline-danger"
        class="ml-auto"
        :disabled="!canRemove"
        @click="$emit('remove', index)"
      >
        <i class="bi bi-trash"></i> Entfernen
      </b-button>
    </b-card-header>

    <b-card-body>
      <!-- Name fields -->
      <div class="row">
        <div class="col-md-6">
          <b-form-group label="Vorname" :state="stateFor('firstName')">
            <b-form-input
              v-model="participant.firstName"
              :state="stateFor('firstName')"
              placeholder="Max"
            ></b-form-input>
            <b-form-invalid-feedback>{{ errors.firstName }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group label="Nachname" :state="stateFor('lastName')">
            <b-form-input
              v-model="participant.lastName"
              :state="stateFor('lastName')"
              placeholder="Mustermann"
            ></b-form-input>
            <b-form-invalid-feedback>{{ errors.lastName }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
      </div>

      <!-- ============ NESTED LIST 1: injuries ============ -->
      <div class="d-flex align-items-center mb-2">
        <h6 class="mb-0">Verletzungen</h6>
        <b-button
          size="sm"
          variant="outline-primary"
          class="ml-auto"
          @click="addInjury"
        >
          <i class="bi bi-plus-lg"></i> Verletzung hinzufügen
        </b-button>
      </div>

      <p v-if="!participant.injury.length" class="text-muted small font-italic">
        Keine Verletzungen erfasst.
      </p>

      <!-- One row per injury. Each row edits participant.injury[i] directly. -->
      <div
        v-for="(injury, i) in participant.injury"
        :key="'injury-' + i"
        class="row align-items-end mb-2"
      >
        <div class="col-md-5">
          <b-form-group label="Körperteil" class="mb-0">
            <b-form-input
              v-model="injury.bodyPart"
              placeholder="z. B. Hand"
              :state="nestedState(injuryErrors(i), 'bodyPart')"
            ></b-form-input>
            <b-form-invalid-feedback>{{ injuryErrors(i).bodyPart }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
        <div class="col-md-5">
          <b-form-group label="Art der Verletzung" class="mb-0">
            <b-form-input
              v-model="injury.injuryType"
              placeholder="z. B. Schnittwunde"
              :state="nestedState(injuryErrors(i), 'injuryType')"
            ></b-form-input>
            <b-form-invalid-feedback>{{ injuryErrors(i).injuryType }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
        <div class="col-md-2">
          <b-button size="sm" variant="outline-danger" block @click="removeInjury(i)">
            <i class="bi bi-x-lg"></i>
          </b-button>
        </div>
      </div>

      <hr />

      <!-- ============ NESTED LIST 2: first-aid usages ============ -->
      <div class="d-flex align-items-center mb-2">
        <h6 class="mb-0">Erste-Hilfe-Material</h6>
        <b-button
          size="sm"
          variant="outline-primary"
          class="ml-auto"
          @click="addFirstAid"
        >
          <i class="bi bi-plus-lg"></i> Material hinzufügen
        </b-button>
      </div>

      <p v-if="!participant.firstAidUsages.length" class="text-muted small font-italic">
        Kein Material erfasst.
      </p>

      <div
        v-for="(usage, i) in participant.firstAidUsages"
        :key="'aid-' + i"
        class="row align-items-end mb-2"
      >
        <div class="col-md-7">
          <b-form-group label="Material" class="mb-0">
            <b-form-input
              v-model="usage.firstAidMaterial"
              placeholder="z. B. Verband"
              :state="nestedState(aidErrors(i), 'firstAidMaterial')"
            ></b-form-input>
            <b-form-invalid-feedback>{{ aidErrors(i).firstAidMaterial }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
        <div class="col-md-3">
          <b-form-group label="Menge" class="mb-0">
            <!-- .number keeps the value a real number, not a string -->
            <b-form-input
              v-model.number="usage.amount"
              type="number"
              min="1"
              :state="nestedState(aidErrors(i), 'amount')"
            ></b-form-input>
            <b-form-invalid-feedback>{{ aidErrors(i).amount }}</b-form-invalid-feedback>
          </b-form-group>
        </div>
        <div class="col-md-2">
          <b-button size="sm" variant="outline-danger" block @click="removeFirstAid(i)">
            <i class="bi bi-x-lg"></i>
          </b-button>
        </div>
      </div>
    </b-card-body>
  </b-card>
</template>

<script>
// Factories for the nested rows live in step 2's data file.
import { createInjury, createFirstAidUsage } from './StepBeteiligte.data.js'

export default {
  name: 'ParticipantCard',

  props: {
    // The single participant this card edits (a sub-object of the shared form).
    participant: { type: Object, required: true },
    // Its position in the parent's list — used for the title and the remove event.
    index: { type: Number, required: true },
    // This participant's error object (from validateStep2()[index]).
    errors: { type: Object, default: () => ({}) },
    // Show red only after the user tried to advance.
    validated: { type: Boolean, default: false },
    // Parent tells us whether removal is allowed (e.g. not the last one).
    canRemove: { type: Boolean, default: true },
  },

  computed: {
    // Live label for the header. Because it reads `participant.firstName` /
    // `lastName`, Vue re-runs it on every keystroke — so the header updates in
    // real time. `.trim()` drops the stray space when only one field is filled,
    // and returns '' when both are empty (so the header shows just the number).
    fullName() {
      return `${this.participant.firstName} ${this.participant.lastName}`.trim()
    },
  },

  methods: {
    stateFor(field) {
      if (!this.validated) return null
      return this.errors[field] ? false : true
    },

    // Safely read the error slot for injury row `i` (returns {} if not there
    // yet). Guards against the brief moment data exists but errors haven't
    // recomputed, avoiding "cannot read property of undefined".
    injuryErrors(i) {
      return (this.errors.injury && this.errors.injury[i]) || {}
    },

    // Same for first-aid row `i`.
    aidErrors(i) {
      return (this.errors.firstAidUsages && this.errors.firstAidUsages[i]) || {}
    },

    // Like stateFor(), but for a nested row: pass in the row's error object.
    nestedState(rowErrors, field) {
      if (!this.validated) return null
      return rowErrors[field] ? false : true
    },

    // --- Nested list 1: injuries (we own these rows, so we mutate directly) ---
    addInjury() {
      this.participant.injury.push(createInjury())
    },
    removeInjury(i) {
      this.participant.injury.splice(i, 1)
    },

    // --- Nested list 2: first-aid usages ---
    addFirstAid() {
      this.participant.firstAidUsages.push(createFirstAidUsage())
    },
    removeFirstAid(i) {
      this.participant.firstAidUsages.splice(i, 1)
    },

    // NOTE: there is NO removeSelf() here. Removing THIS card means changing the
    // PARENT's participant list, which we don't own — so the header button does
    // `$emit('remove', index)` and StepBeteiligte does the actual splice.
  },
}
</script>
