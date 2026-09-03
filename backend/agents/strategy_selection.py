import uuid
from datetime import datetime
from typing import Tuple
from models import (
    Case, InterventionPlan, InterventionType, DiagnosisCause, 
    CaseStateEnum, AuditEntry, TraceEvent, RiskEventType
)


def select_strategy(case: Case) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 3: Strategy Selection
    Maps diagnosis + customer segment + channel & language pref → intervention plan.
    Generates tailored Hinglish / English recovery copy, retry timing, or PTP terms.
    """
    now_iso = datetime.now().isoformat()
    event = case.event
    diagnosis = case.diagnosis
    cause = diagnosis.cause if diagnosis else DiagnosisCause.INSUFFICIENT_FUNDS
    
    intervention_type: InterventionType
    channel: str = event.channel_pref
    timing: str = "immediate"
    copy_text: str = ""
    voice_script: dict = None
    alt_method: str = None
    discount_code: str = None
    ptp_terms: dict = None
    estimated_cost: float = 0.50
    rationale: str = ""

    first_name = event.customer_name.split()[0]
    short_link = f"https://rzp.io/i/rec{uuid.uuid4().hex[:5]}"

    # --- Strategy Mapping Matrix ---
    if cause == DiagnosisCause.ISSUER_TIMEOUT:
        intervention_type = InterventionType.RETRY_NOW
        channel = "gateway_auto_retry"
        timing = "immediate_t_plus_30s"
        estimated_cost = 0.05
        rationale = "Transient issuer switch glitch. Direct gateway retry is highest ROI with zero customer friction."

    elif cause == DiagnosisCause.INSUFFICIENT_FUNDS:
        if event.retry_count == 0:
            intervention_type = InterventionType.RETRY_SCHEDULED
            channel = "gateway_smart_retry"
            timing = "scheduled_t_plus_6h"
            estimated_cost = 0.05
            rationale = "Insufficient funds detected. Scheduled smart auto-retry during next bank clearing window."
        else:
            intervention_type = InterventionType.WHATSAPP_NUDGE
            channel = "whatsapp"
            timing = "immediate"
            estimated_cost = 0.75
            if event.language_pref == "hinglish":
                copy_text = (
                    f"Namaste {first_name} ji! 👋 Aapka ₹{event.amount:,.2f} ka payment bank balance issue ke "
                    f"karan hold pe hai. Apne order ko secure rakhne ke liye 1-click me kisi bhi UPI app ya doosre card "
                    f"se pay karein: {short_link} ⚡ Koi help chahiye to reply karein!"
                )
            else:
                copy_text = (
                    f"Hi {first_name}, your payment of ₹{event.amount:,.2f} could not be processed due to insufficient "
                    f"funds. Please complete it via any UPI app or alternative card here: {short_link} to avoid cancellation."
                )
            rationale = "Primary automated retry failed; dispatched conversational recovery link over WhatsApp."

    elif cause == DiagnosisCause.EXPIRED_CARD:
        intervention_type = InterventionType.ALT_PAYMENT_METHOD
        channel = event.channel_pref or "whatsapp"
        alt_method = "UPI AutoPay / Saved NetBanking"
        estimated_cost = 0.75
        if event.language_pref == "hinglish":
            copy_text = (
                f"Namaste {first_name} ji, aapka registered card expire ho chuka hai. Service uninterrupted "
                f"rakhne ke liye UPI AutoPay ya naye card se update karein (sirf 30 seconds): {short_link} 🔒"
            )
        else:
            copy_text = (
                f"Hi {first_name}, your saved card on file has expired. Please update your payment method or switch to "
                f"instant UPI AutoPay here: {short_link} to prevent service disruption."
            )
        rationale = "Expired token cannot be retried. Routing customer to seamless alternative payment method flow."

    elif cause == DiagnosisCause.MANDATE_NOT_REGISTERED:
        intervention_type = InterventionType.ALT_PAYMENT_METHOD
        channel = "whatsapp"
        alt_method = "NPCI UPI AutoPay Mandate"
        estimated_cost = 0.75
        if event.language_pref == "hinglish":
            copy_text = (
                f"Namaste {first_name} ji! Aapka monthly subscription mandate re-verification mang raha hai. "
                f"Google Pay / PhonePe se 1-click me AutoPay approve karein: {short_link} ✨"
            )
        else:
            copy_text = (
                f"Hello {first_name}, your recurring mandate requires re-authentication per RBI norms. "
                f"Authorize instant UPI AutoPay with one tap here: {short_link}."
            )
        rationale = "E-mandate registration missing. Customer directed to instant UPI AutoPay approval."

    elif cause == DiagnosisCause.PRICE_SENSITIVITY:
        intervention_type = InterventionType.WHATSAPP_NUDGE
        channel = "whatsapp"
        discount_code = "RECOVER8"
        estimated_cost = 0.75
        discount_amount = round(event.amount * 0.08, 2)
        if event.language_pref == "hinglish":
            copy_text = (
                f"Hey {first_name}! Notice kiya aapka checkout complete nahi hua. Aapke liye special 8% discount code "
                f"'{discount_code}' (bachta ₹{discount_amount:,.0f}) apply ho gaya hai! "
                f"Yahan se order finalize karein: {short_link}?code={discount_code} 🎁"
            )
        else:
            copy_text = (
                f"Hi {first_name}, we noticed you left items in your cart. We've applied an exclusive 8% discount code "
                f"'{discount_code}' for you. Complete your order now: {short_link}?code={discount_code} 🛒"
            )
        rationale = "Price barrier identified at checkout. Generated time-sensitive 8% concession nudge."

    elif cause == DiagnosisCause.B2B_DISPUTE:
        if event.amount > 50000 and event.metadata.get("days_overdue", 0) >= 5:
            intervention_type = InterventionType.HUMAN_ESCALATION
            channel = "finance_desk_ticket"
            estimated_cost = 15.00
            rationale = "High-value B2B invoice (>₹50k) with overdue dispute. Triggering mandatory human escalation."
        else:
            intervention_type = InterventionType.PROMISE_TO_PAY_NEGOTIATION
            channel = "email"
            ptp_terms = {
                "total_due": event.amount,
                "split_allowed": True,
                "tranche_1": round(event.amount * 0.5, 2),
                "tranche_2": round(event.amount * 0.5, 2),
                "due_dates": ["3 business days", "15 business days"]
            }
            copy_text = (
                f"Dear Accounts Team at {event.customer_name},\n\n"
                f"Regarding Invoice #{event.metadata.get('invoice_number', 'INV-8891')} for ₹{event.amount:,.2f}: "
                f"We understand there may be line-item clarifications. To maintain uninterrupted credit terms, "
                f"we propose a split reconciliation: 50% (₹{ptp_terms['tranche_1']:,.2f}) commitment via portal: {short_link}.\n\n"
                f"Regards,\nCredit & Receivables Desk"
            )
            estimated_cost = 1.20
            rationale = "Initiating structured Promise-to-Pay (PTP) negotiation with 50/50 tranche split option."

    else:  # SILENT_CHURN
        intervention_type = InterventionType.WHATSAPP_NUDGE
        channel = "whatsapp"
        estimated_cost = 0.75
        if event.language_pref == "hinglish":
            copy_text = (
                f"Namaste {first_name}! We noticed your account renewal is paused. We'd love to help you continue. "
                f"Renew with 1 click: {short_link} or reply to this chat if you have any questions."
            )
        else:
            copy_text = (
                f"Hello {first_name}, your account renewal is pending. Keep access to your benefits by renewing here: {short_link}."
            )
        rationale = "Gentle re-engagement nudge for stalled subscription."

    # If channel preference is voice or high value consumer, generate synthetic voice dialogue script
    if event.channel_pref == "voice" or (event.amount > 25000 and event.event_type == RiskEventType.CHECKOUT_ABANDONED):
        voice_script = {
            "caller_id": "+91 80 6900 1200",
            "language": "hinglish" if event.language_pref == "hinglish" else "english",
            "opening_line": f"Namaste {first_name} ji, main Razorpay Verified Support se bol rahi hoon aapke pending order ke regarding.",
            "objection_handling": {
                "no_balance": "Koi baat nahi sir, hum aapko WhatsApp pe UPI payment link bhej dete hain, aap shaam tak pay kar sakte hain.",
                "card_failed": "Aap Google Pay ya PhonePe se direct 1 tap me complete kar sakte hain."
            }
        }

    plan = InterventionPlan(
        intervention_type=intervention_type,
        channel=channel,
        timing=timing,
        copy_text=copy_text if copy_text else None,
        voice_script=voice_script,
        alt_method_suggested=alt_method,
        discount_code=discount_code,
        ptp_terms=ptp_terms,
        estimated_cost=estimated_cost,
        rationale=rationale
    )

    case.intervention = plan
    case.state = CaseStateEnum.STRATEGY_SELECTED
    case.updated_at = now_iso
    case.history.append({
        "step": "STRATEGY_SELECTED",
        "agent": "Strategy Selection",
        "timestamp": now_iso,
        "description": f"Selected intervention: {intervention_type.value} via {channel}"
    })

    reasoning = (
        f"Selected strategy '{intervention_type.value}' over channel '{channel}'. "
        f"Timing: {timing}. Est. Cost: ₹{estimated_cost:.2f}. Rationale: {rationale}"
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        agent="Strategy Selection",
        step_name="INTERVENTION_PLANNED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "intervention_type": intervention_type.value,
            "channel": channel,
            "timing": timing,
            "copy_text": copy_text[:120] + "..." if len(copy_text) > 120 else copy_text,
            "alt_method": alt_method,
            "discount_code": discount_code,
            "ptp_terms": ptp_terms,
            "estimated_cost": estimated_cost
        },
        state_after="STRATEGY_SELECTED",
        status_badge="PLANNED"
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case.case_id,
        timestamp=now_iso,
        agent="Strategy Selection",
        action="PLAN_INTERVENTION",
        status="INFO",
        reason=f"Formulated {intervention_type.value} intervention via {channel}",
        payload=plan.model_dump()
    )
    case.audit_trail.append(audit)

    return case, trace, audit
