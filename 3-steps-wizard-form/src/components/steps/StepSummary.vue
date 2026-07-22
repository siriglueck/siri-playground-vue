<script setup>
import { computed } from 'vue'
import { findIncidentType, combineDateTime2 } from '../../incidents.js'

const props = defineProps({
  model: { type: Object, required: true },
})

const typeLabel = computed(() => findIncidentType(props.model.type)?.label || '—')

// The combined value isn't stored until save, so we build it here from the two
// form fields (the same helper the wizard uses) purely for display.
const formattedDate = computed(() => {
  const value = combineDateTime2(props.model.occurredDate, props.model.occurredTime)
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
})

const injuredCount = computed(
  () => props.model.participants.filter((p) => p.injured).length,
)
</script>

<template>
  <div>
    <h6 class="text-uppercase text-muted fw-bold small mb-3">Step 3 · Summary</h6>
    <p class="text-body-secondary">
      Please review the information below before submitting.
    </p>

    <!-- Step 1 recap -->
    <div class="card mb-3">
      <div class="card-header fw-semibold bg-light">
        <i class="bi bi-info-circle me-1"></i> Incident information
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item d-flex justify-content-between">
          <span class="text-body-secondary">Type</span>
          <span class="fw-semibold">{{ typeLabel }}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span class="text-body-secondary">Where</span>
          <span class="fw-semibold">{{ model.location || '—' }}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span class="text-body-secondary">When</span>
          <span class="fw-semibold">{{ formattedDate }}</span>
        </li>
        <li class="list-group-item">
          <div class="text-body-secondary mb-1">Description</div>
          <div>{{ model.description || '—' }}</div>
        </li>
        <li v-if="model.images.length" class="list-group-item">
          <div class="text-body-secondary mb-2">Photos ({{ model.images.length }})</div>
          <div class="d-flex flex-wrap gap-2">
            <img
              v-for="(img, i) in model.images"
              :key="i"
              :src="img.url"
              :alt="img.name"
              class="border rounded object-fit-cover"
              style="width: 64px; height: 64px"
            />
          </div>
        </li>
      </ul>
    </div>

    <!-- Step 2 recap -->
    <div class="card">
      <div
        class="card-header fw-semibold bg-light d-flex justify-content-between align-items-center"
      >
        <span><i class="bi bi-people me-1"></i> People involved</span>
        <span class="badge text-bg-secondary">
          {{ model.participants.length }} total · {{ injuredCount }} injured
        </span>
      </div>
      <ul class="list-group list-group-flush">
        <li
          v-for="(p, i) in model.participants"
          :key="i"
          class="list-group-item"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="fw-semibold">{{ p.name || `Participant ${i + 1}` }}</span>
              <span v-if="p.role" class="text-body-secondary"> · {{ p.role }}</span>
            </div>
            <span
              class="badge"
              :class="p.injured ? 'text-bg-danger' : 'text-bg-success'"
            >
              {{ p.injured ? 'Injured' : 'Not injured' }}
            </span>
          </div>
          <div v-if="p.injured" class="mt-1 small">
            <div v-if="p.injuryDetails" class="text-body-secondary">
              Injury: {{ p.injuryDetails }}
            </div>
            <div v-if="p.firstAid.length" class="mt-1">
              <span
                v-for="aid in p.firstAid"
                :key="aid"
                class="badge text-bg-light border me-1"
              >
                {{ aid }}
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
