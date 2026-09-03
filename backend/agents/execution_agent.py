import uuid
import random
from datetime import datetime
from typing import Tuple
from models import (
    Case, ActionResult, CaseStateEnum, AuditEntry, TraceEvent, InterventionType
)


def execute_intervention(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 5: Execution Agent
    Fires bounded simulated actions only:
    - Gateway retry API call
    - WhatsApp / SMS / Email copy dispatch
    - Hinglish voice recovery script dispatch
    - Promise-to-Pay (PTP) record write
    - Human escalation CRM ticket
    """
    now_iso = datetime.now().isoformat()
    plan = case.intervention
    compliance = case.compliance

    # Hard guard: If compliance vetoed, never fire action!
    if compliance and not compliance.allowed:
        action_result = ActionResult(
            action_type="NO_OP_VETOED",
            status="VETOED_BY_COMPLIANCE",
            payload={
                "vetoed": True,
                "reason": compliance.primary_reason
            },
            cost_incurred=0.0,
            executed_at=now_iso,
            response_simulated={"status": "BLOCKED", "execution_aborted": True}
        )
        case.action_result = action_result
        case.state = CaseStateEnum.ACTION_EXECUTED
        case.updated_at = now_iso
        case.history.append({
            "step": "ACTION_EXECUTED",
            "agent": "Execution Agent",
            "timestamp": now_iso,
            "description": f"Execution halted by Compliance Gate: {compliance.primary_reason}"
        })

        trace = TraceEvent(
            trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
            case_id=case.case_id,
            agent="Execution Agent",
            step_name="ACTION_BLOCKED",
            timestamp=now_iso,
            reasoning=f"Intervention aborted. Compliance Guardrail vetoed action: {compliance.primary_reason}",
            payload={"vetoed": True, "reason": compliance.primary_reason},
            state_after="ACTION_EXECUTED",
            status_badge="ABORTED"
        )

        audit = AuditEntry(
            audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
            case_id=case.case_id,
            timestamp=now_iso,
            agent="Execution Agent",
            action="ABORT_INTERVENTION",
            status="BLOCKED",
            reason=f"Action blocked per compliance: {compliance.primary_reason}",
            payload={"vetoed": True}
        )
        case.audit_trail.append(audit)
        return case, trace, audit

    # Allowed execution path
    action_type = plan.intervention_type.value if plan else "unknown_action"
    cost = plan.estimated_cost if plan else 0.50
    case.cumulative_cost += cost
    response_payload = {}
    execution_status = "SUCCESS"

    if plan.intervention_type in [InterventionType.RETRY_NOW, InterventionType.RETRY_SCHEDULED]:
        txn_id = f"txn_sim_{uuid.uuid4().hex[:12]}"
        # Gateway retry outcome simulation
        success_prob = 0.82 if plan.intervention_type == InterventionType.RETRY_NOW else 0.74
        is_success = random.random() < success_prob
        
        response_payload = {
            "gateway": "Razorpay / NPCI Direct Switch",
            "transaction_id": txn_id,
            "merchant_id": "rzp_live_merch99",
            "amount_debited": case.event.amount if is_success else 0.0,
            "currency": "INR",
            "response_code": "200_SUCCESS_AUTHORIZED" if is_success else "402_RETRY_FAILED_ISSUER_REJECT",
            "settlement_status": "captured" if is_success else "failed"
        }
        execution_status = "SUCCESS" if is_success else "SIMULATED_FAILURE"
        action_type = "GATEWAY_RETRY_EXECUTED"

    elif plan.intervention_type == InterventionType.WHATSAPP_NUDGE:
        msg_id = f"wamid.HBgL{uuid.uuid4().hex[:14]}"
        response_payload = {
            "provider": "Meta WhatsApp Cloud API (Simulated)",
            "message_id": msg_id,
            "recipient": f"+91-{case.event.customer_id[-10:] if len(case.event.customer_id) >= 10 else '9876543210'}",
            "template_language": case.event.language_pref,
            "content_preview": plan.copy_text,
            "delivery_status": "delivered",
            "click_tracking_id": f"clk_{uuid.uuid4().hex[:8]}"
        }
        case.event.prior_contact_count_24h += 1
        action_type = "WHATSAPP_OUTREACH_DISPATCHED"

    elif plan.intervention_type == InterventionType.ALT_PAYMENT_METHOD:
        response_payload = {
            "channel": "WhatsApp / SMS Gateway",
            "alt_method": plan.alt_method_suggested,
            "dynamic_link": f"https://rzp.io/i/alt_{uuid.uuid4().hex[:6]}",
            "delivery_status": "delivered",
            "instructions": plan.copy_text
        }
        case.event.prior_contact_count_24h += 1
        action_type = "ALT_PAYMENT_METHOD_DISPATCHED"

    elif plan.intervention_type == InterventionType.HUMAN_ESCALATION:
        ticket_id = f"TICK-B2B-{uuid.uuid4().hex[:6].upper()}"
        response_payload = {
            "ticket_id": ticket_id,
            "queue": "Key Enterprise Accounts Recovery Desk",
            "assigned_lead": "Senior Accounts Receivable Officer",
            "priority": "HIGH",
            "invoice_amount": case.event.amount,
            "notes": "Automated recovery paused. B2B dispute and high balance requires direct account manager mediation."
        }
        execution_status = "ESCALATED"
        action_type = "HUMAN_ESCALATION_QUEUED"

    elif plan.intervention_type == InterventionType.PROMISE_TO_PAY_NEGOTIATION:
        ptp_id = f"PTP-{uuid.uuid4().hex[:6].upper()}"
        response_payload = {
            "ptp_id": ptp_id,
            "terms": plan.ptp_terms,
            "email_dispatched_to": f"accounts@{case.event.customer_name.lower().replace(' ', '')}.com",
            "confirmation_link": f"https://portal.revenue-recovery.io/ptp/{ptp_id}"
        }
        case.event.prior_contact_count_24h += 1
        action_type = "PTP_PROPOSAL_DISPATCHED"

    action_result = ActionResult(
        action_type=action_type,
        status=execution_status,
        payload=response_payload,
        cost_incurred=cost,
        executed_at=now_iso,
        response_simulated=response_payload
    )

    case.action_result = action_result
    case.state = CaseStateEnum.ACTION_EXECUTED
    case.updated_at = now_iso
    case.history.append({
        "step": "ACTION_EXECUTED",
        "agent": "Execution Agent",
        "timestamp": now_iso,
        "description": f"Executed action: {action_type} (Status: {execution_status})"
    })

    reasoning = (
        f"Executed bounded action: '{action_type}'. Status: {execution_status}. "
        f"Cost incurred: ₹{cost:.2f}. Destination: {plan.channel}."
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        agent="Execution Agent",
        step_name="INTERVENTION_EXECUTED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "action_type": action_type,
            "status": execution_status,
            "details": response_payload,
            "cost": cost
        },
        state_after="ACTION_EXECUTED",
        status_badge=execution_status
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        timestamp=now_iso,
        agent="Execution Agent",
        action=action_type,
        status="EXECUTED",
        reason=f"Dispatched bounded action over {plan.channel}",
        payload=response_payload
    )
    case.audit_trail.append(audit)

    return case, trace, audit
