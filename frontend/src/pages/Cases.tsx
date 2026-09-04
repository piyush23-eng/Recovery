import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, ExternalLink, ShieldCheck, 
  ShieldAlert, Layers, Filter 
} from 'lucide-react';
import { Case } from '../types';
import { formatINR, formatTime, getStatusBadge, getDiagnosisLabel, getEventTypeLabel } from '../utils/formatters';

interface CasesPageProps {
  cases: Case[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string | null) => void;
}

export const Cases: React.FC<CasesPageProps> = ({ cases, selectedCaseId, onSelectCase }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | 'PASSED' | 'VETOED'>('ALL');
  const [sortField, setSortField] = useState<'amount' | 'time' | 'id'>('time');
  const [sortAsc, setSortAsc] = useState(false);

  const selectedCase = cases.find((c) => c.case_id === selectedCaseId) || null;

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.state !== statusFilter) return false;
    if (eventTypeFilter !== 'ALL' && c.event.event_type !== eventTypeFilter) return false;
    if (complianceFilter === 'PASSED' && (!c.compliance || !c.compliance.allowed)) return false;
    if (complianceFilter === 'VETOED' && (!c.compliance || c.compliance.allowed)) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchId = c.case_id.toLowerCase().includes(q);
      const matchCust = c.event.customer_name.toLowerCase().includes(q) || c.event.customer_id.toLowerCase().includes(q);
      const matchDiag = c.diagnosis && c.diagnosis.cause.toLowerCase().includes(q);
      return matchId || matchCust || matchDiag;
    }
    return true;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortField === 'amount') {
      return sortAsc ? a.event.amount - b.event.amount : b.event.amount - a.event.amount;
    } else if (sortField === 'id') {
      return sortAsc ? a.case_id.localeCompare(b.case_id) : b.case_id.localeCompare(a.case_id);
    } else {
      return sortAsc
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleSort = (field: 'amount' | 'time' | 'id') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[44px] md:text-[56px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
            Cases
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1 font-normal">
            Autonomous state machine cases tracking revenue at risk, diagnosis, and intervention outcomes.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-hairline rounded-full px-3.5 py-1.5 font-mono text-xs shadow-subtle min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#8A8A85]" />
            <input
              type="text"
              placeholder="Search by ID, customer, cause..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-[#0A0A0A] focus:outline-none placeholder:text-[#8A8A85]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-hairline rounded-full px-3.5 py-1.5 text-xs text-[#5A5A55] focus:outline-none cursor-pointer shadow-subtle font-medium"
          >
            <option value="ALL">Status: All</option>
            <option value="RECOVERED">Recovered</option>
            <option value="STOPPED">Stopped</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RETRY">Retry</option>
          </select>

          {/* Guardrail Filter */}
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value as any)}
            className="bg-card border border-hairline rounded-full px-3.5 py-1.5 text-xs text-[#5A5A55] focus:outline-none cursor-pointer shadow-subtle font-medium"
          >
            <option value="ALL">Guardrail: All</option>
            <option value="PASSED">Passed</option>
            <option value="VETOED">Vetoed</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Pill Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs select-none">
        <span className="text-[11px] text-[#8A8A85] font-mono mr-1">Quick Filters:</span>
        <button
          onClick={() => {
            setStatusFilter('ALL');
            setComplianceFilter('ALL');
            setSearch('');
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
            statusFilter === 'ALL' && complianceFilter === 'ALL' && !search
              ? 'bg-[#0A0A0A] text-white shadow-xs'
              : 'bg-card border border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
          }`}
        >
          All Cases ({cases.length})
        </button>

        <button
          onClick={() => {
            setComplianceFilter('VETOED');
            setStatusFilter('ALL');
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            complianceFilter === 'VETOED'
              ? 'bg-[#E85D8A] text-white shadow-xs'
              : 'bg-card border border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
          }`}
        >
          <span>🛡️ Guardrail Vetoed</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('RECOVERED');
            setComplianceFilter('ALL');
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'RECOVERED'
              ? 'bg-[#3FA85C] text-white shadow-xs'
              : 'bg-card border border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
          }`}
        >
          <span>✅ Recovered</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('RETRY');
            setComplianceFilter('ALL');
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'RETRY'
              ? 'bg-[#E8A23D] text-white shadow-xs'
              : 'bg-card border border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
          }`}
        >
          <span>🔁 In Retry Queue</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('ESCALATED');
            setComplianceFilter('ALL');
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'ESCALATED'
              ? 'bg-[#8B5CF6] text-white shadow-xs'
              : 'bg-card border border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
          }`}
        >
          <span>🏢 Enterprise Escalations</span>
        </button>

        <div className="ml-auto text-[11px] font-mono text-[#8A8A85]">
          Showing <span className="font-bold text-[#0A0A0A]">{sortedCases.length}</span> of {cases.length}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-hairline rounded-2card overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9F7] border-b border-hairline text-[#8A8A85] select-none uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0A0A0A]"
                >
                  <div className="flex items-center gap-1 font-mono">
                    <span>Case ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Signal Event</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0A0A0A] text-right"
                >
                  <div className="flex items-center justify-end gap-1 font-mono">
                    <span>Amount (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Diagnosis</th>
                <th className="py-3.5 px-4">Strategy</th>
                <th className="py-3.5 px-4 text-center">Guardrail Gate</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th
                  onClick={() => handleSort('time')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0A0A0A] text-right font-mono"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-card">
              {sortedCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#8A8A85]">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-[#8A8A85]" />
                    No cases matching current filter criteria.
                  </td>
                </tr>
              ) : (
                sortedCases.map((c) => {
                  const statusBadge = getStatusBadge(c.state);
                  const isVetoed = c.compliance && !c.compliance.allowed;

                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => onSelectCase(c.case_id)}
                      className="hover:bg-[#FAF9F7] transition-colors cursor-pointer group"
                    >
                      {/* Case ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0A0A0A] group-hover:text-accent-blue">
                        <div className="flex items-center gap-1.5">
                          <span>{c.case_id}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0A0A0A]">{c.event.customer_name}</div>
                        <div className="text-[11px] text-[#8A8A85] font-mono">
                          {c.event.customer_segment}
                        </div>
                      </td>

                      {/* Signal */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-canvas border border-hairline text-[#5A5A55] font-medium">
                          {getEventTypeLabel(c.event.event_type)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0A0A0A]">
                        <div>{formatINR(c.event.amount)}</div>
                        {c.recovered_amount > 0 && (
                          <div className="text-[10px] text-[#3FA85C]">
                            +{formatINR(c.recovered_amount)}
                          </div>
                        )}
                      </td>

                      {/* Diagnosis */}
                      <td className="py-3.5 px-4 text-[#5A5A55]">
                        {c.diagnosis ? (
                          <div>
                            <span className="font-semibold text-[#0A0A0A]">{c.diagnosis.cause}</span>
                            <span className="text-[10px] text-[#8A8A85] ml-1 font-mono">
                              ({Math.round(c.diagnosis.confidence * 100)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8A8A85]">Pending</span>
                        )}
                      </td>

                      {/* Strategy */}
                      <td className="py-3.5 px-4 text-[#5A5A55] text-[11px]">
                        {c.intervention ? (
                          <span>
                            {c.intervention.intervention_type}{' '}
                            <span className="text-[#8A8A85]">({c.intervention.channel})</span>
                          </span>
                        ) : (
                          <span className="text-[#8A8A85]">Pending</span>
                        )}
                      </td>

                      {/* Guardrail */}
                      <td className="py-3.5 px-4 text-center">
                        {c.compliance ? (
                          isVetoed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-accent-roseSoft border border-[#F8CAD7] text-[#9E2A4F] font-semibold">
                              <ShieldAlert className="w-3 h-3" />
                              Vetoed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-accent-greenSoft border border-[#C8EAD2] text-[#2D7A42] font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              Passed
                            </span>
                          )
                        ) : (
                          <span className="text-[#8A8A85]">--</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-right text-[#8A8A85] font-mono text-[11px]">
                        {formatTime(c.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
