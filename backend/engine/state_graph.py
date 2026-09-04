import asyncio
from typing import Dict, Any, List, Tuple, Callable, Optional
from models import Case, TraceEvent, AuditEntry
from agents.signal_ingestion import ingest_signal
from agents.root_cause_diagnosis import diagnose_root_cause
from agents.strategy_selection import select_strategy
from agents.compliance_guardrail import evaluate_compliance_guardrails
from agents.execution_agent import execute_intervention
from agents.outcome_audit_agent import resolve_outcome_and_audit


class CaseRecoveryWorkflow:
    """
    State Machine & LangGraph Workflow orchestrating the 6 autonomous recovery agents:
    1. Signal Ingestion
    2. Root Cause Diagnosis
    3. Strategy Selection
    4. Compliance Guardrail
    5. Execution Agent
    6. Outcome & Audit
    """

    @staticmethod
    def process_case_sync(
        raw_event: Dict[str, Any],
        on_step_callback: Optional[Callable[[Case, TraceEvent, AuditEntry], None]] = None
    ) -> Tuple[Case, List[TraceEvent], List[AuditEntry]]:
        """
        Synchronously runs a case through all 6 agent stages, invoking callback after each stage.
        """
        traces: List[TraceEvent] = []
        audits: List[AuditEntry] = []

        # Step 1: Signal Ingestion
        case, trace_1, audit_1 = ingest_signal(raw_event)
        traces.append(trace_1)
        audits.append(audit_1)
        if on_step_callback:
            on_step_callback(case, trace_1, audit_1)

        # Step 2: Root Cause Diagnosis
        case, trace_2, audit_2 = diagnose_root_cause(case)
        traces.append(trace_2)
        audits.append(audit_2)
        if on_step_callback:
            on_step_callback(case, trace_2, audit_2)

        # Step 3: Strategy Selection
        case, trace_3, audit_3 = select_strategy(case)
        traces.append(trace_3)
        audits.append(audit_3)
        if on_step_callback:
            on_step_callback(case, trace_3, audit_3)

        # Step 4: Compliance Guardrail (Hard Gate)
        case, trace_4, audit_4 = evaluate_compliance_guardrails(case)
        traces.append(trace_4)
        audits.append(audit_4)
        if on_step_callback:
            on_step_callback(case, trace_4, audit_4)

        # Step 5: Execution Agent
        case, trace_5, audit_5 = execute_intervention(case)
        traces.append(trace_5)
        audits.append(audit_5)
        if on_step_callback:
            on_step_callback(case, trace_5, audit_5)

        # Step 6: Outcome & Audit
        case, trace_6, audit_6 = resolve_outcome_and_audit(case)
        traces.append(trace_6)
        audits.append(audit_6)
        if on_step_callback:
            on_step_callback(case, trace_6, audit_6)

        return case, traces, audits

    @staticmethod
    async def process_case_async(
        raw_event: Dict[str, Any],
        step_delay: float = 0.05,
        on_step_callback: Optional[Callable[[Case, TraceEvent, AuditEntry], Any]] = None
    ) -> Tuple[Case, List[TraceEvent], List[AuditEntry]]:
        """
        Asynchronously runs a case with realistic micro-delays between agent nodes for real-time visualization.
        """
        traces: List[TraceEvent] = []
        audits: List[AuditEntry] = []

        # Step 1: Signal Ingestion
        case, trace_1, audit_1 = ingest_signal(raw_event)
        traces.append(trace_1)
        audits.append(audit_1)
        if on_step_callback:
            await on_step_callback(case, trace_1, audit_1)
        if step_delay > 0:
            await asyncio.sleep(step_delay)

        # Step 2: Root Cause Diagnosis
        case, trace_2, audit_2 = diagnose_root_cause(case)
        traces.append(trace_2)
        audits.append(audit_2)
        if on_step_callback:
            await on_step_callback(case, trace_2, audit_2)
        if step_delay > 0:
            await asyncio.sleep(step_delay)

        # Step 3: Strategy Selection
        case, trace_3, audit_3 = select_strategy(case)
        traces.append(trace_3)
        audits.append(audit_3)
        if on_step_callback:
            await on_step_callback(case, trace_3, audit_3)
        if step_delay > 0:
            await asyncio.sleep(step_delay)

        # Step 4: Compliance Guardrail
        case, trace_4, audit_4 = evaluate_compliance_guardrails(case)
        traces.append(trace_4)
        audits.append(audit_4)
        if on_step_callback:
            await on_step_callback(case, trace_4, audit_4)
        if step_delay > 0:
            await asyncio.sleep(step_delay)

        # Step 5: Execution Agent
        case, trace_5, audit_5 = execute_intervention(case)
        traces.append(trace_5)
        audits.append(audit_5)
        if on_step_callback:
            await on_step_callback(case, trace_5, audit_5)
        if step_delay > 0:
            await asyncio.sleep(step_delay)

        # Step 6: Outcome & Audit
        case, trace_6, audit_6 = resolve_outcome_and_audit(case)
        traces.append(trace_6)
        audits.append(audit_6)
        if on_step_callback:
            await on_step_callback(case, trace_6, audit_6)

        return case, traces, audits
