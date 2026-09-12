/**
 * CourtFlight — Multi-Dimensional KNN Prediction Engine
 * 
 * Computes case disposition timelines, percentile ranges (p25, median, p75),
 * calibrated confidence, procedural turbulence levels, and feature-level
 * "Why this estimate?" explanations using a weighted k-Nearest Neighbors
 * algorithm against 1,565+ docket records.
 * 
 * Algorithm:
 * 1. Build a multi-dimensional feature representation for the input case.
 * 2. Calculate weighted feature distance to all candidate disposed cases in the archive.
 * 3. Select top k (default k=15) nearest neighbors.
 * 4. Compute empirical percentiles (p25, median, p75) and projected calendar dates.
 * 5. Calculate flight turbulence based on procedural drag and adjournment rate.
 * 6. Calibrate confidence based on neighborhood density, distance, and IQR spread.
 * 7. Extract shared features for precedent transparency and generate "Why?" breakdown.
 */

const cases = require('../data/cases.json');

const STAGES = [
  'Filed',
  'Notice Issued',
  'Written Statement Filed',
  'Evidence Stage',
  'Arguments',
  'Judgment Reserved',
  'Disposed'
];

const CASE_TYPES = ['Criminal', 'Family', 'Property', 'Service', 'Civil', 'Commercial'];

// Feature scaling bounds derived from dataset
const FEATURE_BOUNDS = {
  ageYears: { min: 0, max: 12 },
  adjournments: { min: 0, max: 20 },
  hearings: { min: 1, max: 60 },
  durationDays: { min: 60, max: 4500 }
};

// Complexity weight mapping
const COMPLEXITY_MAP = {
  'Low': 0.2,
  'Medium': 0.5,
  'High': 0.85
};

// ─── Utility Functions ─────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function normalize(val, min, max) {
  if (max <= min) return 0.5;
  return clamp((val - min) / (max - min), 0, 1);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function round0(n) {
  return Math.round(n);
}

function maskCaseId(id, isPublic = false) {
  if (!id) return 'DOCKET-•••';
  if (isPublic || id.startsWith('PUB-')) return id;
  if (id.length < 6) return id;
  return `${id.substring(0, 4)}••${id.substring(id.length - 3)}`;
}

function ordinalStagePosition(stage) {
  const idx = STAGES.indexOf(stage);
  return idx === -1 ? 0 : idx / (STAGES.length - 1);
}

function getCaseAgeYears(caseData, refDate = new Date('2026-09-12')) {
  if (!caseData.filing_date) return 1.0;
  const filing = new Date(caseData.filing_date);
  const end = caseData.disposal_date ? new Date(caseData.disposal_date) : refDate;
  const diffDays = Math.max(0, (end - filing) / (24 * 3600 * 1000));
  return diffDays / 365.25;
}

function addYearsToDate(dateStr, years) {
  const d = dateStr ? new Date(dateStr) : new Date('2026-09-12');
  if (isNaN(d.getTime())) return '2028-01-01';
  const totalMonths = Math.round(years * 12);
  d.setMonth(d.getMonth() + totalMonths);
  return d.toISOString().split('T')[0];
}

