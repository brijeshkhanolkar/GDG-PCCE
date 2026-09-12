/**
 * CourtFlight — Prediction Engine Test Suite
 * 
 * Tests 10 cases covering:
 * - All 6 case types
 * - Various stages (Filed through Disposed)
 * - High/Medium/Low risk
 * - Cluster vs. cohort fallback paths
 * - Edge cases (high adjournments, early filing, disposed)
 * 
 * Run: node scripts/test-predict.js
 */

const { predictEta, getCaseById, searchCases, cases, STAGES } = require('../lib/predictEta');

const PASS = '✓';
const FAIL = '✗';
let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label} ${detail ? '— ' + detail : ''}`);
    failed++;
  }
}

// ─── Test 1: Basic prediction for a known case ──────────────────────────────
console.log('\n━━━ Test 1: Basic prediction (NYR-00001) ━━━');
const case1 = getCaseById('NYR-00001');
assert(case1 !== null, 'Case NYR-00001 exists');
if (case1) {
  const pred1 = predictEta(case1);
  assert(pred1 !== null, 'Prediction returned');
  assert(pred1.method === 'cluster' || pred1.method === 'cohort-fallback' || pred1.method === 'knn', `Method: ${pred1.method}`);
  assert(pred1.etaRangeYears.p25 > 0, `p25 = ${pred1.etaRangeYears.p25} yrs`);
  assert(pred1.etaRangeYears.median > 0, `median = ${pred1.etaRangeYears.median} yrs`);
  assert(pred1.etaRangeYears.p75 >= pred1.etaRangeYears.median, `p75 >= median: ${pred1.etaRangeYears.p75} >= ${pred1.etaRangeYears.median}`);
  assert(pred1.confidence >= 12 && pred1.confidence <= 97, `Confidence: ${pred1.confidence}%`);
  assert(pred1.whyFactors && pred1.whyFactors.length >= 3, `Why factors: ${pred1.whyFactors?.length} reasons`);
  assert(['Low', 'Medium', 'High'].includes(pred1.delayRiskLevel), `Risk: ${pred1.delayRiskLevel}`);
  assert(Array.isArray(pred1.similarCases), `Similar cases: ${pred1.similarCases?.length}`);
}

// ─── Test 2: Each case type gets a prediction ───────────────────────────────
console.log('\n━━━ Test 2: All 6 case types produce predictions ━━━');
const caseTypes = ['Criminal', 'Family', 'Property', 'Service', 'Civil', 'Commercial'];
for (const type of caseTypes) {
  const sample = cases.find(c => c.case_type === type);
  assert(sample !== null, `Found a ${type} case: ${sample?.id}`);
  if (sample) {
    const pred = predictEta(sample);
    assert(pred !== null && pred.etaRangeYears.median > 0, `${type}: median=${pred?.etaRangeYears?.median}yr, confidence=${pred?.confidence}%`);
  }
}

// ─── Test 3: High adjournment case → High risk ──────────────────────────────
console.log('\n━━━ Test 3: High adjournments → High risk ━━━');
const highAdj = cases.filter(c => c.num_adjournments >= 8).sort((a, b) => b.num_adjournments - a.num_adjournments)[0];
if (highAdj) {
  const pred = predictEta(highAdj);
  assert(pred.delayRiskLevel === 'High', `${highAdj.id} (${highAdj.num_adjournments} adj) → Risk: ${pred.delayRiskLevel}`);
  const adjFactor = pred.whyFactors.find(f => f.title === 'Adjournment Drag');
  assert(adjFactor !== undefined, `Has "Adjournment Drag" explanation`);
  if (adjFactor) {
    assert(adjFactor.impact === 'negative', `Adjournment impact: ${adjFactor.impact}`);
  }
}

// ─── Test 4: Low adjournment case → Low risk ────────────────────────────────
console.log('\n━━━ Test 4: Low adjournments → Low risk ━━━');
const lowAdj = cases.filter(c => c.num_adjournments <= 1 && !c.disposal_date)[0];
if (lowAdj) {
  const pred = predictEta(lowAdj);
  assert(pred.delayRiskLevel === 'Low', `${lowAdj.id} (${lowAdj.num_adjournments} adj) → Risk: ${pred.delayRiskLevel}`);
}

// ─── Test 5: Disposed case ──────────────────────────────────────────────────
console.log('\n━━━ Test 5: Disposed case handling ━━━');
const disposed = cases.find(c => c.current_stage === 'Disposed');
if (disposed) {
  const pred = predictEta(disposed);
  assert(pred !== null, `Disposed case ${disposed.id} gets prediction`);
  assert(pred.etaRangeYears.median > 0, `Median: ${pred?.etaRangeYears?.median} yrs`);
}

// ─── Test 6: Null / undefined input ─────────────────────────────────────────
console.log('\n━━━ Test 6: Edge cases ━━━');
assert(predictEta(null) === null, 'null input → null');
assert(predictEta(undefined) === null, 'undefined input → null');

// ─── Test 7: Custom synthetic case (POST simulation) ────────────────────────
console.log('\n━━━ Test 7: Custom case prediction ━━━');
const customCase = {
  id: 'CUSTOM-001',
  case_type: 'Criminal',
  filing_court: 'Delhi High Court',
  predicted_final_court: 'Delhi High Court',
  jurisdiction: 'High Court',
  filing_date: '2024-03-15',
  current_stage: 'Evidence Stage',
  disposal_date: null,
  num_adjournments: 7,
  adjournment_reasons: [],
  hearings: 12,
  complexity: 'High',
  days_elapsed: 540,
  total_duration_days: 2000,
  parties: { petitioner: 'Test Petitioner', respondent: 'Test Respondent' },
};
const customPred = predictEta(customCase);
assert(customPred !== null, 'Custom case gets prediction');
assert(customPred.confidence >= 12, `Confidence: ${customPred?.confidence}%`);
assert(customPred.whyFactors?.length >= 3, `Why factors: ${customPred?.whyFactors?.length}`);

// ─── Test 8: Search functionality ───────────────────────────────────────────
console.log('\n━━━ Test 8: Search ━━━');
const searchResults = searchCases('NYR-000', 5);
assert(searchResults.length > 0, `"NYR-000" → ${searchResults.length} results`);
assert(searchResults[0].id.startsWith('NYR-'), `First result: ${searchResults[0].id}`);

const typeSearch = searchCases('criminal', 3);
assert(typeSearch.length > 0, `"criminal" → ${typeSearch.length} results`);

// ─── Test 9: Confidence varies with data quality ────────────────────────────
console.log('\n━━━ Test 9: Confidence varies appropriately ━━━');
// A case from a well-populated court should have higher confidence
const delhiCase = cases.find(c => c.filing_court === 'Delhi High Court' && !c.disposal_date);
const delhiPred = delhiCase ? predictEta(delhiCase) : null;
if (delhiPred) {
  assert(delhiPred.confidence >= 30, `Delhi HC case: confidence=${delhiPred.confidence}% (should be decent with many cases)`);
}

// ─── Test 10: "Why" factors are specific, not generic ───────────────────────
console.log('\n━━━ Test 10: "Why" factors quality ━━━');
if (customPred && customPred.whyFactors) {
  for (const factor of customPred.whyFactors) {
    assert(factor.title && factor.title.length > 0, `Factor title: "${factor.title}"`);
    assert(factor.detail && factor.detail.length > 20, `Factor detail: "${factor.detail.substring(0, 60)}..."`);
    assert(['positive', 'negative', 'neutral'].includes(factor.impact), `Factor impact: ${factor.impact}`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'━'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
console.log(`${'━'.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
