import { NextResponse } from 'next/server';
import { predictEta, getCaseById, searchCases, cases, STAGES } from '@/lib/predictEta';

/**
 * GET /api/predict?id=NYR-00001
 * 
 * Look up an existing case by ID and return its prediction.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const query = searchParams.get('q'); // search query

    // Search mode
    if (query) {
      const results = searchCases(query, 10);
      return NextResponse.json({
        query,
        count: results.length,
        results: results.map(c => ({
          id: c.id,
          case_type: c.case_type,
          filing_court: c.filing_court,
          current_stage: c.current_stage,
          num_adjournments: c.num_adjournments,
        })),
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id or q', usage: 'GET /api/predict?id=NYR-00001 or GET /api/predict?q=criminal' },
        { status: 400 }
      );
    }

    const caseData = getCaseById(id);
    if (!caseData) {
      return NextResponse.json(
        { error: `Case not found: ${id}`, suggestion: 'Use GET /api/predict?q=NYR to search for cases' },
        { status: 404 }
      );
    }

    const prediction = predictEta(caseData);
    return NextResponse.json({
      case: sanitizeCase(caseData),
      prediction,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predict
 * 
 * Predict ETA for a custom case (not necessarily in the dataset).
 * Accepts a JSON body with case parameters and runs the KNN engine against it.
 * 
 * Required fields: case_type, filing_court
 * Optional fields: jurisdiction, current_stage, num_adjournments, filing_date,
 *                  days_elapsed, total_duration_days, complexity, hearings
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // ─── Validate required fields ────────────────────────────────────────────
    const errors = [];
    if (!body.case_type) errors.push('case_type is required');
    if (!body.filing_court) errors.push('filing_court is required');

    if (errors.length > 0) {
      const validCaseTypes = [...new Set(cases.map(c => c.case_type))];
      const validCourts = [...new Set(cases.map(c => c.filing_court))];
      return NextResponse.json({
        error: 'Validation failed',
        errors,
        validValues: {
          case_types: validCaseTypes,
          filing_courts: validCourts,
          stages: STAGES,
        },
      }, { status: 400 });
    }

    // ─── Build a synthetic case object with defaults ─────────────────────────
    const validCaseTypes = [...new Set(cases.map(c => c.case_type))];
    const validCourts = [...new Set(cases.map(c => c.filing_court))];

    if (!validCaseTypes.includes(body.case_type)) {
      return NextResponse.json({
        error: `Unknown case_type: "${body.case_type}"`,
        validValues: validCaseTypes,
      }, { status: 400 });
    }

    if (!validCourts.includes(body.filing_court)) {
      return NextResponse.json({
        error: `Unknown filing_court: "${body.filing_court}"`,
        validValues: validCourts,
      }, { status: 400 });
    }

    // Infer jurisdiction from court name
    const sameCourtCase = cases.find(c => c.filing_court === body.filing_court);
    const inferredJurisdiction = body.jurisdiction || sameCourtCase?.jurisdiction || 'High Court';

    const syntheticCase = {
      id: body.id || 'CUSTOM-INPUT',
      case_type: body.case_type,
      filing_court: body.filing_court,
      predicted_final_court: body.filing_court,
      jurisdiction: inferredJurisdiction,
      filing_date: body.filing_date || '2023-01-01',
      current_stage: body.current_stage || 'Filed',
      disposal_date: null,
      num_adjournments: body.num_adjournments ?? 3,
      adjournment_reasons: [],
      hearings: body.hearings ?? 5,
      complexity: body.complexity || 'Medium',
      days_elapsed: body.days_elapsed ?? 365,
      total_duration_days: body.total_duration_days ?? 1500,
      parties: body.parties || { petitioner: 'Petitioner', respondent: 'Respondent' },
    };

    // Validate stage
    if (!STAGES.includes(syntheticCase.current_stage)) {
      return NextResponse.json({
        error: `Unknown current_stage: "${syntheticCase.current_stage}"`,
        validValues: STAGES,
      }, { status: 400 });
    }

    const prediction = predictEta(syntheticCase);

    return NextResponse.json({
      case: sanitizeCase(syntheticCase),
      prediction,
      note: 'This prediction is for a custom input case, not a case in the dataset.',
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body', usage: 'POST /api/predict with Content-Type: application/json' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * Sanitize case data for API response (remove internal fields).
 */
function sanitizeCase(c) {
  return {
    id: c.id,
    case_type: c.case_type,
    filing_court: c.filing_court,
    jurisdiction: c.jurisdiction,
    filing_date: c.filing_date,
    current_stage: c.current_stage,
    disposal_date: c.disposal_date,
    num_adjournments: c.num_adjournments,
    hearings: c.hearings,
    complexity: c.complexity,
    days_elapsed: c.days_elapsed,
    parties: c.parties,
  };
}
