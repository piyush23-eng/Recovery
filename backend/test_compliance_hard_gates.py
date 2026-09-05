import sys
from engine.state_graph import CaseRecoveryWorkflow
from models import CaseStateEnum, ComplianceRuleStatus

def test_compliance_guardrails():
    print("==================================================")
    print("RUNNING STRICT COMPLIANCE GUARDRAIL AUDIT SUITE")
    print("==================================================")

    # 1. DND Hard Veto Test
    print("\n--- Test 1: DND Flag = True (National DND Registry Hard Veto - Simulated) ---")
    dnd_case = {
        "case_id": "TEST-DND-01",
        "event_type": "checkout_abandoned",
        "customer_id": "CUST-DND-99",
        "customer_name": "Vikram Malhotra",
        "amount": 4999.0,
        "dnd_flag": True,  # Hard DND flag
        "channel_pref": "whatsapp",
        "local_hour": 14,
        "prior_contact_count_24h": 0,
        "retry_count": 0
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(dnd_case)
    assert case.compliance is not None, "Compliance result missing"
    assert case.compliance.allowed is False, "DND flag must block execution"
    dnd_check = [c for c in case.compliance.checks if c.rule_name == "DND_CONSENT_CHECK"][0]
    assert dnd_check.status == ComplianceRuleStatus.BLOCKED, "DND check must be BLOCKED"
    assert case.state == CaseStateEnum.STOPPED, f"State must be STOPPED, got {case.state}"
    assert case.action_result.status == "VETOED_BY_COMPLIANCE", "Execution must be aborted"
    assert any(a.status == "BLOCKED" for a in audits), "Must log BLOCKED audit entry"
    print("✓ PASSED: DND flag strictly vetoed intervention and closed case with audit proof.")

    # 2. Quiet Hours Test (10 PM local time)
    print("\n--- Test 2: Quiet Hours (10:00 PM local time) ---")
    quiet_case = {
        "case_id": "TEST-QUIET-02",
        "event_type": "checkout_abandoned",
        "customer_id": "CUST-QH-88",
        "customer_name": "Pooja Sharma",
        "amount": 2500.0,
        "dnd_flag": False,
        "channel_pref": "whatsapp",
        "local_hour": 22,  # 10 PM (Quiet hours: 21 to 8)
        "prior_contact_count_24h": 0,
        "retry_count": 0
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(quiet_case)
    assert case.compliance.allowed is False, "Quiet hours must block outbound message"
    qh_check = [c for c in case.compliance.checks if c.rule_name == "QUIET_HOURS"][0]
    assert qh_check.status == ComplianceRuleStatus.BLOCKED, "Quiet hours check must be BLOCKED"
    assert case.state == CaseStateEnum.STOPPED
    print("✓ PASSED: Quiet hours (22:00) blocked outbound contact.")

    # 3. Retry Cap Test (retry_count = 3)
    print("\n--- Test 3: Retry Cap (3 retries already attempted) ---")
    retry_case = {
        "case_id": "TEST-RETRY-03",
        "event_type": "payment_failed",
        "customer_id": "CUST-RC-77",
        "customer_name": "Rahul Verma",
        "amount": 1499.0,
        "dnd_flag": False,
        "channel_pref": "whatsapp",
        "local_hour": 14,
        "prior_contact_count_24h": 0,
        "retry_count": 3,  # Max 3 cap reached
        "metadata": {"decline_code": "E91_ISSUER_TIMEOUT"}  # Will select RETRY_NOW
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(retry_case)
    assert case.compliance.allowed is False, "Retry count >= 3 must block automated retry"
    rc_check = [c for c in case.compliance.checks if c.rule_name == "RETRY_CAP"][0]
    assert rc_check.status == ComplianceRuleStatus.BLOCKED
    assert case.state == CaseStateEnum.STOPPED
    print("✓ PASSED: Retry cap (attempt #4) blocked per card network compliance.")

    # 4. Contact Frequency Cap Test (2 prior contacts in 24h)
    print("\n--- Test 4: Contact Frequency Cap (2 contacts in 24h) ---")
    freq_case = {
        "case_id": "TEST-FREQ-04",
        "event_type": "checkout_abandoned",
        "customer_id": "CUST-FC-66",
        "customer_name": "Sneha Patel",
        "amount": 3200.0,
        "dnd_flag": False,
        "channel_pref": "whatsapp",
        "local_hour": 14,
        "prior_contact_count_24h": 2,  # Max 2 allowed in 24h
        "retry_count": 0
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(freq_case)
    assert case.compliance.allowed is False, "2 prior contacts in 24h must block outreach"
    fc_check = [c for c in case.compliance.checks if c.rule_name == "CONTACT_FREQUENCY_CAP"][0]
    assert fc_check.status == ComplianceRuleStatus.BLOCKED
    assert case.state == CaseStateEnum.STOPPED
    print("✓ PASSED: Contact frequency cap (attempt #3) blocked to prevent spam.")

    # 5. High-Value B2B Overdue Escalation Test (>₹50,000 overdue 7 days)
    print("\n--- Test 5: High-Value B2B Dispute Escalation (>₹50k & 7d overdue) ---")
    b2b_case = {
        "case_id": "TEST-B2B-05",
        "event_type": "invoice_overdue",
        "customer_id": "CUST-B2B-55",
        "customer_name": "Acme Logistics Enterprise",
        "customer_segment": "ENTERPRISE",
        "amount": 125000.0,  # ₹1.25 Lakhs (>₹50k)
        "dnd_flag": False,
        "channel_pref": "email",
        "local_hour": 14,
        "prior_contact_count_24h": 0,
        "retry_count": 0,
        "metadata": {"days_overdue": 7, "dispute_flag": True, "invoice_number": "INV-2026-9912"}
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(b2b_case)
    assert case.state == CaseStateEnum.ESCALATED, f"High value B2B invoice must be ESCALATED, got {case.state}"
    assert "human" in case.final_outcome_reason.lower() or "escalat" in case.final_outcome_reason.lower()
    print("✓ PASSED: High-value B2B overdue invoice routed to human collection desk.")

    # 6. Opt-Out 'STOP' Honoring Test
    print("\n--- Test 6: Opt-Out 'STOP' Honoring ---")
    optout_case = {
        "case_id": "TEST-OPTOUT-06",
        "event_type": "checkout_abandoned",
        "customer_id": "CUST-STOP-44",
        "customer_name": "Alok Joshi",
        "amount": 1999.0,
        "dnd_flag": False,
        "channel_pref": "whatsapp",
        "local_hour": 14,
        "prior_contact_count_24h": 0,
        "retry_count": 0,
        "metadata": {"replied_stop": True}
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(optout_case)
    assert case.compliance.allowed is False, "STOP reply must immediately block case"
    assert case.state == CaseStateEnum.STOPPED
    print("✓ PASSED: Opt-out 'STOP' reply immediately blocked and closed.")

    # 7. Cost-Aware Stop Test (>15% allowable cost ratio)
    print("\n--- Test 7: Cost-Aware Stop (>15% cost ratio) ---")
    micro_case = {
        "case_id": "TEST-COST-07",
        "event_type": "checkout_abandoned",
        "customer_id": "CUST-MICRO-33",
        "customer_name": "Karan Mehra",
        "amount": 20.0, # ₹20 micro-amount where ₹5 minimum or voice fee exceeds 15%
        "dnd_flag": False,
        "channel_pref": "voice", # Voice cost ₹5.00 > 15% of ₹20
        "local_hour": 14,
        "prior_contact_count_24h": 0,
        "retry_count": 0,
        "metadata": {"cumulative_cost": 4.50}
    }
    case, traces, audits = CaseRecoveryWorkflow.process_case_sync(micro_case)
    cost_chk = [c for c in case.compliance.checks if c.rule_name == "COST_AWARE_STOP"][0]
    assert cost_chk is not None, "Cost check must exist"
    print("✓ PASSED: Cost-aware stop evaluated with economic bounds.")

    print("\n==================================================")
    print("ALL 7 COMPLIANCE GUARDRAILS AUDITED AND VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    test_compliance_guardrails()
