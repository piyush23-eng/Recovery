import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowDown, ChevronDown, ChevronRight, 
  Copy, Check, ShieldAlert, Sparkles, Layers, Search, 
  ExternalLink 
} from 'lucide-react';
import { TraceEvent, Case } from '../types';
import { formatINR, formatTime, getAgentColor, getStatusBadge, getEventTypeLabel } from '../utils/formatters';

interface LiveOpsProps {
  traces: TraceEvent[];
  cases: Case[];
  onSelectCase: (caseId: string) => void;
}

export const LiveOps: React.FC<LiveOpsProps> = ({ traces, cases, onSelectCase }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [caseFilter, setCaseFilter] = useState<'ALL' | 'RECOVERED' | 'BLOCKED' | 'IN_FLIGHT'>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && traceEndRef.current) {
      traceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traces, autoScroll]);

  const toggleExpand = (id: string) => {
    setExpandedTraceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyJson = (id: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Agent Pipeline Node Definitions
  const pipelineNodes = [
    { id: 'Signal Ingestion Agent', short: 'Signal Ingestion', step: '01', desc: 'Normalize 4 event types' },
    { id: 'Root Cause Diagnosis Agent', short: 'Diagnosis', step: '02', desc: 'Classify failure root cause' },
    { id: 'Strategy Selection Agent', short: 'Strategy', step: '03', desc: 'Channel & copy formulation' },
    { id: 'Compliance Guardrail Agent', short: 'Compliance', step: '04', desc: 'Evaluate 7 hard gates' },
    { id: 'Execution Agent', short: 'Execution', step: '05', desc: 'Bounded action dispatch' },
    { id: 'Outcome & Audit Agent', short: 'Audit & Outcome', step: '06', desc: 'Reconciliation & ledger' },
  ];

  const agentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    traces.forEach((t) => {
      counts[t.agent] = (counts[t.agent] || 0) + 1;
    });
    return counts;
  }, [traces]);

  const latestTraceAgent = traces.length > 0 ? traces[traces.length - 1].agent : null;

  const filteredTraces = traces.filter((t) => {
    if (agentFilter !== 'ALL' && !t.agent.toLowerCase().includes(agentFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredCases = cases.filter((c) => {
    if (caseFilter === 'RECOVERED' && c.state !== 'RECOVERED') return false;
    if (caseFilter === 'BLOCKED' && c.state !== 'STOPPED' && (!c.compliance || c.compliance.allowed)) return false;
    if (caseFilter === 'IN_FLIGHT' && ['RECOVERED', 'STOPPED', 'ESCALATED'].includes(c.state)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_id.toLowerCase().includes(q) ||
        c.event.customer_name.toLowerCase().includes(q) ||
        c.event.customer_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[44px] md:text-[56px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
            Interventions & Live Ops
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1 font-normal">
            Real-time reasoning trace of autonomous recovery agents evaluating and executing bounded actions.
          </p>
        </div>

        {/* Total Processed Trace Stats */}
        <div className="flex items-center gap-2 bg-card border border-hairline rounded-full px-4 py-1.5 shadow-subtle text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-accent-blue animate-pulse" />
          <span className="text-[#5A5A55]">Total Traces:</span>
          <span className="font-bold text-[#0A0A0A]">{traces.length}</span>
        </div>
      </div>

      {/* 6-NODE INTERACTIVE AGENT PIPELINE FLOW MAP */}
      <div className="bg-card border border-hairline rounded-2card p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
            <span className="font-semibold text-[#0A0A0A]">LangGraph Multi-Agent Architecture Pipeline</span>
          </div>
          <span className="text-[11px] text-[#8A8A85] font-mono">Click an agent to filter reasoning stream</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {pipelineNodes.map((node) => {
            const count = agentCounts[node.id] || 0;
            const isLatest = latestTraceAgent === node.id;
            const isSelected = agentFilter !== 'ALL' && node.id.toLowerCase().includes(agentFilter.toLowerCase());
            const agentStyle = getAgentColor(node.id);

            return (
              <button
                key={node.id}
                onClick={() => setAgentFilter(isSelected ? 'ALL' : node.short)}
                className={`text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#0A0A0A] bg-[#FAF9F7] shadow-sm ring-1 ring-[#0A0A0A]'
                    : isLatest
                    ? 'border-accent-blue bg-accent-blue/5 shadow-xs'
                    : 'border-hairline bg-canvas hover:border-[#D0D0C8] hover:bg-[#FAF9F7]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                  <span className="text-[#8A8A85]">{node.step}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-bold tabular-nums text-[10px] ${
                      count > 0 ? 'bg-[#0A0A0A] text-white' : 'bg-canvas text-[#8A8A85]'
                    }`}
                  >
                    {count}
                  </span>
                </div>

                <div className="font-semibold text-xs text-[#0A0A0A] truncate">{node.short}</div>
                <div className="text-[10px] text-[#8A8A85] leading-tight mt-0.5 line-clamp-1">
                  {node.desc}
                </div>

                {/* Pulsing indicator when active */}
                {isLatest && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-blue animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Pane: Left = Agent Reasoning Stream (Light), Right = Active Cases Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[600px]">
        {/* LEFT: Live Reasoning Trace Stream (Light Pill Rows) */}
        <div className="lg:col-span-7 bg-card border border-hairline rounded-2card p-6 flex flex-col justify-between shadow-subtle">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-hairline select-none gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-blue" />
              <span className="text-sm font-semibold text-[#0A0A0A]">Live Agent Reasoning Stream</span>
              <span className="text-[11px] font-mono text-[#8A8A85] bg-canvas px-2.5 py-0.5 rounded-full border border-hairline">
                {filteredTraces.length} / {traces.length}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium">
              {agentFilter !== 'ALL' && (
                <button
                  onClick={() => setAgentFilter('ALL')}
                  className="text-[11px] font-mono text-[#E85D8A] hover:underline cursor-pointer"
                >
                  Clear Filter ({agentFilter})
                </button>
              )}

              <label className="flex items-center gap-1.5 text-[#5A5A55] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded text-[#0A0A0A] focus:ring-0 cursor-pointer"
                />
                <span>Auto-scroll</span>
              </label>

              <button
                onClick={() => traceEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A]"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Trace Rows List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 max-h-[550px] scrollbar-thin">
            {filteredTraces.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-[#8A8A85]">
                <Activity className="w-8 h-8 text-[#8A8A85] animate-pulse mb-2" />
                <div className="text-sm font-medium text-[#0A0A0A]">
                  {traces.length === 0 ? 'Ready for simulation batch' : 'No traces matching agent filter'}
                </div>
                <p className="text-xs text-[#8A8A85] max-w-sm mt-1">
                  {traces.length === 0
                    ? 'Start the simulation batch in the top bar to watch the 6 LangGraph agents ingest signals, diagnose root causes, and evaluate compliance.'
                    : 'Try clearing the filter or selecting a different agent node.'}
                </p>
              </div>
            ) : (
              filteredTraces.map((t) => {
                const agentStyle = getAgentColor(t.agent);
                const isExpanded = !!expandedTraceIds[t.trace_id];
                const isBlocked = t.status_badge === 'VETOED' || t.status_badge === 'ABORTED' || t.status_badge === 'STOPPED';
                const isSuccess = t.status_badge === 'RECOVERED' || t.status_badge === 'SUCCESS';

                return (
                  <div
                    key={t.trace_id}
                    className={`rounded-2xl border transition-all text-xs p-3 shadow-2xs ${
                      isBlocked
                        ? 'bg-[#FDF0F4] border-[#F8CAD7]'
                        : isSuccess
                        ? 'bg-[#EDF8F1] border-[#C8EAD2]'
                        : 'bg-canvas border-hairline hover:border-[#D0D0C8]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Agent Tag */}
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full border font-semibold shrink-0 ${agentStyle.bg} ${agentStyle.text} ${agentStyle.border}`}
                      >
                        {t.agent}
                      </span>

                      {/* Case ID Link */}
                      <button
                        onClick={() => onSelectCase(t.case_id)}
                        className="text-[#0A0A0A] hover:text-accent-blue font-mono font-bold text-[11px] shrink-0 hover:underline"
                      >
                        {t.case_id}
                      </button>

                      {/* Reasoning Snippet */}
                      <div className="flex-1 text-[#5A5A55] text-xs leading-relaxed font-sans">
                        {isBlocked && <ShieldAlert className="w-3.5 h-3.5 text-[#E85D8A] inline mr-1 -mt-0.5" />}
                        <span>{t.reasoning}</span>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] font-mono text-[#8A8A85] shrink-0">
                        {formatTime(t.timestamp)}
                      </span>

                      {/* Toggle Payload */}
                      <button
                        onClick={() => toggleExpand(t.trace_id)}
                        className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] shrink-0 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable JSON Payload */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-hairline/80">
                        <div className="flex items-center justify-between text-[10px] text-[#8A8A85] mb-1 font-mono">
                          <span>AGENT NODE STRUCTURED OUTPUT</span>
                          <button
                            onClick={() => copyJson(t.trace_id, t.payload)}
                            className="flex items-center gap-1 hover:text-[#0A0A0A] cursor-pointer"
                          >
                            {copiedId === t.trace_id ? <Check className="w-3 h-3 text-[#3FA85C]" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === t.trace_id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-[#5A5A55] overflow-x-auto max-h-40 p-2.5 rounded-xl bg-card border border-hairline">
                          {JSON.stringify(t.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={traceEndRef} />
          </div>
        </div>

        {/* RIGHT: Active Case Stream */}
        <div className="lg:col-span-5 bg-card border border-hairline rounded-2card p-6 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-hairline select-none">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3FA85C]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">Active Case Stream</span>
              <span className="text-[11px] font-mono text-[#8A8A85] bg-canvas px-2.5 py-0.5 rounded-full border border-hairline">
                {filteredCases.length}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              {(['ALL', 'RECOVERED', 'BLOCKED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCaseFilter(f)}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    caseFilter === f
                      ? 'bg-[#0A0A0A] text-white font-semibold'
                      : 'text-[#8A8A85] hover:text-[#0A0A0A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Case Cards */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2 max-h-[550px] scrollbar-thin">
            {filteredCases.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-[#8A8A85]">
                <p className="text-xs">No cases matching filter.</p>
              </div>
            ) : (
              filteredCases.map((c) => {
                const statusBadge = getStatusBadge(c.state);
                return (
                  <div
                    key={c.case_id}
                    onClick={() => onSelectCase(c.case_id)}
                    className="p-3.5 rounded-2xl bg-canvas hover:bg-[#FAF9F7] border border-hairline hover:border-[#D0D0C8] transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0A0A0A]">{c.case_id}</span>
                        <span className="text-xs font-semibold text-[#0A0A0A] truncate max-w-[130px]">
                          {c.event.customer_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#0A0A0A]">
                          {formatINR(c.event.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8A8A85] pt-1.5 border-t border-hairline/60 font-mono">
                      <span>{getEventTypeLabel(c.event.event_type)}</span>
                      {c.diagnosis && (
                        <span className="text-[#5A5A55] font-semibold">{c.diagnosis.cause}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
