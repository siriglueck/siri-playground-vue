<script setup>
import { findIncidentType } from '../incidents.js'

defineProps({
  incidents: { type: Array, required: true },
})

const emit = defineEmits(['edit'])

function typeLabel(value) {
  return findIncidentType(value)?.label || '—'
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

function injuredCount(incident) {
  return incident.participants.filter((p) => p.injured).length
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light">
        <tr>
          <th scope="col">#</th>
          <th scope="col">Type</th>
          <th scope="col">Where</th>
          <th scope="col">When</th>
          <th scope="col" class="text-center">People</th>
          <th scope="col" class="text-center">Injured</th>
          <th scope="col">Status</th>
          <th scope="col" class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!incidents.length">
          <td colspan="8" class="text-center text-body-secondary py-4">
            No incidents reported yet. Click <strong>“Report incident”</strong> to add one.
          </td>
        </tr>
        <tr v-for="incident in incidents" :key="incident.id">
          <td>{{ incident.id }}</td>
          <td>{{ typeLabel(incident.type) }}</td>
          <td>{{ incident.location || '—' }}</td>
          <td>{{ formatDate(incident.occurredAt) }}</td>
          <td class="text-center">{{ incident.participants.length }}</td>
          <td class="text-center">
            <span
              v-if="injuredCount(incident)"
              class="badge text-bg-danger"
            >
              {{ injuredCount(incident) }}
            </span>
            <span v-else class="text-body-secondary">0</span>
          </td>
          <td>
            <span
              class="badge"
              :class="incident.status === 'draft' ? 'text-bg-warning' : 'text-bg-success'"
            >
              {{ incident.status === 'draft' ? 'Draft' : 'Submitted' }}
            </span>
          </td>
          <td class="text-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="emit('edit', incident)"
            >
              <i class="bi bi-pencil"></i> Open
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
