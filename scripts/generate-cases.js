/**
 * CourtFlight — CSV-to-JSON Case Data Converter
 * 
 * Reads the provided synthetic CSV dataset and converts it to the JSON schema
 * expected by the CourtFlight app. Supplements missing fields (parties, 
 * adjournment details, filing dates, disposal dates) with generated data.
 * 
 * Source: nyayaradar_1550_synthetic_cases.csv (1,550 records)
 * Output: data/cases.json
 */

const fs = require('fs');
const path = require('path');

// ─── Seed-able PRNG (mulberry32) for reproducibility ──────────────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const random = mulberry32(42);
function pick(arr) { return arr[Math.floor(random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(random() * (max - min + 1)) + min; }

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i] ? vals[i].trim() : ''; });
    return obj;
  });
}

// ─── Stage mapping ────────────────────────────────────────────────────────────
// Map CSV stages → prompt's stage sequence for the flight-tracker timeline
const STAGE_MAP = {
  'Filing':    'Filed',
  'Hearings':  'Notice Issued',
  'Evidence':  'Evidence Stage',
  'Arguments': 'Arguments',
  'Judgment':  'Judgment Reserved',
};

const STAGES_ORDERED = [
  'Filed', 'Notice Issued', 'Written Statement Filed',
  'Evidence Stage', 'Arguments', 'Judgment Reserved', 'Disposed',
];

// ─── Adjournment reasons ──────────────────────────────────────────────────────
const ADJOURNMENT_REASONS = [
  'Counsel absent', 'Evidence not ready', 'Judge on leave',
  'Amendment application filed', 'Parties seeking settlement',
  'Court strike/bandh', 'Document verification pending', 'Transfer application',
];

// ─── Name generation ──────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Suresh', 'Meera', 'Amit', 'Kavita', 'Vikram', 'Anita',
  'Deepak', 'Sunita', 'Ramesh', 'Neha', 'Ashok', 'Pooja', 'Manoj', 'Rekha',
  'Sanjay', 'Divya', 'Arun', 'Shweta', 'Nitin', 'Anjali', 'Rakesh', 'Geeta',
  'Harish', 'Lakshmi', 'Kiran', 'Pallavi', 'Sunil', 'Aarti', 'Mohan', 'Ritu',
];
const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Gupta', 'Iyer', 'Nair', 'Joshi', 'Desai',
  'Mehta', 'Rao', 'Singh', 'Kumar', 'Bhat', 'Kulkarni', 'Pillai', 'Menon',
  'Agarwal', 'Chatterjee', 'Verma', 'Mishra', 'Patil', 'Shah', 'Dubey', 'Pandey',
];
const COMPANY_SUFFIXES = ['Enterprises', 'Industries', 'Pvt. Ltd.', 'Corp.', 'Holdings', 'Associates'];

