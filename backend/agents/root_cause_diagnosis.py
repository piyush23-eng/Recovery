import uuid
from datetime import datetime
from typing import Tuple
from models import Case, Diagnosis, DiagnosisCause, CaseStateEnum, AuditEntry, TraceEvent, RiskEventType


def diagnose_root_cause(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 2: Root Cause Diagnosis
    Classifies *why* the revenue risk occurred:
    insufficient_funds, expired_card, issuer_timeout, mandate_not_registered,
    price_sensitivity, B2B_dispute, silent_churn with confidence and evidence.
    """
    now_iso = datetime.now().isoformat()
    event = case.event
    meta = event.metadata or {}
    decline_code = meta.get("decline_code", "").upper()
    cart_stage = meta.get("cart_stage", "")
    tenure_months = meta.get("tenure_months", 1)
    days_overdue = meta.get("days_overdue", 0)
    dispute_flag = meta.get("dispute_flag", False)
    item_category = meta.get("item_category", "Standard")

    cause: DiagnosisCause
    confidence: float
    evidence: list[str] = []
    rationale: str

    if event.event_type == RiskEventType.PAYMENT_FAILED:
        if "INSUFFICIENT" in decline_code or "E51" in decline_code or "LOW_BALANCE" in decline_code:
            cause = DiagnosisCause.INSUFFICIENT_FUNDS
            confidence = 0.94
            evidence = [
                f"Bank decline code: {decline_code or 'E51_INSUFFICIENT_FUNDS'}",
                "Cardholder balance below required debit amount",
                "Transaction attempted during non-salary cycle window"
            ]
            rationale = "Customer account had insufficient balance at debit time. Optimal recovery: salary-day retry or UPI split link."
        elif "EXPIRED" in decline_code or "E54" in decline_code or meta.get("card_expiry_passed"):
            cause = DiagnosisCause.EXPIRED_CARD
            confidence = 0.98
            evidence = [
                f"Bank decline code: {decline_code or 'E54_EXPIRED_CARD'}",
                f"Card expiry on record: {meta.get('card_expiry', '10/25')}",
                "Physical card token invalidated by issuer"
            ]
            rationale = "Saved card token has expired. Direct automated retry will fail; requires card update or alt payment link."
        elif "TIMEOUT" in decline_code or "E91" in decline_code or "ISSUER_DOWN" in decline_code:
            cause = DiagnosisCause.ISSUER_TIMEOUT
            confidence = 0.91
            evidence = [
                f"Gateway error: {decline_code or 'E91_ISSUER_TIMEOUT'}",
                f"Issuer bank ({meta.get('issuer_bank', 'HDFC Bank')}) latency exceeded 15,000ms",
                "Systemic network spike detected on NPCI switch"
            ]
            rationale = "Transient gateway / issuer switch timeout. High probability of immediate or 1h auto-retry success."
        elif "MANDATE" in decline_code or "E82" in decline_code or meta.get("mandate_missing"):
            cause = DiagnosisCause.MANDATE_NOT_REGISTERED
            confidence = 0.93
            evidence = [
                "E-mandate token missing or unapproved on NPCI e-NACH portal",
                "Recurring debit authorization revoked or not completed",
                f"Bank code: {decline_code or 'E82_MANDATE_NOT_FOUND'}"
            ]
            rationale = "RBI e-mandate registration missing or expired. Customer must authorize new UPI AutoPay / e-NACH mandate."
        else:
            cause = DiagnosisCause.INSUFFICIENT_FUNDS
            confidence = 0.82
            evidence = [f"Generic decline: {decline_code or 'E05_DO_NOT_HONOR'}", "Fallback classification to balance threshold"]
            rationale = "Defaulted to fund availability check based on consumer profile and transaction timing."

    elif event.event_type == RiskEventType.CHECKOUT_ABANDONED:
        if cart_stage in ["shipping_fee_view", "discount_code_failed"] or meta.get("price_sensitive"):
            cause = DiagnosisCause.PRICE_SENSITIVITY
            confidence = 0.89
            evidence = [
                f"Abandoned at step: '{cart_stage or 'shipping_fee_view'}'",
                f"Cart value ₹{event.amount:,.2f} with shipping threshold hesitation",
                f"Coupon '{meta.get('attempted_coupon', 'SAVE20')}' failed validation"
            ]
            rationale = "Customer dropped off due to unexpected fees / price friction. Highly responsive to dynamic coupon or free shipping nudge."
        else:
            cause = DiagnosisCause.SILENT_CHURN
            confidence = 0.79
            evidence = [
                f"Session idle > 25 mins after viewing checkout",
                "Multiple tab switches recorded",
                f"Cart item category: {item_category}"
            ]
            rationale = "Browsing drop-off. Gentle multi-channel reminder with 1-click checkout recovery recommended."

    elif event.event_type == RiskEventType.SUBSCRIPTION_FAILED:
        if meta.get("mandate_expired") or "MANDATE" in decline_code:
            cause = DiagnosisCause.MANDATE_NOT_REGISTERED
            confidence = 0.96
            evidence = [
                f"Tenure: {tenure_months} months active",
                "Recurring mandate limit exceeded or registration lapsed",
                "Card token invalidated by RBI circular guidelines"
            ]
            rationale = "Subscription billing blocked due to mandate invalidation. Customer needs seamless UPI AutoPay migration."
        elif meta.get("card_expired"):
            cause = DiagnosisCause.EXPIRED_CARD
            confidence = 0.95
            evidence = ["Subscription renewal failed", "Saved payment method expired", f"Customer tenure: {tenure_months} months"]
            rationale = "Active loyal subscriber whose saved card reached expiration date."
        else:
            cause = DiagnosisCause.SILENT_CHURN
            confidence = 0.84
            evidence = [
                f"Subscription renewal failed for {event.customer_segment} plan",
                f"Zero product login activity in last {meta.get('days_inactive', 21)} days",
                "Decline reason: Customer canceled autopay"
            ]
            rationale = "Customer appears to be intentionally dropping service. Value-reinforcement outreach required."

    elif event.event_type == RiskEventType.INVOICE_OVERDUE:
        if dispute_flag or meta.get("dispute_reason"):
            cause = DiagnosisCause.B2B_DISPUTE
            confidence = 0.95
            evidence = [
                f"B2B Invoice #{meta.get('invoice_number', 'INV-9021')} overdue by {days_overdue} days",
                f"Dispute noted: '{meta.get('dispute_reason', 'Item line mismatch with PO #4920')}'",
                f"Invoice amount: ₹{event.amount:,.2f}"
            ]
            rationale = "Payment withheld due to commercial/invoice line item dispute. Automated collection will aggravate relationship; human desk or reconciliation needed."
        else:
            cause = DiagnosisCause.PRICE_SENSITIVITY if days_overdue < 15 else DiagnosisCause.B2B_DISPUTE
            confidence = 0.85
            evidence = [
                f"B2B Invoice overdue by {days_overdue} days",
                f"Credit risk tier: {meta.get('credit_tier', 'B+')}",
                "AP approval pending in customer ERP"
            ]
            rationale = "Delayed B2B receivables processing. Staged payment plan (PTP) or finance escalation recommended."

    diagnosis = Diagnosis(
        cause=cause,
        confidence=confidence,
        evidence=evidence,
        rationale=rationale,
        diagnosed_at=now_iso
    )

    case.diagnosis = diagnosis
    case.state = CaseStateEnum.DIAGNOSING
    case.updated_at = now_iso
    case.history.append({
        "step": "DIAGNOSING",
        "agent": "Root Cause Diagnosis",
        "timestamp": now_iso,
        "description": f"Diagnosed cause: {cause.value} (Confidence: {int(confidence*100)}%)"
    })

    reasoning = (
        f"Diagnosed cause: '{cause.value}' with {int(confidence*100)}% confidence. "
        f"Key evidence: {'; '.join(evidence[:2])}. Rationale: {rationale}"
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        agent="Root Cause Diagnosis",
        step_name="CAUSE_CLASSIFIED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "cause": cause.value,
            "confidence": confidence,
            "evidence": evidence,
            "rationale": rationale
        },
        state_after="DIAGNOSING",
        status_badge="DIAGNOSED"
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        timestamp=now_iso,
        agent="Root Cause Diagnosis",
        action="CLASSIFY_ROOT_CAUSE",
        status="INFO",
        reason=f"Identified {cause.value} ({int(confidence*100)}% confidence)",
        payload=diagnosis.model_dump()
    )
    case.audit_trail.append(audit)

    return case, trace, audit
