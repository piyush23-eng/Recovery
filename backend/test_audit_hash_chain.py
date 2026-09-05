import pytest
from engine.batch_runner import BatchSimulationRunner
from models import compute_audit_entry_hash


def test_hash_chain_creation_and_verification():
    """
    Verifies that the BatchSimulationRunner builds an unbroken SHA-256 hash chain
    starting from the genesis block and that verify_audit_log_chain() passes.
    """
    runner = BatchSimulationRunner()
    runner.reset(count=20, seed=42)
    
    # Process 5 cases synchronously
    for i in range(5):
        raw_event = runner.raw_dataset[i]
        runner.current_index += 1
        # Synchronous test invocation
        import asyncio
        asyncio.run(runner.process_one_case(raw_event))

    assert len(runner.audit_log) > 0, "Audit log should have entries"
    
    # Run cryptographic verification
    result = runner.verify_audit_log_chain()
    assert result["verified"] is True, f"Verification failed: {result}"
    assert result["tampered"] is False
    assert result["genesis_hash"] == "0" * 64
    assert result["total_entries"] == len(runner.audit_log)
    print(f"✓ Hash chain verified cleanly over {result['total_entries']} entries!")


def test_tamper_detection():
    """
    Intentionally tampers with an audit entry payload and verifies that
    verify_audit_log_chain() immediately catches and isolates the tampered entry.
    """
    runner = BatchSimulationRunner()
    runner.reset(count=10, seed=42)
    
    import asyncio
    for i in range(3):
        asyncio.run(runner.process_one_case(runner.raw_dataset[i]))

    assert len(runner.audit_log) >= 3

    # Tamper with the reason field of entry at index 2
    original_reason = runner.audit_log[2].reason
    runner.audit_log[2].reason = "TAMPERED: Illegally altered reason string!"

    # Verify detection
    tamper_result = runner.verify_audit_log_chain()
    assert tamper_result["verified"] is False, "Verification must fail when an entry is tampered"
    assert tamper_result["tampered_index"] == 2
    assert tamper_result["audit_id"] == runner.audit_log[2].audit_id
    print(f"✓ Tamper-evidence verified! Detected malicious mutation at index {tamper_result['tampered_index']}.")


if __name__ == "__main__":
    test_hash_chain_creation_and_verification()
    test_tamper_detection()
    print("ALL AUDIT HASH CHAIN TESTS PASSED!")
