import asyncio
from typing import Dict, Any, List, Tuple, Callable, Optional, TypedDict
from langgraph.graph import StateGraph, END
from models import Case, TraceEvent, AuditEntry
from agents.signal_ingestion import ingest_signal
from agents.root_cause_diagnosis import diagnose_root_cause
from agents.strategy_selection import select_strategy
from agents.compliance_guardrail import evaluate_compliance_guardrails
from agents.execution_agent import execute_intervention
from agents.outcome_audit_agent import resolve_outcome_and_audit


class AgentGraphState(TypedDict):
    raw_event: Dict[str, Any]
    case: Optional[Case]
    traces: List[TraceEvent]
    audits: List[AuditEntry]
    latest_trace: Optional[TraceEvent]
    latest_audit: Optional[AuditEntry]
    current_node: str


# --- LangGraph Agent Node Callbacks ---

def node_signal_ingestion(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = ingest_signal(state["raw_event"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "signal_ingestion"
    }


def node_root_cause_diagnosis(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = diagnose_root_cause(state["case"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "root_cause_diagnosis"
    }


def node_strategy_selection(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = select_strategy(state["case"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "strategy_selection"
    }


def node_compliance_guardrail(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = evaluate_compliance_guardrails(state["case"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "compliance_guardrail"
    }


def node_execution(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = execute_intervention(state["case"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "execution"
    }


def node_outcome_audit(state: AgentGraphState) -> AgentGraphState:
    case, trace, audit = resolve_outcome_and_audit(state["case"])
    return {
        "raw_event": state["raw_event"],
        "case": case,
        "traces": state["traces"] + [trace],
        "audits": state["audits"] + [audit],
        "latest_trace": trace,
        "latest_audit": audit,
        "current_node": "outcome_audit"
    }


def compliance_routing_condition(state: AgentGraphState) -> str:
    """
    Conditional edge evaluator:
    - If compliance allowed -> routes to 'execution'
    - If compliance vetoed -> skips execution and routes directly to 'outcome_audit'
    """
    case = state["case"]
    if case and case.compliance and not case.compliance.allowed:
        return "outcome_audit"
    return "execution"


# --- Compile LangGraph StateGraph ---

graph_builder = StateGraph(AgentGraphState)
graph_builder.add_node("signal_ingestion", node_signal_ingestion)
graph_builder.add_node("root_cause_diagnosis", node_root_cause_diagnosis)
graph_builder.add_node("strategy_selection", node_strategy_selection)
graph_builder.add_node("compliance_guardrail", node_compliance_guardrail)
graph_builder.add_node("execution", node_execution)
graph_builder.add_node("outcome_audit", node_outcome_audit)

graph_builder.set_entry_point("signal_ingestion")
graph_builder.add_edge("signal_ingestion", "root_cause_diagnosis")
graph_builder.add_edge("root_cause_diagnosis", "strategy_selection")
graph_builder.add_edge("strategy_selection", "compliance_guardrail")
graph_builder.add_conditional_edges(
    "compliance_guardrail",
    compliance_routing_condition,
    {
        "execution": "execution",
        "outcome_audit": "outcome_audit"
    }
)
graph_builder.add_edge("execution", "outcome_audit")
graph_builder.add_edge("outcome_audit", END)

recovery_langgraph = graph_builder.compile()


class CaseRecoveryWorkflow:
    """
    LangGraph Workflow orchestrating the 6 autonomous recovery agents:
    1. Signal Ingestion
    2. Root Cause Diagnosis
    3. Strategy Selection
    4. Compliance Guardrail (with conditional branching)
    5. Execution Agent
    6. Outcome & Audit
    """

    @staticmethod
    def process_case_sync(
        raw_event: Dict[str, Any],
        on_step_callback: Optional[Callable[[Case, TraceEvent, AuditEntry], None]] = None
    ) -> Tuple[Case, List[TraceEvent], List[AuditEntry]]:
        """
        Synchronously runs a case through the compiled LangGraph StateGraph.
        """
        initial_state: AgentGraphState = {
            "raw_event": raw_event,
            "case": None,
            "traces": [],
            "audits": [],
            "latest_trace": None,
            "latest_audit": None,
            "current_node": "init"
        }

        final_case: Optional[Case] = None
        all_traces: List[TraceEvent] = []
        all_audits: List[AuditEntry] = []

        for output in recovery_langgraph.stream(initial_state):
            for node_name, state in output.items():
                final_case = state["case"]
                trace = state["latest_trace"]
                audit = state["latest_audit"]
                if trace:
                    all_traces.append(trace)
                if audit:
                    all_audits.append(audit)
                if on_step_callback and final_case and trace and audit:
                    on_step_callback(final_case, trace, audit)

        return final_case, all_traces, all_audits

    @staticmethod
    async def process_case_async(
        raw_event: Dict[str, Any],
        step_delay: float = 0.05,
        on_step_callback: Optional[Callable[[Case, TraceEvent, AuditEntry], Any]] = None
    ) -> Tuple[Case, List[TraceEvent], List[AuditEntry]]:
        """
        Asynchronously streams a case through the compiled LangGraph StateGraph
        with async callback dispatch and real-time visualization delays.
        """
        initial_state: AgentGraphState = {
            "raw_event": raw_event,
            "case": None,
            "traces": [],
            "audits": [],
            "latest_trace": None,
            "latest_audit": None,
            "current_node": "init"
        }

        final_case: Optional[Case] = None
        all_traces: List[TraceEvent] = []
        all_audits: List[AuditEntry] = []

        for output in recovery_langgraph.stream(initial_state):
            for node_name, state in output.items():
                final_case = state["case"]
                trace = state["latest_trace"]
                audit = state["latest_audit"]
                if trace:
                    all_traces.append(trace)
                if audit:
                    all_audits.append(audit)
                if on_step_callback and final_case and trace and audit:
                    await on_step_callback(final_case, trace, audit)
                if step_delay > 0:
                    await asyncio.sleep(step_delay)

        return final_case, all_traces, all_audits
