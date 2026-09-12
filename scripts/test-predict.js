const { predictEta, getCaseById } = require('../lib/predictEta');

const testIds = [
  'NYR-00001', // Criminal, Arguments stage, 6 adjournments
  'NYR-00006', // Civil, Arguments, 5 adjournments
  'NYR-00009', // Property, Evidence, 5 adjournments
  'NYR-00015', // Criminal, Judgment, 9 adjournments
  'NYR-00017', // Family, Judgment, 3 adjournments
  'NYR-00013', // Property, Judgment, 5 adjournments
  'NYR-00002', // Disposed case
];

console.log('=== PREDICTION / CLUSTERING ENGINE VERIFICATION ===\n');

let clusterCount = 0;
let cohortCount = 0;

testIds.forEach((id, idx) => {
  const c = getCaseById(id);
  if (!c) {
    console.error(`Case not found: ${id}`);
    return;
  }
  const p = predictEta(c);
  if (p.method === 'cluster') clusterCount++;
  else cohortCount++;

  console.log(`[${idx + 1}] Case: ${id} (${c.case_type} - ${c.filing_court})`);
  console.log(`    Method:                 ${p.method}`);
  console.log(`    Assigned Cluster:       Cluster #${p.clusterId} (Size: ${p.matchedClusterSize})`);
  console.log(`    ETA Percentiles:        p25 = ${p.etaRangeYears.p25}y | median = ${p.etaRangeYears.median}y | p75 = ${p.etaRangeYears.p75}y`);
  console.log(`    Estimated Date Range:   ${p.etaDateRange.earliest} to ${p.etaDateRange.latest} (Likely: ${p.etaDateRange.likely})`);
  console.log(`    Adjournments / Risk:    Case: ${c.num_adjournments} vs Baseline Avg: ${p.clusterAvgAdjournments} => ${p.delayRiskLevel} Risk`);
  console.log(`    Similar Cases Sampled:  ${p.similarCases.map(s => `${s.id} (${s.yearsToDisposal}y)`).join(', ')}`);
  console.log('');
});

console.log(`Summary: ${clusterCount} cases matched via K-Means Cluster, ${cohortCount} cases matched via Cohort Fallback.`);
