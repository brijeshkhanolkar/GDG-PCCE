/**
 * CourtFlight — ETA Prediction / Clustering Engine
 * 
 * This is a k-nearest-neighbor-style lookup, NOT a black-box model.
 * This simplicity is a DELIBERATE DESIGN CHOICE for explainability —
 * every prediction can be traced back to specific similar cases in the
 * dataset. In production, the same logic would run against live
 * eCourts/NJDG data instead of the synthetic dataset.
 * 
 * Method:
 * 1. Filter cases.json by case_type + filing_court (fall back to case_type + 
 *    jurisdiction if exact court yields < 30 disposed records)
 * 2. From matched pool, take only disposed records
 * 3. Compute yearsToDisposal for each
 * 4. Return p25, median, p75 as the ETA range
 * 5. delayRiskLevel: compare adjournments to cluster average
 * 6. Return 4-5 closest-to-median cases as similarCases
 */

const cases = require('../data/cases.json');

/**
 * Compute a percentile value from a sorted numeric array.
 * @param {number[]} sorted - Sorted array of numbers
 * @param {number} p - Percentile (0-1)
 * @returns {number}
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

/**
 * Predict ETA for a given case by clustering against similar disposed cases.
 * 
 * @param {object} inputCase - A case record from cases.json
 * @returns {object} Prediction result with cluster stats, ETA range, similar cases, and delay risk
 */
function predictEta(inputCase) {
  if (!inputCase) {
    return null;
  }

  // ─── Step 1: Find matching cluster ──────────────────────────────────────────
  // Primary match: same case_type AND filing_court
  let pool = cases.filter(
    c => c.case_type === inputCase.case_type && c.filing_court === inputCase.filing_court
  );

  // Fallback: if the exact court match yields fewer than ~30 disposed records,
  // broaden to case_type + jurisdiction. This handles courts with small sample
  // sizes while keeping the prediction type-specific.
  const disposedInPool = pool.filter(c => c.disposal_date !== null);
  if (disposedInPool.length < 30) {
    pool = cases.filter(
      c => c.case_type === inputCase.case_type && c.jurisdiction === inputCase.jurisdiction
    );
  }

  // Final fallback: if still too few, match on case_type alone
  const disposedInBroadPool = pool.filter(c => c.disposal_date !== null);
  if (disposedInBroadPool.length < 10) {
    pool = cases.filter(c => c.case_type === inputCase.case_type);
  }

  // ─── Step 2: Filter to disposed cases only ─────────────────────────────────
  const disposedCases = pool.filter(c => c.disposal_date !== null && c.id !== inputCase.id);

  if (disposedCases.length === 0) {
    // Not enough data — return a default prediction
    return {
      matchedClusterSize: pool.length,
      etaRangeYears: { p25: 2, median: 4, p75: 6 },
      etaDateRange: {
        earliest: addYearsToDate(inputCase.filing_date, 2),
        likely: addYearsToDate(inputCase.filing_date, 4),
        latest: addYearsToDate(inputCase.filing_date, 6),
      },
      similarCases: [],
      delayRiskLevel: 'Medium',
    };
  }

  // ─── Step 3: Compute yearsToDisposal for each ──────────────────────────────
  const withYears = disposedCases.map(c => {
    const filing = new Date(c.filing_date);
    const disposal = new Date(c.disposal_date);
    const yearsToDisposal = (disposal - filing) / (365.25 * 24 * 3600 * 1000);
    return { ...c, yearsToDisposal: Math.max(0, yearsToDisposal) };
  });

  // Sort by yearsToDisposal for percentile computation
  const sortedYears = withYears.map(c => c.yearsToDisposal).sort((a, b) => a - b);

  // ─── Step 4: Compute p25, median, p75 ───────────────────────────────────────
  const p25 = percentile(sortedYears, 0.25);
  const median = percentile(sortedYears, 0.5);
  const p75 = percentile(sortedYears, 0.75);

  // ─── Step 5: Delay risk level ───────────────────────────────────────────────
  // Compare input case's adjournments to the matched pool's average
  const avgAdjournments = pool.reduce((sum, c) => sum + c.num_adjournments, 0) / pool.length;
  let delayRiskLevel;
  if (inputCase.num_adjournments > avgAdjournments * 1.5) {
    delayRiskLevel = 'High';
  } else if (inputCase.num_adjournments < avgAdjournments * 0.75) {
    delayRiskLevel = 'Low';
  } else {
    delayRiskLevel = 'Medium';
  }

  // ─── Step 6: Find 5 similar cases closest to median ─────────────────────────
  const sortedByDistToMedian = withYears
    .filter(c => c.id !== inputCase.id)
    .sort((a, b) => Math.abs(a.yearsToDisposal - median) - Math.abs(b.yearsToDisposal - median));

  const similarCases = sortedByDistToMedian.slice(0, 5).map(c => ({
    id: maskCaseId(c.id),
    case_type: c.case_type,
    filing_court: c.filing_court,
    disposal_date: c.disposal_date,
    yearsToDisposal: Math.round(c.yearsToDisposal * 10) / 10,
    num_adjournments: c.num_adjournments,
  }));

  return {
    matchedClusterSize: pool.length,
    etaRangeYears: {
      p25: Math.round(p25 * 10) / 10,
      median: Math.round(median * 10) / 10,
      p75: Math.round(p75 * 10) / 10,
    },
    etaDateRange: {
      earliest: addYearsToDate(inputCase.filing_date, p25),
      likely: addYearsToDate(inputCase.filing_date, median),
      latest: addYearsToDate(inputCase.filing_date, p75),
    },
    similarCases,
    delayRiskLevel,
    clusterAvgAdjournments: Math.round(avgAdjournments * 10) / 10,
  };
}

/**
 * Mask a case ID for privacy-flavor realism.
 * e.g. "NYR-00042" → "NYR-••042"
 */
function maskCaseId(id) {
  if (!id || id.length < 5) return id;
  const prefix = id.substring(0, 4);
  const suffix = id.substring(id.length - 3);
  return `${prefix}••${suffix}`;
}

/**
 * Add years to a date string and return an ISO date string.
 */
function addYearsToDate(dateStr, years) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + Math.floor(years));
  d.setMonth(d.getMonth() + Math.round((years % 1) * 12));
  return d.toISOString().split('T')[0];
}

/**
 * Look up a case by ID from the dataset.
 */
function getCaseById(id) {
  return cases.find(c => c.id === id) || null;
}

/**
 * Search cases by partial ID match.
 */
function searchCases(query, limit = 10) {
  if (!query) return [];
  const q = query.toLowerCase();
  return cases
    .filter(c => c.id.toLowerCase().includes(q))
    .slice(0, limit);
}

module.exports = { predictEta, getCaseById, searchCases, cases };
