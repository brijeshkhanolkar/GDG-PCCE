const fs = require('fs');
const path = require('path');

const cases = require('../data/cases.json');

// Canonical categories sorted for deterministic vector layout
const ALL_CASE_TYPES = [...new Set(cases.map(c => c.case_type))].sort();
const ALL_COURTS = [...new Set(cases.map(c => c.filing_court))].sort();
const ALL_JURISDICTIONS = [...new Set(cases.map(c => c.jurisdiction))].sort();

const STAGES = [
  'Filed',
  'Notice Issued',
  'Written Statement Filed',
  'Evidence Stage',
  'Arguments',
  'Judgment Reserved',
  'Disposed'
];

/**
 * One-hot encode a categorical value against an alphabet of all possible values.
 */
function oneHot(val, allVals) {
  return allVals.map(v => (v === val ? 1 : 0));
}

/**
 * Min-max normalize a numeric value to [0, 1].
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
  const idx = STAGES.indexOf(stage);
  if (idx === -1) return 0;
  return idx / (STAGES.length - 1);
}

/**
 * Compute case age in years from filing_date to disposal_date (if disposed) or reference date.
 */
function getCaseAgeYears(caseData, refDate = new Date('2026-09-12')) {
  const filing = new Date(caseData.filing_date);
  const end = caseData.disposal_date ? new Date(caseData.disposal_date) : refDate;
  const years = (end - filing) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, years);
}

// Compute global min / max across the dataset for age and adjournments
const ages = cases.map(c => getCaseAgeYears(c));
const minAge = Math.min(...ages);
const maxAge = Math.max(...ages);

const adjs = cases.map(c => c.num_adjournments);
const minAdj = Math.min(...adjs);
const maxAdj = Math.max(...adjs);

const scalingParams = {
  caseAge: { min: minAge, max: maxAge },
  adjournments: { min: minAdj, max: maxAdj }
};

/**
 * Build the 33-dimensional feature vector for a case.
 */
function buildFeatureVector(caseData, scaling = scalingParams) {
  const age = getCaseAgeYears(caseData);
  return [
    ...oneHot(caseData.case_type, ALL_CASE_TYPES),
    ...oneHot(caseData.filing_court, ALL_COURTS),
    ...oneHot(caseData.jurisdiction, ALL_JURISDICTIONS),
    normalize(age, scaling.caseAge.min, scaling.caseAge.max),
    normalize(caseData.num_adjournments, scaling.adjournments.min, scaling.adjournments.max),
    ordinalStagePosition(caseData.current_stage),
  ];
}

/**
 * Euclidean distance squared between two vectors.
 */
function distSq(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Euclidean distance between two vectors.
 */
function euclideanDistance(a, b) {
  return Math.sqrt(distSq(a, b));
}

/**
 * Run k-means++ initialization to select k initial centroids.
 */
function initKMeansPlusPlus(X, k) {
  const centroids = [];
  // 1. First centroid chosen uniformly at random
  const firstIdx = Math.floor(Math.random() * X.length);
  centroids.push([...X[firstIdx]]);

  // 2. Pick next k-1 centroids with probability proportional to D(x)^2
  while (centroids.length < k) {
    const dists = X.map(x => {
      let minDistSq = Infinity;
      for (const c of centroids) {
        const d2 = distSq(x, c);
        if (d2 < minDistSq) minDistSq = d2;
      }
      return minDistSq;
    });

    const totalDistSq = dists.reduce((sum, d) => sum + d, 0);
    const r = Math.random() * totalDistSq;
    let accum = 0;
    let chosenIdx = 0;
    for (let i = 0; i < dists.length; i++) {
      accum += dists[i];
      if (accum >= r) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push([...X[chosenIdx]]);
  }

  return centroids;
}

/**
 * Single run of k-means algorithm.
 */
function runKMeans(X, k, maxIter = 100) {
  let centroids = initKMeansPlusPlus(X, k);
  const dim = X[0].length;
  let assignments = new Array(X.length).fill(-1);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < X.length; i++) {
      let bestCluster = 0;
      let bestDistSq = Infinity;
      for (let j = 0; j < k; j++) {
        const d2 = distSq(X[i], centroids[j]);
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestCluster = j;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update step
    const newCentroids = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);

    for (let i = 0; i < X.length; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dim; d++) {
        newCentroids[c][d] += X[i][d];
      }
    }

    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        for (let d = 0; d < dim; d++) {
          newCentroids[j][d] /= counts[j];
        }
      } else {
        // Re-seed empty cluster to a random data point
        const randIdx = Math.floor(Math.random() * X.length);
        newCentroids[j] = [...X[randIdx]];
      }
    }

    let maxShift = 0;
    for (let j = 0; j < k; j++) {
      const shift = distSq(centroids[j], newCentroids[j]);
      if (shift > maxShift) maxShift = shift;
    }

    centroids = newCentroids;

    if (maxShift < 1e-6 && !changed) {
      break;
    }
  }

  // Calculate Within-Cluster Sum of Squares (WCSS)
  let wcss = 0;
  for (let i = 0; i < X.length; i++) {
    wcss += distSq(X[i], centroids[assignments[i]]);
  }

  return { centroids, assignments, wcss };
}

