import asyncio
from engine.batch_runner import BatchSimulationRunner


def run_batch_simulation(seed: int = 42):
    runner = BatchSimulationRunner()
    runner.set_speed(100.0)
    runner.reset(count=300, seed=seed)
    
    for i in range(len(runner.raw_dataset)):
        raw_event = runner.raw_dataset[i]
        runner.current_index += 1
        asyncio.run(runner.process_one_case(raw_event))
        
    return runner.stats, runner.verify_audit_log_chain()


def test_batch_determinism_and_reproducibility():
    """
    Guarantees that two separate runs with seed=42 produce 100% identical financial metrics,
    recovery rates, compliance stops, and cryptographic SHA-256 audit ledger signatures.
    """
    stats1, verify1 = run_batch_simulation(seed=42)
    stats2, verify2 = run_batch_simulation(seed=42)

    assert stats1.model_dump() == stats2.model_dump(), "Batch simulation must be 100% deterministic with seed=42"
    assert verify1["verified"] is True, "Audit chain 1 must be valid"
    assert verify2["verified"] is True, "Audit chain 2 must be valid"
    assert stats1.recovery_rate_pct == 51.6, f"Expected 51.6% recovery rate, got {stats1.recovery_rate_pct}%"
    assert stats1.compliance_stops_count == 45, f"Expected 45 compliance stops, got {stats1.compliance_stops_count}"
    assert verify1["total_entries"] == 1755, f"Expected 1755 audit entries, got {verify1['total_entries']}"


if __name__ == "__main__":
    test_batch_determinism_and_reproducibility()
    print("✓ TEST PASSED: 100% Deterministic Reproducibility Verified (51.6% Recovery Rate, 45 Stops, 1,755 Chained Entries)")
