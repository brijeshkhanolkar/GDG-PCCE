# ✈️ CourtFlight — Judicial Telemetry & Case Trajectory Engine

> **"Track your case. Like a flight."**  
> A flight-tracker UI and predictive telemetry platform for the Indian judiciary, transforming 5+ crore (50 million+) pending legal cases into transparent, predictable, and mathematically explainable flight plans.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Core Concept & Flight Metaphors](#-core-concept--flight-metaphors)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Mathematical & Machine Learning Foundations](#-mathematical--machine-learning-foundations)
   - [33-Dimensional Feature Vector Space](#1-33-dimensional-feature-vector-space)
   - [Unsupervised K-Means++ Clustering Engine](#2-unsupervised-k-means-clustering-engine)
   - [Multi-Dimensional Weighted k-NN Engine](#3-multi-dimensional-weighted-k-nn-engine)
   - [Procedural Turbulence Index](#4-procedural-turbulence-index)
   - [Calibrated Confidence Scoring](#5-calibrated-confidence-scoring)
   - [Feature-Level Explainability ("Why This Estimate?")](#6-feature-level-explainability-why-this-estimate)
5. [Complete Screen & Feature Breakdown](#-complete-screen--feature-breakdown)
   - [Screen 1: Radar Landing (`/`)](#screen-1-radar-landing-)
   - [Screen 2: Case Telemetry & Boarding Pass (`/case/[id]`)](#screen-2-case-telemetry--boarding-pass-caseid)
   - [Screen 3: Judicial Trajectory Analytics (`/trajectory`)](#screen-3-judicial-trajectory-analytics-trajectory)
   - [Screen 4: Active Dockets Registry (`/dockets`)](#screen-4-active-dockets-registry-dockets)
   - [Screen 5: System Manifest & Dataset Spec (`/manifest`)](#screen-5-system-manifest--dataset-spec-manifest)
   - [Screen 6: Serverless Prediction API (`/api/predict`)](#screen-6-serverless-prediction-api-apipredict)
6. [Data Model & Synthetic eCourts Archive](#-data-model--synthetic-ecourts-archive)
7. [Visual Design System: Sovereign Juris](#-visual-design-system-sovereign-juris)
8. [Automated Test Suite (52/52 Passing)](#-automated-test-suite-5252-passing)
9. [Project Directory Structure](#-project-directory-structure)
10. [Getting Started & Local Setup](#-getting-started--local-setup)
11. [Deployment & Production Build](#-deployment--production-build)

---

## 🌟 Project Overview

The Indian judicial system faces a systemic challenge with over **5.02 crore (50.2 million) pending cases** across District Courts, High Courts, and the Supreme Court. Litigants, attorneys, and enterprises frequently experience "pendency opacity" — having zero empirical visibility into:
- When a matter is likely to conclude
- Whether their case is progressing on schedule or experiencing abnormal delay
- How many adjournments are typical for their specific case type and court jurisdiction
- What procedural bottlenecks lie ahead in subsequent stages

**CourtFlight** solves this crisis by translating procedural legal milestones into intuitive, real-time aviation telemetry. Rather than treating court cases as static, intimidating legal documents, CourtFlight treats each case like a commercial flight navigating through airspace, providing:
- **Estimated Time of Arrival (ETA)** computed from thousands of historical outcomes
- **Flight plans** mapping exact milestones from *Filing* to *Final Disposition*
- **Weather and procedural delay warnings** formatted like airport departure delays
- **Live Boarding Passes** capturing critical docket metadata with downloadable PNG exports

---

## 🛫 Core Concept & Flight Metaphors

| Court Litigation Concept | CourtFlight Aviation Metaphor | Telemetry Display |
| :--- | :--- | :--- |
| **Case Filing & Jurisdiction** | **Flight Origin & Departure Port** | 3-letter IATA-style court code (`BOM`, `DEL`, `TEL`) |
| **Anticipated Final Court** | **Destination Airport / Landing Port** | Projected final appellate jurisdiction |
| **Procedural Stages (7 Stages)** | **Flight Milestones & Waypoints** | Filed ➔ Notice ➔ Written Statement ➔ Evidence ➔ Arguments ➔ Reserved ➔ Disposed |
| **Disposal Prediction Window** | **Estimated Time of Arrival (ETA)** | $p_{25}$ (Accelerated), Median (Expected), $p_{75}$ (Extended) |
| **Court Adjournments** | **Flight Delays & Holding Patterns** | Adjournment drag telemetry with root-cause logging |
| **Adjournment Velocity & Volatility** | **In-Flight Turbulence Level** | Smooth Air, Light, Moderate, Severe Turbulence |
| **Litigation Record / Case Summary** | **Official Boarding Pass** | Perforated tear-stub ticket with gold foil edge |
| **Case Status Indicator** | **Aeronautical Seal / Departure Stamp** | Circular gold stamp (On Time), red seal (Delayed), gold check (Disposed) |

---

## 🛠️ System Architecture & Tech Stack

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                     COURTFLIGHT                        │
                                  │                  Next.js 14 App Router                 │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                    │                                         │                                        │
                    ▼                                         ▼                                        ▼
    ┌───────────────────────────────┐         ┌───────────────────────────────┐        ┌───────────────────────────────┐
    │          CLIENT UI            │         │        SERVER COMPONENT       │        │        SERVERLESS API         │
    │  • Tailwind CSS               │         │        INFERENCE ENGINE       │        │   GET /api/predict?id=...     │
    │  • Space Grotesk (Headlines)  │◄────────┤  • predictEta.js              │◄───────┤   GET /api/predict?q=...      │
    │  • Inter (Body & Data)        │         │  • Multi-Dimensional k-NN     │        │   POST /api/predict (Custom)  │
    │  • html-to-image (PNG Export) │         │  • K-Means++ Precomputed Stats│        └───────────────────────────────┘
    │  • Cinematic Background Videos│         └───────────────┬───────────────┘
    └───────────────────────────────┘                         │
                                                              ▼
                                              ┌───────────────────────────────┐
                                              │     STATIC DATA ARCHIVE       │
                                              │  • cases.json (1,565+ dockets)│
                                              │  • cluster-stats.json         │
                                              │  • 10 Benchmark SC cases      │
                                              └───────────────────────────────┘
```

- **Framework**: [Next.js 14](https://nextjs.org/) using the App Router with React Server Components (`RSC`) for zero-latency server-side rendering and static page optimization.
- **Styling**: Vanilla [Tailwind CSS](https://tailwindcss.com/) with a curated sovereign luxury theme (no generic rounded SaaS cards).
- **Typography**: 
  - Display/Headings: `Space Grotesk` (tight letter spacing, confident editorial brutalism).
  - Body/Data: `Inter` & tabular monospace for numerical telemetry.
- **Client-Side Media & Generation**:
  - `html-to-image`: Client-side rasterization of the official Boarding Pass into high-resolution PNG downloads.
  - HTML5 Video with hardware acceleration, `playsInline`, `muted`, `autoPlay`, and `prefers-reduced-motion` fallbacks.
- **Zero-Database Architecture**:
  - 1,565+ case records committed in `/data/cases.json`.
  - Zero external database latency (no MongoDB, PostgreSQL, or Redis required).
  - Instant serverless execution compatible with 100% Vercel Edge/Serverless environments.

---

## 🔬 Mathematical & Machine Learning Foundations

Unlike naive rule-based applications that output arbitrary or hardcoded dates, CourtFlight uses an unsupervised and distance-based machine learning pipeline.

### 1. 33-Dimensional Feature Vector Space

Every case in the archive is transformed into a normalized 33-dimensional coordinate point $x \in \mathbb{R}^{33}$:

$$\mathbf{x} = \Big[ \mathbf{v}_{\text{type}} \;\Vert\; \mathbf{v}_{\text{court}} \;\Vert\; \mathbf{v}_{\text{jurisdiction}} \;\Vert\; \hat{a} \;\Vert\; \hat{j} \;\Vert\; \hat{s} \Big]$$

- **Case Types (6 Dimensions, One-Hot)**: Civil Suit, Commercial Dispute, Criminal Appeal, Family/Divorce, Property Dispute, Service Matter.
- **Filing Courts (12 Dimensions, One-Hot)**: Bombay High Court, Delhi High Court, Calcutta High Court, Madras High Court, Allahabad High Court, Telangana High Court, Karnataka High Court, Gujarat High Court, etc.
- **Jurisdictions (12 Dimensions, One-Hot)**: Maharashtra, Delhi, West Bengal, Tamil Nadu, Uttar Pradesh, Telangana, Karnataka, Gujarat, etc.
- **Normalized Case Age ($\hat{a} \in [0, 1]$)**: Min-max scaled case duration:
  $$\hat{a} = \frac{\text{age} - \text{minAge}}{\text{maxAge} - \text{minAge}}$$
- **Normalized Adjournments ($\hat{j} \in [0, 1]$)**: Min-max scaled adjournment count:
  $$\hat{j} = \frac{\text{adjs} - \text{minAdj}}{\text{maxAdj} - \text{minAdj}}$$
- **Ordinal Procedural Stage ($\hat{s} \in [0, 1]$)**: Position along the 7 procedural milestones ($0.0$ for `Filed` to $1.0$ for `Disposed`).

---

### 2. Unsupervised K-Means++ Clustering Engine

- Precomputed via `scripts/build-clusters.js` across the historical case archive.
- Executed with **$k=10$ clusters** using K-Means++ centroid initialization with 5 random restarts to avoid local minima.
- Yielded the minimum Within-Cluster Sum of Squares ($\text{WCSS} = 2396.12$), pre-cached in `/data/cluster-stats.json`.

---

### 3. Multi-Dimensional Weighted k-NN Engine

When evaluating an active case $\mathbf{x}_{\text{input}}$, CourtFlight computes the weighted Euclidean feature distance to all candidate disposed cases $\mathbf{c} \in \mathcal{C}_{\text{disposed}}$:

$$D(\mathbf{x}, \mathbf{c}) = \sqrt{ \sum_{i=1}^{33} w_i \, (x_i - c_i)^2 }$$

Where weights $w_i$ prioritize:
- Exact case type alignment ($w_{\text{type}} = 2.4$)
- Same filing court and jurisdiction tier ($w_{\text{court}} = 1.8$)
- Adjournment velocity and stage maturity ($w_{\text{stage}} = 1.4$)

#### Empirical Percentile Extraction
From the top $k=15$ nearest historical neighbors, the distribution of actual historical years-to-disposal is extracted:
- **$p_{25}$ (Accelerated Scenario)**: 25th percentile of historical neighbor resolution times.
- **$\text{Median}$ (Expected Trajectory)**: 50th percentile resolution time.
- **$p_{75}$ (Extended Litigation Window)**: 75th percentile resolution time.

Projected calendar dates are derived deterministically:
$$\text{ETA}_{\text{likely}} = \text{FilingDate} + \text{Median(years)}$$

---

### 4. Procedural Turbulence Index

CourtFlight evaluates procedural friction by comparing the case's adjournment count $A_{\text{case}}$ against its cohort baseline $\mu_A$:

$$\Delta_A = A_{\text{case}} - \mu_A$$

| Turbulence Level | Criteria | Visual Accent | Telemetry Meaning |
| :--- | :--- | :--- | :--- |
| **Smooth Air** | $\Delta_A \le -1.0$ | Gold (`#C9A24B`) | Case progressing faster than 75% of similar dockets. |
| **Light Turbulence** | $-1.0 < \Delta_A \le 1.0$ | Off-White (`#F5F3EE`) | Case tracking within normal standard deviation. |
| **Moderate Turbulence** | $1.0 < \Delta_A \le 3.5$ | Amber / Gold-Light | Case encountering repeated hearing deferrals. |
| **Severe Turbulence** | $\Delta_A > 3.5$ | Stamp-Red (`#8C3B34`) | High adjournment drag; critical risk of timeline escalation. |

---

### 5. Calibrated Confidence Scoring

Rather than displaying a static, arbitrary 99% accuracy claim, CourtFlight calculates a mathematically calibrated confidence score:

$$\text{Confidence} = f\big(\text{Neighborhood Density}, \overline{D}_{\text{topK}}, \text{IQR}(p_{75} - p_{25})\big)$$

- **Dense clusters with low variance**: Confidence up to **85%–95%**.
- **Outlier matters with high IQR spread**: Confidence responsibly down-calibrated to **40%–55%**.

---

### 6. Feature-Level Explainability ("Why This Estimate?")

Every prediction returns 5 human-readable explainability factors directly tied to mathematical coordinates:
1. **Precedent Baseline**: Baseline years for closest disposed cases in the matched High Court.
2. **Adjournment Drag**: Exact quantified impact of hearings deferred compared to the cohort average.
3. **Flight Altitude & Stage**: Milestone velocity and percentage of procedural flight path remaining.
4. **Complexity Rating**: Impact of multi-party evidence and jurisdictional seniority.
5. **Precedent Match Quality**: Similarity score (60% to 99%) of the single closest historical precedent case.

---

## 🖥️ Complete Screen & Feature Breakdown

### Screen 1: Radar Landing (`/`)
- **Cinematic Atmospheric Hero**: Looping video background (`hero-loop.mp4`) with noise vignette and radial gradient.
- **Live National Pendency Ticker (`NationalPendingCounter.jsx`)**: Displays real-time ticking counter formatted in Indian numbering (`5,02,34,275 pending cases across India`) with live fluctuation and settling animations.
- **Universal Docket Radar (`SearchBar.jsx`)**: Search input supporting instant case number queries (`NYR-00001`, `PUB-SC-2018-001294`, `CNR-MH-2021-004821`) with autocomplete suggestions and keyboard navigation.
- **Radar Telemetry Readout**: Live session indicator, active targets, and total docket counter.
- **Live Departure Board (`CaseListRow.jsx`)**: Clean flight-board listing of featured cases spanning on-time, delayed, high-adjournment, and landed states. Each row displays docket ID, litigant preview, court, case type, and circular status seal.

---

### Screen 2: Case Telemetry & Boarding Pass (`/case/[id]`)

#### Section A: Official Litigation Boarding Pass (`BoardingPass.jsx`)
- **Luxury Sovereign Styling**: Deep charcoal ticket (`#111114`) with a warm metallic gold foil accent edge (`border-l-4 border-l-gold border-gold/40`).
- **Ambient Gold Sheen**: Looping video overlay (`boardingpass-shine.mp4`) contained within the card at `mix-blend-screen opacity-15`.
- **Perforated Ticket Stub**: Physical ticket aesthetics with dashed perforation line and semicircular top & bottom notch cutouts (`w-6 h-6`).
- **Litigant Banner**: Prominent petitioner vs respondent names separated by a classical italic gold `"v."`.
- **Flight Route Vector**: Filing Court airport code (`TEL`, `BOM`, `DEL`) connected to Predicted Final Court airport code via a gold flight path with airplane icon and elapsed time.
- **4 Standard Labeled Fields**:
  - Filing Court
  - Predicted Final Court (switches to "Disposal Court" when landed)
  - Current Stage with live pulsating radar dot
  - Filing Date (or Disposed Date)
- **Bottom Details**: Understated case type tag with thin underline and authentic procedural barcode.
- **Ticket Stub**: Passenger name, target resolution window, and circular status stamp seal.
- **High-Resolution PNG Download**: One-click download exporting a clean, high-resolution PNG image for legal teams and litigants.

#### Section B: Tracker Hero & Journey Timeline (`JourneyTimeline.jsx`)
- **State-Reactive Background Video**: Automatically switches background video based on case state:
  - `tracker-landed.mp4` when disposed
  - `tracker-delayed.mp4` when delay risk is High
  - `tracker-ontime.mp4` when on track
- **High-Contrast Video Overlay**: Engineered with `overlayOpacity={0.82}` and gradient scrims so video motion provides depth without compromising readability.
- **Frosted Milestone Panels**: Each stage milestone is encased in a frosted dark container (`bg-charcoal/95 backdrop-blur-xl border border-hairline/80 shadow-2xl`), eliminating glare from bright video elements (such as the 3D paper airplane).
- **7-Stage Procedural Progression**:
  1. *Filed*
  2. *Notice Issued*
  3. *Written Statement Filed*
  4. *Evidence Stage*
  5. *Arguments*
  6. *Judgment Reserved*
  7. *Disposed*
- **Central Telemetry Spine**: 2px vertical gold spine with central milestone badges, pulsating active nodes, and completed milestones.
- **Milestone Duration Comparison**: Two-bar comparative visual displaying the time your case has spent at the active stage versus the cluster average.

#### Section C: "Why This Estimate?" Explainability
- Modular grid of 5 dynamic factor cards with impact indicators (`positive`, `neutral`, `negative`), quantified metrics, and clear legal rationales.
- Calibrated confidence readout with model metadata.

#### Section D: Delay Report & Trajectory Variance (`DelayReportRow.jsx`)
- Adjournment ledger rendering each hearing postponement as a clean, spacious row with date, reason, and stage at time.
- Thin gold hairline dividers without table/card clutter.
- Dynamic editorial sentence comparing this case's delay trajectory to the broader cluster.

#### Section E: Precedent Vectors & Cluster Insight (`ClusterStats.jsx`)
- Contained `cluster-ambient.mp4` video background.
- Big-number cluster size display (e.g., `1,565 similar cases analyzed`).
- Three-column statistical distribution: 25th Percentile ($p_{25}$), Median Duration, and 75th Percentile ($p_{75}$).
- Precedent dockets table displaying the 5 nearest historical cases with calculated similarity scores (60% to 99%), courts, and durations.

---

### Screen 3: Judicial Trajectory Analytics (`/trajectory`)
- Fleet-wide analytics across Indian High Courts.
- Procedural milestone bottleneck analysis with average months spent at each stage.
- Comparative duration benchmarks by case type (Commercial vs Criminal vs Property vs Family).
- Court efficiency ratings highlighting High Court throughput and procedural velocities.

---

### Screen 4: Active Dockets Registry (`/dockets`)
- Filterable registry table housing all 1,565+ dockets.
- Multi-dimensional filters: Filter by stage, case type, jurisdiction, and complexity level.
- Live search input matching IDs, court names, and litigant names.
- Clean pagination with departure-style row layouts and status seals.

---

### Screen 5: System Manifest & Dataset Spec (`/manifest`)
- System specifications and data architecture summary.
- Global statistics: Total records, active cases, disposed cases, and overall disposal rate.
- Adjournment intelligence: Total adjournments, average per case, and maximum outlier records.
- Case complexity distribution breakdown (Low, Medium, High).

---

### Screen 6: Serverless Prediction API (`/api/predict`)

#### 1. GET by Case ID
```http
GET /api/predict?id=NYR-00001
```
**Response:**
```json
{
  "case": {
    "id": "NYR-00001",
    "case_type": "Criminal",
    "filing_court": "Delhi High Court",
    "jurisdiction": "Delhi",
    "current_stage": "Evidence Stage",
    "num_adjournments": 7
  },
  "prediction": {
    "method": "knn",
    "k": 15,
    "matchedClusterSize": 277,
    "etaRangeYears": { "p25": 3.9, "median": 4.1, "p75": 5.1 },
    "etaDateRange": {
      "earliest": "2029-07-08",
      "likely": "2029-09-17",
      "latest": "2030-09-19"
    },
    "delayRiskLevel": "High",
    "confidence": 55,
    "turbulence": {
      "level": "Moderate Turbulence",
      "score": 68
    },
    "whyFactors": [ ... ],
    "similarCases": [ ... ]
  }
}
```

#### 2. GET Search by Query
```http
GET /api/predict?q=criminal
```

#### 3. POST for Custom Case Prediction
```http
POST /api/predict
Content-Type: application/json

{
  "case_type": "Commercial",
  "filing_court": "Bombay High Court",
  "num_adjournments": 2,
  "current_stage": "Arguments"
}
```

---

## 📊 Data Model & Synthetic eCourts Archive

The data archive (`/data/cases.json`) contains **1,565+ records** modeled on National Judicial Data Grid (NJDG) pendency characteristics:
- **Realistic Statistical Shape**: Time-to-disposal is heavily right-skewed (median 2–6 years with a long tail extending past 10+ years).
- **Realistic Pendency Ratio**: ~70% active matters, ~30% disposed matters.
- **Correlated Variance**: Adjournments correlate naturally with case age and court volume.
- **Landmark Precedents**: 10 public benchmark cases (`PUB-SC-...`) modeled on real Supreme Court of India precedents.

```typescript
interface CaseDocket {
  id: string;                    // e.g. "NYR-00001" or "PUB-SC-2018-001294"
  case_type: string;             // Criminal, Family, Property, Service, Civil, Commercial
  filing_court: string;          // e.g. "Delhi High Court", "Bombay High Court"
  predicted_final_court: string; // e.g. "Delhi High Court", "Supreme Court of India"
  jurisdiction: string;          // State jurisdiction (Delhi, Maharashtra, etc.)
  filing_date: string;           // ISO date
  current_stage: string;         // Filed, Notice Issued, Written Statement Filed, Evidence Stage, Arguments, Judgment Reserved, Disposed
  disposal_date: string | null;  // ISO date if disposed, else null
  num_adjournments: number;      // Realistic distribution (0 to 20+)
  adjournment_reasons: Array<{
    date: string;
    reason: string;
    stage_at_time: string;
  }>;
  parties: {
    petitioner: string;
    respondent: string;
  };
  complexity: 'Low' | 'Medium' | 'High';
  days_elapsed: number;
  total_duration_days: number;
}
```

---

## 🎨 Visual Design System: Sovereign Juris

CourtFlight rejects generic SaaS templates (white cards, multi-color badges, and generic shadows) in favor of **Sovereign Juris** — an aesthetic of editorial brutalism and cinematic minimalism.

```
Palette:
  Charcoal (Base):        #0B0B0C   (Deep near-black foundation)
  Surface Dim:            #111114   (Card and panel backgrounds)
  Surface High:           #1E1E22   (Elevated headers and borders)
  Warm Metallic Gold:     #C9A24B   (Hero accents, status seals, primary metrics)
  Light Gold:             #EBC166   (Secondary highlights and ping indicators)
  Steel Grey:             #8E8E93   (Labels, dates, and auxiliary metadata)
  Dim Grey:               #6B6B6E   (Dividers and low-priority tags)
  Stamp Red:              #8C3B34   (Delay accents and high-risk seals)
  Off-White:              #F5F3EE   (Primary readable text)
```

- **Seals Over Pills**: Case status is communicated via circular stamp seals (`StatusSeal.jsx`), never rounded badge pills.
- **Cinematic Atmospheric Restraint**: Exactly one video moment per screen with dark overlays, keeping typography crisp and readable.
- **Accessibility & Reduced Motion**: Automatically pauses background videos and substitutes clean dark gradient posters when `prefers-reduced-motion` is active.

---

## 🧪 Automated Test Suite (52/52 Passing)

CourtFlight includes a comprehensive standalone test harness in `scripts/test-predict.js`:

```bash
node scripts/test-predict.js
```

### Test Results Breakdown
```
━━━ Test 1: Basic prediction (NYR-00001) ━━━
  ✓ Case NYR-00001 exists
  ✓ Prediction returned
  ✓ Method: knn
  ✓ p25 = 3.9 yrs
  ✓ median = 4.1 yrs
  ✓ p75 >= median: 5.1 >= 4.1
  ✓ Confidence: 55%
  ✓ Why factors: 5 reasons
  ✓ Risk: High
  ✓ Similar cases: 5

━━━ Test 2: All 6 case types produce predictions ━━━
  ✓ Found a Criminal case: NYR-00001 (median=4.1yr, conf=55%)
  ✓ Found a Family case: NYR-00002 (median=3.2yr, conf=81%)
  ✓ Found a Property case: NYR-00004 (median=5.4yr, conf=53%)
  ✓ Found a Service case: NYR-00005 (median=4.3yr, conf=54%)
  ✓ Found a Civil case: NYR-00006 (median=5.2yr, conf=82%)
  ✓ Found a Commercial case: NYR-00010 (median=3.6yr, conf=80%)

━━━ Test 3: High adjournments → High risk ━━━
  ✓ NYR-00015 (9 adj) → Risk: High
  ✓ Has "Adjournment Drag" explanation
  ✓ Adjournment impact: negative

━━━ Test 4: Low adjournments → Low risk ━━━
  ✓ NYR-00003 (0 adj) → Risk: Low

━━━ Test 5: Disposed case handling ━━━
  ✓ Disposed case NYR-00002 gets prediction (Median: 3.2 yrs)

━━━ Test 6: Edge cases ━━━
  ✓ null input → null
  ✓ undefined input → null

━━━ Test 7: Custom case prediction ━━━
  ✓ Custom case gets prediction (Confidence: 53%, 5 Why factors)

━━━ Test 8: Search ━━━
  ✓ "NYR-000" → 5 results
  ✓ First result: NYR-00001
  ✓ "criminal" → 3 results

━━━ Test 9: Confidence varies appropriately ━━━
  ✓ Delhi HC case: confidence=48%

━━━ Test 10: "Why" factors quality ━━━
  ✓ Precedent Baseline factor present
  ✓ Adjournment Drag factor present
  ✓ Flight Altitude & Stage factor present
  ✓ High Complexity Rating factor present
  ✓ Precedent Match Quality factor present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results: 52 passed, 0 failed out of 52 assertions (100%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📁 Project Directory Structure

```
d:/GDGPCCE/courtflight/
├── app/
│   ├── api/
│   │   └── predict/
│   │       └── route.js              # GET & POST prediction endpoint
│   ├── case/
│   │   └── [id]/
│   │       └── page.js               # Case detail page (Boarding Pass, Hero, Timeline, Why?, Clusters)
│   ├── dockets/
│   │   └── page.js                   # Registry table with multi-filter controls
│   ├── manifest/
│   │   └── page.js                   # System architecture & dataset manifest
│   ├── trajectory/
│   │   └── page.js                   # High Court fleet-wide trajectory analytics
│   ├── globals.css                   # Sovereign Juris design tokens & timeline CSS
│   ├── layout.js                     # Root layout with Space Grotesk & Inter font configuration
│   ├── not-found.js                  # Sovereign not-found screen
│   └── page.js                       # Landing radar page with departure feed
├── components/
│   ├── BackgroundVideo.jsx           # Hardware-accelerated video background with fallback
│   ├── BoardingPass.jsx              # Dark luxury boarding pass with perforated tear-stub & PNG download
│   ├── CaseListRow.jsx               # Departure-board style case item
│   ├── ClusterStats.jsx              # Percentile visualization & precedent vectors table
│   ├── DelayReportRow.jsx            # Adjournment timeline entry
│   ├── GlossaryTerm.jsx              # Interactive legal terms with tooltip explainers
│   ├── JourneyTimeline.jsx           # Frosted 7-stage trajectory timeline with milestone cards
│   ├── NationalPendingCounter.jsx    # Live animated Indian pendency ticker (5+ Crore)
│   ├── SearchBar.jsx                 # Universal docket search bar with autocomplete
│   ├── StatusSeal.jsx                # Circular stamp status seal (On Time, Delayed, Landed)
│   └── WhyEtaBreakdown.jsx           # Feature-level explainability factor cards
├── data/
│   ├── cases.json                    # 1,565+ synthetic & benchmark case dockets
│   └── cluster-stats.json            # Precomputed K-Means++ centroids and WCSS metrics
├── lib/
│   ├── legalGlossary.js              # Indian legal terms dictionary
│   └── predictEta.js                 # Multi-dimensional k-NN prediction engine & confidence logic
├── public/
│   └── assets/
│       ├── boardingpass-shine.mp4    # Contained boarding pass metallic sheen
│       ├── cluster-ambient.mp4       # Precedent section ambient video
│       ├── hero-loop.mp4             # Landing page background loop
│       ├── tracker-delayed.mp4       # High delay risk background loop
│       ├── tracker-landed.mp4        # Disposed docket background loop
│       └── tracker-ontime.mp4        # On-time flight path background loop
├── scripts/
│   ├── build-clusters.js             # 33D feature vectorizer & K-Means++ training script
│   ├── generate-cases.js             # Synthetic case generator modeled on NJDG statistics
│   ├── generate_word_report.py       # Python script generating CourtFlight Architecture Word Report (.docx)
│   └── test-predict.js               # 52-assertion automated test suite
├── CourtFlight_Clustering_Architecture_Report.docx # Formatted Word architecture report
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18.17+ or v20+
- npm, pnpm, or yarn
- Python 3.9+ (optional, only needed if regenerating the Word document report)

### 1. Clone & Install Dependencies
```bash
cd courtflight
npm install
```

### 2. Run Standalone Test Suite
Verify the prediction engine and k-NN logic before starting the server:
```bash
node scripts/test-predict.js
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment & Production Build

CourtFlight is optimized for zero-configuration deployment on [Vercel](https://vercel.com/):

```bash
npm run build
npm run start
```

### Production Route Verification
```
Route (app)                              Size     First Load JS
┌ ○ /                                    3.55 kB        99.6 kB
├ ○ /_not-found                          138 B          87.4 kB
├ ƒ /api/predict                         0 B                0 B
├ ƒ /case/[id]                           7.58 kB         104 kB
├ ○ /dockets                             98.5 kB         195 kB
├ ○ /manifest                            179 B          96.2 kB
└ ○ /trajectory                          179 B          96.2 kB
+ First Load JS shared by all            87.3 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 📜 Architectural Word Report

To generate the comprehensive architecture document [`CourtFlight_Clustering_Architecture_Report.docx`](file:///d:/GDGPCCE/CourtFlight_Clustering_Architecture_Report.docx):
```bash
python scripts/generate_word_report.py
```
This produces a document detailing vector coordinates, centroid distributions, distance formulas, and live docket traces.

---

*Built with precision for the Indian judiciary. Designed with Sovereign Juris.*
