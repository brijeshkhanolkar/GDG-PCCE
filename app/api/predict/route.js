import { predictEta, getCaseById, searchCases, cases, STAGES } from '../../../lib/predictEta.js';

const VALID_CASE_TYPES = ['Criminal', 'Family', 'Property', 'Service', 'Civil', 'Commercial'];

const VALID_COURTS = [
  'Delhi High Court',
  'Bombay High Court',
  'Allahabad High Court',
  'Calcutta High Court',
  'Madras High Court',
  'Karnataka High Court',
  'Gujarat High Court',
  'Rajasthan High Court',
  'Punjab and Haryana High Court',
  'Kerala High Court',
  'Patna High Court',
  'Telangana High Court'
];

/**
 * GET /api/predict?id=NYR-00001 or GET /api/predict?q=delhi
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const query = searchParams.get('q');

    // Search query mode
    if (query) {
      const results = searchCases(query, 10);
      return Response.json({
        query,
        count: results.length,
        results: results.map(c => ({
          id: c.id,
          case_type: c.case_type,
          filing_court: c.filing_court,
          current_stage: c.current_stage,
          num_adjournments: c.num_adjournments,
          is_public_sample: Boolean(c.is_public_sample || c.id.startsWith('PUB-'))
        })),
      });
    }

    if (!id) {
      return Response.json(
        { 
          error: 'Missing required parameter: id or q', 
          usage: 'GET /api/predict?id=NYR-00001 or GET /api/predict?q=delhi',
          sampleIds: ['NYR-00001', 'NYR-00006', 'PUB-SC-2017-003988']
        },
        { status: 400 }
      );
    }

    const caseData = getCaseById(id);
    if (!caseData) {
      return Response.json(
        { 
          error: `Case not found: ${id}`, 
          suggestion: 'Use GET /api/predict?q=NYR to search for valid case references' 
        },
        { status: 404 }
      );
    }

    const prediction = predictEta(caseData);
    return Response.json({
      case: sanitizeCase(caseData),
      prediction,
    });
  } catch (err) {
    return Response.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predict
 * 
 * Predict ETA for a custom case using the multi-dimensional k-NN engine.
 * Body:
 * {
 *   "case_type": "Commercial",
 *   "filing_court": "Delhi High Court",
 *   "current_stage": "Evidence Stage", // optional, defaults to "Filed"
 *   "num_adjournments": 4,             // optional, defaults to 2
 *   "complexity": "High",              // optional, defaults to "Medium"
 *   "filing_date": "2024-01-15",       // optional
 *   "parties": {                       // optional
 *     "petitioner": "Company A",
 *     "respondent": "Company B"
 *   }
 * }
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return Response.json(
        { error: 'Invalid JSON payload. Please send application/json with valid syntax.', details: parseErr.message },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return Response.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 }
      );
    }

    // ─── Validation ──────────────────────────────────────────────────────────
    const errors = [];
    if (!body.case_type || typeof body.case_type !== 'string' || !body.case_type.trim()) {
      errors.push('case_type is required (string)');
    }
    if (!body.filing_court || typeof body.filing_court !== 'string' || !body.filing_court.trim()) {
      errors.push('filing_court is required (string)');
    }

    if (errors.length > 0) {
      return Response.json({
        error: 'Validation failed',
        errors,
        validValues: {
          case_types: VALID_CASE_TYPES,
          filing_courts: VALID_COURTS,
          stages: STAGES,
        }
      }, { status: 400 });
    }

    // Normalize and match case_type (case-insensitive)
    const normalizedCaseType = VALID_CASE_TYPES.find(
      t => t.toLowerCase() === body.case_type.trim().toLowerCase()
    );
    if (!normalizedCaseType) {
      return Response.json({
        error: `Unknown case_type: "${body.case_type}"`,
        validValues: VALID_CASE_TYPES,
      }, { status: 400 });
    }

    // Normalize and match filing_court (case-insensitive)
    const normalizedCourt = VALID_COURTS.find(
      c => c.toLowerCase() === body.filing_court.trim().toLowerCase()
    );
    if (!normalizedCourt) {
      return Response.json({
        error: `Unknown filing_court: "${body.filing_court}"`,
        validValues: VALID_COURTS,
      }, { status: 400 });
    }

    // Normalize and match current_stage
    let normalizedStage = 'Filed';
    if (body.current_stage) {
      const match = STAGES.find(s => s.toLowerCase() === String(body.current_stage).trim().toLowerCase());
      if (!match) {
        return Response.json({
          error: `Unknown current_stage: "${body.current_stage}"`,
          validValues: STAGES,
        }, { status: 400 });
      }
      normalizedStage = match;
    }

    // Normalize complexity
    let normalizedComplexity = 'Medium';
    if (body.complexity) {
      const compMatch = ['Low', 'Medium', 'High'].find(
        c => c.toLowerCase() === String(body.complexity).trim().toLowerCase()
      );
      if (compMatch) normalizedComplexity = compMatch;
    }

    // Calculate days_elapsed from filing_date
    const filingDate = body.filing_date || '2024-01-15';
    let daysElapsed = 365;
    const filingTime = new Date(filingDate).getTime();
    if (!isNaN(filingTime)) {
      daysElapsed = Math.max(1, Math.round((new Date('2026-09-12').getTime() - filingTime) / (24 * 3600 * 1000)));
    }

    const numAdjournments = Math.max(0, Math.min(30, parseInt(body.num_adjournments, 10) || 0));

    // Construct Synthetic Case
    const customId = body.id || `CUSTOM-${normalizedCaseType.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Infer jurisdiction
    const sameCourt = cases.find(c => c.filing_court === normalizedCourt);
    const jurisdiction = body.jurisdiction || sameCourt?.jurisdiction || normalizedCourt.replace(' High Court', '');

    const syntheticCase = {
      id: customId,
      case_type: normalizedCaseType,
      filing_court: normalizedCourt,
      predicted_final_court: body.predicted_final_court || normalizedCourt,
      jurisdiction,
      filing_date: filingDate,
      current_stage: normalizedStage,
      disposal_date: null,
      num_adjournments: numAdjournments,
      adjournment_reasons: generateSyntheticAdjournmentReasons(numAdjournments, filingDate, normalizedStage),
      hearings: body.hearings ?? Math.max(2, numAdjournments * 2 + 3),
      complexity: normalizedComplexity,
      days_elapsed: daysElapsed,
      total_duration_days: Math.max(daysElapsed + 200, 1400),
      parties: {
        petitioner: body.parties?.petitioner || 'Petitioner in Person',
        respondent: body.parties?.respondent || 'Respondent / State Authority'
      },
    };

    // Run k-NN prediction
    const prediction = predictEta(syntheticCase);

    return Response.json({
      status: 'success',
      case: sanitizeCase(syntheticCase),
      prediction,
      telemetry: {
        engine: 'Multi-Dimensional k-NN',
        precedentsEvaluated: cases.filter(c => c.disposal_date).length,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (err) {
    return Response.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * Generate realistic procedural adjournment records for custom cases
 */
