import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, ShieldAlert, BarChart2, Layers, 
  CheckCircle2, ArrowUpRight, Calculator, Sparkles, 
  Percent, DollarSign, Zap 
} from 'lucide-react';
import { LedgerStats } from '../types';
import { formatINR, formatCompactINR } from '../utils/formatters';

interface AnalyticsProps {
  stats: LedgerStats;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats }) => {
  // ROI Calculator State
  const [monthlyVolume, setMonthlyVolume] = useState(1500000); // 15 Lakh INR
  const [expectedRate, setExpectedRate] = useState(62); // 62% recovery

  // Calculated ROI figures
  const annualAtRisk = monthlyVolume * 12;
  const annualRecovered = (annualAtRisk * expectedRate) / 100;
  const estimatedCost = annualRecovered * 0.012; // ~1.2% recovery operational fee
  const netSaved = annualRecovered - estimatedCost;
  const netRoi = estimatedCost > 0 ? (annualRecovered / estimatedCost).toFixed(1) : '83.3';

  // Real Waterfall Data
  const contactedAmt = (stats.funnel?.detected || 0) > 0
    ? ((stats.revenue_at_risk || 0) * (stats.funnel?.contacted || 0)) / (stats.funnel?.detected || 1)
    : 0;

  const waterfallData = [
    { name: 'At Risk', amount: stats.revenue_at_risk || 0, color: '#3B6FE0' },
    { name: 'Contacted', amount: contactedAmt, color: '#5B8BF5' },
    { name: 'Recovered Gross', amount: stats.revenue_recovered || 0, color: '#3FA85C' },
    { name: 'Recovery Cost', amount: stats.total_cost_incurred || 0, color: '#E85D8A' },
    { name: 'Net Recovered', amount: stats.net_revenue_recovered || 0, color: '#2D7A42' },
  ];

  // Event Type Breakdown (Real dynamic breakdown)
  const typeData = Object.entries(stats.type_breakdown || {}).map(([key, val]) => {
    const rate = val.risk > 0 ? (val.recovered / val.risk) * 100 : 0;
    let label = 'Payment Failed';
    if (key === 'checkout_abandoned') label = 'Cart Abandoned';
    if (key === 'subscription_failed') label = 'Subscription Renewal';
    if (key === 'invoice_overdue') label = 'Overdue Receivables';
    return {
      type: label,
      risk: val.risk,
      recovered: val.recovered,
      count: val.count,
      rate: rate.toFixed(1),
    };
  });

  const channels = [
    {
      name: 'WhatsApp Business API',
      cost: '₹0.40 / msg',
      rate: '68.4%',
      avgTime: 'Instant (<3s)',
      roi: '85.2x',
      color: 'text-[#3FA85C]',
    },
    {
      name: 'Automated Gateway Retry',
      cost: '₹0.00 / retry',
      rate: '51.2%',
      avgTime: 'Smart Backoff',
      roi: 'Infinite',
      color: 'text-accent-blue',
    },
    {
      name: 'Hinglish AI Voice Agent',
      cost: '₹1.80 / call',
      rate: '74.1%',
      avgTime: 'Scheduled Slot',
      roi: '41.5x',
      color: 'text-[#8B5CF6]',
    },
    {
      name: 'SMS Fallback Gateway',
      cost: '₹0.15 / SMS',
      rate: '38.6%',
      avgTime: 'Instant (<5s)',
      roi: '62.0x',
      color: 'text-[#E8A23D]',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full scrollbar-thin">
      {/* Header */}
      <div>
        <h1 className="text-[44px] md:text-[56px] leading-none font-extralight tracking-tight text-[#0A0A0A]">
          Reports & Analytics
        </h1>
        <p className="text-xs text-[#8A8A85] mt-1 font-normal">
          Comprehensive financial reconciliation, conversion funnels, and ROI recovery analysis.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-hairline rounded-2card p-5 shadow-subtle">
          <div className="text-[11px] text-[#8A8A85] uppercase tracking-wider font-medium">Gross Recovered</div>
          <div className="text-3xl font-extralight tabular-nums text-[#3FA85C] mt-1">
            {formatINR(stats.revenue_recovered, false)}
          </div>
          <div className="text-[11px] text-[#5A5A55] mt-1 font-mono">{stats.recovery_rate_pct.toFixed(1)}% recovery rate</div>
        </div>

        <div className="bg-card border border-hairline rounded-2card p-5 shadow-subtle">
          <div className="text-[11px] text-[#8A8A85] uppercase tracking-wider font-medium">Net Revenue Recovered</div>
          <div className="text-3xl font-extralight tabular-nums text-[#0A0A0A] mt-1">
            {formatINR(stats.net_revenue_recovered, false)}
          </div>
          <div className="text-[11px] text-[#8A8A85] mt-1 font-mono">After ₹{stats.total_cost_incurred.toFixed(2)} cost</div>
        </div>

        <div className="bg-card border border-hairline rounded-2card p-5 shadow-subtle">
          <div className="text-[11px] text-[#8A8A85] uppercase tracking-wider font-medium">Recovery ROI</div>
          <div className="text-3xl font-extralight tabular-nums text-accent-blue mt-1">
            {stats.roi_multiplier > 0 ? `${stats.roi_multiplier.toFixed(1)}x` : '--'}
          </div>
          <div className="text-[11px] text-[#8A8A85] mt-1 font-mono">Per ₹1 recovery expenditure</div>
        </div>

        <div className="bg-card border border-hairline rounded-2card p-5 shadow-subtle">
          <div className="text-[11px] text-[#8A8A85] uppercase tracking-wider font-medium">Guardrail Vetoes</div>
          <div className="text-3xl font-extralight tabular-nums text-[#E85D8A] mt-1">
            {stats.compliance_stops_count}
          </div>
          <div className="text-[11px] text-[#8A8A85] mt-1 font-mono">100% policy enforcement</div>
        </div>
      </div>

      {/* Waterfall & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Waterfall Chart */}
        <div className="lg:col-span-7 bg-card border border-hairline rounded-2card p-6 md:p-8 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-[#0A0A0A]">Revenue Recovery Waterfall</h3>
            <span className="text-xs text-[#8A8A85] font-mono">Values in INR (₹)</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#8A8A85" tick={{ fill: '#5A5A55', fontSize: 11 }} />
                <YAxis stroke="#8A8A85" tick={{ fill: '#5A5A55', fontSize: 11 }} tickFormatter={(v) => formatCompactINR(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#ECECE8', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  formatter={(value: any) => [formatINR(Number(value)), 'Amount']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Breakdown Table */}
        <div className="lg:col-span-5 bg-card border border-hairline rounded-2card p-6 md:p-8 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-[#0A0A0A]">Performance by Event Type</h3>
          </div>

          <div className="overflow-x-auto">
            {typeData.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A8A85]">
                No cases processed yet. Start the batch to see real breakdown.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-[#8A8A85] border-b border-hairline uppercase font-semibold">
                  <tr>
                    <th className="pb-3">Event Signal</th>
                    <th className="pb-3 text-right">At Risk</th>
                    <th className="pb-3 text-right">Recovered</th>
                    <th className="pb-3 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {typeData.map((t) => (
                    <tr key={t.type} className="hover:bg-[#FAF9F7]">
                      <td className="py-3 font-semibold text-[#0A0A0A]">{t.type}</td>
                      <td className="py-3 text-right font-mono text-[#5A5A55]">{formatINR(t.risk, false)}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#3FA85C]">{formatINR(t.recovered, false)}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-greenSoft text-[#2D7A42] border border-[#C8EAD2]">
                          {t.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Channel Unit Economics & Interactive ROI Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Channel Economics Table */}
        <div className="lg:col-span-6 bg-card border border-hairline rounded-2card p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-blue" />
              <h3 className="text-base font-medium text-[#0A0A0A]">Channel Unit Economics</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8A8A85]">Per-Message Dispatch</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-[#8A8A85] border-b border-hairline uppercase font-semibold">
                <tr>
                  <th className="pb-2.5">Outreach Channel</th>
                  <th className="pb-2.5 text-right font-mono">Unit Cost</th>
                  <th className="pb-2.5 text-right font-mono">Conv. Rate</th>
                  <th className="pb-2.5 text-right font-mono">Expected ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {channels.map((ch) => (
                  <tr key={ch.name} className="hover:bg-[#FAF9F7]">
                    <td className="py-3 font-semibold text-[#0A0A0A]">{ch.name}</td>
                    <td className="py-3 text-right font-mono text-[#5A5A55]">{ch.cost}</td>
                    <td className="py-3 text-right font-mono font-bold text-[#3FA85C]">{ch.rate}</td>
                    <td className="py-3 text-right font-mono font-bold text-accent-blue">{ch.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Annual ROI Calculator Card */}
        <div className="lg:col-span-6 bg-card border border-hairline rounded-2card p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#3FA85C]" />
              <h3 className="text-base font-medium text-[#0A0A0A]">Interactive Annual ROI Simulator</h3>
            </div>
            <span className="text-[11px] font-mono text-[#3FA85C] bg-accent-greenSoft px-2.5 py-0.5 rounded-full border border-[#C8EAD2] font-semibold">
              {netRoi}x Net ROI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Volume Slider */}
            <div className="p-3 bg-canvas rounded-xl border border-hairline space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-[#5A5A55]">Monthly Failed Volume:</span>
                <span className="font-mono font-bold text-[#0A0A0A]">{formatINR(monthlyVolume, false)}</span>
              </div>
              <input
                type="range"
                min="200000"
                max="10000000"
                step="100000"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-[#0A0A0A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8A8A85] font-mono">
                <span>₹2L</span>
                <span>₹50L</span>
                <span>₹1Cr</span>
              </div>
            </div>

            {/* Target Rate Slider */}
            <div className="p-3 bg-canvas rounded-xl border border-hairline space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-[#5A5A55]">Target Recovery Rate:</span>
                <span className="font-mono font-bold text-[#3FA85C]">{expectedRate}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="85"
                step="1"
                value={expectedRate}
                onChange={(e) => setExpectedRate(Number(e.target.value))}
                className="w-full accent-[#0A0A0A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8A8A85] font-mono">
                <span>25%</span>
                <span>55%</span>
                <span>85%</span>
              </div>
            </div>
          </div>

          {/* Projection Output Row */}
          <div className="p-4 bg-[#FAF9F7] rounded-xl border border-hairline grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-[#8A8A85] uppercase font-medium">Annual Recovered</div>
              <div className="text-base font-light font-mono text-[#3FA85C] mt-0.5">
                {formatINR(annualRecovered, false)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#8A8A85] uppercase font-medium">Agent Cost</div>
              <div className="text-base font-light font-mono text-[#E85D8A] mt-0.5">
                {formatINR(estimatedCost, false)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#8A8A85] uppercase font-medium">Net Annual Profit</div>
              <div className="text-base font-semibold font-mono text-[#0A0A0A] mt-0.5">
                {formatINR(netSaved, false)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
