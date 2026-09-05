import os
import sqlite3
import json
from typing import Dict, List, Optional, Any
from models import Case, AuditEntry

DB_PATH = os.getenv("RECOVERY_DB_PATH", os.path.join(os.path.dirname(__file__), "recovery.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 10000;")
    return conn


def init_db():
    """Initializes SQLite schema for cases, audit log, idempotency cache, and settled payments."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode = WAL;")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            diagnosis_json TEXT,
            strategy_json TEXT,
            compliance_json TEXT,
            action_log_json TEXT,
            recovered_amount REAL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            full_case_json TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audit_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            agent TEXT NOT NULL,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT NOT NULL,
            entry_hash TEXT NOT NULL,
            prev_hash TEXT,
            timestamp TEXT NOT NULL,
            payload_json TEXT
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            key TEXT PRIMARY KEY,
            response_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settled_payments (
            payment_reference TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            event_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            created_at TEXT NOT NULL
        );
        """)

        # Indices for fast querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_log(case_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_settled_case ON settled_payments(case_id);")

        conn.commit()
    finally:
        conn.close()


def save_case(case: Case):
    """Persists or updates a Case in SQLite."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO cases (
            id, status, diagnosis_json, strategy_json, compliance_json, action_log_json,
            recovered_amount, created_at, updated_at, full_case_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            diagnosis_json = excluded.diagnosis_json,
            strategy_json = excluded.strategy_json,
            compliance_json = excluded.compliance_json,
            action_log_json = excluded.action_log_json,
            recovered_amount = excluded.recovered_amount,
            updated_at = excluded.updated_at,
            full_case_json = excluded.full_case_json;
        """, (
            case.case_id,
            case.state.value,
            case.diagnosis.model_dump_json() if case.diagnosis else None,
            case.intervention.model_dump_json() if case.intervention else None,
            case.compliance.model_dump_json() if case.compliance else None,
            case.action_result.model_dump_json() if case.action_result else None,
            float(case.recovered_amount),
            case.created_at,
            case.updated_at,
            case.model_dump_json()
        ))
        conn.commit()
    finally:
        conn.close()


def save_audit_entry(entry: AuditEntry):
    """
    Persists an append-only AuditEntry in SQLite.
    Strictly uses plain INSERT (no UPSERT / DO UPDATE) to enforce append-only immutability
    at the database layer. Any duplicate audit_id raises sqlite3.IntegrityError.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO audit_log (
            audit_id, case_id, agent, action, status, reason, entry_hash, prev_hash, timestamp, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry.audit_id,
            entry.case_id,
            entry.agent,
            entry.action,
            entry.status,
            entry.reason,
            entry.entry_hash or "",
            entry.prev_hash,
            entry.timestamp,
            json.dumps(entry.payload)
        ))
        conn.commit()
    finally:
        conn.close()


def save_case_and_audit(case: Case, audit: AuditEntry):
    """
    Atomically writes the case-state transition and its corresponding append-only audit entry
    in a single database transaction. If either fails, the entire transaction is rolled back.
    """
    conn = get_db_connection()
    try:
        with conn:  # Automatically commits or rolls back on exception
            cursor = conn.cursor()

            # 1. Upsert Case State
            cursor.execute("""
            INSERT INTO cases (
                id, status, diagnosis_json, strategy_json, compliance_json, action_log_json,
                recovered_amount, created_at, updated_at, full_case_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                diagnosis_json = excluded.diagnosis_json,
                strategy_json = excluded.strategy_json,
                compliance_json = excluded.compliance_json,
                action_log_json = excluded.action_log_json,
                recovered_amount = excluded.recovered_amount,
                updated_at = excluded.updated_at,
                full_case_json = excluded.full_case_json;
            """, (
                case.case_id,
                case.state.value,
                case.diagnosis.model_dump_json() if case.diagnosis else None,
                case.intervention.model_dump_json() if case.intervention else None,
                case.compliance.model_dump_json() if case.compliance else None,
                case.action_result.model_dump_json() if case.action_result else None,
                float(case.recovered_amount),
                case.created_at,
                case.updated_at,
                case.model_dump_json()
            ))

            # 2. Plain Append Audit Record
            cursor.execute("""
            INSERT INTO audit_log (
                audit_id, case_id, agent, action, status, reason, entry_hash, prev_hash, timestamp, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit.audit_id,
                audit.case_id,
                audit.agent,
                audit.action,
                audit.status,
                audit.reason,
                audit.entry_hash or "",
                audit.prev_hash,
                audit.timestamp,
                json.dumps(audit.payload)
            ))
    finally:
        conn.close()


