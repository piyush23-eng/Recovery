import asyncio
from engine.dataset_generator import generate_synthetic_dataset
from engine.state_graph import CaseRecoveryWorkflow
from models import CaseStateEnum


def test_agent_pipeline():
    dataset = generate_synthetic_dataset(50)
    print(f"Generated {len(dataset)} synthetic events.")

    recovered_count = 0
    stopped_count = 0
    escalated_count = 0
    retry_count = 0
    total_at_risk = 0.0
    total_recovered = 0.0
    compliance_blocks = 0

    for i, event in enumerate(dataset):
        case, traces, audits = CaseRecoveryWorkflow.process_case_sync(event)
        expected_steps = 5 if (case.compliance and not case.compliance.allowed) else 6
        assert len(traces) == expected_steps, f"Expected {expected_steps} traces, got {len(traces)}"
        assert len(audits) == expected_steps, f"Expected {expected_steps} audits, got {len(audits)}"
        assert case.state in [CaseStateEnum.RECOVERED, CaseStateEnum.STOPPED, CaseStateEnum.ESCALATED, CaseStateEnum.RETRY]
        
        total_at_risk += case.event.amount
        
        if case.compliance and not case.compliance.allowed:
            compliance_blocks += 1
            print(f" [COMPLIANCE BLOCKED] Case {case.case_id}: {case.compliance.primary_reason}")

        if case.state == CaseStateEnum.RECOVERED:
            recovered_count += 1
            total_recovered += case.recovered_amount
        elif case.state == CaseStateEnum.STOPPED:
            stopped_count += 1
        elif case.state == CaseStateEnum.ESCALATED:
            escalated_count += 1
        elif case.state == CaseStateEnum.RETRY:
            retry_count += 1

    recovery_rate = (total_recovered / total_at_risk) * 100
    print("\n--- Pipeline Test Summary ---")
    print(f"Total Cases: {len(dataset)}")
    print(f"Recovered: {recovered_count} ({recovery_rate:.1f}%)")
    print(f"Stopped: {stopped_count}")
    print(f"Escalated: {escalated_count}")
    print(f"Retry: {retry_count}")
    print(f"Compliance Vetoes: {compliance_blocks}")
    print(f"Total Revenue at Risk: ₹{total_at_risk:,.2f}")
    print(f"Total Revenue Recovered: ₹{total_recovered:,.2f}")
    print("ALL ASSERTIONS PASSED!")


if __name__ == "__main__":
    test_agent_pipeline()
