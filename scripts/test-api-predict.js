/**
 * CourtFlight — API Test Suite: POST & GET /api/predict
 * 
 * 10 Comprehensive Tests:
 * 1. POST: Valid Civil Case @ Bombay High Court
 * 2. POST: Valid Criminal Case with 10 Adjournments (Severe Turbulence)
 * 3. POST: Valid Commercial Case with 0 Adjournments (Smooth Flight)
 * 4. POST: Case-insensitive parameter normalization ("commercial" / "delhi high court")
 * 5. POST: High Complexity Property Suit with Custom Parties
 * 6. POST: Validation Error: Missing required fields (400 Bad Request)
 * 7. POST: Validation Error: Unknown case_type (400 Bad Request)
 * 8. POST: Turbulence gradient verification (0 adjs vs 12 adjs)
 * 9. GET: Docket lookup by ID (/api/predict?id=NYR-00001)
 * 10. GET: Search query mode (/api/predict?q=delhi)
 * 
 * Run: node scripts/test-api-predict.js
 */

const { GET, POST } = require('../app/api/predict/route.js');

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

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' COURTFLIGHT API TEST SUITE: POST & GET /api/predict');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ─── Test 1: POST Valid Civil Case @ Bombay HC ─────────────────────────────
  console.log('━━━ Test 1: POST Valid Civil Case @ Bombay High Court ━━━');
  try {
    const req1 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'Civil',
        filing_court: 'Bombay High Court',
        current_stage: 'Evidence Stage',
        num_adjournments: 3,
        complexity: 'Medium'
      })
    });
    const res1 = await POST(req1);
    const data1 = await res1.json();

    assert(res1.status === 200, 'HTTP status is 200');
    assert(data1.case && data1.case.case_type === 'Civil', 'Case type returned as Civil');
    assert(data1.case.filing_court === 'Bombay High Court', 'Filing court returned as Bombay High Court');
    assert(data1.prediction && data1.prediction.etaRangeYears.median > 0, `Median resolution computed: ${data1.prediction?.etaRangeYears?.median} yrs`);
    assert(data1.prediction.confidence >= 15 && data1.prediction.confidence <= 96, `Calibrated confidence: ${data1.prediction?.confidence}%`);
    assert(data1.prediction.similarCases.length === 5, `Top 5 nearest precedents returned: ${data1.prediction?.similarCases?.length}`);
  } catch (err) {
    assert(false, 'Test 1 exception', err.message);
  }

  // ─── Test 2: POST Criminal Case with 10 Adjournments (Severe Turbulence) ───
  console.log('\n━━━ Test 2: POST Criminal Case (Severe Turbulence Verification) ━━━');
  try {
    const req2 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'Criminal',
        filing_court: 'Allahabad High Court',
        current_stage: 'Evidence Stage',
        num_adjournments: 10,
        complexity: 'High'
      })
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    assert(res2.status === 200, 'HTTP status is 200');
    assert(data2.prediction.delayRiskLevel === 'High', `Delay risk level is High (${data2.prediction?.delayRiskLevel})`);
    assert(data2.prediction.turbulence.level === 'Severe Turbulence', `Turbulence level is Severe (${data2.prediction?.turbulence?.level})`);
    assert(data2.prediction.turbulence.score >= 75, `Turbulence score reflects high friction: ${data2.prediction?.turbulence?.score}/100`);
    const dragFactor = data2.prediction.whyFactors.find(f => f.title === 'Adjournment Drag');
    assert(Boolean(dragFactor), 'Why factors identify Adjournment Drag');
  } catch (err) {
    assert(false, 'Test 2 exception', err.message);
  }

  // ─── Test 3: POST Commercial Case with 0 Adjournments (Smooth Flight) ──────
  console.log('\n━━━ Test 3: POST Commercial Case (Smooth Flight Verification) ━━━');
  try {
    const req3 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'Commercial',
        filing_court: 'Delhi High Court',
        current_stage: 'Arguments',
        num_adjournments: 0,
        complexity: 'Low'
      })
    });
    const res3 = await POST(req3);
    const data3 = await res3.json();

    assert(res3.status === 200, 'HTTP status is 200');
    assert(data3.prediction.turbulence.level === 'Smooth Flight', `Turbulence level is Smooth Flight (${data3.prediction?.turbulence?.level})`);
    assert(data3.prediction.delayRiskLevel === 'Low', `Risk level is Low (${data3.prediction?.delayRiskLevel})`);
    const smoothFactor = data3.prediction.whyFactors.find(f => f.title === 'Optimal Trajectory' || f.impact === 'positive');
    assert(Boolean(smoothFactor), 'Why factors highlight favorable trajectory');
  } catch (err) {
    assert(false, 'Test 3 exception', err.message);
  }

  // ─── Test 4: Case-insensitive Parameter Normalization ───────────────────────
  console.log('\n━━━ Test 4: Case-insensitive Parameter Normalization ━━━');
  try {
    const req4 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'commercial', // lowercase
        filing_court: 'delhi high court', // lowercase
        current_stage: 'evidence stage', // lowercase
        complexity: 'high' // lowercase
      })
    });
    const res4 = await POST(req4);
    const data4 = await res4.json();

    assert(res4.status === 200, 'HTTP status is 200 despite lowercase input');
    assert(data4.case.case_type === 'Commercial', `Normalized case_type to "Commercial": ${data4.case?.case_type}`);
    assert(data4.case.filing_court === 'Delhi High Court', `Normalized filing_court to "Delhi High Court": ${data4.case?.filing_court}`);
    assert(data4.case.current_stage === 'Evidence Stage', `Normalized stage to "Evidence Stage": ${data4.case?.current_stage}`);
  } catch (err) {
    assert(false, 'Test 4 exception', err.message);
  }

  // ─── Test 5: High Complexity Property Suit with Custom Parties ─────────────
  console.log('\n━━━ Test 5: High Complexity Property Suit with Custom Parties ━━━');
  try {
    const req5 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'Property',
        filing_court: 'Calcutta High Court',
        current_stage: 'Written Statement Filed',
        num_adjournments: 4,
        complexity: 'High',
        filing_date: '2023-05-12',
        parties: {
          petitioner: 'Mukherjee Estate Heritage Trust',
          respondent: 'West Bengal Land Development Authority'
        }
      })
    });
    const res5 = await POST(req5);
    const data5 = await res5.json();

    assert(res5.status === 200, 'HTTP status is 200');
    assert(data5.case.parties.petitioner === 'Mukherjee Estate Heritage Trust', 'Custom petitioner preserved');
    assert(data5.case.parties.respondent === 'West Bengal Land Development Authority', 'Custom respondent preserved');
    assert(data5.case.days_elapsed > 300, `Days elapsed calculated dynamically from filing_date: ${data5.case?.days_elapsed} days`);
  } catch (err) {
    assert(false, 'Test 5 exception', err.message);
  }

  // ─── Test 6: Validation Error: Missing Required Fields ─────────────────────
  console.log('\n━━━ Test 6: Validation Error (Missing required fields) ━━━');
  try {
    const req6 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // missing case_type and filing_court
        num_adjournments: 5
      })
    });
    const res6 = await POST(req6);
    const data6 = await res6.json();

    assert(res6.status === 400, 'HTTP status is 400 Bad Request');
    assert(Array.isArray(data6.errors) && data6.errors.length >= 2, `Helpful error array returned: ${data6.errors?.join('; ')}`);
    assert(Boolean(data6.validValues?.case_types) && Boolean(data6.validValues?.filing_courts), 'Returns validValues hints to assist caller');
  } catch (err) {
    assert(false, 'Test 6 exception', err.message);
  }

  // ─── Test 7: Validation Error: Unknown Case Type ───────────────────────────
  console.log('\n━━━ Test 7: Validation Error (Unknown case_type) ━━━');
  try {
    const req7 = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_type: 'Maritime Admiralty Dispute', // Not in alphabet
        filing_court: 'Madras High Court'
      })
    });
    const res7 = await POST(req7);
    const data7 = await res7.json();

    assert(res7.status === 400, 'HTTP status is 400 Bad Request for unknown category');
    assert(data7.error.includes('Unknown case_type'), `Helpful error message: "${data7.error}"`);
    assert(Array.isArray(data7.validValues), 'Returns allowed case_types');
  } catch (err) {
    assert(false, 'Test 7 exception', err.message);
  }

  // ─── Test 8: Turbulence Gradient Verification ──────────────────────────────
  console.log('\n━━━ Test 8: Turbulence Gradient Verification (0 vs 12 adjs) ━━━');
  try {
    const reqLow = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_type: 'Civil', filing_court: 'Delhi High Court', num_adjournments: 0 })
    });
    const resLow = await POST(reqLow);
    const dataLow = await resLow.json();

    const reqHigh = new Request('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_type: 'Civil', filing_court: 'Delhi High Court', num_adjournments: 12 })
    });
    const resHigh = await POST(reqHigh);
    const dataHigh = await resHigh.json();

    const lowScore = dataLow.prediction.turbulence.score;
    const highScore = dataHigh.prediction.turbulence.score;
    assert(highScore > lowScore, `Friction score increases with adjournments: ${lowScore} -> ${highScore}`);
    assert(dataHigh.prediction.etaRangeYears.median >= dataLow.prediction.etaRangeYears.median, 'Higher adjournments yields longer or equal median ETA');
  } catch (err) {
    assert(false, 'Test 8 exception', err.message);
  }

  // ─── Test 9: GET Docket Lookup by ID ───────────────────────────────────────
  console.log('\n━━━ Test 9: GET /api/predict?id=NYR-00001 ━━━');
  try {
    const req9 = new Request('http://localhost:3000/api/predict?id=NYR-00001', { method: 'GET' });
    const res9 = await GET(req9);
    const data9 = await res9.json();

    assert(res9.status === 200, 'HTTP status is 200');
    assert(data9.case && data9.case.id === 'NYR-00001', `Case NYR-00001 resolved: ${data9.case?.case_type}`);
    assert(data9.prediction && data9.prediction.etaRangeYears.p25 > 0, `Range verified: p25=${data9.prediction?.etaRangeYears?.p25}, median=${data9.prediction?.etaRangeYears?.median}`);
  } catch (err) {
    assert(false, 'Test 9 exception', err.message);
  }

  // ─── Test 10: GET Search Query Mode ────────────────────────────────────────
  console.log('\n━━━ Test 10: GET Search Query Mode (/api/predict?q=delhi) ━━━');
  try {
    const req10 = new Request('http://localhost:3000/api/predict?q=delhi', { method: 'GET' });
    const res10 = await GET(req10);
    const data10 = await res10.json();

    assert(res10.status === 200, 'HTTP status is 200');
    assert(Array.isArray(data10.results) && data10.results.length > 0, `Returned ${data10.results?.length} matching cases for query "delhi"`);
    assert(data10.results[0].filing_court.toLowerCase().includes('delhi'), `First result is at Delhi court: ${data10.results[0]?.filing_court}`);
  } catch (err) {
    assert(false, 'Test 10 exception', err.message);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` API TEST SUITE SUMMARY: ${passed} passed, ${failed} failed (${passed + failed} assertions)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
