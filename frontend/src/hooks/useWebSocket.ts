import { useState, useEffect, useRef, useCallback } from 'react';
import { Case, TraceEvent, LedgerStats } from '../types';
import { authFetch } from '../utils/api';

const INITIAL_STATS: LedgerStats = {
  total_cases: 300,
  processed_cases: 0,
  revenue_at_risk: 0,
  revenue_recovered: 0,
  recovery_rate_pct: 0,
  total_cost_incurred: 0,
  net_revenue_recovered: 0,
  roi_multiplier: 0,
  compliance_stops_count: 0,
  escalated_count: 0,
  retry_count: 0,
  status_distribution: {},
  type_breakdown: {
    payment_failed: { risk: 0, recovered: 0, count: 0, recovered_count: 0 },
    checkout_abandoned: { risk: 0, recovered: 0, count: 0, recovered_count: 0 },
    subscription_failed: { risk: 0, recovered: 0, count: 0, recovered_count: 0 },
    invoice_overdue: { risk: 0, recovered: 0, count: 0, recovered_count: 0 }
  },
  funnel: { detected: 0, diagnosed: 0, contacted: 0, responded: 0, promised: 0, recovered: 0 },
  veto_reasons: {}
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<LedgerStats>(INITIAL_STATS);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [casesMap, setCasesMap] = useState<Record<string, Case>>({});
  const [simulationStatus, setSimulationStatus] = useState({
    is_running: false,
    is_paused: false,
    current_index: 0,
    total_cases: 300,
    speed: 1.0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.hostname}:8000`
      : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        if (type === 'INITIAL_SYNC') {
          if (data.stats) setStats(data.stats);
          if (data.cases) {
            const map: Record<string, Case> = {};
            data.cases.forEach((c: Case) => {
              map[c.case_id] = c;
            });
            setCasesMap(map);
          }
          if (data.traces) {
            setTraces((prev) => {
              const existingIds = new Set(prev.map((t) => t.trace_id));
              const incoming = (data.traces as TraceEvent[]).filter((t) => !existingIds.has(t.trace_id));
              const merged = [...prev, ...incoming];
              return merged.slice(Math.max(0, merged.length - 250));
            });
          }
          if (data.simulation_status) setSimulationStatus(data.simulation_status);
        } else if (type === 'TRACE_EMITTED') {
          setTraces((prev) => {
            if (prev.some((t) => t.trace_id === data.trace_id)) return prev;
            const next = [...prev, data];
            return next.length > 250 ? next.slice(next.length - 250) : next;
          });
        } else if (type === 'CASE_UPDATED') {
          setCasesMap((prev) => {
            const next = { ...prev, [data.case_id]: data };
            return next;
          });
          setSimulationStatus((prev) => ({
            ...prev,
            current_index: prev.current_index + 1,
          }));
        } else if (type === 'STATS_UPDATED') {
          setStats(data);
        } else if (type === 'SIMULATION_STATE') {
          setSimulationStatus((prev) => ({
            ...prev,
            is_running: data.is_running,
            is_paused: data.is_paused,
            speed: data.speed ?? prev.speed,
          }));
        } else if (type === 'SIMULATION_RESET') {
          setCasesMap({});
          setTraces([]);
          setStats({ ...INITIAL_STATS, total_cases: data.total_cases || 300 });
          setSimulationStatus({
            is_running: false,
            is_paused: false,
            current_index: 0,
            total_cases: data.total_cases || 300,
            speed: 1.0,
          });
        } else if (type === 'SPEED_CHANGED') {
          setSimulationStatus((prev) => ({ ...prev, speed: data.speed }));
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      try {
        ws.close();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  // REST control helpers with API Key authentication via authFetch
  const startSimulation = async () => {
    await authFetch('/api/simulation/start', { method: 'POST' });
  };

  const pauseSimulation = async () => {
    await authFetch('/api/simulation/pause', { method: 'POST' });
  };

  const stepSimulation = async () => {
    await authFetch('/api/simulation/step', { method: 'POST' });
  };

  const resetSimulation = async (count: number = 300) => {
    await authFetch('/api/simulation/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
  };

  const setSpeedMultiplier = async (speed: number) => {
    await authFetch('/api/simulation/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
  };

  const runInstant = async () => {
    await authFetch('/api/simulation/run-instant', { method: 'POST' });
  };

  return {
    isConnected,
    stats,
    traces,
    cases: Object.values(casesMap).reverse(),
    casesMap,
    simulationStatus,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    setSpeedMultiplier,
    runInstant,
  };
}