function generateSyntheticAdjournmentReasons(count, filingDate, currentStage) {
  if (count <= 0) return [];

  const REASONS = [
    'Counsel for respondent requested adjournment due to personal illness',
    'Adjourned for completion of pleadings and filing of counter-affidavit',
    'Key witness unavailable; summons re-issued for next scheduled bench',
    'Bench reconstituted; part-heard matter adjourned for physical rehearing',
    'Joint application by parties requesting mediation exploration window',
    'Interim status quo extended; awaiting lower court lower trial record',
    'Adjourned on request of senior counsel appearing in constitutional bench'
  ];

  const reasons = [];
  const start = new Date(filingDate || '2024-01-15');
  const now = new Date('2026-09-12');
  const intervalDays = Math.max(30, Math.floor((now - start) / (count + 1) / (24 * 3600 * 1000)));

  for (let i = 0; i < count; i++) {
    const adjDate = new Date(start.getTime() + (i + 1) * intervalDays * 24 * 3600 * 1000);
    reasons.push({
      date: adjDate.toISOString().split('T')[0],
      reason: REASONS[i % REASONS.length],
      stage_at_time: i === count - 1 ? currentStage : 'Written Statement Filed'
    });
  }

  return reasons;
}

function sanitizeCase(c) {
  return {
    id: c.id,
    case_type: c.case_type,
    filing_court: c.filing_court,
    predicted_final_court: c.predicted_final_court,
    jurisdiction: c.jurisdiction,
    filing_date: c.filing_date,
    current_stage: c.current_stage,
    disposal_date: c.disposal_date,
    num_adjournments: c.num_adjournments,
    adjournment_reasons: c.adjournment_reasons,
    hearings: c.hearings,
    complexity: c.complexity,
    days_elapsed: c.days_elapsed,
    parties: c.parties,
  };
}
