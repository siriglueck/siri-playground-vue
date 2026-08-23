// -----------------------------------------------------------------------------
// WizardModal.data.js — data logic for the wizard as a whole.
//
// The wizard OWNS the draft form, so the factory for the whole form lives here.
// It composes createParticipant() from step 2's data file — the overall shape is
// built from the per-step pieces.
// -----------------------------------------------------------------------------
import { createParticipant } from './steps/StepBeteiligte.data.js'

// The whole form (the "draft"). We keep date and time as TWO fields because the
// form shows two inputs; we combine them into one datetime string at submit time
// (see combineDateTime below).
export function createIncident() {
  return {
    incidentType: '',
    incidentDate: '', // <input type="date">  -> 'YYYY-MM-DD'
    incidentTime: '', // <input type="time">  -> 'HH:mm'
    incidentLocation: '',
    incidentPhoto: [], // { filename, url }
    incidentParticipant: [createParticipant()], // start with one empty participant
  }
}

// Combine the two form fields into one ISO datetime string for the final JSON.
// 'YYYY-MM-DD' + 'HH:mm' -> 'YYYY-MM-DDTHH:mm:00'. Returns '' if either missing.
export function combineDateTime(date, time) {
  if (!date || !time) return ''
  return `${date}T${time}:00`
}
