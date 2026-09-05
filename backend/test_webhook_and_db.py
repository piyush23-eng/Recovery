import pytest
from fastapi.testclient import TestClient
from main import app
from engine.batch_runner import runner
from models import CaseStateEnum
import database

client = TestClient(app)
API_KEY = "demo-recovery-key-2026"
AUTH_HEADERS = {"X-API-Key": API_KEY}


def setup_function():
    """Reset simulation and DB before each test."""
    runner.set_speed(100.0)
    runner.reset(count=20, seed=42)


def test_api_key_authentication_enforcement():
    """Mutating endpoints must reject requests with missing or invalid API keys with 401."""
    # Missing API Key
    res_no_key = client.post("/api/simulation/start")
    assert res_no_key.status_code == 401
    assert "Unauthorized" in res_no_key.json()["detail"]["error"]

    # Invalid API Key
    res_bad_key = client.post("/api/simulation/start", headers={"X-API-Key": "wrong-key"})
    assert res_bad_key.status_code == 401

    # Valid API Key
    res_valid = client.post("/api/simulation/pause", headers=AUTH_HEADERS)
    assert res_valid.status_code == 200


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
        "amount": 15000.0,
        "currency": "INR",
        "notes": "Payment captured via Razorpay UPI",
        "payment_reference": "pay_Oq129X01"
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
