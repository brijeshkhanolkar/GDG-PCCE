import { NextResponse } from 'next/server';
import { predictEta, getCaseById } from '@/lib/predictEta';

/**
 * GET /api/predict?id=NYR-00001
 * 
 * Returns the predictEta() output as JSON for a given case ID.
 * This route is for external/demo consumption — the pages call
 * predictEta() directly server-side for speed.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required query parameter: id' },
      { status: 400 }
    );
  }

  const caseData = getCaseById(id);

  if (!caseData) {
    return NextResponse.json(
      { error: `Case not found: ${id}` },
      { status: 404 }
    );
  }

  const prediction = predictEta(caseData);

  return NextResponse.json({
    case: {
      id: caseData.id,
      case_type: caseData.case_type,
      filing_court: caseData.filing_court,
      jurisdiction: caseData.jurisdiction,
      current_stage: caseData.current_stage,
      num_adjournments: caseData.num_adjournments,
    },
    prediction,
  });
}
