// -----------------------------------------------------------------------------
// StepUnfalldaten.data.js — data logic that belongs to STEP 1 only.
//
// Convention: each step keeps its own constants + validation next to its .vue
// file, so everything about "step 1" lives in one place. The .vue file handles
// the UI; this file handles the plain-data concerns (no Vue, no `this`).
// -----------------------------------------------------------------------------

// Options for the accident-type dropdown. `value` is what we store/send;
// `text` is what the user sees. <b-form-select> reads this array directly.
export const INCIDENT_TYPES = [
  { value: '', text: 'Bitte wählen…', disabled: true },
  { value: 'work_accident', text: 'Arbeitsunfall (work accident)' },
  { value: 'commute_accident', text: 'Wegeunfall (on-the-way)' },
  { value: 'near_miss', text: 'Beinaheunfall (near miss)' },
]

// Map a stored type value (e.g. 'work_accident') to its readable label
// ('Arbeitsunfall…'). Returns '' if not found. Reused by the preview and by the
// saved-reports list on the page.
export function incidentTypeText(value) {
  const match = INCIDENT_TYPES.find((t) => t.value === value)
  return match ? match.text : ''
}

// Validation for step 1. A pure function: takes the form, returns an `errors`
// object. A field is "valid" when its key is ABSENT from the result.
export function validateStep1(form) {
  const errors = {}
  if (!form.incidentType) errors.incidentType = 'Bitte einen Unfalltyp wählen.'
  if (!form.incidentDate) errors.incidentDate = 'Bitte das Datum angeben.'
  if (!form.incidentTime) errors.incidentTime = 'Bitte die Uhrzeit angeben.'
  if (!form.incidentLocation.trim())
    errors.incidentLocation = 'Bitte den Ort angeben.'
  return errors
}
