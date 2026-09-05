import sqlite3
import pytest
from fastapi.testclient import TestClient
from main import app, EXPECTED_API_KEY
from engine.batch_runner import runner
from models import Case, RiskEvent, AuditEntry, CaseStateEnum, RiskEventType
import database

client = TestClient(app)
AUTH_HEADERS = {"X-API-Key": EXPECTED_API_KEY}


def setup_function():
    """Reset simulation and DB before each test."""
    runner.set_speed(100.0)
    runner.reset(count=20, seed=42)


def test_api_key_authentication_enforcement():
    """Mutating & sensitive endpoints must reject requests with missing or invalid API keys with 401."""
    # 1. Missing API Key on Mutating Endpoint
    res_no_key = client.post("/api/simulation/start")
    assert res_no_key.status_code == 401
    assert "Unauthorized" in res_no_key.json()["detail"]["error"]

    # 2. Invalid API Key
    res_bad_key = client.post("/api/simulation/start", headers={"X-API-Key": "wrong-key-xyz"})
    assert res_bad_key.status_code == 401

    # 3. Valid API Key on Mutating Endpoint
    res_valid = client.post("/api/simulation/pause", headers=AUTH_HEADERS)
    assert res_valid.status_code == 200

    # 4. Protected Sensitive Read Endpoints
    res_verify_no_key = client.get("/api/audit-log/verify")
    assert res_verify_no_key.status_code == 401

    res_verify_valid = client.get("/api/audit-log/verify", headers=AUTH_HEADERS)
    assert res_verify_valid.status_code == 200

    res_export_query_key = client.get(f"/api/audit-log/export?api_key={EXPECTED_API_KEY}")
    assert res_export_query_key.status_code == 200


def test_audit_entry_plain_insert_no_upsert():
    """
    Append-only guarantee: save_audit_entry() must execute a plain INSERT.
    Inserting a duplicate audit_id must raise sqlite3.IntegrityError (never silently update).
    """
    entry1 = AuditEntry(
        audit_id="AUD-STRICT-001",
        case_id="CASE-STRICT-01",
        timestamp="2026-09-05T12:00:00",
        agent="Signal Ingestion",
        action="INGEST_EVENT",
        status="INFO",
        reason="Initial ingestion",
        payload={"amount": 1000.0}
    )
    database.save_audit_entry(entry1)

    # Attempt duplicate insert with same audit_id but modified payload
    entry2 = AuditEntry(
        audit_id="AUD-STRICT-001",
        case_id="CASE-STRICT-01",
        timestamp="2026-09-05T12:01:00",
        agent="Signal Ingestion",
        action="TAMPER_ATTEMPT",
        status="BLOCKED",
        reason="Tamper attempt",
        payload={"amount": 99999.0}
    )
    with pytest.raises(sqlite3.IntegrityError):
        database.save_audit_entry(entry2)


def test_atomic_case_and_audit_writes():
    """
    save_case_and_audit must be transactional:
    If audit insert fails due to collision, the case state write must be rolled back.
    """
    # 1. Write initial entry
    audit_prime = AuditEntry(
        audit_id="AUD-ATOMIC-EXISTING",
        case_id="CASE-ATOMIC-01",
        timestamp="2026-09-05T12:00:00",
        agent="Test Agent",
        action="INIT",
        status="INFO",
        reason="Setup",
        payload={}
    )
    database.save_audit_entry(audit_prime)

    # 2. Prepare case in DETECTED state
    event = RiskEvent(
        event_id="EVT-ATOMIC-01",
        case_id="CASE-ATOMIC-01",
        event_type=RiskEventType.PAYMENT_FAILED,
        customer_id="CUST-01",
        customer_name="Atomic Customer",
        amount=5000.0
    )
    case_initial = Case(case_id="CASE-ATOMIC-01", state=CaseStateEnum.DETECTED, event=event)
    database.save_case(case_initial)

    # 3. Try to update case to RECOVERED while pairing with duplicate audit_id
    case_updated = Case(case_id="CASE-ATOMIC-01", state=CaseStateEnum.RECOVERED, event=event, recovered_amount=5000.0)
    audit_colliding = AuditEntry(
        audit_id="AUD-ATOMIC-EXISTING",  # Will cause IntegrityError
        case_id="CASE-ATOMIC-01",
        timestamp="2026-09-05T12:05:00",
        agent="Outcome & Audit",
        action="RECOVER",
        status="RECOVERED",
        reason="Colliding update",
        payload={}
    )

    with pytest.raises(sqlite3.IntegrityError):
        database.save_case_and_audit(case_updated, audit_colliding)

    # Assert Case state in DB remained DETECTED (transaction was rolled back)
    persisted_case = database.get_case("CASE-ATOMIC-01")
    assert persisted_case is not None
    assert persisted_case.state == CaseStateEnum.DETECTED, "Case must NOT have updated to RECOVERED due to rollback"