def is_payment_reference_used(payment_reference: str) -> bool:
    """Checks if a payment_reference has already been recorded in settled_payments."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM settled_payments WHERE payment_reference = ?", (payment_reference,))
        row = cursor.fetchone()
        return row is not None
    finally:
        conn.close()


def record_settled_payment(payment_reference: str, case_id: str, event_id: str, amount: float, currency: str = "INR"):
    """
    Records a unique settled payment reference in the settled_payments table.
    Raises sqlite3.IntegrityError if the payment reference has already been used.
    """
    import datetime
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now_iso = datetime.datetime.now().isoformat()

        cursor.execute("""
        INSERT INTO settled_payments (payment_reference, case_id, event_id, amount, currency, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (payment_reference, case_id, event_id, float(amount), currency, now_iso))

        conn.commit()
    finally:
        conn.close()


def load_all_cases() -> Dict[str, Case]:
    """Loads all Cases from SQLite into a Dict[case_id, Case]."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT full_case_json FROM cases ORDER BY rowid ASC")
        rows = cursor.fetchall()

        cases: Dict[str, Case] = {}
        for row in rows:
            try:
                case = Case.model_validate_json(row["full_case_json"])
                cases[case.case_id] = case
            except Exception:
                continue
        return cases
    finally:
        conn.close()


def get_case(case_id: str) -> Optional[Case]:
    """Fetches a single case by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT full_case_json FROM cases WHERE id = ?", (case_id,))
        row = cursor.fetchone()
        if row:
            return Case.model_validate_json(row["full_case_json"])
        return None
    finally:
        conn.close()


def load_all_audit_entries() -> List[AuditEntry]:
    """Loads all AuditEntry records in chronological sequence from SQLite."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_log ORDER BY id ASC")
        rows = cursor.fetchall()

        entries: List[AuditEntry] = []
        for row in rows:
            try:
                payload = json.loads(row["payload_json"]) if row["payload_json"] else {}
                entry = AuditEntry(
                    audit_id=row["audit_id"],
                    case_id=row["case_id"],
                    timestamp=row["timestamp"],
                    agent=row["agent"],
                    action=row["action"],
                    status=row["status"],
                    reason=row["reason"],
                    payload=payload,
                    prev_hash=row["prev_hash"],
                    entry_hash=row["entry_hash"]
                )
                entries.append(entry)
            except Exception:
                continue
        return entries
    finally:
        conn.close()


def get_latest_audit_hash() -> str:
    """Returns the entry_hash of the latest audit log entry, or genesis hash if empty."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT entry_hash FROM audit_log ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row and row["entry_hash"]:
            return row["entry_hash"]
        return "0" * 64
    finally:
        conn.close()


def save_idempotency_key(key: str, response_data: Dict[str, Any]):
    """Stores an idempotency key and its response payload."""
    import datetime
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now_iso = datetime.datetime.now().isoformat()
        cursor.execute("""
        INSERT OR REPLACE INTO idempotency_keys (key, response_json, created_at)
        VALUES (?, ?, ?)
        """, (key, json.dumps(response_data), now_iso))
        conn.commit()
    finally:
        conn.close()


def get_idempotency_key(key: str) -> Optional[Dict[str, Any]]:
    """Retrieves cached response by idempotency key."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT response_json FROM idempotency_keys WHERE key = ?", (key,))
        row = cursor.fetchone()
        if row:
            return json.loads(row["response_json"])
        return None
    finally:
        conn.close()


def clear_all_db():
    """Wipes all rows from cases, audit_log, idempotency_keys, and settled_payments."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cases;")
        cursor.execute("DELETE FROM audit_log;")
        cursor.execute("DELETE FROM idempotency_keys;")
        cursor.execute("DELETE FROM settled_payments;")
        conn.commit()
    finally:
        conn.close()
