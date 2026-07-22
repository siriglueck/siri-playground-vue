// ---------------------------------------------------------------------------
// Shared domain data & factories for the incident wizard.
// Keeping these here (instead of inside components) makes them easy to reuse
// across steps and, later, to map onto the database.
// ---------------------------------------------------------------------------

// The three incident categories the wizard supports.
export const INCIDENT_TYPES = [
  {
    value: 'work',
    label: 'Work accident',
    description: 'An injury or incident that happened while performing work.',
    icon: 'bi-hammer',
  },
  {
    value: 'otw',
    label: 'On-the-way accident',
    description: 'An incident on the commute to or from work.',
    icon: 'bi-truck',
  },
  {
    value: 'almost',
    label: 'Almost accident (near miss)',
    description: 'A close call where no one was hurt, but could have been.',
    icon: 'bi-exclamation-triangle',
  },
]

// Common first-aid measures offered as checkboxes for each participant.
export const FIRST_AID_OPTIONS = [
  'Bandage / dressing',
  'Disinfection',
  'Cooling / ice pack',
  'Splint / immobilization',
  'CPR',
  'Called ambulance',
  'Sent to hospital',
]

// Look up the label/icon for a stored incident type value.
export function findIncidentType(value) {
  return INCIDENT_TYPES.find((t) => t.value === value) || null
}

// A brand-new, empty participant row.
export function createParticipant() {
  return {
    name: '',
    role: '',
    injured: false,
    injuryDetails: '',
    firstAid: [],
  }
}

// A brand-new, empty incident form model. `status` starts as 'draft'.
//
// Note the date/time split: the FORM works with two separate fields
// (`occurredDate` + `occurredTime`) because that's what the two inputs bind to.
// The STORED record gets a single combined `occurredAt` DATETIME2 value, built
// at save time (see combineDateTime2). Keeping the input shape separate from the
// storage shape is a common, healthy pattern.
export function createIncident() {
  return {
    id: null,
    type: '',
    location: '',
    occurredDate: '', // <input type="date">  → 'YYYY-MM-DD'
    occurredTime: '', // <input type="time">  → 'HH:mm'
    description: '',
    images: [], // { name, url, size }
    participants: [createParticipant()],
    status: 'draft',
    createdAt: null,
  }
}

// Combine the two form fields into one value shaped for SQL Server DATETIME2.
// DATETIME2 accepts ISO 8601 'YYYY-MM-DDTHH:mm:ss'. The time input has no
// seconds, so we append ':00'. Returns null when either part is missing.
export function combineDateTime2(date, time) {
  if (!date || !time) return null
  return `${date}T${time}:00`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
// Pure functions: they take the model and return an errors object/array. No
// Vue, no DOM — easy to reason about, reuse, and unit-test later. A field is
// "valid" when its key is absent from the returned errors. Drafts skip these;
// only "Next" and "Submit" enforce them.

// Step 1: an incident needs a type, a place, and a time.
export function validateStep1(model) {
  const errors = {}
  if (!model.type) errors.type = 'Please choose an incident type.'
  if (!model.location.trim()) errors.location = 'Please enter where it happened.'
  // Date and time are separate inputs now, so each gets its own message.
  if (!model.occurredDate) errors.occurredDate = 'Please enter the date.'
  if (!model.occurredTime) errors.occurredTime = 'Please enter the time.'
  return errors
}

// A single participant: name is required; injury details are required only when
// the person is marked as injured.
export function validateParticipant(participant) {
  const errors = {}
  if (!participant.name.trim()) errors.name = 'Name is required.'
  if (participant.injured && !participant.injuryDetails.trim()) {
    errors.injuryDetails = 'Please describe the injury.'
  }
  return errors
}

// Step 2: validate every participant. Returns an array parallel to
// model.participants, so errors[i] lines up with participant i.
export function validateStep2(model) {
  return model.participants.map(validateParticipant)
}

// Convenience booleans used by the wizard to allow/deny navigation.
export function isStep1Valid(model) {
  return Object.keys(validateStep1(model)).length === 0
}
export function isStep2Valid(model) {
  return validateStep2(model).every((e) => Object.keys(e).length === 0)
}

// Deep-ish clone so the modal edits a copy, not the row in the table.
export function cloneIncident(incident) {
  return {
    ...incident,
    images: incident.images.map((img) => ({ ...img })),
    participants: incident.participants.map((p) => ({
      ...p,
      firstAid: [...p.firstAid],
    })),
  }
}
