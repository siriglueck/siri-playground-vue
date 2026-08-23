// -----------------------------------------------------------------------------
// StepBeteiligte.data.js — data logic that belongs to STEP 2 only.
//
// Step 2 is the nested part of the form: participants, each with their own
// injuries and first-aid usages. All the factories for those nested rows live
// here, next to the step that creates them.
// -----------------------------------------------------------------------------

// One injury row (deepest level, nested inside a participant).
export function createInjury() {
  return {
    bodyPart: '',
    injuryType: '',
  }
}

// One first-aid usage row (also nested inside a participant).
export function createFirstAidUsage() {
  return {
    firstAidMaterial: '',
    amount: 1,
  }
}

// One participant. Starts with EMPTY injury/firstAid arrays — the user adds
// rows on demand in the UI.
export function createParticipant() {
  return {
    firstName: '',
    lastName: '',
    injury: [], // -> createInjury()
    firstAidUsages: [], // -> createFirstAidUsage()
  }
}

// Validation for step 2. Returns an ARRAY parallel to form.incidentParticipant:
// result[i] is the error object for participant i. Here we only require a first
// and last name per participant (keep it simple while learning).
export function validateStep2(form) {
  return form.incidentParticipant.map((participant) => {
    const errors = {}
    if (!participant.firstName.trim()) errors.firstName = 'Vorname fehlt.'
    if (!participant.lastName.trim()) errors.lastName = 'Nachname fehlt.'
    return errors
  })
}
