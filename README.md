# RazorCartAI: Agentic AI E-Commerce Platform

**RazorCartAI** is an Agentic AI E-Commerce platform built for the **AI Growth & Agentic Commerce** hackathon track. It pairs a **Myntra-inspired frontend** with a **FastAPI + LangGraph multi-agent backend** powered by **Groq LLM** (`llama-3.3-70b-versatile`), a semantic vector search engine, Razorpay test mode payments, and an immutable real-time **Merchant Audit Ledger**.

---

## 🏆 Hackathon Alignment ("The Bar")
> *"Every money action explainable, bounded and gated. Show the audit trail and one failure handled gracefully."*

RazorCartAI meets and exceeds this bar:
1. **Explainable & Gated Money Actions**: All cart transactions, checkout payloads, and failure recoveries are logged into an immutable `AuditLedger` with clear reasoning and verification.
2. **Graceful Timeout Failure Recovery (Pillar 8)**: Intercepts Razorpay 504 gateway delays, issues a dynamic UPI QR, and locks the price for 15 minutes.
3. **Autonomous Cart Negotiation (Pillar 9)**: When a card declines due to insufficient funds, the agent automatically identifies negotiable low-priority items, offers 1-click cart pruning, and recalculates the total.
4. **Rating & Review-Weighted Discovery (Pillar 4 & 5)**: Evaluates high star ratings (4.5★+) and customer review volume (e.g. 275+ verified reviews) combined with seller city proximity for fast dispatch.

---

## 🌟 The 10 Core Pillars

| # | Pillar | Architecture & Features |
|---|---|---|
| 1 | **E-Commerce Base** | Full CRUD for products, categories, and shopping bag. Rich footwear/apparel catalog seeded with realistic Myntra-style imagery, star rating badges (`4.6 ★ \| 94`), and seller dispatch cities. |
| 2 | **Authentication & User Tracking** | JWT auth tracking customer location (`Bengaluru`, `Mumbai`, `Delhi`) and past search/view history. |
| 3 | **Zero-Query Personalization** | Computes a composite user vector embedding from past searches & viewed products, dynamically generating a personalized rail on login/homepage. |
| 4 | **AI Conversational Discovery** | LangGraph multi-agent engine powered by Groq LLM (`llama-3.3-70b-versatile`), extracting filters and performing semantic vector retrieval. |
| 5 | **Smart Rating & Review Ranking** | Multi-factor scoring formula: `Score = 0.40 * SemanticSim + 0.35 * RatingReviewScore + 0.25 * SellerCityBoost`. |
| 6 | **FBT Complementary Pairing** | Graph relationships mapping Frequently Bought Together items (cushioned running socks, sneaker cleaning kits, training bags) recommended at catalog pricing based on synergy. |
| 7 | **Conversational Checkout** | Generates Razorpay Orders & hosted links directly in chat. |
| 8 | **Graceful Payment Recovery (Timeouts)** | Intercepts HTTP 504 gateway timeouts -> issues instant Dynamic UPI QR and 15-minute price freeze guarantee. |
| 9 | **Cart Negotiation (Insufficient Funds)** | On budget limits or card declines, identifies lowest-priority accessory in bag and negotiates 1-click removal. |
| 10 | **Merchant Audit Ledger** | Immutable audit trail displaying AI-generated revenue, failure recovery ROI, and step-by-step decision logs. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS (Myntra design system & typography), Lucide Icons, Axios, Context API.
- **Backend**: FastAPI (Python 3.12), SQLAlchemy (SQLite/PostgreSQL), Scikit-Learn Vector Space / ChromaDB.
- **AI Orchestration**: LangGraph, LangChain, Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`).
- **Payments**: Razorpay Python SDK (Test Mode / Sandbox Simulator).

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend

# Configure Environment
cp .env.example .env
# Add your GROQ_API_KEY to .env (optional: fallback heuristic mode runs out-of-the-box)

# Run FastAPI Server
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install Dependencies
npm install

# Start Vite Dev Server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Demo & Chaos Center Controls

The floating widget in the bottom-left corner of the UI allows judges to trigger key capabilities instantly:
- **🏃 Priya (Bengaluru)** vs **👟 Rahul (Mumbai)**: Instantly swap persona to observe Zero-Query feed re-ranking based on composite interest vectors and seller city proximity.
- **⚡ Trigger 504 Timeout Recovery**: Demonstrates autonomous gateway failure interception, Dynamic UPI QR generation, and 15-minute price lock.
- **💳 Trigger Card Decline / Cart Pruning**: Demonstrates agentic cart negotiation by detecting low-priority accessories and recalculating budget total.
- **🛡️ Open Merchant Audit Ledger**: Opens the live dashboard showing revenue stats, recovery rate, and decision logs.
