# API & Protocol Reference: Recovery

This document provides complete documentation for the REST API and real-time WebSocket interfaces provided by the Recovery platform.

---

## 1. REST Endpoints

Base URL: `http://localhost:8000`

### Health & Statistics

#### `GET /api/health`
Returns the status of the engine and active simulation counters.
```json
{
  "status": "healthy",
  "engine": "active",
  "processed_cases": 184,
  "total_dataset_size": 300
}
```

#### `GET /api/stats`
Returns the aggregated financial ledger metrics and funnel counts.
**Response Schema**: `LedgerStats`
```json
{
  "total_cases": 300,
  "processed_cases": 184,
  "revenue_at_risk": 1892450.00,
  "revenue_recovered": 1098400.00,
  "recovery_rate_pct": 58.0,
  "total_cost_incurred": 108.40,
  "net_revenue_recovered": 1098291.60,
  "roi_multiplier": 101.3,
  "compliance_stops_count": 26,
  "escalated_count": 5,
  "retry_count": 18,
  "funnel": {
    "detected": 184,
    "diagnosed": 184,
    "contacted": 158,
    "responded": 108,
    "promised": 108,
    "recovered": 108
  },
  "veto_reasons": {
    "DND_CONSENT_CHECK": 14,
    "QUIET_HOURS": 8,
    "CONTACT_FREQUENCY_CAP": 4
  }
}
```

---

### Case Management

#### `GET /api/cases`
Returns paginated case records with optional multi-attribute filtering.
**Query Parameters**:
- `page` (int, default: 1): Page number.
- `limit` (int, default: 50, max: 1000): Items per page.
- `status` (string, optional): Filter by `CaseStateEnum` (`RECOVERED`, `STOPPED`, `ESCALATED`, `RETRY`).
- `event_type` (string, optional): Filter by `RiskEventType` (`payment_failed`, `checkout_abandoned`, etc.).
- `search` (string, optional): Substring search across case ID, customer name, customer ID, or diagnosis cause.

#### `GET /api/cases/{case_id}`
Returns complete detail, history progression, compliance checks, and audit entries for a specific case.

#### `POST /api/cases/inject`
Allows external systems or judges to inject an ad-hoc custom failure event live.
**Request Body**:
```json
{
  "customer_name": "Zomato Media Logistics",
  "customer_segment": "ENTERPRISE",
  "event_type": "invoice_overdue",
  "amount": 85000.00,
  "channel_pref": "whatsapp",
  "language_pref": "hinglish",
  "dnd_flag": false,
  "local_hour": 15,
  "prior_contact_count_24h": 0,
  "retry_count": 0,
  "is_disputed": true,
  "days_overdue": 7,
  "replied_stop": false
}
```
**Response**:
```json
{
  "message": "Case ingested and processed across all 6 agents",
  "case_id": "CASE-9FA812",
  "case": { ... }
}
```

#### `POST /api/cases/{case_id}/respond`
Asynchronously reconciles a customer payment callback or webhook response for a case in `AWAITING_RESPONSE`.
**Request Body**:
```json
{
  "outcome": "PAID",
  "notes": "Razorpay webhook callback: captured",
  "payment_reference": "pay_98a7sd89f7"
}
```
**Response**:
```json
{
  "message": "Case CASE-1042 successfully reconciled with outcome: PAID",
  "case_id": "CASE-1042",
  "state": "RECOVERED",
  "recovered_amount": 1499.00,
  "case": { ... }
}
```

---

### Audit & Compliance

#### `GET /api/audit-log`
Returns paginated append-only immutable audit ledger entries.
**Query Parameters**:
- `page` (int, default: 1)
- `limit` (int, default: 100, max: 2000)
- `status` (string, optional): `PASSED`, `BLOCKED`, `EXECUTED`, `RECOVERED`
- `agent` (string, optional): Filter by agent name

#### `GET /api/audit-log/verify`
Cryptographically verifies the append-only SHA-256 hash chain from the genesis block (`0000...0000`) to the latest head entry.
**Response**:
```json
{
  "verified": true,
  "total_entries": 1755,
  "genesis_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "chain_head": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "tampered": false,
  "message": "Cryptographic verification passed: All 1755 audit entries form an unbroken, tamper-evident SHA-256 chain."
}
```

#### `GET /api/audit-log/export`
Streams the complete audit trail as a downloadable `compliance_audit_ledger.csv` file with cryptographic SHA-256 signatures.

---

### Simulation & Playback Controls

- `POST /api/simulation/start` — Starts or resumes asynchronous batch processing.
- `POST /api/simulation/pause` — Pauses batch processing.
- `POST /api/simulation/step` — Steps exactly 1 case forward.
- `POST /api/simulation/speed` — Sets speed multiplier (`{"speed": 5.0}`).
- `POST /api/simulation/run-instant` — Executes remaining cases with zero delay (100x speed).
- `POST /api/simulation/reset` — Resets dataset to calibrated cases (`{"count": 300}`).

---

## 2. WebSocket Streaming Protocol (`ws://localhost:8000/ws`)

### Message Envelope Structure
All WebSocket messages sent by the server follow this envelope format:
```json
{
  "type": "MESSAGE_TYPE",
  "data": { ... }
}
```

### Event Types:

1. **`INITIAL_SYNC`**:
   Sent immediately upon connection to initialize the frontend dashboard.
   ```json
   {
     "type": "INITIAL_SYNC",
     "data": {
       "stats": { ... },
       "cases": [ ... ],
       "traces": [ ... ],
       "simulation_status": { "is_running": false, "speed": 1.0, ... }
     }
   }
   ```

2. **`TRACE_EMITTED`**:
   Broadcast whenever an individual agent node completes a reasoning step.
   ```json
   {
     "type": "TRACE_EMITTED",
     "data": {
       "trace_id": "TRC-8F92A1B0",
       "case_id": "CASE-1042",
       "agent": "Compliance Guardrail",
       "step_name": "COMPLIANCE_EVALUATED",
       "timestamp": "2026-09-05T21:40:02.124Z",
       "reasoning": "Compliance Gate: VETOED [BLOCKED]. National DND Registry match (simulated)...",
       "payload": { "allowed": false, "blocked_checks": [ ... ] },
       "status_badge": "VETOED"
     }
   }
   ```

3. **`CASE_UPDATED`**:
   Broadcast whenever a case transitions to a new state.

4. **`STATS_UPDATED`**:
   Broadcast whenever financial totals, funnel counts, or veto statistics are recalculated.

5. **`SIMULATION_STATE`**:
   Broadcast when playback status (`is_running`, `is_paused`, `speed`) changes.
