import uuid
import random
from datetime import datetime
from typing import Tuple
from models import (
    Case, CaseStateEnum, AuditEntry, TraceEvent, InterventionType
)


def resolve_outcome_and_audit(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 6: Outcome & Audit
    - Logs final decision & results immutably
    - Evaluates customer response & resolves final state:
      {RECOVERED | RETRY | ESCALATED | STOPPED}
    - Updates recovered-revenue ledger and final audit record
    """
    now_iso = datetime.now().isoformat()
    compliance = case.compliance
    action = case.action_result
    event = case.event
    plan = case.intervention

    final_state = CaseStateEnum.STOPPED
    recovered_amount = 0.0
    outcome_reason = ""
    audit_status = "INFO"

    # Branch 1: Compliance Veto
    if compliance and not compliance.allowed:
        if "B2B" in compliance.primary_reason or (plan and plan.intervention_type == InterventionType.HUMAN_ESCALATION):
            final_state = CaseStateEnum.ESCALATED
            outcome_reason = f"Compliance Escalation: {compliance.primary_reason}"
            audit_status = "ESCALATED"
        else:
            final_state = CaseStateEnum.STOPPED
            outcome_reason = f"Compliance Hard Stop: {compliance.primary_reason}"
            audit_status = "STOPPED"

    # Branch 2: Human Escalation Triggered
    elif action and action.status == "ESCALATED":
        final_state = CaseStateEnum.ESCALATED
        outcome_reason = "Case assigned to Senior Accounts Specialist for human mediation."
        audit_status = "ESCALATED"

    # Branch 3: Direct Gateway Retry Executed
    elif action and action.action_type == "GATEWAY_RETRY_EXECUTED":
        if action.status == "SUCCESS":
            final_state = CaseStateEnum.RECOVERED
            recovered_amount = event.amount
            outcome_reason = f"Direct gateway retry succeeded! Captured ₹{event.amount:,.2f} via {action.payload.get('gateway')}."
            audit_status = "RECOVERED"
        else:
            if event.retry_count < 2:
                final_state = CaseStateEnum.RETRY
                outcome_reason = "Gateway retry failed; scheduled secondary backoff retry."
                audit_status = "INFO"
            else:
                final_state = CaseStateEnum.STOPPED
                outcome_reason = "Max automated gateway retries exhausted with no capture."
                audit_status = "STOPPED"

    # Branch 4: Customer Outreach Interventions (WhatsApp, Alt Payment, PTP)
    else:
        # Realistic resolution simulation calibrated to ~70% recovery overall
        # Weighted by customer segment and diagnosis
        weight = 0.72
        if event.customer_segment == "ENTERPRISE":
            weight = 0.80
        elif event.customer_segment == "SMB":
            weight = 0.74
        elif event.dnd_flag:
            weight = 0.0  # Already blocked by compliance anyway
        
        outcome_rand = random.random()
        if outcome_rand < weight:
            final_state = CaseStateEnum.RECOVERED
            recovered_amount = event.amount
            method = plan.channel if plan else "digital_link"
            outcome_reason = f"Customer completed ₹{event.amount:,.2f} payment via {method} recovery link."
            audit_status = "RECOVERED"
        elif outcome_rand < 0.88:
            final_state = CaseStateEnum.RETRY
            outcome_reason = "Customer opened recovery link but did not complete authorization. Scheduled follow-up."
            audit_status = "INFO"
        else:
            final_state = CaseStateEnum.STOPPED
            outcome_reason = "Outreach timed out with zero customer response after expiry window."
            audit_status = "STOPPED"

    case.state = final_state
    case.recovered_amount = recovered_amount
    case.final_outcome_reason = outcome_reason
    case.updated_at = now_iso
    case.history.append({
        "step": final_state.value,
        "agent": "Outcome & Audit",
        "timestamp": now_iso,
        "description": outcome_reason
    })

    reasoning = (
        f"Case transitioned to final state: [{final_state.value}]. "
        f"Recovered: ₹{recovered_amount:,.2f} of ₹{event.amount:,.2f}. Reason: {outcome_reason}"
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        agent="Outcome & Audit",
        step_name="CASE_RESOLVED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "final_state": final_state.value,
            "recovered_amount": recovered_amount,
            "amount_at_risk": event.amount,
            "net_recovered": max(0.0, recovered_amount - case.cumulative_cost),
            "reason": outcome_reason
        },
        state_after=final_state.value,
        status_badge=final_state.value
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        timestamp=now_iso,
        agent="Outcome & Audit",
        action="UPDATE_LEDGER_AND_CLOSE",
        status=audit_status,
        reason=outcome_reason,
        payload={
            "final_state": final_state.value,
            "recovered_amount": recovered_amount,
            "cumulative_cost": case.cumulative_cost
        }
    )
    case.audit_trail.append(audit)

    return case, trace, audit
