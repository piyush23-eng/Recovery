# Technical Architecture Specification: Recovery

This document outlines the detailed system architecture, state machine specification, concurrency model, data contracts, and compliance enforcement mechanisms implemented in **Recovery**.

---

## 1. Architectural Philosophy

Recovery is designed around four core engineering principles:

1. **Closed-Loop Autonomy**: The system does not merely detect or summarize revenue at risk; it deterministically transitions each case from signal detection to cash reconciliation without human bottlenecking on standard flows.
2. **Pre-Execution Hard Gates**: Safety and compliance rules are decoupled from generative model outputs and implemented as deterministic Python gate checks. An LLM cannot bypass a deterministic compliance veto.
3. **Append-Only Tamper Evidence**: Every state transition, reasoning step, compliance verdict, and simulated dispatch writes an immutable `AuditEntry` record.
4. **Resilient Real-Time Synchronization**: Bidirectional state synchronization via WebSockets ensures that the client dashboard reflects sub-millisecond agent reasoning traces with zero polling or screen flickering.

---

## 2. Canonical Finite State Machine

Every detected financial risk event undergoes state transitions according to the state machine defined in [`models.py`](./backend/models.py):

```
                   ┌───────────────┐
                   │   DETECTED    │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  DIAGNOSING   │
                   └───────┬───────┘
                           │
                           ▼
                   ┌────────────────────────┐
                   │   STRATEGY_SELECTED    │
                   └───────┬────────────────┘
                           │
                           ▼
                   ┌────────────────────────┐
                   │    COMPLIANCE_CHECK    │
                   └───────┬────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
  [ Gate PASSED ]                     [ Gate VETOED ]
         │                                   │
         ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐
│ ACTION_EXECUTED  │               │     STOPPED      │
└────────┬─────────┘               └──────────────────┘
         │
         ▼
┌──────────────────┐
│AWAITING_RESPONSE │
└────────┬─────────┘
         │
 ┌───────┼───────────────────────┐
 │       │                       │
 ▼       ▼                       ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ RECOVERED │ │   RETRY   │ │ ESCALATED │
└───────────┘ └───────────┘ └───────────┘
```

### State Definitions:
- **`DETECTED`**: Raw event ingested, validated, and normalized into `RiskEvent`.
- **`DIAGNOSING`**: Root cause classified with evidentiary confidence scoring.
- **`STRATEGY_SELECTED`**: Targeted intervention synthesized (channel, copy, timing, cost).
- **`COMPLIANCE_CHECK`**: All 7 hard gates evaluated. If any rule triggers a veto, transitions to `STOPPED`.
- **`ACTION_EXECUTED`**: Bounded action dispatched (API retry, WhatsApp template, voice call).
- **`AWAITING_RESPONSE`**: Waiting for customer payment completion or gateway callback.
- **`RECOVERED`**: Cash collected and reconciled into the global recovered ledger.
- **`RETRY`**: Transient failure queued for exponential backoff retry.
- **`ESCALATED`**: High-value dispute or complex debt transferred to human credit desk.
- **`STOPPED`**: Workflow permanently halted due to compliance veto or opt-out revocation.

---

## 3. The 6-Agent LangGraph Node Implementations

### Node 1: Signal Ingestion Agent
- **File**: `backend/agents/signal_ingestion.py`
- **Function**: `ingest_signal(raw_event: Dict[str, Any]) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - Validates required fields (`customer_id`, `amount`, `event_type`).
  - Sets initial `cumulative_cost = 0.0`.
  - Normalizes timezone timestamps and local hours.

### Node 2: Root Cause Diagnosis Agent
- **File**: `backend/agents/root_cause_diagnosis.py`
- **Function**: `diagnose_root_cause(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - Evaluates decline codes (`E91_ISSUER_TIMEOUT`, `E04_EXPIRED_CARD`, `E51_INSUFFICIENT_FUNDS`).
  - Distinguishes high-intent cart abandonment from price sensitivity based on cart dwell time and checkout step.
  - Flags commercial B2B contract disputes based on invoice metadata.

### Node 3: Strategy Selection Agent
- **File**: `backend/agents/strategy_selection.py`
- **Function**: `select_strategy(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - Dynamically picks channel: WhatsApp Business API (standard retail), Voice Agent (high-LTV carts & subscriptions), Smart Retry (bank timeouts), Human Escalation (disputed B2B >₹50k).
  - Formulates localized copy in Hinglish, Hindi, or English.
  - Computes estimated unit communication cost.

### Node 4: Compliance Guardrail Agent (Hard Gate)
- **File**: `backend/agents/compliance_guardrail.py`
- **Function**: `evaluate_compliance_guardrails(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - Iterates through all 7 deterministic policies.
  - Appends detailed check objects with regulatory design rationales and simulation checks.
  - If any check returns `ComplianceRuleStatus.BLOCKED`, sets `allowed = False` and constructs an explicit veto reason.

### Node 5: Execution Agent
- **File**: `backend/agents/execution_agent.py`
- **Function**: `execute_recovery_action(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - If compliance vetoed, sets `action_result.status = "VETOED_BY_COMPLIANCE"` and terminates.
  - Otherwise, records action payload, increments `case.cumulative_cost`, and transitions to `ACTION_EXECUTED`.

### Node 6: Outcome & Audit Agent
- **File**: `backend/agents/outcome_audit_agent.py`
- **Function**: `audit_and_reconcile_outcome(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]`
- **Logic**:
  - Evaluates simulated outcome based on calibrated probability distributions.
  - Sets final state (`RECOVERED`, `RETRY`, `ESCALATED`, or `STOPPED`).
  - Writes the final immutable audit ledger entry.

---

## 4. Concurrency & Synchronization Model

```
┌──────────────────────────────────────────────────────────┐
│                   BatchSimulationRunner                  │
├──────────────────────────────────────────────────────────┤
│ - raw_dataset: List[Dict] (300 calibrated cases)        │
│ - cases: Dict[str, Case] (In-memory registry)            │
│ - audit_log: List[AuditEntry] (Append-only ledger)       │
│ - active_websockets: Set[WebSocket]                      │
│ - speed_multiplier: float (1.0x to 100.0x)               │
└────────────────────────────┬─────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   [ Asyncio Execution Loop ]    [ WebSocket Broadcast Hub ]
   - Step delay calculation      - TRACE_EMITTED
   - State transition updates    - CASE_UPDATED
   - Financial aggregation       - STATS_UPDATED
```

- **Asyncio Task Management**: Simulation runs within an independent `asyncio.Task` loop, allowing clients to pause, step, or speed up processing without blocking the FastAPI HTTP event loop.
- **Dead Connection Handling**: WebSockets that disconnect unexpectedly are automatically removed from `active_websockets` to prevent memory leakage or send errors.
