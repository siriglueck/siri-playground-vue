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

// -----------------------------------------------------------------------------
// buildPayload — turn the DRAFT (`form`, the shape the UI needs) into the exact
// JSON the backend expects (the shape the API needs). These two shapes differ on
// purpose, so this is where we translate:
//   • date + time  ->  one combined `incidentDate` datetime
//   • photos       ->  keep only `filename` (drop the browser-only preview `url`)
//   • participants ->  copy through the clean nested structure
// Building a payload explicitly (instead of sending `form` as-is) means the API
// never receives UI-only junk, and the backend contract is documented right here.
// -----------------------------------------------------------------------------
export function buildPayload(form) {
  return {
    incidentType: form.incidentType,
    incidentDate: combineDateTime(form.incidentDate, form.incidentTime),
    incidentLocation: form.incidentLocation,

    // Photos: strip the preview `url`, keep just the filename.
    incidentPhoto: form.incidentPhoto.map((photo) => ({
      filename: photo.filename,
    })),

    // Participants: rebuild each level so only the fields we mean to send go out.
    incidentParticipant: form.incidentParticipant.map((p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      injury: p.injury.map((inj) => ({
        bodyPart: inj.bodyPart,
        injuryType: inj.injuryType,
      })),
      firstAidUsages: p.firstAidUsages.map((u) => ({
        firstAidMaterial: u.firstAidMaterial,
        amount: u.amount,
      })),
    })),
  }
}
