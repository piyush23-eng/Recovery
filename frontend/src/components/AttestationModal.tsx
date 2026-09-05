import React from 'react';
import { X, ShieldCheck, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { LedgerStats } from '../types';
import { formatINR } from '../utils/formatters';

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: LedgerStats;
}

export const AttestationModal: React.FC<AttestationModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-hairline rounded-2card max-w-2xl w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-hairline">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4 text-[#3FA85C]" />
              </div>
              <span className="font-semibold text-base text-[#0A0A0A]">Compliance Policy Simulation Report</span>
            </div>
            <p className="text-xs text-[#8A8A85]">
              Internal simulation summary of guardrail rules, stopping thresholds, and veto statistics.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visible Prominent Demonstration Disclaimer Banner */}
        <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl text-xs text-[#92400E] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
          <div className="space-y-0.5 leading-relaxed">
            <div className="font-bold text-[#78350F]">Demonstration & Simulation Notice</div>
            <p className="text-[11px] text-[#92400E]">
              These thresholds represent configurable business logic simulating regulatory and industry guidelines for demonstration purposes, not a certified legal audit or statutory compliance certificate.
            </p>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-6 rounded-2xl bg-[#FAF9F7] border border-hairline space-y-5 text-[#0A0A0A]">
          <div className="text-center space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-[#8A8A85] uppercase font-bold">
              INTERNAL COMPLIANCE POLICY REPORT
            </div>
            <h2 className="text-lg font-medium text-[#0A0A0A]">
              Simulated Guardrail Policy Enforcement
            </h2>
            <div className="text-xs text-[#5A5A55]">
              Batch Execution Summary: #{stats.processed_cases} of {stats.total_cases} Cases Processed
            </div>
          </div>

          <div className="text-xs text-[#5A5A55] leading-relaxed space-y-3 pt-3 border-t border-hairline">
            <p>
              Summary of automated policy evaluation applied across all simulated recovery interventions:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-hairline space-y-1">
                <div className="flex items-center gap-1.5 text-[#3FA85C] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>TRAI DND Policy (Simulated)</span>
                </div>
                <div className="text-[11px] text-[#5A5A55]">
                  Suppresses outreach if flagged on DND registry. {stats.veto_reasons['DND_CONSENT_CHECK'] || 0} stops recorded.
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-hairline space-y-1">
                <div className="flex items-center gap-1.5 text-[#3FA85C] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quiet Hours (9pm–9am)</span>
                </div>
                <div className="text-[11px] text-[#5A5A55]">
                  Blocks night-time contact in customer timezone. {stats.veto_reasons['QUIET_HOURS'] || 0} stops recorded.
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-hairline space-y-1">
                <div className="flex items-center gap-1.5 text-[#3FA85C] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Card Retry Frequency</span>
                </div>
                <div className="text-[11px] text-[#5A5A55]">
                  Max 3 auto-retries with exponential backoff.
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-hairline space-y-1">
                <div className="flex items-center gap-1.5 text-[#3FA85C] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Consent Opt-Out Honoring</span>
                </div>
                <div className="text-[11px] text-[#5A5A55]">
                  Immediate case closure upon STOP/opt-out keyword.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-hairline flex items-center justify-between text-[11px] font-mono">
              <div>
                Total Policy Vetoes Enforced: <strong className="text-[#E85D8A]">{stats.compliance_stops_count}</strong>
              </div>
              <div>
                Net Recovered Amount: <strong className="text-[#3FA85C]">{formatINR(stats.net_revenue_recovered, false)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="/api/audit-log/export"
            download="compliance_audit_ledger.csv"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-semibold cursor-pointer shadow-subtle transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Simulation Audit Ledger (CSV)</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-hairline hover:bg-black/5 text-[#5A5A55] text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
