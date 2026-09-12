<div align="center">

# ✈️ CourtFlight
### Track your case. Like a flight.

**Bitn Build 2026 — GDG Goa × PCCE**



</div>

<br>

<div align="center">

## 🚨 4.76 Cr+ cases pending across India.
### Every citizen gets the same answer: **"Pending."** No ETA. No context. No visibility.

</div>

<br>

## 💡 The Idea

CourtFlight turns a court case into a **flight tracker**. Enter a case ID → get a live ETA, a delay-risk level, and a plain-English "why" — computed by matching your case against 1,565 modeled historical dockets, not a hardcoded guess.

| Legal Reality | CourtFlight |
|---|---|
| Filing → Appellate court | Departure → Destination airport |
| 7 procedural stages | Flight waypoints |
| Predicted disposal date | ETA (p25 / median / p75) |
| Adjournments | Delays & turbulence |
| Case summary | Downloadable Boarding Pass |

## 🧠 How It's Predicted

**33-D feature vector → K-Means cluster match → nearest disposed precedents → percentile ETA → confidence score.**

No black box: every prediction returns 5 human-readable reasons, and confidence drops honestly when precedent match is weak.

## 🖥️ What's Live

Radar landing with real-time search · downloadable Boarding Pass · 7-stage journey timeline with delay ledger · fleet-wide trajectory analytics · filterable dockets registry · a public prediction API (`GET /api/predict?id=...`) — **no login required, try it now.**

## 🏗️ Tech Stack

**Next.js 14 · Tailwind CSS · zero-database JSON architecture · K-Means clustering · Vercel**

| Dhiraj Reddy | Brijesh Khanolkar |
|---|---|
| ML & Backend — clustering, prediction engine, API | Frontend & Design — UI, boarding pass, timeline |

## 🚀 Run Locally

```bash
git clone <repo-url> && cd courtflight
npm install && npm run dev   # → localhost:3000
```

## 📈 What's Next

Live eCourts/NJDG data · WhatsApp delay alerts · regional languages · lawyer dashboard.

*Historical similarity informs a range — it doesn't guarantee an outcome.*

---

<div align="center">

**Because knowing when your case lands shouldn't take a lawyer to figure out.**

</div>
