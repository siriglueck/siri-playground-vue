<!--
  StepBeteiligte.vue — STEP 2 view: the participant LIST.

  This step OWNS the array `form.incidentParticipant` (well — the shared form
  does, and this step is the one that adds/removes entries in it). It renders one
  <ParticipantCard> per participant and listens for each card's `remove` event.

  Data flow to notice:
    • DOWN : we pass each `participant` object into its card as a prop.
    • UP   : a card emits `remove` → we handle it here with removeParticipant().
  The card handles its OWN nested lists (injuries, first-aid) internally; this
  step never touches those. Each level manages what it owns.
-->
<template>
  <div>
    <div class="d-flex align-items-center mb-3">
      <h5 class="mb-0">Schritt 2 · Beteiligte Daten</h5>
      <b-button
        variant="primary"
        size="sm"
        class="ml-auto"
        @click="addParticipant"
      >
        <i class="bi bi-person-plus"></i> Teilnehmer hinzufügen
      </b-button>
    </div>

    <!-- One card per participant. `:key` must be stable & unique so Vue reuses
         the right DOM node when the list changes. -->
    <ParticipantCard
      v-for="(participant, index) in form.incidentParticipant"
      :key="index"
      :participant="participant"
      :index="index"
      :errors="errors[index] || {}"
      :validated="validated"
      :can-remove="form.incidentParticipant.length > 1"
      @remove="removeParticipant"
    />
  </div>
</template>

<script>
import ParticipantCard from './ParticipantCard.vue'
import { createParticipant } from './StepBeteiligte.data.js'

export default {
  name: 'StepBeteiligte',

  components: { ParticipantCard },

  props: {
    // The shared draft object.
    form: { type: Object, required: true },
    // ARRAY of error objects, parallel to form.incidentParticipant.
    errors: { type: Array, default: () => [] },
    // Gate showing red messages until the user tries to advance.
    validated: { type: Boolean, default: false },
  },

  methods: {
    // Add a blank participant to the shared list.
    addParticipant() {
      this.form.incidentParticipant.push(createParticipant())
    },

    // Handle a card's `remove` event (the payload is the index it sent up).
    removeParticipant(index) {
      this.form.incidentParticipant.splice(index, 1)
    },
  },
}
</script>
