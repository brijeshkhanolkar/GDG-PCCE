<div align="center">

# ✈️ CourtFlight
### Track your case. Like a flight.

**A flight-tracker for India's 5+ crore pending court cases.**
Built in 48 hours at **Bitn Build**, GDG Goa × PCCE.

🔗 **[Live Demo](#)** · 🎥 **[Demo Video](#)** · 📊 **[Pitch Deck](#)**

</div>

---

## 🚨 The Problem

India has **5.02 crore+ pending court cases**. Litigants have no idea:
- When their case will actually be resolved
- Whether it's delayed compared to similar cases
- What stage comes next, and how long it usually takes

We call this **pendency opacity** — it's confusing, opaque, and it affects millions of people with zero legal background.

## 💡 The Solution

**CourtFlight** turns a court case into something everyone already understands: **a flight tracker.**

| Legal Reality | CourtFlight |
|---|---|
| Filing & appellate court | Departure & destination airport |
| 7 procedural stages | Flight waypoints |
| Predicted disposal date | ETA (p25 / median / p75) |
| Adjournments | Delays & turbulence |
| Case summary | Downloadable Boarding Pass |

Enter a case ID → get a live ETA, a risk level, and a plain-English explanation of *why* — backed by real machine learning on historical case outcomes, not a hardcoded guess.

---

## 🧠 How It Works (the ML, in 30 seconds)

1. Every case → **33-dimensional feature vector** (type, court, jurisdiction, age, adjournments, stage)
2. **K-Means++ clustering** groups similar cases into cohorts
3. **Weighted k-NN (k=15)** finds the closest *disposed* precedent cases
4. ETA = **real percentile outcomes** (p25 / median / p75) from those neighbors — not a fake number
5. **Confidence score** shrinks automatically when precedent match is weak — no fake "99% accurate" claims
6. Every prediction ships with **5 human-readable "why" factors**

✅ Verified by a **52/52 passing automated test suite** (`node scripts/test-predict.js`)

---

## 🖥️ What's Built

- **Landing Radar** — live pendency ticker + case search
- **Case Boarding Pass** — a luxury, downloadable PNG ticket for any case
- **Journey Timeline** — 7-stage animated progress tracker with delay ledger
- **Trajectory Analytics** — fleet-wide bottleneck & court efficiency stats
- **Dockets Registry** — searchable, filterable table of 1,565+ cases
- **Live Prediction API** — `GET/POST /api/predict`, try it yourself:

```bash
GET /api/predict?id=NYR-00001
```
```json
{ "etaRangeYears": { "p25": 3.9, "median": 4.1, "p75": 5.1 },
  "delayRiskLevel": "High", "confidence": 55 }
```

---

## 🏗️ Tech Stack

**Next.js 14** (App Router) · **Tailwind CSS** · **html-to-image** (PNG export) · **Zero-database architecture** — 1,565+ case records precomputed to static JSON, deployed 100% serverless on Vercel Edge for instant, cost-free demos.

---

## 🚀 Run It Locally

```bash
git clone <repo-url> && cd courtflight
npm install
node scripts/test-predict.js   # verify the ML engine
npm run dev                    # → http://localhost:3000
```
Requires Node.js 18.17+ or 20+. No login/auth required — everything is open to try.

---

## 🎨 Design

A custom dark, gold-accented "Sovereign Juris" theme — circular stamp seals instead of status pills, editorial typography, cinematic video moments — built to feel authoritative, like a justice-system product should.

---

## 🔮 What's Next

Real NJDG/eCourts data integration · WhatsApp delay alerts · regional language support · a lawyer-facing bulk dashboard.

---

## 👥 Team

| Name | Role |
|---|---|
| *Your Name* | Full-stack / ML |
| *Teammate* | Frontend / Design |
| *Teammate* | Data / Backend |

<div align="center">

**Because knowing when your case lands shouldn't take a lawyer to figure out.**

</div>
