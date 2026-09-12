'use client';

import { useState } from 'react';
import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo';
import BoardingPass from '@/components/BoardingPass';
import JourneyTimeline from '@/components/JourneyTimeline';
import ClusterStats from '@/components/ClusterStats';

const CASE_TYPES = ['Criminal', 'Family', 'Property', 'Service', 'Civil', 'Commercial'];

const COURTS = [
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

const STAGES = [
  'Filed',
  'Notice Issued',
  'Written Statement Filed',
  'Evidence Stage',
  'Arguments',
  'Judgment Reserved'
];

const PRESETS = [
  {
    name: 'Commercial Dispute @ Delhi HC',
    desc: 'High complexity, expedited arguments, 2 adjournments',
    data: {
      case_type: 'Commercial',
      filing_court: 'Delhi High Court',
      current_stage: 'Arguments',
      num_adjournments: 2,
      complexity: 'High',
      filing_date: '2024-02-10',
      parties: { petitioner: 'Apex Global Logistics Pvt. Ltd.', respondent: 'Trans-India Infra Ltd.' }
    }
  },
  {
    name: 'Criminal Appeal @ Allahabad HC',
    desc: 'Heavy procedural friction, 9 adjournments, evidence stage',
    data: {
      case_type: 'Criminal',
      filing_court: 'Allahabad High Court',
      current_stage: 'Evidence Stage',
      num_adjournments: 9,
      complexity: 'High',
      filing_date: '2023-08-15',
      parties: { petitioner: 'State of U.P.', respondent: 'Virendra Pratap & Ors.' }
    }
  },
  {
    name: 'Property Partition @ Bombay HC',
    desc: 'Standard cadence, 4 adjournments, written statement filed',
    data: {
      case_type: 'Property',
      filing_court: 'Bombay High Court',
      current_stage: 'Written Statement Filed',
      num_adjournments: 4,
      complexity: 'Medium',
      filing_date: '2024-05-20',
      parties: { petitioner: 'Kapadia Family Trust', respondent: 'Municipal Corp. of Greater Mumbai' }
    }
  },
  {
    name: 'Expedited Family Appeal @ Karnataka HC',
    desc: 'Low complexity, smooth flight, 0 adjournments',
    data: {
      case_type: 'Family',
      filing_court: 'Karnataka High Court',
      current_stage: 'Notice Issued',
      num_adjournments: 0,
      complexity: 'Low',
      filing_date: '2024-11-01',
      parties: { petitioner: 'Ananya Rao', respondent: 'Karthik S. Murthy' }
    }
  }
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

export default function AnalyzePage() {
  // Form State
  const [formData, setFormData] = useState({
    case_type: 'Commercial',
    filing_court: 'Delhi High Court',
    current_stage: 'Evidence Stage',
    num_adjournments: 4,
    complexity: 'Medium',
    filing_date: '2024-03-15',
    petitioner: 'Sovereign Ventures Ltd.',
    respondent: 'Union Express Rail Corp.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Live turbulence preview based on current slider value
  const getTurbulencePreview = (adjs) => {
    if (adjs >= 8) return { label: 'Severe Turbulence', color: 'text-stamp-red border-stamp-red/50 bg-stamp-red/10' };
    if (adjs >= 5) return { label: 'Moderate Turbulence', color: 'text-amber-400 border-amber-400/50 bg-amber-400/10' };
    if (adjs >= 2) return { label: 'Light Turbulence', color: 'text-gold-light border-gold/40 bg-gold/10' };
    return { label: 'Smooth Flight', color: 'text-gold border-gold/50 bg-gold/10' };
  };

  const turbPreview = getTurbulencePreview(formData.num_adjournments);

  const applyPreset = (preset) => {
    setFormData({
      case_type: preset.data.case_type,
      filing_court: preset.data.filing_court,
      current_stage: preset.data.current_stage,
      num_adjournments: preset.data.num_adjournments,
      complexity: preset.data.complexity,
      filing_date: preset.data.filing_date,
      petitioner: preset.data.parties.petitioner,
      respondent: preset.data.parties.respondent
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        case_type: formData.case_type,
        filing_court: formData.filing_court,
        current_stage: formData.current_stage,
        num_adjournments: Number(formData.num_adjournments),
        complexity: formData.complexity,
        filing_date: formData.filing_date,
        parties: {
          petitioner: formData.petitioner || 'Petitioner',
          respondent: formData.respondent || 'Respondent'
        }
      };

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to compute prediction telemetry.');
      }

      setResult(data);

      // Smooth scroll to result
      setTimeout(() => {
        const el = document.getElementById('telemetry-result');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-charcoal text-off-white font-body selection:bg-gold selection:text-charcoal pb-24">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display font-semibold text-gold tracking-tight text-lg hover:text-gold-light transition-colors">
              COURTFLIGHT
            </span>
          </Link>
          <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
          <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">
            Flight Dispatch &amp; Analyzer
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Overview</Link>
          <Link href="/analyze" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase font-bold border border-gold/40 px-2.5 py-1 bg-gold/10">Analyze Case</Link>
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Dockets</Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Trajectory</Link>
          <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Manifest</Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-dim-grey hidden sm:inline">
            k-NN Engine: <span className="text-gold">Active (1,565 Precedents)</span>
          </span>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="px-6 md:px-16 pt-12 md:pt-16 pb-10 border-b border-hairline bg-[#0E0E10]">
        <div className="max-w-4xl">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Empirical Prediction Console // Case Dispatch Terminal
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-4">
            Enter case parameters.<br />Compute real-time flight ETA.
          </h1>
          <p className="font-body text-dim-grey text-base md:text-lg max-w-2xl leading-relaxed">
            Dispatch a custom docket to the multi-dimensional k-NN engine. The algorithm extracts similar historical precedents, calculates empirical disposition percentiles (p25, median, p75), measures procedural turbulence, and generates explainable factors.
          </p>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="px-6 md:px-16 py-12 max-w-6xl mx-auto">
        {/* Quick Presets / Flight Templates */}
        <div className="mb-10">
          <div className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase mb-3 flex items-center gap-2">
            <span>Or select a procedural flight preset:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-3.5 bg-surface-dim border border-hairline hover:border-gold/60 transition-colors duration-150 group"
              >
                <div className="font-display text-xs text-off-white group-hover:text-gold transition-colors font-medium mb-1 truncate">
                  {preset.name}
                </div>
                <div className="font-mono text-[10px] text-dim-grey leading-tight line-clamp-2">
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-surface-dim border border-hairline p-6 md:p-10 mb-16 shadow-2xl">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 border-b border-hairline pb-3 flex items-center justify-between">
            <span>Docket Vector Specifications</span>
            <span className="text-dim-grey">// POST /api/predict</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Case Type */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                1. Case Category (Litigation Vector) *
              </label>
              <select
                value={formData.case_type}
                onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-hairline-light px-4 py-3 text-off-white font-mono text-sm focus:border-gold outline-none transition-colors"
                required
              >
                {CASE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Filing Court */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                2. Filing Jurisdiction / Court *
              </label>
              <select
                value={formData.filing_court}
                onChange={(e) => setFormData({ ...formData, filing_court: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-hairline-light px-4 py-3 text-off-white font-mono text-sm focus:border-gold outline-none transition-colors"
                required
              >
                {COURTS.map(court => (
                  <option key={court} value={court}>{court}</option>
                ))}
              </select>
            </div>

            {/* Current Stage */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                3. Current Procedural Milestone (Altitude) *
              </label>
              <select
                value={formData.current_stage}
                onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-hairline-light px-4 py-3 text-off-white font-mono text-sm focus:border-gold outline-none transition-colors"
                required
              >
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {/* Complexity Rating */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                4. Procedural Complexity Grade *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, complexity: level })}
                    className={`py-3 px-3 border font-mono text-xs uppercase tracking-wider transition-colors ${
                      formData.complexity === level
                        ? 'border-gold bg-gold/15 text-gold font-bold'
                        : 'border-hairline-light bg-[#0B0B0C] text-steel-grey hover:border-hairline'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Adjournments */}
            <div className="md:col-span-2 border border-hairline p-5 bg-[#0B0B0C]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
                  5. Adjournments Recorded (Procedural Turbulence Driver)
                </label>
                <div className={`px-2.5 py-0.5 border text-[10px] font-mono uppercase tracking-[0.12em] ${turbPreview.color}`}>
                  Preview: {turbPreview.label} ({formData.num_adjournments} postponements)
                </div>
              </div>

              <div className="flex items-center gap-5">
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={formData.num_adjournments}
                  onChange={(e) => setFormData({ ...formData, num_adjournments: Number(e.target.value) })}
                  className="flex-1 accent-[#C9A24B] cursor-pointer h-1.5 bg-hairline-light rounded-none"
                />
                <span className="font-display text-2xl text-gold font-bold w-10 text-right">
                  {formData.num_adjournments}
                </span>
              </div>
              <p className="font-body text-xs text-dim-grey mt-2">
                Each postponement correlates historically with ~2.8 months of additional court docket delay.
              </p>
            </div>

            {/* Filing Date */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                6. Filing Date (Departure Date)
              </label>
              <input
                type="date"
                value={formData.filing_date}
                onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-hairline-light px-4 py-3 text-off-white font-mono text-sm focus:border-gold outline-none transition-colors"
                required
              >
              </input>
            </div>

            {/* Petitioner / Respondent */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey mb-2">
                7. Parties to Dispute (Manifest)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Petitioner"
                  value={formData.petitioner}
                  onChange={(e) => setFormData({ ...formData, petitioner: e.target.value })}
                  className="w-full bg-[#0B0B0C] border border-hairline-light px-3 py-3 text-off-white font-mono text-xs focus:border-gold outline-none transition-colors"
                />
                <input
                  type="text"
                  placeholder="Respondent"
                  value={formData.respondent}
                  onChange={(e) => setFormData({ ...formData, respondent: e.target.value })}
                  className="w-full bg-[#0B0B0C] border border-hairline-light px-3 py-3 text-off-white font-mono text-xs focus:border-gold outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-stamp-red/60 bg-stamp-red/10 text-stamp-red font-mono text-xs">
              Error: {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-hairline">
            <span className="font-mono text-xs text-dim-grey">
              Engine will compute Euclidean distances against 1,565 candidate precedents.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gold hover:bg-off-white text-charcoal font-mono text-xs tracking-[0.14em] uppercase font-bold px-8 py-4 transition-colors duration-200 border border-gold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-charcoal animate-ping inline-block" />
                  Running k-NN Telemetry...
                </>
              ) : (
                <>
                  <span>Launch Telemetry &amp; Compute KNN</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ─── Telemetry Result Section ─────────────────────────────────── */}
        {result && (
          <div id="telemetry-result" className="pt-8 border-t-2 border-gold animate-fadeIn">
            {/* Status Announcement Bar */}
            <div className="mb-10 p-4 border border-gold/40 bg-gold/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse inline-block" />
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-gold font-bold">
                  Telemetry Stream Established // k-NN Search Complete
                </span>
              </div>
              <div className="font-mono text-xs text-steel-grey">
                Docket Ref: <span className="text-off-white font-bold">{result.case?.id || 'CUSTOM-INPUT'}</span>
              </div>
            </div>

            {/* Boarding Pass Result */}
            <div className="mb-16">
              <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gold inline-block" />
                Custom Litigation Manifest // Generated Card
              </div>
              <BoardingPass caseData={result.case} prediction={result.prediction} />
            </div>

            {/* Flight Tracker Hero */}
            <div className="relative border border-hairline overflow-hidden mb-16">
              <BackgroundVideo 
                src={result.prediction.delayRiskLevel === 'High' ? 'tracker-delayed' : 'tracker-ontime'} 
                overlayOpacity={0.82} 
                className="relative w-full min-h-[60vh]"
              >
                <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 flex flex-col justify-center bg-gradient-to-b from-charcoal/50 via-transparent to-charcoal/80">
                  <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold inline-block" />
                    Procedural Trajectory Stream // Active Flight Telemetry
                  </div>

                  <h2 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-6">
                    Currently cruising<br />over {result.case?.filing_court}
                  </h2>

                  {/* Flight Telemetry Badges */}
                  <div className="flex flex-wrap items-center gap-4 mb-10">
                    {/* Confidence */}
                    <div className="border border-hairline-light px-4 py-2.5 bg-charcoal/90 backdrop-blur-md">
                      <span className="font-mono text-[9px] text-steel-grey tracking-[0.14em] uppercase block">Calibrated Confidence</span>
                      <span className="font-display text-xl text-gold font-bold">{result.prediction.confidence}%</span>
                    </div>

                    {/* Turbulence */}
                    {result.prediction.turbulence && (
                      <div className={`border px-4 py-2.5 bg-charcoal/90 backdrop-blur-md ${result.prediction.turbulence.badgeColor}`}>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-80 block">Turbulence Status</span>
                        <span className="font-mono text-sm font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-ping" />
                          {result.prediction.turbulence.level} ({result.prediction.turbulence.score}/100)
                        </span>
                      </div>
                    )}

                    {/* Projected Likely Window */}
                    <div className="border border-hairline-light px-4 py-2.5 bg-charcoal/90 backdrop-blur-md">
                      <span className="font-mono text-[9px] text-steel-grey tracking-[0.14em] uppercase block">Likely Resolution (Median)</span>
                      <span className="font-mono text-sm text-off-white font-medium">
                        {result.prediction.etaRangeYears?.median} yrs ({formatDate(result.prediction.etaDateRange?.likely)})
                      </span>
                    </div>
                  </div>

                  {/* Airplane Journey Timeline */}
                  <JourneyTimeline
                    currentStage={result.case?.current_stage}
                    filingDate={result.case?.filing_date}
                    prediction={result.prediction}
                  />
                </div>
              </BackgroundVideo>
            </div>

            {/* "Why This Estimate?" Factor Breakdown */}
            {result.prediction.whyFactors && result.prediction.whyFactors.length > 0 && (
              <div className="mb-16 bg-surface-dim border border-hairline p-6 md:p-10">
                <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold inline-block" />
                  Explainable AI // Why This Estimate?
                </div>
                <h3 className="font-display font-medium text-3xl md:text-4xl tracking-tight text-off-white mb-2">
                  {result.prediction.etaRangeYears?.median} years median resolution window.
                </h3>
                <p className="font-mono text-xs text-dim-grey mb-8 uppercase tracking-wider">
                  Weighted features across {result.prediction.matchedClusterSize} procedural precedents in cohort
                </p>

                <div className="space-y-0 border-t border-hairline">
                  {result.prediction.whyFactors.map((factor, fIdx) => (
                    <div key={fIdx} className="border-b border-hairline py-5 flex flex-col md:flex-row gap-4 md:gap-8">
                      <div className="md:w-[220px] flex-shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full inline-block ${
                            factor.impact === 'positive' ? 'bg-gold' :
                            factor.impact === 'negative' ? 'bg-stamp-red' :
                            'bg-dim-grey'
                          }`} />
                          <span className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                            factor.impact === 'positive' ? 'text-gold' :
                            factor.impact === 'negative' ? 'text-stamp-red' :
                            'text-steel-grey'
                          }`}>
                            {factor.impact === 'positive' ? 'Favorable' :
                             factor.impact === 'negative' ? 'Procedural Drag' :
                             'Baseline'}
                          </span>
                        </div>
                        <span className="font-display text-base text-off-white block font-medium">
                          {factor.title}
                        </span>
                        {factor.metric && (
                          <span className="font-mono text-xs text-dim-grey mt-0.5 block">
                            {factor.metric}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs md:text-sm text-dim-grey leading-relaxed flex-1">
                        {factor.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Range Bar */}
                <div className="mt-10 pt-6 border-t border-hairline">
                  <span className="font-mono text-[10px] text-gold uppercase tracking-[0.14em] block mb-4">
                    Resolution Range Spread (p25 – p75)
                  </span>
                  <div className="grid grid-cols-3 text-center border border-hairline divide-x divide-hairline max-w-xl">
                    <div className="p-3">
                      <span className="font-display text-2xl text-steel-grey block">{result.prediction.etaRangeYears?.p25} yrs</span>
                      <span className="font-mono text-[9px] text-dim-grey uppercase">25th Percentile</span>
                    </div>
                    <div className="p-3 bg-charcoal">
                      <span className="font-display text-3xl text-gold block font-bold">{result.prediction.etaRangeYears?.median} yrs</span>
                      <span className="font-mono text-[9px] text-gold uppercase font-bold">Median Likely</span>
                    </div>
                    <div className="p-3">
                      <span className="font-display text-2xl text-stamp-red block">{result.prediction.etaRangeYears?.p75} yrs</span>
                      <span className="font-mono text-[9px] text-dim-grey uppercase">75th Percentile</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Precedent Vectors (Similar Cases) */}
            <div className="border border-hairline p-6 md:p-10 bg-charcoal">
              <ClusterStats prediction={result.prediction} />
            </div>

            {/* Return to Top of Form Button */}
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gold/40 text-gold hover:bg-gold hover:text-charcoal font-mono text-xs uppercase tracking-[0.14em] transition-colors"
              >
                ↑ Adjust Parameters &amp; Re-Analyze
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
