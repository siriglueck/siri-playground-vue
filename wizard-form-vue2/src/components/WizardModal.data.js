// -----------------------------------------------------------------------------
// WizardModal.data.js — data logic for the wizard as a whole.
//
// The wizard OWNS the draft form, so the factory for the whole form lives here,
// together with the two TRANSLATORS between shapes:
//   • buildPayload  : form (edit shape)  -> record (stored/backend shape)
//   • recordToForm  : record             -> form   (the reverse, for editing)
// Keeping both in one place makes the two directions easy to keep in sync.
// -----------------------------------------------------------------------------
import { createParticipant } from './steps/StepBeteiligte.data.js'

// The whole form (the "draft"). `id` is null for a brand-new report; when we
// EDIT an existing one, recordToForm() fills it in so saving updates that record
// instead of creating a duplicate. Date and time are two fields here because the
// form has two inputs; they get combined at save time.
export function createIncident() {
  return {
    id: null,
    incidentType: '',
    incidentDate: '', // <input type="date">  -> 'YYYY-MM-DD'
    incidentTime: '', // <input type="time">  -> 'HH:mm'
    incidentLocation: '',
    incidentPhoto: [], // { filename, url }
    incidentParticipant: [createParticipant()], // start with one empty participant
  }
}

// 'YYYY-MM-DD' + 'HH:mm' -> 'YYYY-MM-DDTHH:mm:00'. Returns '' if either missing.
export function combineDateTime(date, time) {
  if (!date || !time) return ''
  return `${date}T${time}:00`
}

// The reverse of combineDateTime: split a stored datetime back into the two form
// fields. 'YYYY-MM-DDTHH:mm:ss' -> { date: 'YYYY-MM-DD', time: 'HH:mm' }.
export function splitDateTime(datetime) {
  if (!datetime) return { date: '', time: '' }
  const [date, timePart] = datetime.split('T')
  return { date: date || '', time: timePart ? timePart.slice(0, 5) : '' }
}

// -----------------------------------------------------------------------------
// buildPayload — form (edit shape) -> record (stored/backend shape).
//   • combine date + time into one `incidentDate`
//   • stamp `reportStatus` ('drafted' when saving a draft, 'submitted' on submit)
//   • strip the browser-only preview `url` from photos (keep filename)
//   • carry `id` through so App can upsert the right record
// -----------------------------------------------------------------------------
export function buildPayload(form, status) {
  return {
    id: form.id, // null for new; set when editing
    reportStatus: status, // 'drafted' | 'submitted'
    incidentType: form.incidentType,
    incidentDate: combineDateTime(form.incidentDate, form.incidentTime),
    incidentLocation: form.incidentLocation,

    incidentPhoto: form.incidentPhoto.map((photo) => ({
      filename: photo.filename,
    })),

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

// -----------------------------------------------------------------------------
// recordToForm — record (stored/backend shape) -> form (edit shape).
//
// This is BOTH the reverse translator AND the "working copy": every array and
// object is rebuilt fresh (via .map / spread), so the returned form is a deep
// copy. Editing it never touches the stored record — so Cancel is always safe.
// -----------------------------------------------------------------------------
export function recordToForm(record) {
  const { date, time } = splitDateTime(record.incidentDate)
  return {
    id: record.id != null ? record.id : null,
    incidentType: record.incidentType || '',
    incidentDate: date,
    incidentTime: time,
    incidentLocation: record.incidentLocation || '',
    incidentPhoto: (record.incidentPhoto || []).map((p) => ({
      filename: p.filename,
      url: p.url, // undefined for drafts reloaded from storage (no live preview)
    })),
    incidentParticipant: (record.incidentParticipant || []).map((p) => ({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      injury: (p.injury || []).map((i) => ({
        bodyPart: i.bodyPart || '',
        injuryType: i.injuryType || '',
      })),
      firstAidUsages: (p.firstAidUsages || []).map((u) => ({
        firstAidMaterial: u.firstAidMaterial || '',
        amount: u.amount || 1,
      })),
    })),
  }
}