/**
 * Compute percentile of an already sorted array.
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
 * Main execution function
 */
function buildClusters(k = 18, restarts = 5) {
  console.log(`Building feature vectors for ${cases.length} cases...`);
  const X = cases.map(c => buildFeatureVector(c, scalingParams));

  console.log(`Running k-means with k=${k} across ${restarts} restarts...`);
  let bestRun = null;

  for (let r = 0; r < restarts; r++) {
    const run = runKMeans(X, k);
    console.log(`  Restart ${r + 1}/${restarts}: WCSS = ${run.wcss.toFixed(4)}`);
    if (!bestRun || run.wcss < bestRun.wcss) {
      bestRun = run;
    }
  }

  console.log(`Selected best clustering with WCSS = ${bestRun.wcss.toFixed(4)}`);

  // Compute cluster statistics
  const clusterGroups = Array.from({ length: k }, () => []);
  for (let i = 0; i < cases.length; i++) {
    clusterGroups[bestRun.assignments[i]].push(cases[i]);
  }

  const clusters = clusterGroups.map((groupCases, clusterId) => {
    const size = groupCases.length;
    const disposedCases = groupCases.filter(c => c.disposal_date !== null);
    const disposedCount = disposedCases.length;

    // Compute years to disposal for all disposed cases
    const yearsList = disposedCases.map(c => {
      const filing = new Date(c.filing_date);
      const disposal = new Date(c.disposal_date);
      const yrs = (disposal - filing) / (365.25 * 24 * 3600 * 1000);
      return { id: c.id, years: Math.max(0, yrs) };
    }).sort((a, b) => a.years - b.years);

    const sortedYears = yearsList.map(y => y.years);
    const p25 = sortedYears.length ? percentile(sortedYears, 0.25) : 2.0;
    const median = sortedYears.length ? percentile(sortedYears, 0.5) : 3.8;
    const p75 = sortedYears.length ? percentile(sortedYears, 0.75) : 5.5;

    // Average adjournments in this cluster
    const avgAdjournments = size > 0
      ? groupCases.reduce((sum, c) => sum + c.num_adjournments, 0) / size
      : 4.0;

    // Dominant case types
    const caseTypeCounts = {};
    for (const c of groupCases) {
      caseTypeCounts[c.case_type] = (caseTypeCounts[c.case_type] || 0) + 1;
    }
    const dominantCaseTypes = Object.entries(caseTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // Dominant courts
    const courtCounts = {};
    for (const c of groupCases) {
      courtCounts[c.filing_court] = (courtCounts[c.filing_court] || 0) + 1;
    }
    const dominantCourts = Object.entries(courtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // 6-8 disposed cases closest to the median disposal time
    const sortedByDistToMedian = [...yearsList].sort(
      (a, b) => Math.abs(a.years - median) - Math.abs(b.years - median)
    );
    const exampleDisposedCaseIds = sortedByDistToMedian.slice(0, 8).map(y => y.id);

    return {
      clusterId,
      centroid: bestRun.centroids[clusterId].map(v => Math.round(v * 10000) / 10000),
      size,
      disposedCount,
      disposalStats: {
        p25: Math.round(p25 * 10) / 10,
        median: Math.round(median * 10) / 10,
        p75: Math.round(p75 * 10) / 10,
      },
      avgAdjournments: Math.round(avgAdjournments * 10) / 10,
      dominantCaseTypes,
      dominantCourts,
      exampleDisposedCaseIds,
    };
  });

  const outputData = {
    metadata: {
      k,
      wcss: Math.round(bestRun.wcss * 100) / 100,
      totalCases: cases.length,
      disposedCases: cases.filter(c => c.disposal_date !== null).length,
      createdAt: new Date().toISOString()
    },
    scalingParams,
    categories: {
      allCaseTypes: ALL_CASE_TYPES,
      allCourts: ALL_COURTS,
      allJurisdictions: ALL_JURISDICTIONS,
      stages: STAGES
    },
    clusters
  };

  const outputPath = path.join(__dirname, '../data/cluster-stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Cluster statistics saved successfully to ${outputPath}`);

  console.log('\n--- Cluster Summary ---');
  for (const cl of clusters) {
    console.log(
      `Cluster ${String(cl.clusterId).padStart(2, ' ')}: ` +
      `size=${String(cl.size).padStart(3, ' ')}, ` +
      `disposed=${String(cl.disposedCount).padStart(3, ' ')}, ` +
      `median=${cl.disposalStats.median}y, ` +
      `dominant=${cl.dominantCaseTypes.join(', ')}`
    );
  }

  return outputData;
}

// Allow CLI execution or module export
if (require.main === module) {
  // Let k be passed from command line if desired, e.g. node scripts/build-clusters.js 18
  const argK = parseInt(process.argv[2], 10) || 18;
  buildClusters(argK, 5);
}

module.exports = {
  ALL_CASE_TYPES,
  ALL_COURTS,
  ALL_JURISDICTIONS,
  STAGES,
  oneHot,
  normalize,
  ordinalStagePosition,
  getCaseAgeYears,
  scalingParams,
  buildFeatureVector,
  euclideanDistance,
  buildClusters
};
