import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, 
  Lock, FileCheck, Play, RotateCcw, Sparkles, Check, 
  XCircle, Clock, PhoneOff, UserCheck 
} from 'lucide-react';
import { LedgerStats } from '../types';

interface ComplianceProps {
  stats: LedgerStats;
}

interface SimResult {
  allowed: boolean;
  primaryReason: string;
  results: {
    rule: string;
    name: string;
    passed: boolean;
    reason: string;
    citation: string;
  }[];
}

export const Compliance: React.FC<ComplianceProps> = ({ stats }) => {
  // Sandbox State
  const [dndFlag, setDndFlag] = useState(true);
  const [localHour, setLocalHour] = useState(22); // 22:00 = 10 PM (Quiet Hours)
  const [retryCount, setRetryCount] = useState(1);
  const [contactCount24h, setContactCount24h] = useState(1);
  const [isB2BDispute, setIsB2BDispute] = useState(false);
  const [amount, setAmount] = useState(65000);
  const [optOutReplied, setOptOutReplied] = useState(false);
  const [cumulativeCost, setCumulativeCost] = useState(45);

  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const evaluateSandbox = () => {
    const checks: SimResult['results'] = [];
    let isAllowed = true;
    let mainVetoReason = 'All 7 deterministic compliance guardrails verified and passed.';

    // 1. Opt-out
    if (optOutReplied) {
      isAllowed = false;
      mainVetoReason = 'Customer sent STOP/Opt-Out keyword. Immediate permanent suppression required.';
      checks.push({
        rule: 'OPT_OUT_HONORING',
        name: 'Immediate Opt-Out & STOP Honoring',
        passed: false,
        reason: 'Revocation keyword detected. Zero subsequent contact permitted.',
        citation: 'Design Rationale: Aligned with consent management & privacy frameworks (Simulated)',
      });
    } else {
      checks.push({
        rule: 'OPT_OUT_HONORING',
        name: 'Immediate Opt-Out & STOP Honoring',
        passed: true,
        reason: 'No opt-out revocation recorded for customer ID.',
        citation: 'Design Rationale: Aligned with consent management & privacy frameworks (Simulated)',
      });
    }

    // 2. DND
    if (dndFlag) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = 'Customer registered on National TRAI DND registry with no explicit transactional consent.';
      checks.push({
        rule: 'DND_CONSENT_CHECK',
        name: 'TRAI / National DND Registry Check',
        passed: false,
        reason: 'National DND registry match. Outbound promotional & unsolicited communications strictly prohibited.',
        citation: 'Design Rationale: Aligned with TRAI National DND consumer preference framework (Simulated)',
      });
    } else {
      checks.push({
        rule: 'DND_CONSENT_CHECK',
        name: 'TRAI / National DND Registry Check',
        passed: true,
        reason: 'Verified clear on DND registry with active opt-in consent.',
        citation: 'Design Rationale: Aligned with TRAI National DND consumer preference framework (Simulated)',
      });
    }

    // 3. Quiet Hours (9 PM to 9 AM)
    if (localHour >= 21 || localHour < 9) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = `Current time (${localHour}:00 IST) violates regulatory quiet hours (9:00 PM - 9:00 AM).`;
      checks.push({
        rule: 'QUIET_HOURS',
        name: 'Quiet Hours Enforcement (9:00 PM – 9:00 AM)',
        passed: false,
        reason: `Local time is ${localHour}:00 IST. Direct outreach prohibited between 21:00 and 09:00.`,
        citation: 'Design Rationale: Aligned with regional commercial communication timing guidelines (Simulated)',
      });
    } else {
      checks.push({
        rule: 'QUIET_HOURS',
        name: 'Quiet Hours Enforcement (9:00 PM – 9:00 AM)',
        passed: true,
        reason: `Local time is ${localHour}:00 IST (Permitted business window: 09:00 - 21:00 IST).`,
        citation: 'Design Rationale: Aligned with regional commercial communication timing guidelines (Simulated)',
      });
    }

    // 4. Contact Frequency Cap (max 2 per 24h)
    if (contactCount24h >= 2) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = `Customer already contacted ${contactCount24h} times in past 24h (Max cap: 2).`;
      checks.push({
        rule: 'CONTACT_FREQUENCY_CAP',
        name: 'Contact Frequency Cap (Max 2 in 24h)',
        passed: false,
        reason: `24-hour touchpoint count (${contactCount24h}) reached saturation limit (Cap: 2).`,
        citation: 'Design Rationale: Aligned with consumer fair communication & anti-harassment principles (Simulated)',
      });
    } else {
      checks.push({
        rule: 'CONTACT_FREQUENCY_CAP',
        name: 'Contact Frequency Cap (Max 2 in 24h)',
        passed: true,
        reason: `Prior 24h contact count is ${contactCount24h} (Below saturation cap of 2).`,
        citation: 'Design Rationale: Aligned with consumer fair communication & anti-harassment principles (Simulated)',
      });
    }

    // 5. Retry Cap (max 3 auto-retries)
    if (retryCount >= 3) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = `Gateway auto-retry limit reached (${retryCount}/3 attempts).`;
      checks.push({
        rule: 'RETRY_CAP',
        name: 'Retry Cap (Max 3 Auto-Retries)',
        passed: false,
        reason: `Retry attempt #${retryCount + 1} exceeds max limit of 3 network attempts.`,
        citation: 'Design Rationale: Aligned with card network auto-retry exponential backoff conventions (Simulated)',
      });
    } else {
      checks.push({
        rule: 'RETRY_CAP',
        name: 'Retry Cap (Max 3 Auto-Retries)',
        passed: true,
        reason: `Retry count is ${retryCount} of 3 maximum allowed attempts.`,
        citation: 'Design Rationale: Aligned with card network auto-retry exponential backoff conventions (Simulated)',
      });
    }

    // 6. B2B High Value Dispute Escalation (>50k and dispute)
    if (amount > 50000 && isB2BDispute) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = `B2B invoice (₹${amount.toLocaleString()}) has commercial dispute. Automated recovery halted for Senior Credit Desk escalation.`;
      checks.push({
        rule: 'B2B_HIGH_VALUE_ESCALATION',
        name: 'B2B High-Value Invoice Escalation (>₹50,000)',
        passed: false,
        reason: `Disputed B2B invoice of ₹${amount.toLocaleString()} (>₹50k threshold). Escalated to Key Account Desk.`,
        citation: 'Design Rationale: Aligned with commercial credit dispute risk thresholds (Simulated)',
      });
    } else {
      checks.push({
        rule: 'B2B_HIGH_VALUE_ESCALATION',
        name: 'B2B High-Value Invoice Escalation (>₹50,000)',
        passed: true,
        reason: 'Invoice does not meet B2B dispute escalation criteria.',
        citation: 'Design Rationale: Aligned with commercial credit dispute risk thresholds (Simulated)',
      });
    }

    // 7. Cost-to-Recovery Stop (15% cap)
    const costRatio = amount > 0 ? (cumulativeCost / amount) * 100 : 0;
    if (costRatio > 15) {
      isAllowed = false;
      if (isAllowed) mainVetoReason = `Cumulative recovery expenditure (₹${cumulativeCost}) exceeds 15% of invoice value.`;
      checks.push({
        rule: 'COST_AWARE_STOP',
        name: 'Economic Cost-to-Recovery Stop (15% Cap)',
        passed: false,
        reason: `Recovery cost ratio (${costRatio.toFixed(1)}%) exceeds 15.0% economic profitability threshold.`,
        citation: 'Design Rationale: Algorithmic unit-economics boundary (Simulated)',
      });
    } else {
      checks.push({
        rule: 'COST_AWARE_STOP',
        name: 'Economic Cost-to-Recovery Stop (15% Cap)',
        passed: true,
        reason: `Recovery cost ratio is ${costRatio.toFixed(2)}% (Within 15% economic boundary).`,
        citation: 'Design Rationale: Algorithmic unit-economics boundary (Simulated)',
      });
    }

    setSimResult({
      allowed: isAllowed,
      primaryReason: isAllowed ? 'All guardrail policies satisfied. Bounded action approved for execution.' : mainVetoReason,
      results: checks,
    });
  };

  const resetSandbox = () => {
    setDndFlag(false);
    setLocalHour(14);
    setRetryCount(1);
    setContactCount24h(0);
    setIsB2BDispute(false);
    setAmount(25000);
    setOptOutReplied(false);
    setCumulativeCost(12);
    setSimResult(null);
  };

  const rules = [
    {
      id: 'RETRY_CAP',
      name: 'Retry Cap (Max 3 Auto-Retries)',
      description: 'Simulates card network auto-retry limits with a maximum of 3 automated retry attempts and exponential backoff (1h, 6h, 24h).',
      type: 'Network Policy',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['RETRY_CAP'] || 0,
      severity: 'HARD GATE',
    },
    {
      id: 'CONTACT_FREQUENCY_CAP',
      name: 'Contact Frequency Cap (Max 2 in 24h)',
      description: 'Simulates consumer protection guidelines by capping outbound customer touches (WhatsApp, SMS, Voice, Email) to at most 2 per 24 hours across all channels.',
      type: 'Consumer Protection',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['CONTACT_FREQUENCY_CAP'] || 0,
      severity: 'HARD GATE',
    },
    {
      id: 'QUIET_HOURS',
      name: 'Quiet Hours Enforcement (9:00 PM – 9:00 AM)',
      description: 'Simulates regional communication timing policies prohibiting direct customer outreach between 9:00 PM and 9:00 AM local time.',
      type: 'Timing Policy',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['QUIET_HOURS'] || 0,
      severity: 'HARD GATE',
    },
    {
      id: 'DND_CONSENT_CHECK',
      name: 'TRAI / National DND Registry Check',
      description: 'Simulates national Do-Not-Disturb registry checks. Instantly vetoes outreach if the customer is flagged on DND without explicit transactional opt-in.',
      type: 'Consent Policy',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['DND_CONSENT_CHECK'] || 0,
      severity: 'HARD GATE',
    },
    {
      id: 'OPT_OUT_HONORING',
      name: 'Immediate Opt-Out & STOP Honoring',
      description: 'Simulates privacy opt-out frameworks where receiving "STOP" or unsubscribe keywords immediately and permanently closes the case.',
      type: 'Consent Policy',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['OPT_OUT_HONORING'] || 0,
      severity: 'HARD GATE',
    },
    {
      id: 'B2B_HIGH_VALUE_ESCALATION',
      name: 'B2B High-Value Invoice Escalation (>₹50,000)',
      description: 'Commercial credit policy where disputed B2B invoices exceeding ₹50,000 overdue for 5+ days halt automated nudges and escalate to human credit desks.',
      type: 'Enterprise Risk',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['B2B_HIGH_VALUE_ESCALATION'] || 0,
      severity: 'MANDATORY ESCALATION',
    },
    {
      id: 'COST_AWARE_STOP',
      name: 'Economic Cost-to-Recovery Stop (15% Cap)',
      description: 'Algorithmic unit-economics boundary that terminates recovery workflows if cumulative communication & gateway fees exceed 15% of amount at risk.',
      type: 'Economic Guardrail',
      status: 'ACTIVE',
      vetoCount: stats.veto_reasons['COST_AWARE_STOP'] || 0,
      severity: 'HARD GATE',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[44px] md:text-[56px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
            Compliance & Guardrails
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1 font-normal">
            Deterministic hard gates evaluated before any action execution. Every single check writes an immutable audit record.
          </p>
        </div>

        {/* Global Compliance Badge */}
        <div className="flex items-center gap-2 bg-card border border-hairline rounded-full px-4 py-2 shadow-subtle">
          <ShieldCheck className="w-4 h-4 text-[#3FA85C]" />
          <span className="text-xs font-semibold text-[#0A0A0A]">All 7 Policies Active</span>
          <span className="text-xs text-[#8A8A85]">•</span>
          <span className="text-xs font-mono font-bold text-[#E85D8A]">
            {stats.compliance_stops_count} Total Vetoes Enforced
          </span>
        </div>
      </div>

      {/* Visible Demonstration & Simulation Notice Banner */}
      <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-2card text-xs text-[#92400E] flex items-start gap-2.5 shadow-subtle">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
        <div className="leading-relaxed">
          <span className="font-bold text-[#78350F]">Policy Simulation Notice:</span> These thresholds represent configurable business logic simulating regulatory and industry guidelines for demonstration purposes, not a certified legal audit.
        </div>
      </div>

      {/* INTERACTIVE GUARDRAIL TEST SANDBOX */}
      <div className="bg-card border border-hairline rounded-2card p-6 shadow-subtle space-y-5">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-hairline gap-3 select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-blue" />
            <span className="font-semibold text-sm text-[#0A0A0A]">Interactive Guardrail Simulator (Sandbox)</span>
          </div>
          <span className="text-xs text-[#8A8A85]">
            Configure edge-case scenarios and test deterministic gate enforcement
          </span>
        </div>

        {/* Parameter Sliders & Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* DND Toggle */}
          <div className="p-3.5 bg-canvas rounded-2xl border border-hairline space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-[#0A0A0A]">TRAI DND Registry</span>
              <span className={dndFlag ? 'text-[#E85D8A] font-bold font-mono' : 'text-[#3FA85C] font-bold font-mono'}>
                {dndFlag ? 'DND ACTIVE' : 'NO DND'}
              </span>
            </div>
            <button
              onClick={() => setDndFlag(!dndFlag)}
              className={`w-full py-1.5 px-3 rounded-xl border font-medium transition-all cursor-pointer text-xs ${
                dndFlag
                  ? 'bg-accent-roseSoft border-[#F8CAD7] text-[#9E2A4F]'
                  : 'bg-card border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
              }`}
            >
              {dndFlag ? 'Flagged on National DND' : 'Clear (Consent Granted)'}
            </button>
          </div>

          {/* Local Hour */}
          <div className="p-3.5 bg-canvas rounded-2xl border border-hairline space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-[#0A0A0A]">Customer Local Time</span>
              <span className="font-mono font-bold text-[#0A0A0A]">{localHour}:00 IST</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={localHour}
              onChange={(e) => setLocalHour(Number(e.target.value))}
              className="w-full accent-[#0A0A0A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8A8A85] font-mono">
              <span>00:00 (Quiet)</span>
              <span className="text-accent-blue font-bold">14:00 (Valid)</span>
              <span>23:00 (Quiet)</span>
            </div>
          </div>

          {/* 24h Touches */}
          <div className="p-3.5 bg-canvas rounded-2xl border border-hairline space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-[#0A0A0A]">24h Contacts</span>
              <span className="font-mono font-bold text-[#0A0A0A]">{contactCount24h} / 2</span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setContactCount24h(num)}
                  className={`flex-1 py-1 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    contactCount24h === num
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-card border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* B2B Dispute */}
          <div className="p-3.5 bg-canvas rounded-2xl border border-hairline space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-[#0A0A0A]">B2B Invoice Dispute</span>
              <span className={isB2BDispute ? 'text-[#E8A23D] font-bold font-mono' : 'text-[#8A8A85] font-mono'}>
                {isB2BDispute ? 'DISPUTED' : 'NORMAL'}
              </span>
            </div>
            <button
              onClick={() => setIsB2BDispute(!isB2BDispute)}
              className={`w-full py-1.5 px-3 rounded-xl border font-medium transition-all cursor-pointer text-xs ${
                isB2BDispute
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  : 'bg-card border-hairline text-[#5A5A55] hover:text-[#0A0A0A]'
              }`}
            >
              {isB2BDispute ? 'Disputed (>₹50k Flag)' : 'Standard Invoice'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={evaluateSandbox}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-medium transition-all cursor-pointer shadow-subtle"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate Guardrail Gate</span>
            </button>
            <button
              onClick={resetSandbox}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-hairline hover:border-[#D0D0C8] text-xs font-medium text-[#5A5A55] hover:text-[#0A0A0A] transition-colors cursor-pointer shadow-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {simResult && (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                simResult.allowed
                  ? 'bg-accent-greenSoft border-[#C8EAD2] text-[#2D7A42]'
                  : 'bg-accent-roseSoft border-[#F8CAD7] text-[#9E2A4F]'
              }`}
            >
              {simResult.allowed ? (
                <ShieldCheck className="w-4 h-4 text-[#3FA85C]" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#E85D8A]" />
              )}
              <span>Verdict: {simResult.allowed ? 'PASSED (ALLOWED)' : 'ACTION VETOED / BLOCKED'}</span>
            </div>
          )}
        </div>

        {/* Simulator Results Output */}
        {simResult && (
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-hairline space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-medium text-[#0A0A0A]">
              <span className="text-[#8A8A85]">Gate Summary: </span>
              {simResult.primaryReason}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {simResult.results.map((res) => (
                <div
                  key={res.rule}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    res.passed
                      ? 'bg-card border-hairline'
                      : 'bg-accent-roseSoft/40 border-[#F8CAD7]'
                  }`}
                >
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3FA85C] shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-[#E85D8A] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0A0A0A]">{res.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          res.passed ? 'text-[#3FA85C]' : 'text-[#E85D8A]'
                        }`}
                      >
                        {res.passed ? 'PASS' : 'VETO'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A5A55] leading-relaxed">{res.reason}</p>
                    <div className="text-[10px] text-[#8A8A85] font-mono">{res.citation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className="bg-card border border-hairline rounded-2card p-6 flex flex-col justify-between shadow-subtle space-y-4 hover:border-[#D0D0C8] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8A8A85]">
                  {r.type}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-greenSoft border border-[#C8EAD2] text-[#2D7A42]">
                  {r.severity}
                </span>
              </div>
              <h3 className="text-base font-medium text-[#0A0A0A]">{r.name}</h3>
              <p className="text-xs text-[#5A5A55] leading-relaxed mt-2 font-normal">
                {r.description}
              </p>
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#3FA85C]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-semibold">Guardrail Operational</span>
              </div>
              <div className="text-[#5A5A55]">
                Vetoes Enforced:{' '}
                <span className="font-bold text-[#0A0A0A]">{r.vetoCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
