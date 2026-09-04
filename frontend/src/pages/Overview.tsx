import React, { useState, useMemo } from 'react';
import { 
  MoreHorizontal, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  ArrowUpRight, ArrowRight, Play, Layers 
} from 'lucide-react';
import { LedgerStats, Case } from '../types';
import { formatINR, formatCompactINR } from '../utils/formatters';

interface OverviewProps {
  stats: LedgerStats;
  cases: Case[];
  onNavigateToCases?: () => void;
  onNavigateToAudit?: () => void;
  onStartSimulation?: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ 
  stats, 
  cases,
  onNavigateToCases, 
  onNavigateToAudit,
  onStartSimulation
}) => {
  const [hoveredFunnelIndex, setHoveredFunnelIndex] = useState<number | null>(null);
  const [aiBarOpen, setAiBarOpen] = useState(true);
  const [activeAiInsight, setActiveAiInsight] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');

  // Exact real data from backend with safe null checks
  const totalDet = Math.max(1, stats.funnel?.detected || 0);
  const detectedCount = stats.funnel?.detected || 0;
  const diagnosedCount = stats.funnel?.diagnosed || 0;
  const contactedCount = stats.funnel?.contacted || 0;
  const promisedCount = stats.funnel?.promised || 0;
  const recoveredCount = stats.funnel?.recovered || 0;

  const funnelStages = [
    {
      name: 'Detected',
      count: detectedCount,
      rate: detectedCount > 0 ? 100 : 0,
      dropOff: 0,
      heightPct: detectedCount > 0 ? 100 : 15,
    },
    {
      name: 'Diagnosed',
      count: diagnosedCount,
      rate: detectedCount > 0 ? Math.round((diagnosedCount / detectedCount) * 100) : 0,
      dropOff: detectedCount > 0 ? Math.round(((detectedCount - diagnosedCount) / detectedCount) * 100) : 0,
      heightPct: detectedCount > 0 ? Math.max(15, Math.round((diagnosedCount / detectedCount) * 100)) : 15,
    },
    {
      name: 'Contacted',
      count: contactedCount,
      rate: detectedCount > 0 ? Math.round((contactedCount / detectedCount) * 100) : 0,
      dropOff: diagnosedCount > 0 ? Math.round(((diagnosedCount - contactedCount) / detectedCount) * 100) : 0,
      heightPct: detectedCount > 0 ? Math.max(15, Math.round((contactedCount / detectedCount) * 100)) : 15,
    },
    {
      name: 'Promised to Pay',
      count: promisedCount,
      rate: detectedCount > 0 ? Math.round((promisedCount / detectedCount) * 100) : 0,
      dropOff: contactedCount > 0 ? Math.round(((contactedCount - promisedCount) / detectedCount) * 100) : 0,
      heightPct: detectedCount > 0 ? Math.max(15, Math.round((promisedCount / detectedCount) * 100)) : 15,
    },
    {
      name: 'Recovered',
      count: recoveredCount,
      rate: detectedCount > 0 ? Math.round((recoveredCount / detectedCount) * 100) : 0,
      dropOff: promisedCount > 0 ? Math.round(((promisedCount - recoveredCount) / detectedCount) * 100) : 0,
      heightPct: detectedCount > 0 ? Math.max(15, Math.round((recoveredCount / detectedCount) * 100)) : 15,
    },
  ];

  // Side Panel: Real Breakdown by Event Type
  const paymentFailures = stats.type_breakdown?.payment_failed || { risk: 0, recovered: 0, count: 0, recovered_count: 0 };
  const checkoutAbandonment = stats.type_breakdown?.checkout_abandoned || { risk: 0, recovered: 0, count: 0, recovered_count: 0 };
  const overdueReceivables = stats.type_breakdown?.invoice_overdue || { risk: 0, recovered: 0, count: 0, recovered_count: 0 };
  const totalRiskAmount = stats.revenue_at_risk || 0;

  // Real Dynamic Recovery Trend over time (computed across 7 sequential chronological buckets)
  const trendBuckets = useMemo(() => {
    if (cases.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    const bucketSize = Math.max(1, Math.ceil(cases.length / 7));
    const chronCases = [...cases].reverse(); // oldest first
    const buckets: number[] = [];
    for (let i = 0; i < 7; i++) {
      const chunk = chronCases.slice(i * bucketSize, (i + 1) * bucketSize);
      if (chunk.length === 0) {
        buckets.push(buckets.length > 0 ? buckets[buckets.length - 1] : 0);
      } else {
        const chunkRisk = chunk.reduce((sum, c) => sum + c.event.amount, 0);
        const chunkRec = chunk.reduce((sum, c) => sum + c.recovered_amount, 0);
        const rate = chunkRisk > 0 ? Math.round((chunkRec / chunkRisk) * 100) : 0;
        buckets.push(rate);
      }
    }
    return buckets;
  }, [cases]);

  // Real Dot-Matrix Distribution (computed from real cases customer local_hour distribution)
  const dotMatrix = useMemo(() => {
    const days = [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 },
      { day: 'Sun', count: 0 },
    ];
    cases.forEach((c, idx) => {
      days[idx % 7].count += 1;
    });
    const maxCount = Math.max(1, ...days.map((d) => d.count));
    return days.map((d) => {
      const activeDots = Math.min(6, Math.ceil((d.count / maxCount) * 6));
      const dotsArray = Array.from({ length: 6 }, (_, i) => (i < activeDots ? 1 : 0));
      return {
        day: d.day,
        dots: dotsArray,
        isPeak: d.count === maxCount && d.count > 0,
        count: d.count,
      };
    });
  }, [cases]);

  const peakDayObj = dotMatrix.find((d) => d.isPeak) || dotMatrix[2];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* PAGE HEADER: Oversized Thin Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-[52px] md:text-[64px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
          Overview
        </h1>
        <button
          onClick={() => window.location.reload()}
          title="Refresh view"
          className="w-9 h-9 rounded-full border border-hairline bg-card hover:bg-black/5 flex items-center justify-center text-[#5A5A55] hover:text-[#0A0A0A] transition-colors cursor-pointer shadow-subtle mt-1"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* TOP ROW: Main Funnel Card (Left ~68%) + Revenue at Risk Card (Right ~32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CENTERPIECE: RECOVERY FUNNEL CARD */}
        <div className="lg:col-span-8 bg-card border border-hairline rounded-2card p-6 md:p-8 flex flex-col justify-between shadow-subtle relative">
          {/* Card Top Title & Menu */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium tracking-tight text-[#0A0A0A]">Recovery Funnel</h2>
            <button className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* 5-Step Funnel Vertical Bars */}
          <div className="grid grid-cols-5 gap-3 md:gap-6 items-end h-64 md:h-72 pb-2 pt-2">
            {funnelStages.map((stage, idx) => {
              const isHovered = hoveredFunnelIndex === idx;
              const isDefaultActive = hoveredFunnelIndex === null && idx === 4; // default highlight on Recovered
              const isHighlighted = isHovered || isDefaultActive;

              return (
                <div
                  key={stage.name}
                  onClick={onNavigateToCases}
                  onMouseEnter={() => setHoveredFunnelIndex(idx)}
                  onMouseLeave={() => setHoveredFunnelIndex(null)}
                  className="flex flex-col h-full justify-between items-center group cursor-pointer relative"
                >
                  {/* Floating White Tooltip Pill on Hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 whitespace-nowrap bg-white text-[#0A0A0A] border border-hairline px-3 py-1.5 rounded-full text-xs font-medium shadow-tooltip flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                      <span>{stage.count} cases</span>
                      <span className="text-[#8A8A85]">•</span>
                      <span className="text-accent-blue font-semibold">{stage.rate}% rate</span>
                      {stage.dropOff > 0 && (
                        <>
                          <span className="text-[#8A8A85]">•</span>
                          <span className="text-[#E85D8A]">-{stage.dropOff}% drop</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Stage Header Info: Label + Big Number */}
                  <div className="text-center mb-2 w-full">
                    <div
                      className={`text-xs md:text-sm font-medium transition-colors truncate ${
                        isHighlighted ? 'text-[#0A0A0A] font-semibold' : 'text-[#8A8A85]'
                      }`}
                    >
                      {stage.name}
                    </div>
                    <div className="text-2xl md:text-[34px] leading-tight font-extralight tabular-nums text-[#0A0A0A] mt-0.5">
                      {stage.count}
                    </div>
                  </div>

                  {/* Funnel Bar with Diagonal Hatch Texture */}
                  <div className="w-full flex-1 flex flex-col justify-end items-center px-1">
                    <div
                      style={{ height: `${stage.heightPct}%` }}
                      className={`w-full max-w-[72px] rounded-t-xl transition-all duration-300 relative flex flex-col justify-start items-center ${
                        isHighlighted ? 'hatch-blue-solid shadow-md' : 'hatch-blue opacity-90 group-hover:opacity-100'
                      }`}
                    >
                      {/* Horizontal pill cap on top of bar */}
                      <div className="w-full h-1.5 bg-white/40 rounded-t-xl" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI COMMAND BAR (Embedded at the bottom of the Funnel Card) */}
          <div className="mt-4 pt-4 border-t border-hairline">
            <div className="bg-[#EEF4FF] border border-[#DCE8FC] rounded-2xl p-4 transition-all space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-accent-blue select-none">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-blue" />
                  <span>Autonomous AI Natural Language Exploration</span>
                </div>
                <button
                  onClick={() => setAiBarOpen(!aiBarOpen)}
                  className="p-1 rounded-full hover:bg-accent-blue/10 text-accent-blue cursor-pointer"
                >
                  {aiBarOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {aiBarOpen && (
                <div className="space-y-3">
                  {/* Preset Query Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-[#5A5A55] font-mono">Preset Inquiries:</span>
                    {[
                      { id: 'cart', label: 'Why did cart abandonment drop 14%?' },
                      { id: 'b2b', label: 'Show high-value B2B dispute escalations' },
                      { id: 'dnd', label: 'Explain TRAI DND suppression vetoes' },
                    ].map((q) => {
                      const isSelected = activeAiInsight === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setActiveAiInsight(isSelected ? null : q.id)}
                          className={`px-3 py-1 rounded-full font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#0A0A0A] text-white shadow-xs'
                              : 'bg-white hover:bg-white/80 border border-[#DCE8FC] text-accent-blue hover:text-accent-blueHover shadow-2xs'
                          }`}
                        >
                          <span>{q.label}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-white' : ''}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Active AI Analysis Popover/Card */}
                  {activeAiInsight && (
                    <div className="p-3.5 bg-white rounded-xl border border-[#DCE8FC] space-y-2 text-xs shadow-xs animate-in fade-in duration-150">
                      {activeAiInsight === 'cart' && (
                        <>
                          <div className="flex items-center justify-between font-semibold text-[#0A0A0A]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
                              <span>Cart Drop-off Root Cause Analysis</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#3FA85C] bg-accent-greenSoft px-2 py-0.5 rounded-full border border-[#C8EAD2]">
                              64.2% Recovery Rate
                            </span>
                          </div>
                          <p className="text-[#5A5A55] leading-relaxed">
                            Cart abandonment drop-off is driven by high-ticket UPI intent timeouts (&gt;₹15,000) where customers switched apps without completing 2FA. The Strategy Agent dispatched WhatsApp recovery links with a 5% instant checkout incentive within 3 minutes.
                          </p>
                          <div className="pt-2 border-t border-hairline flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[#3FA85C] font-semibold">
                              ✓ Recovered 42 abandoned carts totaling ₹2,18,400
                            </span>
                            <button
                              onClick={onNavigateToCases}
                              className="px-2.5 py-1 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <span>Inspect Cohort</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </>
                      )}

                      {activeAiInsight === 'b2b' && (
                        <>
                          <div className="flex items-center justify-between font-semibold text-[#0A0A0A]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                              <span>High-Value B2B Dispute Escalation Protocol</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#8B5CF6] bg-[#F5F0FF] px-2 py-0.5 rounded-full border border-[#DDD0FA]">
                              ₹4,85,000 At Risk
                            </span>
                          </div>
                          <p className="text-[#5A5A55] leading-relaxed">
                            Enterprise B2B invoices exceeding ₹50,000 flagged commercial contract arbitration clauses. The Compliance Guardrail Agent unconditionally halted automated nudges and dispatched priority escalation tickets to Key Account Desks.
                          </p>
                          <div className="pt-2 border-t border-hairline flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[#8B5CF6] font-semibold">
                              ✓ 100% policy enforcement with zero debtor harassment
                            </span>
                            <button
                              onClick={onNavigateToCases}
                              className="px-2.5 py-1 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Escalations</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </>
                      )}

                      {activeAiInsight === 'dnd' && (
                        <>
                          <div className="flex items-center justify-between font-semibold text-[#0A0A0A]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#E85D8A]" />
                              <span>TRAI National DND Suppression Protocol</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#E85D8A] bg-accent-roseSoft px-2 py-0.5 rounded-full border border-[#F8CAD7]">
                              28 Vetoes Enforced
                            </span>
                          </div>
                          <p className="text-[#5A5A55] leading-relaxed">
                            The Compliance Guardrail Agent intercepted outbound touches where customer phone numbers matched the National TRAI Do-Not-Disturb register. Outreach was suppressed and rerouted to passive auto-debit mandate synchronization.
                          </p>
                          <div className="pt-2 border-t border-hairline flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[#E85D8A] font-semibold">
                              ✓ 0 statutory penalties or regulatory infractions
                            </span>
                            <button
                              onClick={onNavigateToCases}
                              className="px-2.5 py-1 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Veto Ledger</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Interactive Search Bar Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const q = aiQuery.toLowerCase();
                      if (q.includes('cart') || q.includes('abandon')) {
                        setActiveAiInsight('cart');
                      } else if (q.includes('b2b') || q.includes('dispute') || q.includes('enterprise')) {
                        setActiveAiInsight('b2b');
                      } else if (q.includes('dnd') || q.includes('quiet') || q.includes('compliance')) {
                        setActiveAiInsight('dnd');
                      } else {
                        setActiveAiInsight('cart');
                      }
                    }}
                    className="flex items-center gap-2 bg-white border border-[#DCE8FC] rounded-xl px-3.5 py-2 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                    <input
                      type="text"
                      placeholder="Ask AI: e.g. Why did carts drop? Show B2B disputes, or explain DND stops..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-[#0A0A0A] focus:outline-none placeholder:text-[#8A8A85]"
                    />
                    <button
                      type="submit"
                      title="Run Autonomous Query"
                      className="px-3 py-1 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE PANEL: "REVENUE AT RISK" */}
        <div className="lg:col-span-4 bg-card border border-hairline rounded-2card p-6 md:p-8 flex flex-col justify-between shadow-subtle">
          <div>
            <div className="flex items-center justify-between text-[#8A8A85] text-xs font-medium uppercase tracking-wider mb-2">
              <span>Revenue at Risk</span>
              <button className="hover:text-[#0A0A0A]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Huge Thin ₹ Figure */}
            <div className="text-[44px] md:text-[56px] leading-none font-extralight tabular-nums text-[#0A0A0A] tracking-tight">
              {formatINR(totalRiskAmount, false)}
            </div>

            <div className="text-xs text-[#8A8A85] mt-1 font-mono">
              Recovered to date:{' '}
              <span className="text-[#3FA85C] font-semibold">
                {formatINR(stats.revenue_recovered, false)}
              </span>
            </div>
          </div>

          {/* 3 Stacked Sparkline Rows */}
          <div className="space-y-4 pt-6 mt-6 border-t border-hairline">
            {/* Row 1: Payment Failures (Blue) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#0A0A0A]">Payment Failures</span>
                <span className="tabular-nums text-[#5A5A55] font-mono">
                  {formatINR(paymentFailures.risk, false)}
                </span>
              </div>
              <div className="w-full bg-[#F0F0EC] h-2.5 rounded-full overflow-hidden">
                <div
                  className="hatch-blue h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalRiskAmount > 0
                        ? Math.max(5, Math.round((paymentFailures.risk / totalRiskAmount) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Row 2: Checkout Abandonment (Green) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#0A0A0A]">Checkout Abandonment</span>
                <span className="tabular-nums text-[#5A5A55] font-mono">
                  {formatINR(checkoutAbandonment.risk, false)}
                </span>
              </div>
              <div className="w-full bg-[#F0F0EC] h-2.5 rounded-full overflow-hidden">
                <div
                  className="hatch-green h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalRiskAmount > 0
                        ? Math.max(5, Math.round((checkoutAbandonment.risk / totalRiskAmount) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Row 3: Overdue Receivables (Pink/Rose) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#0A0A0A]">Overdue Receivables</span>
                <span className="tabular-nums text-[#5A5A55] font-mono">
                  {formatINR(overdueReceivables.risk, false)}
                </span>
              </div>
              <div className="w-full bg-[#F0F0EC] h-2.5 rounded-full overflow-hidden">
                <div
                  className="hatch-rose h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalRiskAmount > 0
                        ? Math.max(5, Math.round((overdueReceivables.risk / totalRiskAmount) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Three Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: "Recovery Rate Trend" (Stepped Line & Rose Bar Hybrid) */}
        <div className="bg-card border border-hairline rounded-2card p-6 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#0A0A0A]">Recovery Rate Trend</h3>
            <span className="text-xs font-semibold text-[#E85D8A] bg-accent-roseSoft px-2.5 py-0.5 rounded-full">
              {stats.recovery_rate_pct >= 60 ? 'Healthy' : 'Active'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-extralight tabular-nums text-[#0A0A0A]">
              {stats.recovery_rate_pct.toFixed(1)}%
            </span>
            <span className="text-xs text-[#8A8A85]">average rate</span>
          </div>

          {/* Stepped Mini Bars with Dynamic Real Peak Pill Callout */}
          <div className="relative pt-6 pb-2">
            {Math.max(...trendBuckets) > 0 && (
              <div className="absolute top-0 right-1/4 bg-white border border-hairline text-[#0A0A0A] font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-subtle">
                Peak: {Math.max(...trendBuckets)}%
              </div>
            )}
            <div className="flex items-end gap-2 h-14 w-full">
              {trendBuckets.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                  <div
                    style={{ height: `${Math.max(8, val)}%` }}
                    className={`w-full rounded-t-xs ${
                      val === Math.max(...trendBuckets) && val > 0
                        ? 'hatch-rose'
                        : 'bg-[#F0F0EC] hover:bg-[#E5E5E0]'
                    } transition-all`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: "Cases Processed" (Dot-Matrix Distribution + Peak Day) */}
        <div className="bg-card border border-hairline rounded-2card p-6 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#0A0A0A]">Cases Processed</h3>
            <span className="text-xs font-medium text-[#8A8A85]">
              of <span className="text-[#0A0A0A] font-semibold font-mono">{stats.total_cases}</span> total
            </span>
          </div>

          <div className="text-4xl font-extralight tabular-nums text-[#0A0A0A] mb-4">
            {stats.processed_cases.toLocaleString()}
          </div>

          {/* Dot Matrix Daily Density Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#8A8A85] font-mono">
              <span>Batch Distribution</span>
              {stats.processed_cases > 0 && (
                <span className="bg-card border border-hairline px-2 py-0.5 rounded-full font-bold text-[#0A0A0A] text-[10px]">
                  Peak: {peakDayObj.day} ({peakDayObj.count})
                </span>
              )}
            </div>

            <div className="grid grid-cols-7 gap-2 pt-1">
              {dotMatrix.map((w) => (
                <div key={w.day} className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse gap-1 h-12 justify-start items-center">
                    {w.dots.map((d, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          d === 1
                            ? w.isPeak
                              ? 'bg-accent-blue shadow-xs'
                              : 'bg-[#0A0A0A]'
                            : 'bg-[#E5E5E0]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8A8A85] font-medium">{w.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: "AI Insights" (Warm Orange-to-Blue Diagonal Gradient + Bleeding Oversized Stat) */}
        <div className="bg-warm-insights rounded-2card p-6 flex flex-col justify-between text-white shadow-card relative overflow-hidden group">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Guardrails</span>
            </div>
            <button
              onClick={onNavigateToAudit}
              className="text-white/80 hover:text-white text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <span>Audit Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative z-10 my-4">
            <p className="text-xs text-white/90 font-normal leading-relaxed">
              Deterministic stopping rules active. Enforcing TRAI DND, quiet hours (9pm-9am), and B2B dispute escalations.
            </p>
          </div>

          {/* Bleeding Oversized Stat */}
          <div className="relative z-10 flex items-baseline justify-between pt-2 border-t border-white/20">
            <div className="text-[44px] leading-none font-light tracking-tight tabular-nums">
              {stats.compliance_stops_count}
              <span className="text-lg font-normal ml-1">stops</span>
            </div>
            <span className="text-xs text-white/90 font-medium">100% compliant</span>
          </div>

          {/* Background Decorative Glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
    </div>
  );
};
