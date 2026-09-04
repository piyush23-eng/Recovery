import io
import csv
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models import Case, AuditEntry, LedgerStats
from engine.batch_runner import runner

app = FastAPI(
    title="Recovery — Autonomous Revenue Recovery Platform",
    description="Multi-agent closed-loop revenue recovery system with LangGraph state graph and compliance guardrails",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SpeedRequest(BaseModel):
    speed: float


class ResetRequest(BaseModel):
    count: Optional[int] = 300


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "active",
        "processed_cases": len(runner.cases),
        "total_dataset_size": len(runner.raw_dataset)
    }


@app.get("/api/stats", response_model=LedgerStats)
async def get_stats():
    return runner.stats


@app.get("/api/cases")
async def get_cases(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    status: Optional[str] = None,
    event_type: Optional[str] = None,
    segment: Optional[str] = None,
    search: Optional[str] = None
):
    all_cases = list(runner.cases.values())
    all_cases.reverse()  # most recent first

    filtered = []
    for c in all_cases:
        if status and c.state.value != status:
            continue
        if event_type and c.event.event_type.value != event_type:
            continue
        if segment and c.event.customer_segment != segment:
            continue
        if search:
            q = search.lower()
            match = (
                q in c.case_id.lower() or
                q in c.event.customer_name.lower() or
                q in c.event.customer_id.lower() or
                (c.diagnosis and q in c.diagnosis.cause.value.lower())
            )
            if not match:
                continue
        filtered.append(c)

    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = filtered[start_idx:end_idx]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "cases": paginated
    }


@app.get("/api/cases/{case_id}")
async def get_case_detail(case_id: str):
    case = runner.cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.get("/api/audit-log")
async def get_audit_log(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=2000),
    status: Optional[str] = None,
    agent: Optional[str] = None,
    search: Optional[str] = None
):
    logs = list(runner.audit_log)
    logs.reverse()  # most recent first

    filtered = []
    for entry in logs:
        if status and entry.status != status:
            continue
        if agent and entry.agent != agent:
            continue
        if search:
            q = search.lower()
            match = (
                q in entry.audit_id.lower() or
                q in entry.case_id.lower() or
                q in entry.reason.lower() or
                q in entry.action.lower()
            )
            if not match:
                continue
        filtered.append(entry)

    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "logs": filtered[start_idx:end_idx]
    }


@app.get("/api/audit-log/export")
async def export_audit_log():
    """
    Exports the complete immutable audit trail as a downloadable CSV for compliance certification.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Audit ID",
        "Timestamp",
        "Case ID",
        "Agent",
        "Action",
        "Status",
        "Reason / Guardrail Rule",
        "Payload Summary"
    ])

    for entry in runner.audit_log:
        writer.writerow([
            entry.audit_id,
            entry.timestamp,
            entry.case_id,
            entry.agent,
            entry.action,
            entry.status,
            entry.reason,
            str(entry.payload)
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=compliance_audit_ledger.csv"}
    )


@app.post("/api/simulation/start")
async def start_simulation():
    runner.start()
    await runner.broadcast("SIMULATION_STATE", {
        "is_running": runner.is_running,
        "is_paused": runner.is_paused,
        "speed": runner.speed_multiplier
    })
    return {"message": "Simulation started", "is_running": runner.is_running, "is_paused": runner.is_paused}


@app.post("/api/simulation/pause")
async def pause_simulation():
    runner.pause()
    await runner.broadcast("SIMULATION_STATE", {
        "is_running": runner.is_running,
        "is_paused": runner.is_paused,
        "speed": runner.speed_multiplier
    })
    return {"message": "Simulation paused", "is_paused": runner.is_paused}


@app.post("/api/simulation/step")
async def step_simulation():
    stepped = await runner.step()
    return {
        "message": "Step processed" if stepped else "All cases processed",
        "stepped": stepped,
        "current_index": runner.current_index,
        "total_cases": len(runner.raw_dataset)
    }


@app.post("/api/simulation/reset")
async def reset_simulation(req: ResetRequest):
    runner.reset(req.count or 300)
    await runner.broadcast("SIMULATION_RESET", {"total_cases": len(runner.raw_dataset)})
    return {"message": "Simulation reset", "total_cases": len(runner.raw_dataset)}


@app.post("/api/simulation/speed")
async def set_speed(req: SpeedRequest):
    runner.set_speed(req.speed)
    await runner.broadcast("SPEED_CHANGED", {"speed": req.speed})
    return {"message": "Speed updated", "speed": req.speed}


@app.post("/api/simulation/run-instant")
async def run_instant():
    """Processes remaining batch instantly with zero delay"""
    runner.set_speed(100.0)
    runner.start()
    await runner.broadcast("SIMULATION_STATE", {
        "is_running": runner.is_running,
        "is_paused": runner.is_paused,
        "speed": runner.speed_multiplier
    })
    return {"message": "Instant execution started"}


class InjectCaseRequest(BaseModel):
    customer_name: Optional[str] = "Acme Retail Ltd"
    customer_id: Optional[str] = None
    customer_segment: Optional[str] = "SMB"
    event_type: Optional[str] = "payment_failed"
    amount: Optional[float] = 14999.0
    channel_pref: Optional[str] = "whatsapp"
    language_pref: Optional[str] = "hinglish"
    dnd_flag: Optional[bool] = False
    prior_contact_count_24h: Optional[int] = 0
    retry_count: Optional[int] = 0
    local_hour: Optional[int] = 14
    decline_code: Optional[str] = "E91_ISSUER_TIMEOUT"
    is_disputed: Optional[bool] = False
    days_overdue: Optional[int] = 7
    replied_stop: Optional[bool] = False


@app.post("/api/cases/inject")
async def inject_case(req: InjectCaseRequest):
    """
    Allows judges or operators to inject an ad-hoc custom risk event live into the running 6-agent system.
    """
    case = await runner.inject_custom_event(req.model_dump())
    if not case:
        raise HTTPException(status_code=500, detail="Failed to process injected case")
    return {
        "message": "Case ingested and processed across all 6 agents",
        "case_id": case.case_id,
        "case": case
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await runner.connect_ws(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        runner.disconnect_ws(websocket)
    except Exception:
        runner.disconnect_ws(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
