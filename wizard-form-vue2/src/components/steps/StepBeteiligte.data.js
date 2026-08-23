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

// Validation for ONE participant. The returned error object mirrors the data:
//   { firstName?, lastName?,
//     injury:          [ { bodyPart?, injuryType? }, ... ],   // parallel to participant.injury
//     firstAidUsages:  [ { firstAidMaterial?, amount? }, ... ] // parallel to firstAidUsages
//   }
// A field/row is valid when its key is ABSENT. Note: an EMPTY injury/firstAid
// list is fine (those rows are optional) — but any row the user ADDED must be
// filled in.
export function validateParticipant(participant) {
  const errors = {}
  if (!participant.firstName.trim()) errors.firstName = 'Vorname fehlt.'
  if (!participant.lastName.trim()) errors.lastName = 'Nachname fehlt.'

  // One error object per injury row (same index as the data).
  errors.injury = participant.injury.map((injury) => {
    const e = {}
    if (!injury.bodyPart.trim()) e.bodyPart = 'Körperteil fehlt.'
    if (!injury.injuryType.trim()) e.injuryType = 'Art fehlt.'
    return e
  })

  // One error object per first-aid row.
  errors.firstAidUsages = participant.firstAidUsages.map((usage) => {
    const e = {}
    if (!usage.firstAidMaterial.trim()) e.firstAidMaterial = 'Material fehlt.'
    if (!usage.amount || usage.amount < 1) e.amount = 'Menge ≥ 1.'
    return e
  })

  return errors
}

// Does a participant's error object contain ANY error — name OR a nested row?
// We can't just do Object.keys(errors).length, because `injury` and
// `firstAidUsages` keys are ALWAYS present (as arrays), even when empty. So we
// check the name keys, then look inside the nested arrays for a non-empty entry.
export function participantHasError(errors) {
  if (errors.firstName || errors.lastName) return true
  const nested = [...(errors.injury || []), ...(errors.firstAidUsages || [])]
  return nested.some((rowErrors) => Object.keys(rowErrors).length > 0)
}

// Validation for step 2. Returns an ARRAY parallel to form.incidentParticipant:
// result[i] is the error object for participant i.
export function validateStep2(form) {
  return form.incidentParticipant.map(validateParticipant)
}
