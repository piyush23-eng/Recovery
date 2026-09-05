import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class RiskEventType(str, Enum):
    PAYMENT_FAILED = "payment_failed"
    CHECKOUT_ABANDONED = "checkout_abandoned"
    SUBSCRIPTION_FAILED = "subscription_failed"
    INVOICE_OVERDUE = "invoice_overdue"


class DiagnosisCause(str, Enum):
    INSUFFICIENT_FUNDS = "insufficient_funds"
    EXPIRED_CARD = "expired_card"
    ISSUER_TIMEOUT = "issuer_timeout"
    MANDATE_NOT_REGISTERED = "mandate_not_registered"
    PRICE_SENSITIVITY = "price_sensitivity"
    B2B_DISPUTE = "B2B_dispute"
    SILENT_CHURN = "silent_churn"


class InterventionType(str, Enum):
    RETRY_NOW = "retry_now"
    RETRY_SCHEDULED = "retry_scheduled"
    WHATSAPP_NUDGE = "whatsapp_nudge"
    ALT_PAYMENT_METHOD = "alt_payment_method"
    HUMAN_ESCALATION = "human_escalation"
    PROMISE_TO_PAY_NEGOTIATION = "promise_to_pay_negotiation"


class CaseStateEnum(str, Enum):
    DETECTED = "DETECTED"
    DIAGNOSING = "DIAGNOSING"
    STRATEGY_SELECTED = "STRATEGY_SELECTED"
    COMPLIANCE_CHECK = "COMPLIANCE_CHECK"
    ACTION_EXECUTED = "ACTION_EXECUTED"
    AWAITING_RESPONSE = "AWAITING_RESPONSE"
    RECOVERED = "RECOVERED"
    RETRY = "RETRY"
    ESCALATED = "ESCALATED"
    STOPPED = "STOPPED"


class ComplianceRuleStatus(str, Enum):
    PASSED = "PASSED"
    BLOCKED = "BLOCKED"
    WARNED = "WARNED"


class ComplianceCheckDetail(BaseModel):
    rule_name: str
    status: ComplianceRuleStatus
    reason: str
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class RiskEvent(BaseModel):
    event_id: str
    case_id: str
    event_type: RiskEventType
    customer_id: str
    customer_name: str
    customer_segment: Literal["SMB", "ENTERPRISE", "CONSUMER_PRO", "CONSUMER_RETAIL"] = "CONSUMER_RETAIL"
    amount: float
    currency: str = "INR"
    channel_pref: Literal["whatsapp", "sms", "email", "voice", "portal"] = "whatsapp"
    language_pref: Literal["hinglish", "english", "hindi"] = "hinglish"
    dnd_flag: bool = False
    prior_contact_count_24h: int = 0
    retry_count: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    local_hour: int = 14  # 0 to 23 (for quiet hours check: 9pm-9am is 21 to 8)
    cumulative_cost: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Diagnosis(BaseModel):
    cause: DiagnosisCause
    confidence: float
    evidence: List[str]
    rationale: str
    diagnosed_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class InterventionPlan(BaseModel):
    intervention_type: InterventionType
    channel: str
    timing: str = "immediate"
    copy_text: Optional[str] = None
    voice_script: Optional[Dict[str, Any]] = None
    alt_method_suggested: Optional[str] = None
    discount_code: Optional[str] = None
    ptp_terms: Optional[Dict[str, Any]] = None
    estimated_cost: float = 0.50
    rationale: str = ""


class ComplianceResult(BaseModel):
    allowed: bool
    primary_reason: str
    checks: List[ComplianceCheckDetail]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ActionResult(BaseModel):
    action_type: str
    status: Literal["SUCCESS", "QUEUED", "SIMULATED_FAILURE", "VETOED_BY_COMPLIANCE", "ESCALATED"]
    payload: Dict[str, Any]
    cost_incurred: float = 0.0
    executed_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    response_simulated: Optional[Dict[str, Any]] = None


class AuditEntry(BaseModel):
    audit_id: str
    case_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    agent: str
    action: str
    status: Literal["INFO", "PASSED", "BLOCKED", "EXECUTED", "RECOVERED", "ESCALATED", "STOPPED"]
    reason: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    prev_hash: Optional[str] = None
    entry_hash: Optional[str] = None


def compute_audit_entry_hash(prev_hash: str, entry: Dict[str, Any]) -> str:
    """
    Computes a cryptographic SHA-256 hash over the canonical JSON serialization
    of the AuditEntry combined with the previous entry's hash.
    """
    canonical_payload = {
        "audit_id": entry.get("audit_id"),
        "case_id": entry.get("case_id"),
        "timestamp": entry.get("timestamp"),
        "agent": entry.get("agent"),
        "action": entry.get("action"),
        "status": entry.get("status"),
        "reason": entry.get("reason"),
        "payload": entry.get("payload", {}),
        "prev_hash": prev_hash
    }
    canonical_json = json.dumps(canonical_payload, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256((prev_hash + canonical_json).encode("utf-8")).hexdigest()


class Case(BaseModel):
    case_id: str
    state: CaseStateEnum = CaseStateEnum.DETECTED
    event: RiskEvent
    diagnosis: Optional[Diagnosis] = None
    intervention: Optional[InterventionPlan] = None
    compliance: Optional[ComplianceResult] = None
    action_result: Optional[ActionResult] = None
    recovered_amount: float = 0.0
    cumulative_cost: float = 0.0
    history: List[Dict[str, Any]] = Field(default_factory=list)
    audit_trail: List[AuditEntry] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    final_outcome_reason: Optional[str] = None


class TraceEvent(BaseModel):
    trace_id: str
    case_id: str
    agent: str
    step_name: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    reasoning: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    state_after: str
    status_badge: str = "INFO"


class LedgerStats(BaseModel):
    total_cases: int = 300
    processed_cases: int = 0
    revenue_at_risk: float = 0.0
    revenue_recovered: float = 0.0
    recovery_rate_pct: float = 0.0
    total_cost_incurred: float = 0.0
    net_revenue_recovered: float = 0.0
    roi_multiplier: float = 0.0
    compliance_stops_count: int = 0
    escalated_count: int = 0
    retry_count: int = 0
    status_distribution: Dict[str, int] = Field(default_factory=dict)
    type_breakdown: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    funnel: Dict[str, int] = Field(default_factory=lambda: {
        "detected": 0,
        "diagnosed": 0,
        "contacted": 0,
        "responded": 0,
        "promised": 0,
        "recovered": 0
    })
    veto_reasons: Dict[str, int] = Field(default_factory=dict)
