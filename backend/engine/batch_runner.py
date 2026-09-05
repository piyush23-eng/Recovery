import asyncio
from typing import Dict, List, Any, Optional, Set
from fastapi import WebSocket
from models import Case, TraceEvent, AuditEntry, LedgerStats, CaseStateEnum, compute_audit_entry_hash
from engine.dataset_generator import generate_synthetic_dataset
from engine.state_graph import CaseRecoveryWorkflow


class BatchSimulationRunner:
    def __init__(self):
        self.raw_dataset: List[Dict[str, Any]] = generate_synthetic_dataset(300, seed=42)
        self.cases: Dict[str, Case] = {}
        self.audit_log: List[AuditEntry] = []
        self.latest_audit_hash: str = "0" * 64
        self.traces: List[TraceEvent] = []
        self.stats = LedgerStats(total_cases=len(self.raw_dataset))
        
        self.is_running: bool = False
        self.is_paused: bool = False
        self.current_index: int = 0
        self.speed_multiplier: float = 1.0  # 1.0 = base speed, 5.0 = 5x faster, 0.0 = instant
        self.active_websockets: Set[WebSocket] = set()
        self._task: Optional[asyncio.Task] = None

    async def connect_ws(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        # Send initial full state snapshot
        await websocket.send_json({
            "type": "INITIAL_SYNC",
            "data": {
                "stats": self.stats.model_dump(),
                "cases": [c.model_dump() for c in list(self.cases.values())[-100:]],
                "traces": [t.model_dump() for t in self.traces[-100:]],
                "simulation_status": {
                    "is_running": self.is_running,
                    "is_paused": self.is_paused,
                    "current_index": self.current_index,
                    "total_cases": len(self.raw_dataset),
                    "speed": self.speed_multiplier
                }
            }
        })

    def disconnect_ws(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)

    async def broadcast(self, message_type: str, data: Any):
        if not self.active_websockets:
            return
        payload = {"type": message_type, "data": data}
        dead_sockets = set()
        for ws in self.active_websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.add(ws)
        for dead in dead_sockets:
            self.active_websockets.discard(dead)

    def recalculate_stats(self):
        total_at_risk = 0.0
        total_recovered = 0.0
        total_cost = 0.0
        compliance_stops = 0
        escalated = 0
        retry_count = 0
        
        status_dist: Dict[str, int] = {}
        type_breakdown: Dict[str, Dict[str, float]] = {
            "payment_failed": {"risk": 0.0, "recovered": 0.0, "count": 0, "recovered_count": 0},
            "checkout_abandoned": {"risk": 0.0, "recovered": 0.0, "count": 0, "recovered_count": 0},
            "subscription_failed": {"risk": 0.0, "recovered": 0.0, "count": 0, "recovered_count": 0},
            "invoice_overdue": {"risk": 0.0, "recovered": 0.0, "count": 0, "recovered_count": 0}
        }
        
        diagnosed_count = len([c for c in self.cases.values() if c.diagnosis is not None])
        funnel = {
            "detected": len(self.cases),
            "diagnosed": diagnosed_count,
            "contacted": 0,
            "responded": 0,
            "promised": 0,
            "recovered": 0
        }
        veto_reasons: Dict[str, int] = {}

        for case in self.cases.values():
            amount = case.event.amount
            total_at_risk += amount
            total_cost += case.cumulative_cost
            st = case.state.value
            status_dist[st] = status_dist.get(st, 0) + 1

            etype = case.event.event_type.value
            if etype in type_breakdown:
                type_breakdown[etype]["risk"] += amount
                type_breakdown[etype]["count"] += 1

            if case.compliance and not case.compliance.allowed:
                compliance_stops += 1
                for chk in case.compliance.checks:
                    if chk.status.value == "BLOCKED":
                        veto_reasons[chk.rule_name] = veto_reasons.get(chk.rule_name, 0) + 1

            if case.intervention and case.compliance and case.compliance.allowed:
                funnel["contacted"] += 1

            if case.state == CaseStateEnum.RECOVERED:
                total_recovered += case.recovered_amount
                funnel["responded"] += 1
                funnel["promised"] += 1
                funnel["recovered"] += 1
                if etype in type_breakdown:
                    type_breakdown[etype]["recovered"] += case.recovered_amount
                    type_breakdown[etype]["recovered_count"] += 1
            elif case.state == CaseStateEnum.ESCALATED:
                escalated += 1
            elif case.state == CaseStateEnum.RETRY:
                retry_count += 1
                funnel["responded"] += 1

        rec_rate = (total_recovered / total_at_risk * 100) if total_at_risk > 0 else 0.0
        net_recovered = max(0.0, total_recovered - total_cost)
        roi = (total_recovered / total_cost) if total_cost > 0 else 0.0

        self.stats = LedgerStats(
            total_cases=len(self.raw_dataset),
            processed_cases=len(self.cases),
            revenue_at_risk=round(total_at_risk, 2),
            revenue_recovered=round(total_recovered, 2),
            recovery_rate_pct=round(rec_rate, 1),
            total_cost_incurred=round(total_cost, 2),
            net_revenue_recovered=round(net_recovered, 2),
            roi_multiplier=round(roi, 1),
            compliance_stops_count=compliance_stops,
            escalated_count=escalated,
            retry_count=retry_count,
            status_distribution=status_dist,
            type_breakdown=type_breakdown,
            funnel=funnel,
            veto_reasons=veto_reasons
        )

    async def _handle_step(self, case: Case, trace: TraceEvent, audit: AuditEntry):
        self.cases[case.case_id] = case
        
        # Cryptographic Hash-Chain Integrity Linking
        audit.prev_hash = self.latest_audit_hash
        entry_hash = compute_audit_entry_hash(self.latest_audit_hash, audit.model_dump())
        audit.entry_hash = entry_hash
        self.latest_audit_hash = entry_hash

        self.audit_log.append(audit)
        self.traces.append(trace)
        if len(self.traces) > 300:
            self.traces = self.traces[-300:]  # keep recent 300 in memory
        self.recalculate_stats()

        # Broadcast live updates
        await self.broadcast("TRACE_EMITTED", trace.model_dump())
        await self.broadcast("CASE_UPDATED", case.model_dump())
        await self.broadcast("STATS_UPDATED", self.stats.model_dump())

    def verify_audit_log_chain(self) -> Dict[str, Any]:
        """
        Walks the entire audit trail and re-computes every SHA-256 hash to prove tamper-evidence.
        """
        if not self.audit_log:
            return {
                "verified": True,
                "total_entries": 0,
                "genesis_hash": "0" * 64,
                "chain_head": self.latest_audit_hash,
                "tampered": False,
                "message": "Audit ledger is currently empty."
            }

        expected_prev = "0" * 64
        for i, entry in enumerate(self.audit_log):
            if entry.prev_hash != expected_prev:
                return {
                    "verified": False,
                    "total_entries": len(self.audit_log),
                    "tampered_index": i,
                    "audit_id": entry.audit_id,
                    "expected_prev_hash": expected_prev,
                    "actual_prev_hash": entry.prev_hash,
                    "error": f"Broken chain link at index {i} (Audit ID: {entry.audit_id})"
                }
            recomputed = compute_audit_entry_hash(expected_prev, entry.model_dump())
            if entry.entry_hash != recomputed:
                return {
                    "verified": False,
                    "total_entries": len(self.audit_log),
                    "tampered_index": i,
                    "audit_id": entry.audit_id,
                    "expected_entry_hash": recomputed,
                    "actual_entry_hash": entry.entry_hash,
                    "error": f"Cryptographic signature mismatch at index {i} (Audit ID: {entry.audit_id})"
                }
            expected_prev = entry.entry_hash

        return {
            "verified": True,
            "total_entries": len(self.audit_log),
            "genesis_hash": "0" * 64,
            "chain_head": self.latest_audit_hash,
            "tampered": False,
            "message": f"Cryptographic verification passed: All {len(self.audit_log)} audit entries form an unbroken, tamper-evident SHA-256 chain."
        }

    async def resolve_case_response(self, case_id: str, outcome: str, notes: Optional[str] = None) -> Optional[Case]:
        """
        Reconciles a customer response received asynchronously via webhook for a case in AWAITING_RESPONSE.
        """
        case = self.cases.get(case_id)
        if not case:
            return None
        from agents.outcome_audit_agent import resolve_outcome_and_audit
        case, trace, audit = resolve_outcome_and_audit(case, manual_outcome=outcome, manual_payload={"notes": notes})
        await self._handle_step(case, trace, audit)
        return case

    async def process_one_case(self, raw_event: Dict[str, Any]):
        base_step_delay = 0.08 / max(0.2, self.speed_multiplier) if self.speed_multiplier > 0 else 0.0
        await CaseRecoveryWorkflow.process_case_async(
            raw_event=raw_event,
            step_delay=base_step_delay,
            on_step_callback=self._handle_step
        )

    async def _run_loop(self):
        self.is_running = True
        self.is_paused = False
        await self.broadcast("SIMULATION_STATE", {"is_running": True, "is_paused": False, "speed": self.speed_multiplier})

        try:
            while self.current_index < len(self.raw_dataset) and self.is_running:
                if self.is_paused:
                    await asyncio.sleep(0.2)
                    continue

                raw_event = self.raw_dataset[self.current_index]
                self.current_index += 1
                await self.process_one_case(raw_event)

                case_pause = (0.25 / max(0.2, self.speed_multiplier)) if self.speed_multiplier > 0 else 0.01
                if case_pause > 0:
                    await asyncio.sleep(case_pause)

        finally:
            self.is_running = False
            await self.broadcast("SIMULATION_STATE", {"is_running": False, "is_paused": self.is_paused, "speed": self.speed_multiplier})

    def start(self):
        if not self.is_running:
            self._task = asyncio.create_task(self._run_loop())
        elif self.is_paused:
            self.is_paused = False

    def pause(self):
        self.is_paused = True

    def reset(self, count: int = 300, seed: int = 42):
        if self._task and not self._task.done():
            self._task.cancel()
        self.is_running = False
        self.is_paused = False
        self.current_index = 0
        self.raw_dataset = generate_synthetic_dataset(count, seed=seed)
        self.cases.clear()
        self.audit_log.clear()
        self.latest_audit_hash = "0" * 64
        self.traces.clear()
        self.stats = LedgerStats(total_cases=len(self.raw_dataset))

    def set_speed(self, speed: float):
        self.speed_multiplier = speed

    async def step(self):
        """Processes exactly 1 case step-by-step"""
        if self.current_index < len(self.raw_dataset):
            raw_event = self.raw_dataset[self.current_index]
            self.current_index += 1
            await self.process_one_case(raw_event)
            return True
        return False

    async def inject_custom_event(self, event_data: Dict[str, Any]) -> Optional[Case]:
        """Injects and executes a single custom risk event through all 6 LangGraph agents live"""
        import uuid
        case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"
        event_id = f"EVT-{uuid.uuid4().hex[:6].upper()}"
        
        meta = {}
        if event_data.get("decline_code"):
            meta["decline_code"] = event_data["decline_code"]
        if event_data.get("is_disputed"):
            meta["dispute_flag"] = True
            meta["days_overdue"] = int(event_data.get("days_overdue", 7))
        if event_data.get("replied_stop"):
            meta["replied_stop"] = True

        raw_event = {
            "case_id": case_id,
            "event_id": event_id,
            "customer_id": event_data.get("customer_id") or f"CUST-{uuid.uuid4().hex[:4].upper()}",
            "customer_name": event_data.get("customer_name") or "Live Scenario Customer",
            "customer_segment": event_data.get("customer_segment") or "CONSUMER_RETAIL",
            "event_type": event_data.get("event_type") or "payment_failed",
            "amount": float(event_data.get("amount", 9999.0)),
            "currency": "INR",
            "channel_pref": event_data.get("channel_pref") or "whatsapp",
            "language_pref": event_data.get("language_pref") or "hinglish",
            "dnd_flag": bool(event_data.get("dnd_flag", False)),
            "prior_contact_count_24h": int(event_data.get("prior_contact_count_24h", 0)),
            "retry_count": int(event_data.get("retry_count", 0)),
            "local_hour": int(event_data.get("local_hour", 14)),
            "cumulative_cost": 0.0,
            "metadata": meta
        }
        
        await self.process_one_case(raw_event)
        return self.cases.get(case_id)


runner = BatchSimulationRunner()