function generateName() {
  if (random() < 0.25) {
    return `${pick(LAST_NAMES)} ${pick(COMPANY_SUFFIXES)}`;
  }
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

// ─── High court mapping for predicted_final_court ─────────────────────────────
const STATE_HIGH_COURTS = {
  'Maharashtra': 'Bombay High Court',
  'Delhi': 'Delhi High Court',
  'Karnataka': 'Karnataka High Court',
  'Kerala': 'Kerala High Court',
  'Tamil Nadu': 'Madras High Court',
  'Uttar Pradesh': 'Allahabad High Court',
  'Gujarat': 'Gujarat High Court',
  'West Bengal': 'Calcutta High Court',
  'Telangana': 'Telangana High Court',
  'Madhya Pradesh': 'Madhya Pradesh High Court',
  'Rajasthan': 'Rajasthan High Court',
  'Haryana': 'Punjab and Haryana High Court',
  'Punjab': 'Punjab and Haryana High Court',
  'Jharkhand': 'Jharkhand High Court',
  'Odisha': 'Orissa High Court',
  'Assam': 'Gauhati High Court',
};

// ─── Main conversion ─────────────────────────────────────────────────────────

const csvPath = path.join(__dirname, '..', '..', 'courtflight-assets', 'nyayaradar_1550_synthetic_cases.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');
const records = parseCSV(csvText);

console.log(`Read ${records.length} records from CSV\n`);

const cases = records.map((row, idx) => {
  const filingYear = parseInt(row.filing_year) || 2020;
  // Generate a specific filing date within the filing year
  const monthOffset = randomInt(0, 11);
  const dayOffset = randomInt(1, 28);
  const filingDate = new Date(filingYear, monthOffset, dayOffset);
  const filingDateStr = filingDate.toISOString().split('T')[0];

  const daysElapsed = parseInt(row.days_elapsed) || 0;
  const totalDurationDays = parseInt(row.total_duration_days) || 1000;
  const adjournments = parseInt(row.adjournments) || 0;
  const hearings = parseInt(row.hearings) || 0;

  // Determine if this case should be "Disposed"
  // Cases where days_elapsed is a significant portion of total_duration_days
  // and random chance — targeting ~30% disposed for the prediction engine
  const progressRatio = daysElapsed / totalDurationDays;
  const isDisposed = progressRatio >= 0.50 && random() < 0.55;

  let currentStage;
  let disposalDate = null;

  if (isDisposed) {
    currentStage = 'Disposed';
    const disposalMs = filingDate.getTime() + totalDurationDays * 24 * 3600 * 1000;
    const dispDate = new Date(disposalMs);
    // Cap at current date
    const now = new Date('2026-06-01');
    disposalDate = dispDate > now
      ? new Date(now.getTime() - randomInt(30, 365) * 24 * 3600 * 1000)
      : dispDate;
    disposalDate = disposalDate.toISOString().split('T')[0];
  } else {
    // Map CSV stage to our stage names
    currentStage = STAGE_MAP[row.current_stage] || row.current_stage || 'Filed';
    
    // For cases far along, possibly bump to "Written Statement Filed" if they're 
    // currently at "Notice Issued" and have many hearings
    if (currentStage === 'Notice Issued' && hearings > 15) {
      currentStage = 'Written Statement Filed';
    }
  }

  // Filing court from CSV
  const filingCourt = row.court || 'Unknown Court';
  const state = row.state || 'Unknown';
  const jurisdiction = row.jurisdiction || state;

  // Predicted final court — usually same, sometimes escalates
  let predictedFinalCourt = filingCourt;
  if (random() < 0.08) {
    predictedFinalCourt = 'Supreme Court of India';
  } else if (random() < 0.15 && !filingCourt.includes('High Court')) {
    predictedFinalCourt = STATE_HIGH_COURTS[state] || filingCourt;
  }

  // Case type — keep from CSV (Criminal, Family, Property, Service, Civil, Commercial)
  const caseType = row.case_type || 'Civil';

  // Generate adjournment_reasons array
  const adjournmentReasons = [];
  for (let a = 0; a < adjournments; a++) {
    const adjProgress = adjournments > 1 ? a / (adjournments - 1) : 0;
    const adjDaysFromFiling = Math.round(adjProgress * daysElapsed * (0.8 + random() * 0.2));
    const adjDate = new Date(filingDate.getTime() + adjDaysFromFiling * 24 * 3600 * 1000);

    // Approximate stage at time of adjournment
    const stageIdx = Math.min(5, Math.floor(adjProgress * 6));
    const stageAtTime = STAGES_ORDERED[stageIdx];

    adjournmentReasons.push({
      date: adjDate.toISOString().split('T')[0],
      reason: pick(ADJOURNMENT_REASONS),
      stage_at_time: stageAtTime,
    });
  }

  return {
    id: row.case_id || `NYR-${String(idx + 1).padStart(5, '0')}`,
    case_type: caseType,
    filing_court: filingCourt,
    predicted_final_court: predictedFinalCourt,
    jurisdiction: jurisdiction,
    filing_date: filingDateStr,
    current_stage: currentStage,
    disposal_date: disposalDate,
    num_adjournments: adjournments,
    adjournment_reasons: adjournmentReasons,
    hearings: hearings,
    complexity: row.complexity || 'Medium',
    days_elapsed: daysElapsed,
    total_duration_days: totalDurationDays,
    parties: {
      petitioner: generateName(),
      respondent: generateName(),
    },
  };
});

// ─── Sanity checks ────────────────────────────────────────────────────────────
const disposed = cases.filter(c => c.disposal_date !== null);
const pending = cases.filter(c => c.disposal_date === null);

console.log(`Total: ${cases.length}`);
console.log(`Disposed: ${disposed.length} (${(disposed.length / cases.length * 100).toFixed(1)}%)`);
console.log(`Pending: ${pending.length} (${(pending.length / cases.length * 100).toFixed(1)}%)`);
console.log('');

// Median duration by case_type
console.log('Median total_duration_days by case_type:');
console.log('─'.repeat(55));
const caseTypes = [...new Set(cases.map(c => c.case_type))];
for (const ct of caseTypes) {
  const ofType = cases.filter(c => c.case_type === ct);
  const durations = ofType.map(c => c.total_duration_days).sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)];
  const medianYears = (median / 365.25).toFixed(1);
  console.log(`  ${ct.padEnd(20)} median=${median}d (${medianYears}yr)  n=${ofType.length}`);
}
console.log('');

// Courts
const courts = [...new Set(cases.map(c => c.filing_court))];
console.log(`Unique courts: ${courts.length}`);
courts.forEach(c => console.log(`  - ${c}`));
console.log('');

// Stages
const stages = {};
cases.forEach(c => { stages[c.current_stage] = (stages[c.current_stage] || 0) + 1; });
console.log('Stage distribution:');
Object.entries(stages).forEach(([s, n]) => console.log(`  ${s.padEnd(30)} ${n}`));

// ─── Write output ─────────────────────────────────────────────────────────────
const outputDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'cases.json');
fs.writeFileSync(outputPath, JSON.stringify(cases, null, 2));
console.log(`\nWritten ${cases.length} cases to ${outputPath}`);