def test_sqlite_persistence_across_restart():
    """State and cryptographic audit chain survive process restarts via SQLite."""
    # Process 5 cases
    for _ in range(5):
        client.post("/api/simulation/step", headers=AUTH_HEADERS)

    original_cases_count = len(runner.cases)
    original_audit_count = len(runner.audit_log)
    original_head = runner.latest_audit_hash
    original_stats = runner.stats.model_dump()

    assert original_cases_count == 5
    assert original_audit_count > 0

    # Simulate server restart by creating a new BatchSimulationRunner instance
    from engine.batch_runner import BatchSimulationRunner
    reloaded_runner = BatchSimulationRunner()

    assert len(reloaded_runner.cases) == original_cases_count, "Cases must be reloaded from SQLite"
    assert len(reloaded_runner.audit_log) == original_audit_count, "Audit ledger must be reloaded from SQLite"
    assert reloaded_runner.latest_audit_hash == original_head, "Hash chain tip must match"
    assert reloaded_runner.stats.processed_cases == original_stats["processed_cases"]
    
    # Cryptographic verification of reloaded ledger
    verify_result = reloaded_runner.verify_audit_log_chain()
    assert verify_result["verified"] is True
    assert verify_result["total_entries"] == original_audit_count


def test_payment_reference_required_and_unique_constraint():
    """
    PAID webhook outcomes must:
    1. Require payment_reference (422 if missing).
    2. Enforce uniqueness on payment_reference (409 if duplicate across settlements).
    """
    # 1. Inject case 1
    inj1 = client.post("/api/cases/inject", headers=AUTH_HEADERS, json={
        "customer_name": "Customer One",
        "amount": 10000.0,
        "event_type": "checkout_abandoned",
        "await_response": True
    })
    case1_id = inj1.json()["case_id"]

    # Missing payment_reference on PAID -> 422
    res_no_ref = client.post(f"/api/cases/{case1_id}/respond", headers=AUTH_HEADERS, json={
        "event_id": "EVT-PAY-111",
        "outcome": "PAID",
        "amount": 10000.0,
        "currency": "INR"
        # payment_reference omitted
    })
    assert res_no_ref.status_code == 422
    assert "payment_reference is required" in res_no_ref.json()["detail"]

    # Successful payment with unique payment_reference
    res_paid1 = client.post(f"/api/cases/{case1_id}/respond", headers=AUTH_HEADERS, json={
        "event_id": "EVT-PAY-111",
        "outcome": "PAID",
        "payment_reference": "pay_UNIQUE_9999",
        "amount": 10000.0,
        "currency": "INR"
    })
    assert res_paid1.status_code == 200
    assert res_paid1.json()["state"] == "RECOVERED"

    # 2. Inject case 2 and attempt to reuse same payment_reference
    inj2 = client.post("/api/cases/inject", headers=AUTH_HEADERS, json={
        "customer_name": "Customer Two",
        "amount": 10000.0,
        "event_type": "checkout_abandoned",
        "await_response": True
    })
    case2_id = inj2.json()["case_id"]

    res_paid2_dup = client.post(f"/api/cases/{case2_id}/respond", headers=AUTH_HEADERS, json={
        "event_id": "EVT-PAY-222",
        "outcome": "PAID",
        "payment_reference": "pay_UNIQUE_9999",  # Duplicate payment reference
        "amount": 10000.0,
        "currency": "INR"
    })
    assert res_paid2_dup.status_code == 409
    assert "already been processed" in res_paid2_dup.json()["detail"]


