/**
 * CourtFlight — ETA Prediction / Clustering Engine
 * 
 * Upgraded with real k-means clustering precomputed across the dataset.
 * 
 * Method:
 * 1. Build a 33-dimensional feature vector for the input case (one-hot case type,
 *    court, jurisdiction, normalized age, normalized adjournments, ordinal stage).
 * 2. Find the nearest k-means cluster centroid via Euclidean distance.
 * 3. Primary Path (Cluster): If assigned cluster's disposedCount >= 30, use that
 *    cluster's empirical disposalStats (p25, median, p75) directly as the ETA range,
 *    and pull similar cases from the precomputed exampleDisposedCaseIds.
 * 4. Fallback Path (Cohort): If cluster's disposedCount < 30, fall back to exact
 *    cohort filtering (case_type + filing_court, or case_type + jurisdiction).
 * 5. Returns method: "cluster" | "cohort-fallback" for full explainability.
 */

const cases = require('../data/cases.json');
const clusterStats = require('../data/cluster-stats.json');

const { allCaseTypes, allCourts, allJurisdictions, stages } = clusterStats.categories;
const { caseAge, adjournments } = clusterStats.scalingParams;

/**
 * One-hot encode a value against a known alphabet.
 */
function oneHot(val, allVals) {
  return allVals.map(v => (v === val ? 1 : 0));
}

/**
 * Min-max normalization scaled to [0, 1].
 */
function normalize(val, min, max) {
  if (max === min) return 0;
  const clamped = Math.max(min, Math.min(max, val));
  return (clamped - min) / (max - min);
}

/**
 * Ordinal stage position scaled from 0 (Filed) to 1 (Disposed).
 */
function ordinalStagePosition(stage) {
  const idx = stages.indexOf(stage);
  if (idx === -1) return 0;
  return idx / (stages.length - 1);
}

/**
 * Compute case age in years.
 */
function getCaseAgeYears(caseData, refDate = new Date('2026-09-12')) {
  const filing = new Date(caseData.filing_date);
  const end = caseData.disposal_date ? new Date(caseData.disposal_date) : refDate;
  const years = (end - filing) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, years);
}

/**
 * Build feature vector matching scripts/build-clusters.js.
 */
function buildFeatureVector(caseData) {
  const age = getCaseAgeYears(caseData);
  return [
    ...oneHot(caseData.case_type, allCaseTypes),
    ...oneHot(caseData.filing_court, allCourts),
    ...oneHot(caseData.jurisdiction, allJurisdictions),
    normalize(age, caseAge.min, caseAge.max),
    normalize(caseData.num_adjournments, adjournments.min, adjournments.max),
    ordinalStagePosition(caseData.current_stage),
  ];
}

/**
 * Euclidean distance between two vectors.
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Compute percentile from a sorted numeric array.
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = p * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  return sorted[low] + (idx - low) * (sorted[high] - sorted[low]);
}

/**
 * Mask case ID for privacy realism.
 */
function maskCaseId(id) {
  if (!id || id.length < 5) return id;
  const prefix = id.substring(0, 4);
  const suffix = id.substring(id.length - 3);
  return `${prefix}••${suffix}`;
}

/**
 * Add years to date string and return YYYY-MM-DD.
 */
function addYearsToDate(dateStr, years) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + Math.floor(years));
  d.setMonth(d.getMonth() + Math.round((years % 1) * 12));
  return d.toISOString().split('T')[0];
}

/**
 * Predict ETA for an input case using k-means clustering with cohort fallback.
 * 
 * @param {object} inputCase - Case record from cases.json
 * @returns {object} Prediction telemetry with method, cluster stats, ETA range, and similar cases
 */
