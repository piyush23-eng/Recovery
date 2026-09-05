# Recovery — Autonomous AI Revenue Recovery Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-blue?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **A closed-loop, multi-agent autonomous revenue recovery platform built with FastAPI, LangGraph, and a Mercury/Ramp-adjacent fintech SaaS design system.**

---

## 📑 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [The Core Problem & Why Now](#-the-core-problem--why-now)
3. [System Architecture & Finite State Machine](#-system-architecture--finite-state-machine)
4. [The 6 Autonomous Recovery Agents](#-the-6-autonomous-recovery-agents)
5. [The 7 Deterministic Compliance Hard Gates](#-the-7-deterministic-compliance-hard-gates)
6. [Interactive Live Ops & Sandbox Features](#-interactive-live-ops--sandbox-features)
7. [Financial Reconciliation & Benchmark Metrics](#-financial-reconciliation--benchmark-metrics)
8. [Project Structure](#-project-structure)
9. [Installation & Quickstart Guide](#-installation--quickstart-guide)
10. [Test Suite & Formal Verification](#-test-suite--formal-verification)
11. [API & WebSocket Reference](#-api--websocket-reference)

---

## 📌 Executive Summary

**Recovery** addresses the single biggest source of silent financial leakage in modern commerce: failed payments, dropped checkout carts, recurring mandate degradation, and overdue commercial receivables.

Rather than relying on unguided chatbots or dumb notification blasts that spam customers and trigger regulatory penalties, Recovery implements a **deterministic 6-stage finite state machine**:
- Ingests raw risk events across 4 distinct financial vectors.
- Performs root-cause failure classification with confidence scoring.
- Formulates localized, bounded interventions (Hinglish voice scripts, WhatsApp 1-tap UPI deep links, mandate updates).
- **Evaluates 7 deterministic statutory stopping rules BEFORE executing any action**.
- Simulates bounded action execution with per-message unit-economics tracking.
- Appends every decision to a tamper-evident, cryptographic SHA-256 audit ledger verifiable via REST API and exportable to CSV.

---

## 🔍 What's Real vs Simulated in This Build

To ensure complete engineering transparency and rigorous technical integrity, here is a precise breakdown of what is fully implemented in code versus what is modeled in simulation:

| Component / Layer | Status | Implementation Details |
| :--- | :--- | :--- |
| **Agent Pipeline & State Machine** | **REAL** | Compiled LangGraph `StateGraph` with explicit nodes and conditional edge routing (`add_conditional_edges`) around compliance vetoes and async webhook awaiting. |
| **Persistence & State Recovery** | **REAL** | SQLite database (`recovery.db`) storing cases, audit log, and idempotency keys; full state survives server process restarts and laptop sleep. |
| **Compliance Hard Gates** | **REAL** | 7 deterministic Python evaluation rules executed *before* any action dispatch; vetoes strictly halt execution with zero bypasses. |
| **Tamper-Evident Audit Ledger** | **REAL** | Append-only plain `INSERT` cryptographic SHA-256 hash-chaining across all audit entries from genesis (`0`*64) to head; verifiable via `GET /api/audit-log/verify`. |
| **API Security & Idempotency** | **REAL** | `X-API-Key` verification across all mutating/sensitive endpoints + SQLite-backed `event_id`, unique `payment_reference`, and `Idempotency-Key` guards. |
| **WebSocket Synchronization Hub** | **REAL** | Full bidirectional asynchronous broadcast engine emitting sub-millisecond trace payloads to React UI. |
| **Recovery Outcomes & Reconciliation** | **HYBRID** | **Batch Path**: Calibrated probabilistic simulation evaluated deterministically with `seed=42`.<br>**Webhook Path**: Real asynchronous HTTP callback endpoint (`POST /api/cases/{case_id}/respond`) with state conflict rejection and amount validation. |
| **Channel Dispatch (WhatsApp/Voice/API)** | **SIMULATED** | Structured payload synthesis, localized Hinglish copy, and per-message unit-economics tracking (no live third-party API keys required). |

---

## 🚀 Production Roadmap

While this build is fully functional with compiled LangGraph agents, SQLite persistence, and cryptographic audit proofs, moving from a buildathon prototype to multi-tenant enterprise production involves specific architectural scaling:

1. **External Immutable Audit Anchoring**:
   * *Current Build*: The SHA-256 audit hash-chain is stored in SQLite and cryptographically verified in memory via `GET /api/audit-log/verify`.
   * *Production Target*: Anchor periodic Merkle root checkpoints to external immutable storage (e.g. AWS S3 Object Lock in WORM compliance mode, or public RFC 3161 timestamping authorities) so the audit trail survives not only process restarts but also host-level infrastructure compromise.

2. **Live Payment Settlement & Multi-Gateway Reconciliation**:
   * *Current Build*: Webhook payloads are processed with schema and amount validation, but are not yet verified against cryptographic provider signatures (e.g. Razorpay's `X-Razorpay-Signature` HMAC-SHA256 scheme).
   * *Production Target*: A production integration would reject any callback that does not verify against the provider's shared webhook secret, connect directly to live payment gateway webhooks (Razorpay, Cashfree, Stripe, PayU), and perform end-of-day nodal account reconciliation against settlement batch files (MT940/CAMT.053) rather than inferring outcomes from simulation models.

3. **Multi-Tenant Authentication & Scoped RBAC**:
   * *Current Build*: Authenticates mutating endpoints via a shared `X-API-Key` header with dynamic demo session generation or environment variable configuration.
   * *Production Target*: Implement per-merchant OAuth 2.0 / JWT multi-tenant isolation, granular endpoint-level permissions (`recovery:write`, `audit:read`, `compliance:admin`), and KMS-managed API credential rotation.

---

## ⚡ The Core Problem & Why Now

Revenue loss rarely occurs in one clean step. It degrades progressively:
- A card authorization times out at the issuing bank switch.
- A consumer switches apps during 2FA and abandons the cart.
- A recurring UPI AutoPay mandate fails due to balance timing.
- An enterprise B2B invoice past Net-30 terms sits dormant with an unaddressed contract dispute.

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│ Payment Timeout │ ──> │ Cart Drop-off       │ ──> │ Failed Mandate       │ ──> │ Overdue B2B Invoice  │
│ (Gateway Error) │     │ (Intent Loss)       │     │ (Recurring Churn)    │     │ (Receivables Aging)  │
└─────────────────┘     └─────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

### Why Existing Solutions Fail:
1. **Rule-Based Notification Spammers**: Blast generic SMS/WhatsApp messages without diagnosing why the transaction failed, violating TRAI DND regulations and annoying high-LTV users.
2. **Siloed Gateway Smart Retries**: Built-in gateway retries (Stripe/Razorpay) operate as black boxes limited to card re-attempts. They cannot negotiate B2B installment tranches or orchestrate cross-rail WhatsApp nudges.
3. **Passive Manual Collections**: Finance teams manually review aging buckets weeks after default, by which time recovery probability drops by over 60%.

---

## 🏗️ System Architecture & Finite State Machine

Recovery enforces a strict, canonical lifecycle for every detected risk event:

$$\text{DETECTED} \longrightarrow \text{DIAGNOSING} \longrightarrow \text{STRATEGY\_SELECTED} \longrightarrow \text{COMPLIANCE\_CHECK} \longrightarrow \text{ACTION\_EXECUTED} \longrightarrow \text{AWAITING\_RESPONSE} \longrightarrow \{\text{RECOVERED} \mid \text{RETRY} \mid \text{ESCALATED} \mid \text{STOPPED}\}$$

### Architectural Diagram

```
                             [ RAW FINANCIAL RISK EVENT ]
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │  01. SIGNAL INGESTION AGENT         │
                       │  - Ingests 4 distinct risk vectors  │
                       │  - Validates Pydantic schema        │
                       └─────────────────────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │  02. ROOT CAUSE DIAGNOSIS AGENT     │
                       │  - Classifies 7 failure causes      │
                       │  - Multi-factor confidence scoring  │
                       └─────────────────────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │  03. STRATEGY SELECTION AGENT       │
                       │  - Formulates bounded interventions │
                       │  - Generates Hinglish copy / script │
                       └─────────────────────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │  04. COMPLIANCE GUARDRAIL (GATE)    │
                       │  - Evaluates 7 deterministic rules  │
                       │  - Can VETO / HALT unconditionally  │
                       └─────────────────────────────────────┘
                                   │              │
                   [ If Gate PASSED ]            [ If Gate VETOED ]
                           │                              │
                           ▼                              ▼
        ┌─────────────────────────────────────┐   ┌────────────────────────────────┐
        │  05. BOUNDED EXECUTION AGENT        │   │  CASE STATE: STOPPED           │
        │  - Gateway Retries / WhatsApp CTAs  │   │  - Reason logged to Audit Log  │
        │  - Unit economics spend tracking    │   │  - Zero customer contact       │
        └─────────────────────────────────────┘   └────────────────────────────────┘
                           │                              │
                           ▼                              ▼
        ┌──────────────────────────────────────────────────────────────────────────┐
        │  06. OUTCOME & AUDIT AGENT                                               │
        │  - Reconciles cash recovery to global ledger                             │
        │  - Appends tamper-evident audit record exportable to CSV                 │
        └──────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 The 6 Autonomous Recovery Agents

| # | Agent Name | Primary Responsibility | Input Artifact | Output Artifact |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Signal Ingestion Agent** | Ingests webhook payloads from payment gateways, cart drop detectors, subscription engines, and ERP systems; normalizes into standardized schemas. | Webhook JSON / Event Signal | `RiskEvent` |
| **02** | **Root Cause Diagnosis Agent** | Classifies failure reasons into 7 taxonomy buckets with confidence scores and evidentiary reasoning. | `RiskEvent` | `Diagnosis` |
| **03** | **Strategy Selection Agent** | Maps diagnosis to optimal recovery channels (WhatsApp, Voice, Smart Retry, PTP Tranches) and generates localized Hinglish/English copy. | `RiskEvent`, `Diagnosis` | `InterventionPlan` |
| **04** | **Compliance Guardrail Agent** | **The Hard Gate**: Deterministically evaluates 7 statutory and economic stopping rules before any touchpoint occurs. | `Case`, `InterventionPlan` | `ComplianceResult` |
| **05** | **Execution Agent** | Dispatches bounded actions, records gateway responses, and calculates cumulative communication expenditure. | `Case`, `ComplianceResult` | `ActionResult` |
| **06** | **Outcome & Audit Agent** | Reconciles recovered cash into the global ledger, updates the funnel, and writes immutable records to the audit trail. | `Case`, `ActionResult` | `AuditEntry`, `LedgerStats` |

---

## 🛡️ The 7 Deterministic Compliance Hard Gates

To reflect standard regulatory frameworks and consumer protection norms (such as TRAI consumer preferences, quiet hours, consent management, and card network retry policies), the Compliance Agent operates as a **hard deterministic gate** (not an unguided LLM prompt). If any rule is triggered, the action is unconditionally vetoed:

```
                                  [ INTERVENTION PLAN ]
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
    ┌───────────────────────┐                                 ┌───────────────────────┐
    │ 1. TRAI DND Registry  │ ──> [ MATCHED ] ──> VETO        │ 5. Opt-Out STOP Reply │ ──> [ KEYWORD ] ──> VETO
    └───────────────────────┘                                 └───────────────────────┘
               ▼                                                         ▼
    ┌───────────────────────┐                                 ┌───────────────────────┐
    │ 2. Quiet Hours        │ ──> [ 21:00-09:00 ] ──> VETO    │ 6. High-Value B2B     │ ──> [ >₹50k & DISP ] ──> ESCALATE
    └───────────────────────┘                                 └───────────────────────┘
               ▼                                                         ▼
    ┌───────────────────────┐                                 ┌───────────────────────┐
    │ 3. 24h Contact Cap    │ ──> [ ≥ 2 TOUCHES ] ──> VETO    │ 7. Cost-Aware Stop    │ ──> [ >15% VALUE ] ──> VETO
    └───────────────────────┘                                 └───────────────────────┘
               ▼                                                         ▼
    ┌───────────────────────┐                                 ┌───────────────────────┐
    │ 4. Network Retry Cap  │ ──> [ ≥ 3 RETRIES ] ──> VETO    │ ALL 7 POLICIES PASS   │ ──> APPROVED FOR EXECUTION
    └───────────────────────┘                                 └───────────────────────┘
```

> **Note on Regulatory Modeling**: The rules below are modeled after major consumer protection and payments frameworks for demonstration purposes. They represent configurable business policy logic and have not been certified against official statutory texts.

1. **TRAI National DND Registry Check (`DND_CONSENT_CHECK`)**:
   - *Design Rationale*: Aligned with TRAI's National DND / consumer preference framework for commercial communications. Suppresses outbound messages if customer phone number is registered on DND without active opt-in consent.
2. **Quiet Hours Enforcement (`QUIET_HOURS`)**:
   - *Design Rationale*: Aligned with regional commercial communication timing guidelines. Enforces strict prohibition on direct customer communications between **9:00 PM and 9:00 AM** in customer local time (`Asia/Kolkata`).
3. **Contact Frequency Cap (`CONTACT_FREQUENCY_CAP`)**:
   - *Design Rationale*: Aligned with consumer fair communication and anti-harassment principles. Restricts outbound customer touches to **at most 2 touchpoints per 24 hours** across all channels combined.
4. **Card Gateway Retry Cap (`RETRY_CAP`)**:
   - *Design Rationale*: Aligned with card network auto-retry frequency conventions and exponential backoff standards. Limits automated gateway retries to a maximum of **3 attempts** (1h, 6h, 24h backoff).
5. **Immediate Opt-Out & STOP Honoring (`OPT_OUT_HONORING`)**:
   - *Design Rationale*: Aligned with consent management and data protection opt-out principles (DPDP Act / global privacy frameworks). Any customer reply containing "STOP", unsubscribe, or revocation keywords permanently halts the case with zero subsequent touches.
6. **High-Value B2B Dispute Escalation (`B2B_HIGH_VALUE_ESCALATION`)**:
   - *Design Rationale*: Commercial credit risk policy. Disputed B2B invoices exceeding **₹50,000** overdue for 5+ days are immediately halted from automated contact and escalated to Senior Credit Desks.
7. **Economic Cost-to-Recovery Stop (`COST_AWARE_STOP`)**:
   - *Design Rationale*: Algorithmic recovery unit-economics boundary. Terminates recovery workflows if cumulative communication & gateway fees exceed **15%** of the amount at risk.

---

## 🖥️ Interactive Live Ops & Sandbox Features

The user interface follows a light, glassmorphic fintech SaaS design language (Mercury/Ramp-adjacent: `#FAFAF8` background, `#FFFFFF` cards, `#ECECE8` hairline borders, diagonal hatch textures):

1. **Live Scenario Injector Modal (`InjectCaseModal.tsx`)**:
   - Allows judges to inject custom failure events on the fly with one-click presets (`TRAI DND Suppression`, `Late-Night Quiet Hours`, `High-Value B2B Dispute`, `Bank Timeout Retry`, `STOP Opt-Out`).
   - Runs the event live across all 6 LangGraph agents and immediately opens the Case Drawer.
2. **Compliance Policy Simulation Report (`AttestationModal.tsx`)**:
   - Internal compliance simulation report summarizing guardrail policy enforcement with complete audit trail export to CSV (includes prominent demonstration disclaimer).
3. **Natural Language AI Exploration Bar (`Overview.tsx`)**:
   - Interactive prompt bar allowing users to ask questions like *"Why did carts drop?"* or *"Show B2B disputes"*, delivering dynamic diagnosis cards.
4. **Slide-Over Case Drawer (`CaseDrawer.tsx`)**:
   - 4-tab slide-over with state progression timeline, compliance check details, simulated WhatsApp thread with UPI intent CTAs, and **Hinglish AI Voice Player with native browser speech synthesis**.
5. **Interactive Compliance Sandbox (`Compliance.tsx`)**:
   - Configurable sliders for local time, 24h contacts, DND flag, and B2B disputes with instant deterministic gate verdicts.
6. **Channel Unit Economics & Annual ROI Simulator (`Analytics.tsx`)**:
   - Multi-channel cost/conversion comparison and dynamic annual ROI calculator with volume and recovery rate sliders.
7. **Append-Only Immutable Audit Log (`AuditLog.tsx`)**:
   - Search, status filtering, expandable structured JSON payloads, and direct CSV export (`/api/audit-log/export`).
8. **Interactive Date Range Picker (`DateRangePicker.tsx`)**:
   - 7 presets (`Today`, `7d`, `30d`, `MTD`, `Oct 1–31, 2026`, `Q3 2026`, `YTD`), custom calendar ranges, and comparison periods.

---

## 📊 Financial Reconciliation & Benchmark Metrics

> **Reproducibility Guarantee**: Results are deterministic given `seed=42`; unseeded runs will vary by simulation design.

### Baseline Results across 300-Case Calibrated Batch:

$$\text{Recovery Rate} = \frac{\text{₹}17,25,547.85}{\text{₹}33,41,754.18} \times 100 = 51.6\%$$

$$\text{Net Profit Recovered} = \text{₹}17,25,547.85 - \text{₹}196.10 = \text{₹}17,25,351.75$$

$$\text{Net Recovery ROI Multiplier} = \frac{\text{₹}17,25,547.85}{\text{₹}196.10} = 8,799.3\times$$

```
┌──────────────────────────────────────┬────────────────────────────────┐
│ Metric Dimension                     │ Audited Value                  │
├──────────────────────────────────────┼────────────────────────────────┤
│ Total Revenue at Risk                │ ₹33,41,754.18 (300 cases)      │
│ Total Gross Revenue Recovered        │ ₹17,25,547.85 (51.6% rate)     │
│ Total Channel Operational Cost       │ ₹196.10 (WhatsApp + Voice + SMS)│
│ Net Revenue Recovered                │ ₹17,25,351.75                  │
│ Net ROI Multiplier                   │ 8,799.3x per ₹1 spend          │
│ Compliance Hard Stops Enforced       │ 45 Vetoes (Zero infractions)   │
│ Cryptographic Audit Entries          │ 1,755 SHA-256 chained records  │
│ Audit Chain Verification             │ PASSED (Unbroken from genesis) │
└──────────────────────────────────────┴────────────────────────────────┘
```

---

## 📁 Project Structure

```
ai-revenue-recovery/
├── backend/
│   ├── agents/
│   │   ├── signal_ingestion.py        # Normalizes 4 event types
│   │   ├── root_cause_diagnosis.py    # Classifies 7 failure causes
│   │   ├── strategy_selection.py      # Formulates WhatsApp / Voice / Retry actions
│   │   ├── compliance_guardrail.py    # Evaluates 7 deterministic hard gates
│   │   ├── execution_agent.py         # Dispatches bounded actions & tracks cost
│   │   └── outcome_audit_agent.py     # Updates ledger & writes audit entries
│   ├── engine/
│   │   ├── batch_runner.py            # WebSocket simulation & case injection engine
│   │   ├── dataset_generator.py       # 300-case calibrated dataset generator
│   │   └── state_graph.py             # LangGraph state machine workflow
│   ├── main.py                        # FastAPI endpoints, WebSockets, CSV export
│   ├── models.py                      # Pydantic schemas (RiskEvent, Case, AuditEntry, hash chain)
│   ├── test_compliance_hard_gates.py  # Strict 7-gate compliance test suite
│   ├── test_pipeline.py               # End-to-end LangGraph StateGraph pipeline test
│   ├── test_audit_hash_chain.py       # Cryptographic SHA-256 hash-chain verification test
│   ├── test_reproducibility.py        # 100% deterministic reproducibility test suite
│   └── requirements.txt               # Backend dependencies (fastapi, langgraph, pytest, etc.)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttestationModal.tsx   # Compliance policy simulation report
│   │   │   ├── CaseDrawer.tsx         # Slide-over drawer with WhatsApp & Voice Player
│   │   │   ├── DateRangePicker.tsx    # Popover date range picker with 7 presets
│   │   │   ├── HatchPattern.tsx       # Scalable SVG diagonal hatch pattern defs
│   │   │   ├── Header.tsx             # Brand header, navigation, and batch controls
│   │   │   ├── InjectCaseModal.tsx    # Live custom failure scenario injector
│   │   │   ├── KeyboardShortcutsModal.tsx # Shortcuts modal (Space, S, 1-6, I, ?)
│   │   │   └── Toast.tsx              # Tactical feedback toast notifications
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts        # Zero-flicker WebSocket synchronization hook
│   │   ├── pages/
│   │   │   ├── Analytics.tsx          # Waterfall chart, channel economics, ROI simulator
│   │   │   ├── AuditLog.tsx           # Searchable audit ledger with CSV download
│   │   │   ├── Cases.tsx              # Searchable, filterable cases data table
│   │   │   ├── Compliance.tsx         # Interactive guardrail test sandbox
│   │   │   ├── LiveOps.tsx            # 6-node LangGraph flow map & live traces
│   │   │   └── Overview.tsx           # 5-step conversion funnel & AI query bar
│   │   ├── types.ts                   # TypeScript interfaces
│   │   └── utils/
│   │       └── formatters.ts          # INR currency & semantic badge formatters
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated GitHub Actions CI test & build pipeline
├── DEMO_SCRIPT.md                     # 2-minute judge demo & pitch script
├── ARCHITECTURE.md                    # Deep-dive architectural specification
├── API_REFERENCE.md                   # REST and WebSocket API documentation
└── README.md
```

---

## 🚀 Installation & Quickstart Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18.0+
- **npm** or **pnpm**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/piyush23-eng/Recovery.git
cd Recovery
```

---

### Step 2: Backend Setup (FastAPI + LangGraph)
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs at: `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)*

---

### Step 3: Frontend Setup (React + Vite + Tailwind)
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev -- --host 0.0.0.0 --port 3000
```
*Frontend runs at: `http://localhost:3000`*

---

## 🧪 Test Suite & Formal Verification

Run the automated Python test suite to verify pipeline integrity, compliance rules, and cryptographic audit hash-chaining:

```bash
# 1. Run all tests with pytest
pytest backend/

# 2. Run compliance hard gate verification (tests all 7 stopping rules)
python backend/test_compliance_hard_gates.py

# 3. Run end-to-end LangGraph pipeline test (50-case batch)
python backend/test_pipeline.py

# 4. Run cryptographic SHA-256 hash-chain verification & tamper detection
python backend/test_audit_hash_chain.py

# 5. Run 300-case batch reproducibility test (guarantees identical deterministic metrics)
python backend/test_reproducibility.py

# 6. Verify frontend production build
cd frontend && npm run build
```

---

## 📡 API & WebSocket Reference

### Key REST Endpoints
- `GET /api/health` — Health check & active batch state
- `GET /api/stats` — Real-time ledger statistics & financial totals
- `GET /api/cases` — Paginated, filtered case records (`status`, `event_type`, `search`)
- `GET /api/cases/{case_id}` — Detailed state machine history & audit trail for a case
- `POST /api/cases/{case_id}/respond` — Asynchronous webhook endpoint to resolve case response live
- `GET /api/audit-log` — Immutable append-only audit trail
- `GET /api/audit-log/verify` — Cryptographic SHA-256 tamper-evidence verification of full audit chain
- `GET /api/audit-log/export` — Download complete audit ledger as `.csv` (with SHA-256 signatures)
- `POST /api/cases/inject` — Ingest & execute an ad-hoc custom failure scenario live (supports `Idempotency-Key`)
- `POST /api/simulation/start` — Start / resume batch processing
- `POST /api/simulation/pause` — Pause batch processing
- `POST /api/simulation/step` — Process exactly 1 case step-by-step
- `POST /api/simulation/run-instant` — Execute remaining cases instantly (100x speed)
- `POST /api/simulation/reset` — Reset dataset to 300 calibrated cases (`seed=42`)

### Live WebSocket Stream (`ws://localhost:8000/ws`)
- `INITIAL_SYNC` — Full snapshot of ledger stats, recent cases, and traces upon connection
- `TRACE_EMITTED` — Real-time reasoning payload emitted by an agent node
- `CASE_UPDATED` — State change notification for an individual case
- `STATS_UPDATED` — Recalculated financial totals and funnel conversion counts
- `SIMULATION_STATE` — Play/pause/speed synchronization across clients

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