def test_webhook_idempotency_and_state_hardening():
    """
    Webhook must:
    1. Resolve AWAITING_RESPONSE case.
    2. Be idempotent on event_id (no double-recovery).
    3. Return 409 Conflict if case is not in AWAITING_RESPONSE.
    """
    # 1. Inject a case that lands in AWAITING_RESPONSE
    inject_res = client.post("/api/cases/inject", headers=AUTH_HEADERS, json={
        "customer_name": "Test Webhook Customer",
        "amount": 15000.0,
        "event_type": "checkout_abandoned",
        "channel_pref": "whatsapp",
        "language_pref": "hinglish",
        "dnd_flag": False,
        "local_hour": 14,
        "await_response": True
    })
    assert inject_res.status_code == 200
    case_id = inject_res.json()["case_id"]

    case = runner.cases[case_id]
    assert case.state == CaseStateEnum.AWAITING_RESPONSE

    initial_recovered_total = runner.stats.revenue_recovered

    # 2. Call Webhook with event_id
    webhook_payload = {
        "event_id": "EVT-PAY-TEST-9988",
        "outcome": "PAID",
        "payment_reference": "pay_Oq129X01",
        "amount": 15000.0,
        "currency": "INR",
        "notes": "Payment captured via Razorpay UPI"
    }
    resp1 = client.post(f"/api/cases/{case_id}/respond", headers=AUTH_HEADERS, json=webhook_payload)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["state"] == "RECOVERED"
    assert data1["recovered_amount"] == 15000.0
    assert data1["idempotent"] is False

    new_recovered_total = runner.stats.revenue_recovered
    assert new_recovered_total == initial_recovered_total + 15000.0

    # 3. Call Webhook again with SAME event_id (Idempotency test)
    resp2 = client.post(f"/api/cases/{case_id}/respond", headers=AUTH_HEADERS, json=webhook_payload)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["idempotent"] is True
    assert data2["recovered_amount"] == 15000.0

    # Ensure no double counting occurred
    assert runner.stats.revenue_recovered == new_recovered_total

    # 4. Call Webhook with NEW event_id on already RECOVERED case (409 Conflict test)
    new_payload = {
        "event_id": "EVT-PAY-NEW-3344",
        "outcome": "PAID",
        "payment_reference": "pay_Oq129X02",
        "amount": 15000.0,
        "currency": "INR"
    }
    resp3 = client.post(f"/api/cases/{case_id}/respond", headers=AUTH_HEADERS, json=new_payload)
    assert resp3.status_code == 409
    assert "AWAITING_RESPONSE" in resp3.json()["detail"]


def test_webhook_payment_mismatch_reconciliation():
    """Payment amount or currency mismatch must route to ESCALATED (reconciliation needed)."""
    # Inject case in AWAITING_RESPONSE with expected amount 25,000 INR
    inject_res = client.post("/api/cases/inject", headers=AUTH_HEADERS, json={
        "customer_name": "Mismatch Corp",
        "amount": 25000.0,
        "event_type": "checkout_abandoned",
        "channel_pref": "whatsapp",
        "dnd_flag": False,
        "local_hour": 14,
        "await_response": True
    })
    assert inject_res.status_code == 200
    case_id = inject_res.json()["case_id"]

    # Partial / mismatched payment reported
    mismatch_payload = {
        "event_id": "EVT-MISMATCH-1122",
        "outcome": "PAID",
        "payment_reference": "pay_MISMATCH_881",
        "amount": 12000.0,  # Expected 25,000 but received 12,000
        "currency": "INR",
        "notes": "Customer made partial payment"
    }
    res = client.post(f"/api/cases/{case_id}/respond", headers=AUTH_HEADERS, json=mismatch_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["state"] == "ESCALATED", "Amount mismatch must escalate for reconciliation"
    assert data["recovered_amount"] == 0.0, "Mismatched payment must not be silently marked as fully recovered"
    assert "mismatch" in data["case"]["final_outcome_reason"].lower()
