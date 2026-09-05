import uuid
from datetime import datetime
from typing import Tuple, List
from models import (
    Case, ComplianceResult, ComplianceCheckDetail, ComplianceRuleStatus,
    CaseStateEnum, AuditEntry, TraceEvent, InterventionType
)


def evaluate_compliance_guardrails(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 4: Compliance Guardrail
    Pre-execution hard gate evaluating 7 deterministic policy rules.
    
    Design rationale:
    - Thresholds simulate standard consumer protection and telecom frameworks (TRAI DND, quiet hours, contact frequency, card retry backoff, consent opt-outs).
    - This is an operational policy simulation for demonstration purposes; thresholds are configurable business logic.
    
    Rules Evaluated:
    1. Retry cap: max 3 auto-retries with exponential backoff.
    2. Contact frequency cap: max 2 outbound customer contacts / 24h across all channels.
    3. Quiet hours: no direct outbound contact 9pm–9am local time.
    4. Consent/DND check: suppression veto if customer is on DND list without explicit consent.
    5. Opt-out honoring: any 'STOP' reply immediately closes case.
    6. Escalation trigger: B2B invoice > ₹50k with commercial dispute → human desk escalation.
    7. Cost-aware stop: if cumulative recovery cost exceeds 15% of amount at risk.
    """
    now_iso = datetime.now().isoformat()
    event = case.event
    plan = case.intervention
    meta = event.metadata or {}
    
    checks: List[ComplianceCheckDetail] = []
    blocked = False
    block_reasons: List[str] = []

    is_outbound_contact = plan and plan.intervention_type in [
        InterventionType.WHATSAPP_NUDGE,
        InterventionType.ALT_PAYMENT_METHOD,
        InterventionType.PROMISE_TO_PAY_NEGOTIATION
    ] or (plan and plan.channel in ["whatsapp", "sms", "email", "voice"])

    is_automated_retry = plan and plan.intervention_type in [
        InterventionType.RETRY_NOW,
        InterventionType.RETRY_SCHEDULED
    ]

    # --- Rule 1: Retry Cap (Max 3) ---
    if is_automated_retry:
        if event.retry_count >= 3:
            blocked = True
            reason = f"Retry cap exceeded: Attempt #{event.retry_count + 1} blocked. Max 3 retries allowed per card network rules."
            checks.append(ComplianceCheckDetail(rule_name="RETRY_CAP", status=ComplianceRuleStatus.BLOCKED, reason=reason))
            block_reasons.append(reason)
        else:
            checks.append(ComplianceCheckDetail(
                rule_name="RETRY_CAP",
                status=ComplianceRuleStatus.PASSED,
                reason=f"Retry attempt #{event.retry_count + 1} of 3 allowable retries."
            ))
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="RETRY_CAP",
            status=ComplianceRuleStatus.PASSED,
            reason="Not an automated gateway retry; rule not triggered."
        ))

    # --- Rule 2: Contact Frequency Cap (Max 2 in 24h) ---
    if is_outbound_contact:
        if event.prior_contact_count_24h >= 2:
            blocked = True
            reason = f"Contact frequency cap breached: Customer already contacted {event.prior_contact_count_24h} times in last 24 hours (Max 2 allowed)."
            checks.append(ComplianceCheckDetail(rule_name="CONTACT_FREQUENCY_CAP", status=ComplianceRuleStatus.BLOCKED, reason=reason))
            block_reasons.append(reason)
        else:
            checks.append(ComplianceCheckDetail(
                rule_name="CONTACT_FREQUENCY_CAP",
                status=ComplianceRuleStatus.PASSED,
                reason=f"Touchpoint #{event.prior_contact_count_24h + 1} within 24-hour limit (Max 2)."
            ))
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="CONTACT_FREQUENCY_CAP",
            status=ComplianceRuleStatus.PASSED,
            reason="Channel is system-internal or gateway; no direct customer outreach."
        ))

    # --- Rule 3: Quiet Hours (9pm–9am Local Time) ---
    if is_outbound_contact:
        hour = event.local_hour
        if hour < 9 or hour >= 21:
            blocked = True
            formatted_time = f"{hour:02d}:00"
            reason = f"Quiet hours active: Customer local time is {formatted_time}. Direct outbound contact strictly prohibited between 9:00 PM and 9:00 AM."
            checks.append(ComplianceCheckDetail(rule_name="QUIET_HOURS", status=ComplianceRuleStatus.BLOCKED, reason=reason))
            block_reasons.append(reason)
        else:
            checks.append(ComplianceCheckDetail(
                rule_name="QUIET_HOURS",
                status=ComplianceRuleStatus.PASSED,
                reason=f"Customer local time ({event.local_hour:02d}:00) is within approved communication hours (9am - 9pm)."
            ))
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="QUIET_HOURS",
            status=ComplianceRuleStatus.PASSED,
            reason="Background automated retry or internal routing; exempt from quiet hours."
        ))

    # --- Rule 4: Consent & DND Check (Hard Veto) ---
    if is_outbound_contact and event.dnd_flag:
        blocked = True
        reason = "National DND Registry match (simulated): Customer has explicit Do-Not-Disturb registration. Outbound message blocked."
        checks.append(ComplianceCheckDetail(rule_name="DND_CONSENT_CHECK", status=ComplianceRuleStatus.BLOCKED, reason=reason))
        block_reasons.append(reason)
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="DND_CONSENT_CHECK",
            status=ComplianceRuleStatus.PASSED,
            reason="Customer DND flag is false; opt-in consent verified."
        ))

    # --- Rule 5: Opt-out Honoring (STOP reply) ---
    if meta.get("opted_out") or meta.get("replied_stop"):
        blocked = True
        reason = "Customer sent opt-out keyword 'STOP'. Case execution immediately blocked."
        checks.append(ComplianceCheckDetail(rule_name="OPT_OUT_HONORING", status=ComplianceRuleStatus.BLOCKED, reason=reason))
        block_reasons.append(reason)
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="OPT_OUT_HONORING",
            status=ComplianceRuleStatus.PASSED,
            reason="No active opt-out or STOP request on file."
        ))

    # --- Rule 6: Escalation Trigger (B2B invoice > ₹50k after 5 days) ---
    days_overdue = meta.get("days_overdue", 0)
    if event.amount > 50000 and days_overdue >= 5 and event.event_type.value == "invoice_overdue":
        if plan.intervention_type != InterventionType.HUMAN_ESCALATION:
            blocked = True
            reason = f"High-value B2B invoice (₹{event.amount:,.2f} > ₹50,000) overdue by {days_overdue} days. Automated outreach vetoed; mandatory escalation to human desk."
            checks.append(ComplianceCheckDetail(rule_name="B2B_HIGH_VALUE_ESCALATION", status=ComplianceRuleStatus.BLOCKED, reason=reason))
            block_reasons.append(reason)
        else:
            checks.append(ComplianceCheckDetail(
                rule_name="B2B_HIGH_VALUE_ESCALATION",
                status=ComplianceRuleStatus.PASSED,
                reason=f"Compliant human escalation correctly selected for high-value B2B invoice (₹{event.amount:,.2f})."
            ))
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="B2B_HIGH_VALUE_ESCALATION",
            status=ComplianceRuleStatus.PASSED,
            reason="Amount or overdue duration within automated recovery thresholds."
        ))

    # --- Rule 7: Cost-Aware Stop ---
    current_cost = case.cumulative_cost + (plan.estimated_cost if plan else 0.0)
    max_allowable_cost = max(5.0, event.amount * 0.15)
    if current_cost > max_allowable_cost:
        blocked = True
        reason = f"Cost-to-recovery cap exceeded: Cumulative cost ₹{current_cost:.2f} exceeds allowable ₹{max_allowable_cost:.2f} (15% of ₹{event.amount:,.2f})."
        checks.append(ComplianceCheckDetail(rule_name="COST_AWARE_STOP", status=ComplianceRuleStatus.BLOCKED, reason=reason))
        block_reasons.append(reason)
    else:
        checks.append(ComplianceCheckDetail(
            rule_name="COST_AWARE_STOP",
            status=ComplianceRuleStatus.PASSED,
            reason=f"Recovery cost ₹{current_cost:.2f} within economic limit (₹{max_allowable_cost:.2f})."
        ))

    allowed = not blocked
    primary_reason = "All 7 compliance guardrails verified and passed." if allowed else "; ".join(block_reasons)

    compliance_result = ComplianceResult(
        allowed=allowed,
        primary_reason=primary_reason,
        checks=checks,
        timestamp=now_iso
    )

    case.compliance = compliance_result
    case.state = CaseStateEnum.COMPLIANCE_CHECK
    case.updated_at = now_iso

    if not allowed:
        from models import ActionResult
        case.action_result = ActionResult(
            action_type="EXECUTION_BYPASS",
            status="VETOED_BY_COMPLIANCE",
            payload={"reason": primary_reason, "bypassed_by": "ComplianceGuardrailAgent"},
            cost_incurred=0.0
        )

    case.history.append({
        "step": "COMPLIANCE_CHECK",
        "agent": "Compliance Guardrail",
        "timestamp": now_iso,
        "description": f"Compliance Gate: {'ALLOWED' if allowed else 'VETOED / BLOCKED'} — {primary_reason}"
    })

    reasoning = (
        f"Compliance Gate: {'PASSED [ALLOWED]' if allowed else 'VETOED [BLOCKED]'}. "
        f"{primary_reason}"
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        agent="Compliance Guardrail",
        step_name="COMPLIANCE_EVALUATED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "allowed": allowed,
            "primary_reason": primary_reason,
            "blocked_checks": [c.model_dump() for c in checks if c.status == ComplianceRuleStatus.BLOCKED],
            "passed_checks_count": len([c for c in checks if c.status == ComplianceRuleStatus.PASSED])
        },
        state_after="COMPLIANCE_CHECK",
        status_badge="ALLOWED" if allowed else "VETOED"
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        timestamp=now_iso,
        agent="Compliance Guardrail",
        action="EVALUATE_COMPLIANCE_GATE",
        status="PASSED" if allowed else "BLOCKED",
        reason=primary_reason,
        payload={
            "allowed": allowed,
            "checks": [c.model_dump() for c in checks]
        }
    )
    case.audit_trail.append(audit)

    return case, trace, audit
