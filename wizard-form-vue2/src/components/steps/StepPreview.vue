<!--
  StepPreview.vue — STEP 3 view: a READ-ONLY summary of everything.

  This is the "reader" of the shared whiteboard. Steps 1 & 2 WROTE into `form`;
  this step only READS it — no v-model, no mutation, no emits. Because `form` is
  the same reactive object, whatever the user typed earlier already shows here
  with zero copying.

  It also shows how the stored VALUES map to human LABELS (e.g. the type value
  'work_accident' -> "Arbeitsunfall"), which is the same mapping the backend
  would use in reverse.
-->
<template>
  <div>
    <h5 class="mb-3">Schritt 3 · Vorschau</h5>
    <p class="text-muted small">
      Bitte prüfen Sie die Angaben. Mit „Absenden“ wird die Meldung erstellt.
    </p>

    <!-- ============ Section 1: Unfalldaten ============ -->
    <b-card class="mb-3">
      <h6 class="text-uppercase text-muted mb-3">Unfalldaten</h6>

      <dl class="row mb-0">
        <dt class="col-sm-3">Unfalltyp</dt>
        <dd class="col-sm-9">{{ incidentTypeText || '—' }}</dd>

        <dt class="col-sm-3">Datum / Uhrzeit</dt>
        <dd class="col-sm-9">
          {{ form.incidentDate || '—' }}
          <span v-if="form.incidentTime">um {{ form.incidentTime }} Uhr</span>
        </dd>

        <dt class="col-sm-3">Ort</dt>
        <dd class="col-sm-9">{{ form.incidentLocation || '—' }}</dd>

        <dt class="col-sm-3">Fotos</dt>
        <dd class="col-sm-9">
          <span v-if="!form.incidentPhoto.length" class="text-muted">Keine</span>
          <div v-else class="d-flex flex-wrap">
            <template v-for="(photo, i) in form.incidentPhoto">
              <img
                v-if="photo.url"
                :key="i"
                :src="photo.url"
                :alt="photo.filename"
                :title="photo.filename"
                class="border rounded mr-2 mb-2"
                style="width: 80px; height: 80px; object-fit: cover"
              />
              <span
                v-else
                :key="i"
                class="badge badge-light border mr-2 mb-2 p-2"
              >{{ photo.filename }}</span>
            </template>
          </div>
        </dd>
      </dl>
    </b-card>

    <!-- ============ Section 2: Beteiligte ============ -->
    <b-card>
      <h6 class="text-uppercase text-muted mb-3">
        Beteiligte ({{ form.incidentParticipant.length }})
      </h6>

      <div
        v-for="(p, index) in form.incidentParticipant"
        :key="index"
        class="mb-3 pb-3"
        :class="{ 'border-bottom': index < form.incidentParticipant.length - 1 }"
      >
        <strong>{{ index + 1 }}. {{ fullName(p) || '(kein Name)' }}</strong>

        <!-- Injuries -->
        <div class="mt-2">
          <span class="text-muted small">Verletzungen:</span>
          <span v-if="!p.injury.length" class="text-muted small font-italic"> keine</span>
          <ul v-else class="mb-1">
            <li v-for="(inj, i) in p.injury" :key="i">
              {{ inj.bodyPart }} — {{ inj.injuryType }}
            </li>
          </ul>
        </div>

        <!-- First aid -->
        <div>
          <span class="text-muted small">Erste-Hilfe-Material:</span>
          <span v-if="!p.firstAidUsages.length" class="text-muted small font-italic"> keins</span>
          <ul v-else class="mb-0">
            <li v-for="(u, i) in p.firstAidUsages" :key="i">
              {{ u.firstAidMaterial }} × {{ u.amount }}
            </li>
          </ul>
        </div>
      </div>
    </b-card>
  </div>
</template>

<script>
// Shared helper that turns the stored value into a readable label.
import { incidentTypeText } from './StepUnfalldaten.data.js'

export default {
  name: 'StepPreview',

  props: {
    // Read-only here. We never write to `form` in the preview.
    form: { type: Object, required: true },
  },

  computed: {
    // Map the stored value (e.g. 'work_accident') to its label ('Arbeitsunfall…').
    incidentTypeText() {
      return incidentTypeText(this.form.incidentType)
    },
  },

  methods: {
    // Small helper reused for each participant's display name.
    fullName(participant) {
      return `${participant.firstName} ${participant.lastName}`.trim()
    },
  },
}
</script>
