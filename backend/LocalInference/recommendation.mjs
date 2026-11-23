/** Untrusted inference may recommend staging; it cannot supply an action tuple. */
export class InferenceError extends Error {}
export const RECOMMENDATION_SCHEMA = Object.freeze({
  type: 'object', additionalProperties: false, required: ['recommendation', 'rationale'],
  properties: {
    recommendation: {type: 'string', enum: ['propose', 'abstain']},
    rationale: {type: 'string', minLength: 1, maxLength: 1500},
  },
});
export function validateRecommendation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'recommendation') || !Object.hasOwn(value, 'rationale')
      || !['propose', 'abstain'].includes(value.recommendation)
      || typeof value.rationale !== 'string' || !value.rationale.trim()
      || value.rationale.length > 1500 || /[\u0000-\u001f\u007f]/.test(value.rationale))
    throw new InferenceError('Local model returned an invalid recommendation. No proposal was staged.');
  return {recommendation: value.recommendation, rationale: value.rationale};
}
export function validateInput(input) {
  const c = input?.context;
  if (typeof input?.intent !== 'string' || !input.intent.trim() || input.intent.length > 4000 || input.intent.includes('\0')
      || !c || typeof c.category !== 'string' || !c.category.trim() || c.category.length > 100 || c.category.includes('\0')
      || c.currency !== 'USD' || !Number.isSafeInteger(c.amountMinor) || c.amountMinor < 1
      || !Number.isSafeInteger(c.maxAmountMinor) || c.maxAmountMinor < c.amountMinor || c.maxAmountMinor > 1e12)
    throw new InferenceError('Invalid local recommendation input. No proposal was staged.');
  return {intent: input.intent, context: {category: c.category, amountMinor: c.amountMinor,
    currency: 'USD', maxAmountMinor: c.maxAmountMinor}};
}