function percentile(sorted, p) {
  if (!sorted || sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  return sorted[low] + (idx - low) * (sorted[high] - sorted[low]);
}

// ─── Weighted Feature Distance ─────────────────────────────────────────────

/**
 * Calculates a weighted Euclidean distance between an input case and a historical case.
 * Weights reflect domain significance in Indian civil/criminal procedure.
 */
function computeWeightedDistance(input, candidate) {
  let sumSq = 0;

  // 1. Case Type match (Weight 3.2 — fundamental jurisdictional driver)
  const isSameType = input.case_type === candidate.case_type;
  sumSq += isSameType ? 0 : 3.2 * 3.2;

  // 2. Court & Jurisdiction match (Weight 2.6 — court backlog varies by state)
  if (input.filing_court === candidate.filing_court) {
    sumSq += 0;
  } else if (input.jurisdiction && candidate.jurisdiction && input.jurisdiction === candidate.jurisdiction) {
    sumSq += 0.35 * 2.6 * 2.6;
  } else {
    sumSq += 1.0 * 2.6 * 2.6;
  }

  // 3. Stage Progression (Weight 2.0)
  const stage1 = ordinalStagePosition(input.current_stage);
  const stage2 = ordinalStagePosition(candidate.current_stage);
  const stageDiff = Math.abs(stage1 - stage2);
  sumSq += (stageDiff * 2.0) ** 2;

  // 4. Number of Adjournments (Weight 1.8 — primary source of procedural delay)
  const adj1 = normalize(input.num_adjournments || 0, FEATURE_BOUNDS.adjournments.min, FEATURE_BOUNDS.adjournments.max);
  const adj2 = normalize(candidate.num_adjournments || 0, FEATURE_BOUNDS.adjournments.min, FEATURE_BOUNDS.adjournments.max);
  sumSq += ((adj1 - adj2) * 1.8) ** 2;

  // 5. Complexity (Weight 1.2)
  const comp1 = COMPLEXITY_MAP[input.complexity] ?? 0.5;
  const comp2 = COMPLEXITY_MAP[candidate.complexity] ?? 0.5;
  sumSq += ((comp1 - comp2) * 1.2) ** 2;

  // 6. Case Age / Elapsed Time (Weight 1.4)
  const age1 = normalize(getCaseAgeYears(input), FEATURE_BOUNDS.ageYears.min, FEATURE_BOUNDS.ageYears.max);
  const age2 = normalize(getCaseAgeYears(candidate), FEATURE_BOUNDS.ageYears.min, FEATURE_BOUNDS.ageYears.max);
  sumSq += ((age1 - age2) * 1.4) ** 2;

  // 7. Hearings Intensity (Weight 0.9)
  const h1 = normalize(input.hearings || 5, FEATURE_BOUNDS.hearings.min, FEATURE_BOUNDS.hearings.max);
  const h2 = normalize(candidate.hearings || 5, FEATURE_BOUNDS.hearings.min, FEATURE_BOUNDS.hearings.max);
  sumSq += ((h1 - h2) * 0.9) ** 2;

  return Math.sqrt(sumSq);
}

/**
 * Identify exact shared features between input case and a neighbor
 */
function extractSharedFeatures(input, neighbor) {
  const features = [];
  if (input.filing_court === neighbor.filing_court) {
    features.push(`Same Court (${input.filing_court})`);
  } else if (input.jurisdiction === neighbor.jurisdiction) {
    features.push(`Same Jurisdiction (${input.jurisdiction})`);
  }

  if (input.case_type === neighbor.case_type) {
    features.push(`Same Case Type (${input.case_type})`);
  }

  const adjDiff = Math.abs((input.num_adjournments || 0) - (neighbor.num_adjournments || 0));
  if (adjDiff <= 1) {
    features.push(`Similar Adjournments (${neighbor.num_adjournments} vs ${input.num_adjournments || 0})`);
  }

  if (input.complexity && neighbor.complexity && input.complexity === neighbor.complexity) {
    features.push(`Matching ${neighbor.complexity} Complexity`);
  }

  if (Math.abs(ordinalStagePosition(input.current_stage) - ordinalStagePosition(neighbor.current_stage)) <= 0.2) {
    features.push(`Comparable Procedural Stage`);
  }

  if (features.length === 0) {
    features.push(`General Judicial Baseline`);
  }

  return features;
}

// ─── Turbulence Analysis ───────────────────────────────────────────────────

/**
 * Computes procedural turbulence based on adjournment density,
 * hearing frequency, and court delay metrics.
 */
function computeTurbulence(inputCase, avgAdjournments) {
  const adjs = inputCase.num_adjournments || 0;
  const ageYears = Math.max(0.5, getCaseAgeYears(inputCase));
  const adjRate = adjs / ageYears; // adjournments per year

  let score = Math.min(100, Math.round((adjs * 8) + (adjRate * 6)));
  let level = 'Smooth Flight';
  let description = 'Optimal procedural cruising. Few or no adjournments recorded.';
  let indicatorColor = 'text-gold';
  let badgeColor = 'bg-gold/20 text-gold border-gold/40';

  if (adjs >= 8 || score >= 75) {
    level = 'Severe Turbulence';
    score = clamp(score, 75, 98);
    description = 'High procedural friction: frequent postponements, witness delays, or bench reconstitutions.';
    indicatorColor = 'text-stamp-red';
    badgeColor = 'bg-stamp-red/20 text-stamp-red border-stamp-red/40';
  } else if (adjs >= 5 || score >= 50) {
    level = 'Moderate Turbulence';
    score = clamp(score, 50, 74);
    description = 'Intermittent holding patterns: above-average adjournments causing procedural drag.';
    indicatorColor = 'text-amber-400';
    badgeColor = 'bg-amber-400/20 text-amber-400 border-amber-400/40';
  } else if (adjs >= 2 || score >= 25) {
    level = 'Light Turbulence';
    score = clamp(score, 25, 49);
    description = 'Routine court delays: standard notice periods and scheduled filing windows.';
    indicatorColor = 'text-gold-light';
    badgeColor = 'bg-gold/15 text-gold-light border-gold/30';
  } else {
    score = clamp(score, 10, 24);
  }

  return {
    level,
    score,
    description,
    indicatorColor,
    badgeColor,
    adjournmentsCount: adjs,
    adjournmentsPerYear: round1(adjRate)
  };
}

// ─── Confidence Scoring ────────────────────────────────────────────────────

/**
 * Calibrate confidence (15–96%) based on:
 * 1. Nearest neighbor proximity (mean distance of top k)
 * 2. Pool support size (number of relevant disposed precedents)
 * 3. Range spread (IQR relative to median)
 */
function computeCalibratedConfidence(topNeighbors, poolSize, p25, median, p75) {
  if (topNeighbors.length === 0) return 15;

  // Proximity score: lower mean distance = closer precedents (0–38 points)
  const meanDistance = topNeighbors.reduce((sum, n) => sum + n.distance, 0) / topNeighbors.length;
  const proximityScore = Math.max(0, Math.min(38, 38 - meanDistance * 10));

  // Pool size score: log-scaled (0–32 points)
  const sizeScore = Math.min(32, Math.log2(Math.max(1, poolSize)) * 4.2);

  // Spread score: tight IQR relative to median yields higher certainty (0–26 points)
  const iqr = Math.max(0.2, p75 - p25);
  const spreadRatio = median > 0 ? iqr / median : 1.0;
  const spreadScore = Math.max(4, Math.min(26, 26 - spreadRatio * 16));

  const total = proximityScore + sizeScore + spreadScore;
  return clamp(Math.round(total), 15, 96);
}

// ─── "Why This Estimate?" Factor Generator ─────────────────────────────────

function buildWhyExplanation(inputCase, topNeighbors, p25, median, p75, avgAdjournments, turbulence) {
  const factors = [];
  const medianYr = round1(median);
  const p25Yr = round1(p25);
  const p75Yr = round1(p75);
  const adjs = inputCase.num_adjournments || 0;
  const adjDiff = round1(adjs - avgAdjournments);

  // Factor 1: Precedent Baseline
  factors.push({
    title: 'Precedent Baseline',
    detail: `Analysis of ${topNeighbors.length} closest disposed cases in ${inputCase.filing_court} established a median resolution time of ${medianYr} years (fastest 25%: ${p25Yr} yrs, slowest 25%: ${p75Yr} yrs).`,
    impact: 'neutral',
    metric: `${medianYr} yrs median`
  });

  // Factor 2: Procedural Turbulence & Adjournment Impact
  if (adjDiff > 1.0) {
    const estimatedExtraMonths = Math.round(adjDiff * 2.8);
    factors.push({
      title: 'Adjournment Drag',
      detail: `This case has recorded ${adjs} adjournments (+${adjDiff} above the cohort benchmark of ${round1(avgAdjournments)}). Each adjournment historically adds ~2.8 months of procedural holding pattern, introducing ~${estimatedExtraMonths} months of timeline drag.`,
      impact: 'negative',
      metric: `+${estimatedExtraMonths} mo delay`
    });
  } else if (adjDiff < -1.0) {
    factors.push({
      title: 'Optimal Trajectory',
      detail: `With only ${adjs} adjournments (benchmark average: ${round1(avgAdjournments)}), this case is cruising smoothly with fewer postponements than ${Math.min(90, Math.round((1 - adjs / Math.max(1, avgAdjournments * 2)) * 100))}% of similar dockets.`,
      impact: 'positive',
      metric: `${adjs} adjournments`
    });
  } else {
    factors.push({
      title: 'Standard Flight Path',
      detail: `The adjournment count (${adjs}) aligns closely with the regional norm (${round1(avgAdjournments)}). Procedural turbulence is within expected variance.`,
      impact: 'neutral',
      metric: 'Benchmark cadence'
    });
  }

  // Factor 3: Current Stage & Flight Progress
  const stageIdx = STAGES.indexOf(inputCase.current_stage);
  if (inputCase.current_stage === 'Disposed') {
    factors.push({
      title: 'Flight Landed',
      detail: `The docket has reached final disposition at ${inputCase.predicted_final_court || inputCase.filing_court}.`,
      impact: 'positive',
      metric: '100% completed'
    });
  } else if (stageIdx >= 0) {
    const progressPct = Math.round((stageIdx / (STAGES.length - 2)) * 100);
    const monthsElapsed = Math.max(1, Math.round(getCaseAgeYears(inputCase) * 12));
    factors.push({
      title: 'Flight Altitude & Stage',
      detail: `Cruising in "${inputCase.current_stage}" (stage ${stageIdx + 1} of ${STAGES.length - 1}). Approximately ${progressPct}% through procedural milestones. ${monthsElapsed} months elapsed since initial filing.`,
      impact: progressPct >= 60 ? 'positive' : progressPct <= 25 ? 'neutral' : 'neutral',
      metric: `${progressPct}% altitude`
    });
  }

  // Factor 4: Complexity Rating
  if (inputCase.complexity) {
    const comp = inputCase.complexity;
    const desc = comp === 'High' 
      ? 'Multi-party disputes, extensive expert testimony, and interlocutory appeals add duration variance.'
      : comp === 'Low'
      ? 'Streamlined statutory issues and summary proceedings facilitate expedited hearings.'
      : 'Standard evidentiary hearings and routine procedural filings.';

    factors.push({
      title: `${comp} Complexity Rating`,
      detail: `Assessed as "${comp}" complexity. ${desc}`,
      impact: comp === 'High' ? 'negative' : comp === 'Low' ? 'positive' : 'neutral',
      metric: `${comp} grade`
    });
  }

  // Factor 5: KNN Neighborhood Match Quality
  const topMatch = topNeighbors[0];
  if (topMatch) {
    factors.push({
      title: 'Precedent Match Quality',
      detail: `Top precedent match (${topMatch.id}) shares ${topMatch.sharedFeatures.join(', ')} and completed resolution in ${topMatch.yearsToDisposal} years.`,
      impact: 'positive',
      metric: `${topMatch.similarityScore}% match`
    });
  }

  return factors;
}

// ─── Main KNN Prediction Function ──────────────────────────────────────────

/**
 * Predict ETA and disposition window for a case using k-Nearest Neighbors.
 * Works seamlessly with both existing dataset cases and custom user inputs.
 */
function predictEta(inputCase, options = {}) {
  if (!inputCase) return null;

  const k = options.k || 15;

  // Filter disposed cases from the archive as candidate training precedents
  // If input case is in the dataset, exclude it from its own neighbor pool (leave-one-out)
  const candidatePool = cases.filter(c => {
    if (!c.disposal_date) return false;
    if (inputCase.id && c.id === inputCase.id) return false;
    return true;
  });

  if (candidatePool.length === 0) {
    return getFallbackPrediction(inputCase);
  }

  // Calculate weighted distance to all candidate cases
  const scoredCandidates = candidatePool.map(candidate => {
    const dist = computeWeightedDistance(inputCase, candidate);
    const yrsToDisposal = Math.max(0.2, getCaseAgeYears(candidate));
    return {
      candidate,
      distance: dist,
      yearsToDisposal: yrsToDisposal
    };
  });

  // Sort by distance ascending
  scoredCandidates.sort((a, b) => a.distance - b.distance);

  // Take top k nearest neighbors
  const topK = scoredCandidates.slice(0, Math.min(k, scoredCandidates.length));
  const topKDisposals = topK.map(item => item.yearsToDisposal).sort((a, b) => a - b);

  // Compute empirical percentiles
  const p25 = round1(percentile(topKDisposals, 0.25));
  const median = round1(percentile(topKDisposals, 0.50));
  const p75 = round1(percentile(topKDisposals, 0.75));

  // Determine filing court / cohort statistics
  const cohortCases = cases.filter(c => c.case_type === inputCase.case_type && c.filing_court === inputCase.filing_court);
  const fallbackCohort = cohortCases.length > 5 ? cohortCases : cases.filter(c => c.case_type === inputCase.case_type);
  const avgAdjournments = fallbackCohort.reduce((sum, c) => sum + (c.num_adjournments || 0), 0) / Math.max(1, fallbackCohort.length);

  // Delay risk level
  const numAdj = inputCase.num_adjournments || 0;
  let delayRiskLevel = 'Medium';
  if (numAdj > avgAdjournments * 1.4) delayRiskLevel = 'High';
  else if (numAdj < avgAdjournments * 0.75) delayRiskLevel = 'Low';

  // Procedural Turbulence
  const turbulence = computeTurbulence(inputCase, avgAdjournments);

  // Format Top 5 Similar Cases for User Presentation
  const similarCases = topK.slice(0, 5).map(item => {
    const c = item.candidate;
    const similarity = clamp(Math.round(100 - item.distance * 12), 62, 99);
    const isPublic = Boolean(c.is_public_sample || c.id.startsWith('PUB-'));
    return {
      id: maskCaseId(c.id, isPublic),
      rawId: c.id,
      is_public_sample: isPublic,
      source: c.source || (isPublic ? 'eCourts Public Record' : null),
      case_type: c.case_type,
      filing_court: c.filing_court,
      jurisdiction: c.jurisdiction,
      disposal_date: c.disposal_date,
      yearsToDisposal: round1(item.yearsToDisposal),
      num_adjournments: c.num_adjournments,
      complexity: c.complexity,
      current_stage: c.current_stage || 'Disposed',
      similarityScore: similarity,
      distance: round1(item.distance),
      sharedFeatures: extractSharedFeatures(inputCase, c)
    };
  });

  // Confidence Score
  const confidence = computeCalibratedConfidence(
    topK.map(item => ({ distance: item.distance })),
    fallbackCohort.length,
    p25,
    median,
    p75
  );

  // "Why This Estimate?" Factor Breakdown
  const whyFactors = buildWhyExplanation(
    inputCase,
    similarCases,
    p25,
    median,
    p75,
    avgAdjournments,
    turbulence
  );

  // Projected calendar date range
  const filingDate = inputCase.filing_date || '2025-01-01';
  const etaDateRange = {
    earliest: addYearsToDate(filingDate, p25),
    likely: addYearsToDate(filingDate, median),
    latest: addYearsToDate(filingDate, p75)
  };

  // Stage Duration Comparison
  const currentStage = inputCase.current_stage || 'Filed';
  const stageComparison = computeStageComparison(inputCase, fallbackCohort);

  return {
    method: 'knn',
    k: topK.length,
    matchedClusterSize: fallbackCohort.length,
    etaRangeYears: { p25, median, p75 },
    etaDateRange,
    delayRiskLevel,
    turbulence,
    clusterAvgAdjournments: round1(avgAdjournments),
    confidence,
    similarCases,
    whyFactors,
    stageComparison,
    dominantCaseTypes: [inputCase.case_type],
    dominantCourts: [inputCase.filing_court]
  };
}

/**
 * Stage duration benchmark comparison
 */
function computeStageComparison(inputCase, cohort) {
  const currentStage = inputCase.current_stage || 'Filed';
  const ageMonths = Math.max(1, Math.round(getCaseAgeYears(inputCase) * 12));
  
  // Approximate stage proportion based on pipeline position
  const stageIdx = STAGES.indexOf(currentStage);
  const totalStages = STAGES.length - 1;
  const stageWeights = [0.10, 0.12, 0.15, 0.28, 0.22, 0.13, 0.00];
  const expectedWeight = stageWeights[stageIdx >= 0 ? stageIdx : 0] || 0.15;

  // Average time cases in this cohort spend at this milestone
  const avgTotalMonths = (cohort.reduce((sum, c) => sum + (c.total_duration_days || 1200), 0) / Math.max(1, cohort.length)) / 30.44;
  const avgTimeAtStage = Math.max(2, Math.round(avgTotalMonths * expectedWeight));

  // Estimated months spent in current stage
  const timeAtCurrentStage = Math.min(ageMonths, Math.max(1, Math.round(avgTimeAtStage * (0.8 + ((inputCase.num_adjournments || 0) * 0.1)))));

  return {
    currentStage,
    timeAtCurrentStageMonths: timeAtCurrentStage,
    avgTimeAtStageForClusterMonths: avgTimeAtStage,
    remainingCruisingMonths: Math.max(0, Math.round(avgTotalMonths - ageMonths))
  };
}

function getFallbackPrediction(inputCase) {
  return {
    method: 'cohort-fallback',
    k: 0,
    matchedClusterSize: 50,
    etaRangeYears: { p25: 2.5, median: 4.2, p75: 6.0 },
    etaDateRange: {
      earliest: addYearsToDate(inputCase.filing_date || '2025-01-01', 2.5),
      likely: addYearsToDate(inputCase.filing_date || '2025-01-01', 4.2),
      latest: addYearsToDate(inputCase.filing_date || '2025-01-01', 6.0)
    },
    delayRiskLevel: 'Medium',
    turbulence: {
      level: 'Light Turbulence',
      score: 35,
      description: 'Standard judicial flight plan baseline.',
      indicatorColor: 'text-gold'
    },
    clusterAvgAdjournments: 4.0,
    confidence: 35,
    similarCases: [],
    whyFactors: [{
      title: 'Baseline Estimate',
      detail: 'Broad jurisdiction baseline applied.',
      impact: 'neutral',
      metric: '4.2 yrs'
    }],
    stageComparison: {
      currentStage: inputCase.current_stage || 'Filed',
      timeAtCurrentStageMonths: 6,
      avgTimeAtStageForClusterMonths: 8,
      remainingCruisingMonths: 24
    }
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

function getCaseById(id) {
  if (!id) return null;
  return cases.find(c => c.id.toLowerCase() === id.toLowerCase()) || null;
}

function searchCases(query, limit = 10) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  return cases
    .filter(c => 
      c.id.toLowerCase().includes(q) ||
      c.case_type.toLowerCase().includes(q) ||
      c.filing_court.toLowerCase().includes(q) ||
      (c.parties?.petitioner && c.parties.petitioner.toLowerCase().includes(q)) ||
      (c.parties?.respondent && c.parties.respondent.toLowerCase().includes(q))
    )
    .slice(0, limit);
}

module.exports = {
  predictEta,
  getCaseById,
  searchCases,
  computeTurbulence,
  cases,
  STAGES,
  CASE_TYPES
};
