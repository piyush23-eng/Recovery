export type RiskEventType = 'payment_failed' | 'checkout_abandoned' | 'subscription_failed' | 'invoice_overdue';

export type DiagnosisCause =
  | 'insufficient_funds'
  | 'expired_card'
  | 'issuer_timeout'
  | 'mandate_not_registered'
  | 'price_sensitivity'
  | 'B2B_dispute'
  | 'silent_churn';

export type InterventionType =
  | 'retry_now'
  | 'retry_scheduled'
  | 'whatsapp_nudge'
  | 'alt_payment_method'
  | 'human_escalation'
  | 'promise_to_pay_negotiation';

export type CaseState =
  | 'DETECTED'
  | 'DIAGNOSING'
  | 'STRATEGY_SELECTED'
  | 'COMPLIANCE_CHECK'
  | 'ACTION_EXECUTED'
  | 'AWAITING_RESPONSE'
  | 'RECOVERED'
  | 'RETRY'
  | 'ESCALATED'
  | 'STOPPED';

export interface ComplianceCheckDetail {
  rule_name: string;
  status: 'PASSED' | 'BLOCKED' | 'WARNED';
  reason: string;
  evaluated_at: string;
}

export interface RiskEvent {
  event_id: string;
  case_id: string;
  event_type: RiskEventType;
  customer_id: string;
  customer_name: string;
  customer_segment: 'SMB' | 'ENTERPRISE' | 'CONSUMER_PRO' | 'CONSUMER_RETAIL';
  amount: number;
  currency: string;
  channel_pref: string;
  language_pref: string;
  dnd_flag: boolean;
  prior_contact_count_24h: number;
  retry_count: number;
  timestamp: string;
  local_hour: number;
  cumulative_cost: number;
  metadata: Record<string, any>;
}

export interface Diagnosis {
  cause: DiagnosisCause;
  confidence: number;
  evidence: string[];
  rationale: string;
  diagnosed_at: string;
}

export interface InterventionPlan {
  intervention_type: InterventionType;
  channel: string;
  timing: string;
  copy_text?: string;
  voice_script?: Record<string, any>;
  alt_method_suggested?: string;
  discount_code?: string;
  ptp_terms?: Record<string, any>;
  estimated_cost: number;
  rationale: string;
}

export interface ComplianceResult {
  allowed: boolean;
  primary_reason: string;
  checks: ComplianceCheckDetail[];
  timestamp: string;
}

export interface ActionResult {
  action_type: string;
  status: 'SUCCESS' | 'QUEUED' | 'SIMULATED_FAILURE' | 'VETOED_BY_COMPLIANCE' | 'ESCALATED';
  payload: Record<string, any>;
  cost_incurred: number;
  executed_at: string;
  response_simulated?: Record<string, any>;
}

export interface AuditEntry {
  audit_id: string;
  case_id: string;
  timestamp: string;
  agent: string;
  action: string;
  status: 'INFO' | 'PASSED' | 'BLOCKED' | 'EXECUTED' | 'RECOVERED' | 'ESCALATED' | 'STOPPED';
  reason: string;
  payload: Record<string, any>;
}

export interface Case {
  case_id: string;
  state: CaseState;
  event: RiskEvent;
  diagnosis?: Diagnosis;
  intervention?: InterventionPlan;
  compliance?: ComplianceResult;
  action_result?: ActionResult;
  recovered_amount: number;
  cumulative_cost: number;
  history: Array<{
    step: string;
    agent: string;
    timestamp: string;
    description: string;
  }>;
  audit_trail: AuditEntry[];
  created_at: string;
  updated_at: string;
  final_outcome_reason?: string;
}

export interface TraceEvent {
  trace_id: string;
  case_id: string;
  agent: string;
  step_name: string;
  timestamp: string;
  reasoning: string;
  payload: Record<string, any>;
  state_after: string;
  status_badge: string;
}

export interface LedgerStats {
  total_cases: number;
  processed_cases: number;
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate_pct: number;
  total_cost_incurred: number;
  net_revenue_recovered: number;
  roi_multiplier: number;
  compliance_stops_count: number;
  escalated_count: number;
  retry_count: number;
  status_distribution: Record<string, number>;
  type_breakdown: Record<string, { risk: number; recovered: number; count: number; recovered_count: number }>;
  funnel: {
    detected: number;
    diagnosed: number;
    contacted: number;
    responded: number;
    promised: number;
    recovered: number;
  };
  veto_reasons: Record<string, number>;
}
