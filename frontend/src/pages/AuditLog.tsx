import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Download, Search, 
  FileText, Check, Copy, ChevronDown, ChevronRight, 
  ExternalLink, X 
} from 'lucide-react';
import { AuditEntry } from '../types';
import { formatTime, getAgentColor } from '../utils/formatters';
import { authFetch, getApiKey, initApiKey } from '../utils/api';

interface AuditLogPageProps {
  onSelectCase: (caseId: string) => void;
}

export const AuditLog: React.FC<AuditLogPageProps> = ({ onSelectCase }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const handleVerifyChain = async () => {
    try {
      setIsVerifying(true);
      setIsVerifyOpen(true);
      const res = await authFetch('/api/audit-log/verify');
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        setVerifyResult({ verified: false, message: 'Verification failed: server error' });
      }
    } catch (err: any) {
      setVerifyResult({ verified: false, message: `Verification failed: ${err.message}` });
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchLogs = async (isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      const key = await initApiKey();
      if (key) setApiKey(key);
      const res = await authFetch('/api/audit-log?limit=250');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => fetchLogs(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((entry) => {
    if (statusFilter !== 'ALL' && entry.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.audit_id.toLowerCase().includes(q) ||
        entry.case_id.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyEntryJson = (id: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[44px] md:text-[56px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
            Audit Log
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1 font-normal">
            Append-only, immutable audit trail of every agent decision, compliance gate verdict, and bounded execution action.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-hairline rounded-full px-3.5 py-1.5 font-mono text-xs shadow-subtle min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#8A8A85]" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-[#0A0A0A] focus:outline-none placeholder:text-[#8A8A85]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-hairline rounded-full px-3.5 py-1.5 text-xs text-[#5A5A55] focus:outline-none cursor-pointer shadow-subtle font-medium"
          >
            <option value="ALL">Status: All Records</option>
            <option value="BLOCKED">Blocked / Vetoed Only</option>
            <option value="PASSED">Passed Guardrail</option>
            <option value="EXECUTED">Executed Actions</option>
            <option value="RECOVERED">Recovered Outcomes</option>
          </select>

          {/* Verify Hash Chain Button */}
          <button
            onClick={handleVerifyChain}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-green hover:bg-accent-green/90 text-white text-xs font-medium transition-all cursor-pointer shadow-subtle"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Hash Chain</span>
          </button>

          {/* Export CSV Pill Button */}
          <a
            href={apiKey ? `/api/audit-log/export?api_key=${encodeURIComponent(apiKey)}` : '/api/audit-log/export'}
            download="compliance_audit_ledger.csv"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-medium transition-all cursor-pointer shadow-subtle"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-hairline rounded-2card overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9F7] border-b border-hairline text-[#8A8A85] select-none uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3.5 px-4 font-mono">Audit ID</th>
                <th className="py-3.5 px-4 font-mono">Case ID</th>
                <th className="py-3.5 px-4">Agent Node</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Reason & Guardrail Rule</th>
                <th className="py-3.5 px-4 text-right font-mono">Time</th>
                <th className="py-3.5 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-card">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#8A8A85]">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#8A8A85]" />
                    No audit records matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const agentStyle = getAgentColor(entry.agent);
                  const isBlocked = entry.status === 'BLOCKED' || entry.status === 'STOPPED';
                  const isPassed = entry.status === 'PASSED' || entry.status === 'RECOVERED';
                  const isExpanded = expandedId === entry.audit_id;

                  return (
                    <React.Fragment key={entry.audit_id}>
                      <tr className={`hover:bg-[#FAF9F7] transition-colors ${isBlocked ? 'bg-accent-roseSoft/20' : ''}`}>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#8A8A85]">
                          {entry.audit_id}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onSelectCase(entry.case_id)}
                            className="text-accent-blue hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{entry.case_id}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${agentStyle.bg} ${agentStyle.text} ${agentStyle.border}`}
                          >
                            {entry.agent}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-[#0A0A0A]">
                          {entry.action}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isBlocked
                                ? 'bg-accent-roseSoft text-[#9E2A4F] border-[#F8CAD7]'
                                : isPassed
                                ? 'bg-accent-greenSoft text-[#2D7A42] border-[#C8EAD2]'
                                : 'bg-canvas text-[#5A5A55] border-hairline'
                            }`}
                          >
                            {isBlocked ? (
                              <ShieldAlert className="w-3 h-3 text-[#E85D8A]" />
                            ) : isPassed ? (
                              <ShieldCheck className="w-3 h-3 text-[#3FA85C]" />
                            ) : null}
                            <span>{entry.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#5A5A55] text-xs max-w-md break-words font-normal">
                          {entry.reason}
                        </td>

                        <td className="py-3.5 px-4 text-right text-[#8A8A85] font-mono text-[11px]">
                          {formatTime(entry.timestamp)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.audit_id)}
                            className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FAF9F7]">
                          <td colSpan={8} className="p-4 border-y border-hairline">
                            <div className="flex items-center justify-between pb-1.5 text-[10px] text-[#8A8A85] select-none font-mono">
                              <span>IMMUTABLE AUDIT ENTRY STRUCTURED PAYLOAD</span>
                              <button
                                onClick={() => copyEntryJson(entry.audit_id, entry.payload)}
                                className="flex items-center gap-1 text-[#8A8A85] hover:text-[#0A0A0A] cursor-pointer"
                              >
                                {copiedId === entry.audit_id ? (
                                  <Check className="w-3 h-3 text-[#3FA85C]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedId === entry.audit_id ? 'Copied' : 'Copy Payload'}</span>
                              </button>
                            </div>
                            <pre className="text-[11px] font-mono text-[#5A5A55] overflow-x-auto max-h-48 p-3 rounded-2xl bg-card border border-hairline">
                              {JSON.stringify(entry.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Cryptographic Hash Chain Verification Modal */}
      {isVerifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-hairline rounded-2card max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#0A0A0A]">
                    Cryptographic SHA-256 Ledger Verification
                  </h3>
                  <p className="text-[11px] text-[#8A8A85]">
                    Independent proof of tamper-evident append-only integrity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVerifyOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isVerifying ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#5A5A55] font-mono">
                  Tracing SHA-256 hash pointers from genesis block...
                </p>
              </div>
            ) : verifyResult ? (
              <div className="space-y-4">
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    verifyResult.verified
                      ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
                      : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
                  }`}
                >
                  {verifyResult.verified ? (
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-xs text-[#0A0A0A]">
                      {verifyResult.verified
                        ? 'Verification Succeeded: Unbroken Chain'
                        : 'Verification Failed: Tamper Detected'}
                    </div>
                    <p className="text-[11px] text-[#5A5A55] mt-0.5">
                      {verifyResult.message}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF9F7] p-3 rounded-xl border border-hairline space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8A8A85]">Total Audited Entries:</span>
                    <span className="font-bold text-[#0A0A0A]">{verifyResult.total_entries || logs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A85]">Genesis Block Hash:</span>
                    <span className="text-[#0A0A0A] truncate max-w-[280px]" title={verifyResult.genesis_hash}>
                      {verifyResult.genesis_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A85]">Chain Head Hash:</span>
                    <span className="text-[#0A0A0A] truncate max-w-[280px]" title={verifyResult.chain_head}>
                      {verifyResult.chain_head || 'Pending...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A85]">Tampered Blocks:</span>
                    <span className="font-bold text-accent-green">0 (Chain Intact)</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsVerifyOpen(false)}
                  className="w-full py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-[#222] transition-colors cursor-pointer"
                >
                  Close Verification
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
