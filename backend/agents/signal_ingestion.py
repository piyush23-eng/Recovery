import uuid
from datetime import datetime
from typing import Dict, Any, Tuple
from models import RiskEvent, RiskEventType, Case, CaseStateEnum, AuditEntry, TraceEvent


def ingest_signal(raw_event: Dict[str, Any]) -> Tuple[Case, TraceEvent, AuditEntry]:
    """
    Agent 1: Signal Ingestion
    Normalizes 4 event types (payment_failed, checkout_abandoned, subscription_failed, invoice_overdue)
    into standard RiskEvent schema and initializes the Case state machine.
    """
    case_id = raw_event.get("case_id") or f"CASE-{uuid.uuid4().hex[:8].upper()}"
    event_id = raw_event.get("event_id") or f"EVT-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now().isoformat()
    
    event_type_str = raw_event.get("event_type", "payment_failed")
    try:
        event_type = RiskEventType(event_type_str)
    except ValueError:
        event_type = RiskEventType.PAYMENT_FAILED

    risk_event = RiskEvent(
        event_id=event_id,
        case_id=case_id,
        event_type=event_type,
        customer_id=raw_event.get("customer_id", f"CUST-{uuid.uuid4().hex[:6].upper()}"),
        customer_name=raw_event.get("customer_name", "Customer"),
        customer_segment=raw_event.get("customer_segment", "CONSUMER_RETAIL"),
        amount=float(raw_event.get("amount", 999.0)),
        currency=raw_event.get("currency", "INR"),
        channel_pref=raw_event.get("channel_pref", "whatsapp"),
        language_pref=raw_event.get("language_pref", "hinglish"),
        dnd_flag=bool(raw_event.get("dnd_flag", False)),
        prior_contact_count_24h=int(raw_event.get("prior_contact_count_24h", 0)),
        retry_count=int(raw_event.get("retry_count", 0)),
        timestamp=raw_event.get("timestamp", now_iso),
        local_hour=int(raw_event.get("local_hour", 14)),
        cumulative_cost=float(raw_event.get("cumulative_cost", 0.0)),
        metadata=raw_event.get("metadata", {})
    )

    case = Case(
        case_id=case_id,
        state=CaseStateEnum.DETECTED,
        event=risk_event,
        created_at=now_iso,
        updated_at=now_iso,
        history=[{
            "step": "DETECTED",
            "agent": "Signal Ingestion",
            "timestamp": now_iso,
            "description": f"Ingested {event_type.value} signal for ₹{risk_event.amount:,.2f} from {risk_event.customer_name}"
        }]
    )

    reasoning = (
        f"Normalized {risk_event.event_type.value.upper()} signal for customer '{risk_event.customer_name}' "
        f"({risk_event.customer_segment}). Revenue at risk: ₹{risk_event.amount:,.2f}. "
        f"Channel pref: {risk_event.channel_pref}, Lang: {risk_event.language_pref}. DND: {risk_event.dnd_flag}."
    )

    trace = TraceEvent(
        trace_id=f"TRC-{uuid.uuid4().hex[:8]}",
        case_id=case_id,
        agent="Signal Ingestion",
        step_name="SIGNAL_NORMALIZED",
        timestamp=now_iso,
        reasoning=reasoning,
        payload={
            "event_id": event_id,
            "event_type": risk_event.event_type.value,
            "customer": risk_event.customer_name,
            "amount": risk_event.amount,
            "segment": risk_event.customer_segment,
            "metadata": risk_event.metadata
        },
        state_after="DETECTED",
        status_badge="INGESTED"
    )

    audit = AuditEntry(
        audit_id=f"AUD-{uuid.uuid4().hex[:8]}",
        case_id=case_id,
        timestamp=now_iso,
        agent="Signal Ingestion",
        action="NORMALIZE_RISK_SIGNAL",
        status="INFO",
        reason=f"Ingested {risk_event.event_type.value} signal totaling ₹{risk_event.amount:.2f}",
        payload={"raw_event": raw_event, "normalized": risk_event.model_dump()}
    )

    case.audit_trail.append(audit)
    return case, trace, audit
