import {InferenceError, validateInput, validateRecommendation} from './recommendation.mjs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nonemptyId = value => typeof value === 'string' && uuid.test(value) && value.replaceAll('-', '') !== '0'.repeat(32);
/** The client exposes ONLY context and propose. Model output never enters the action tuple. */
export async function proposeReimbursement({client, provider, reimbursementId, maxAmountMinor, ttlSeconds, intent}) {
  if (!nonemptyId(reimbursementId) || !Number.isSafeInteger(maxAmountMinor) || maxAmountMinor < 1 || maxAmountMinor > 1e12
      || !Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 600
      || typeof intent !== 'string' || !intent.trim() || intent.length > 4000 || intent.includes('\0'))
    throw new InferenceError('Invalid proposal request. No inference or proposal was performed.');
  const context = await client.context(reimbursementId);
  if (!context || !nonemptyId(context.id) || context.id.toLowerCase() !== reimbursementId.toLowerCase()
      || context.status !== 'pending' || context.currency !== 'USD' || context.version !== 0
      || !Number.isSafeInteger(context.amountMinor) || context.amountMinor < 1 || context.amountMinor > maxAmountMinor)
    throw new InferenceError('Record is unavailable, changed, or outside the fixed limit. No proposal was staged.');
  const input = validateInput({intent, context: {category: context.category, amountMinor: context.amountMinor,
    currency: context.currency, maxAmountMinor}});
  const raw = await provider.recommend(input);
  const candidate = raw && typeof raw === 'object' && !Array.isArray(raw) ? {...raw} : raw;
  let provenance;
  if (candidate && typeof candidate === 'object' && Object.hasOwn(candidate, 'provenance')) {
    provenance = candidate.provenance;
    delete candidate.provenance;
  }
  const recommendation = validateRecommendation(candidate);
  const reported = provenance?.provider === 'ollama-local' && typeof provenance.model === 'string'
    && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(provenance.model)
    ? {provider: 'ollama-local', model: provenance.model,
      modelModifiedAt: typeof provenance.modelModifiedAt === 'string' && provenance.modelModifiedAt.length <= 100
        && Number.isFinite(Date.parse(provenance.modelModifiedAt)) ? provenance.modelModifiedAt : null,
      elapsedMs: Number.isSafeInteger(provenance.elapsedMs) && provenance.elapsedMs >= 0 && provenance.elapsedMs <= 120000
        ? provenance.elapsedMs : null, verifiedInference: false} : {provider: 'injected-test-provider', verifiedInference: false};
  if (recommendation.recommendation === 'abstain') return {state: 'abstained', recommendation, provenance: reported};
  // The service rechecks membership/status/version after inference. Never retry staging automatically.
  const proposal = await client.propose({reimbursementId: context.id, expectedVersion: context.version, maxAmountMinor, ttlSeconds});
  return {state: 'proposed', proposal, recommendation, provenance: reported};
}