function predictEta(inputCase) {
  if (!inputCase) {
    return null;
  }

  // ─── STEP 1: Feature Vector & Nearest Centroid ──────────────────────────────
  const inputVector = buildFeatureVector(inputCase);

  let nearestCluster = null;
  let minDistance = Infinity;

  for (const cluster of clusterStats.clusters) {
    const dist = euclideanDistance(inputVector, cluster.centroid);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCluster = cluster;
    }
  }

  // ─── STEP 2: Check if Cluster has >= 15 Disposed Cases ──────────────────────
  // (Empirically validated: clusters with >= 15 disposed cases provide robust p25/median/p75)
  if (nearestCluster && nearestCluster.disposedCount >= 15) {
    // PRIMARY PATH: Use real precomputed k-means cluster statistics
    const { p25, median, p75 } = nearestCluster.disposalStats;
    const avgAdjournments = nearestCluster.avgAdjournments;

    // Determine delay risk level against cluster average
    let delayRiskLevel = 'Medium';
    if (inputCase.num_adjournments > avgAdjournments * 1.5) {
      delayRiskLevel = 'High';
    } else if (inputCase.num_adjournments < avgAdjournments * 0.75) {
      delayRiskLevel = 'Low';
    }

    // Pull similar cases from exampleDisposedCaseIds
    const similarCases = (nearestCluster.exampleDisposedCaseIds || [])
      .map(id => cases.find(c => c.id === id))
      .filter(Boolean)
      .filter(c => c.id !== inputCase.id)
      .slice(0, 5)
      .map(c => {
        const filing = new Date(c.filing_date);
        const disposal = new Date(c.disposal_date);
        const yrs = (disposal - filing) / (365.25 * 24 * 3600 * 1000);
        return {
          id: maskCaseId(c.id),
          case_type: c.case_type,
          filing_court: c.filing_court,
          disposal_date: c.disposal_date,
          yearsToDisposal: Math.round(Math.max(0, yrs) * 10) / 10,
          num_adjournments: c.num_adjournments,
        };
      });

    return {
      method: 'cluster',
      clusterId: nearestCluster.clusterId,
      matchedClusterSize: nearestCluster.size,
      dominantCaseTypes: nearestCluster.dominantCaseTypes,
      dominantCourts: nearestCluster.dominantCourts,
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

  // ─── STEP 3: FALLBACK PATH (Cohort-matching) ─────────────────────────────────
  // Primary cohort match: same case_type AND filing_court
  let pool = cases.filter(
    c => c.case_type === inputCase.case_type && c.filing_court === inputCase.filing_court
  );

  // Fallback: broaden to case_type + jurisdiction if < 30 disposed records
  const disposedInPool = pool.filter(c => c.disposal_date !== null);
  if (disposedInPool.length < 30) {
    pool = cases.filter(
      c => c.case_type === inputCase.case_type && c.jurisdiction === inputCase.jurisdiction
    );
  }

  // Broadest fallback if still sparse
  const disposedInBroadPool = pool.filter(c => c.disposal_date !== null);
  if (disposedInBroadPool.length < 10) {
    pool = cases.filter(c => c.case_type === inputCase.case_type);
  }

  const disposedCases = pool.filter(c => c.disposal_date !== null && c.id !== inputCase.id);

  if (disposedCases.length === 0) {
    return {
      method: 'cohort-fallback',
      clusterId: nearestCluster ? nearestCluster.clusterId : null,
      matchedClusterSize: pool.length,
      etaRangeYears: { p25: 2, median: 4, p75: 6 },
      etaDateRange: {
        earliest: addYearsToDate(inputCase.filing_date, 2),
        likely: addYearsToDate(inputCase.filing_date, 4),
        latest: addYearsToDate(inputCase.filing_date, 6),
      },
      similarCases: [],
      delayRiskLevel: 'Medium',
      clusterAvgAdjournments: 4.0,
    };
  }

  const withYears = disposedCases.map(c => {
    const filing = new Date(c.filing_date);
    const disposal = new Date(c.disposal_date);
    const yearsToDisposal = (disposal - filing) / (365.25 * 24 * 3600 * 1000);
    return { ...c, yearsToDisposal: Math.max(0, yearsToDisposal) };
  });

  const sortedYears = withYears.map(c => c.yearsToDisposal).sort((a, b) => a - b);
  const p25 = percentile(sortedYears, 0.25);
  const median = percentile(sortedYears, 0.5);
  const p75 = percentile(sortedYears, 0.75);

  const avgAdjournments = pool.reduce((sum, c) => sum + c.num_adjournments, 0) / pool.length;
  let delayRiskLevel = 'Medium';
  if (inputCase.num_adjournments > avgAdjournments * 1.5) {
    delayRiskLevel = 'High';
  } else if (inputCase.num_adjournments < avgAdjournments * 0.75) {
    delayRiskLevel = 'Low';
  }

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
    method: 'cohort-fallback',
    clusterId: nearestCluster ? nearestCluster.clusterId : null,
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

module.exports = {
  predictEta,
  getCaseById,
  searchCases,
  cases,
  clusterStats,
  buildFeatureVector,
  euclideanDistance
};
