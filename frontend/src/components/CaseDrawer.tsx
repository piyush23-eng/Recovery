import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, ShieldAlert, CheckCircle2, 
  MessageSquare, FileCode, Check, Copy, 
  PhoneCall, ArrowRight, User, Play, Pause, 
  Volume2, CheckCheck, CreditCard, RefreshCw, Sparkles, 
  ChevronRight, CircleDot 
} from 'lucide-react';
import { Case } from '../types';
import { formatINR, formatTime, getStatusBadge, getAgentColor, getDiagnosisLabel, getEventTypeLabel } from '../utils/formatters';

interface CaseDrawerProps {
  caseData: Case | null;
  onClose: () => void;
}

export const CaseDrawer: React.FC<CaseDrawerProps> = ({ caseData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'compliance' | 'outreach' | 'audit'>('timeline');
  const [copied, setCopied] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!caseData) return null;

  const { event, diagnosis, intervention, compliance, action_result, audit_trail, state } = caseData;
  const statusBadge = getStatusBadge(state);
  const isVetoed = compliance && !compliance.allowed;

  const copyCaseJson = () => {
    navigator.clipboard.writeText(JSON.stringify(caseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const togglePlayVoice = () => {
    if (!('speechSynthesis' in window)) {
      setIsPlayingVoice(!isPlayingVoice);
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = intervention?.voice_script?.opening_line || 'Namaste, this is an automated payment recovery notification from the recovery team.';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = event.language_pref === 'hindi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingVoice(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden isolate">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Solid Opaque Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div 
          style={{ backgroundColor: '#FFFFFF' }}
          className="w-screen max-w-2xl bg-white border-l border-[#D0D0C8] h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.35)] overflow-hidden animate-in slide-in-from-right duration-300 relative z-10 pointer-events-auto"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-hairline bg-white flex items-start justify-between gap-4 select-none">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-mono font-bold text-[#0A0A0A]">{caseData.case_id}</span>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-canvas border border-hairline text-[#5A5A55]">
                {event.customer_segment}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
              <span>{event.customer_name}</span>
              <span className="text-xs text-[#8A8A85] font-mono">({event.customer_id})</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-[#8A8A85] uppercase tracking-wider font-medium">Revenue at Risk</div>
              <div className="text-lg font-light tabular-nums text-[#0A0A0A]">{formatINR(event.amount)}</div>
              {caseData.recovered_amount > 0 && (
                <div className="text-xs font-mono text-[#3FA85C] font-semibold">
                  Recovered: {formatINR(caseData.recovered_amount)}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-hairline bg-white px-6 font-medium text-xs select-none">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-[#0A0A0A] text-[#0A0A0A] font-semibold'
                : 'border-transparent text-[#8A8A85] hover:text-[#0A0A0A]'
            }`}
          >
            State Machine ({caseData.history.length})
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-[#0A0A0A] text-[#0A0A0A] font-semibold'
                : 'border-transparent text-[#8A8A85] hover:text-[#0A0A0A]'
            }`}
          >
            {isVetoed ? (
              <ShieldAlert className="w-3.5 h-3.5 text-[#E85D8A]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#3FA85C]" />
            )}
            <span>Guardrail Gate</span>
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'outreach'
                ? 'border-[#0A0A0A] text-[#0A0A0A] font-semibold'
                : 'border-transparent text-[#8A8A85] hover:text-[#0A0A0A]'
            }`}
          >
            Intervention Copy
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#0A0A0A] text-[#0A0A0A] font-semibold'
                : 'border-transparent text-[#8A8A85] hover:text-[#0A0A0A]'
            }`}
          >
            Audit Trail ({audit_trail.length})
          </button>

          <div className="ml-auto">
            <button
              onClick={copyCaseJson}
              className="text-[11px] text-[#8A8A85] hover:text-[#0A0A0A] flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-full hover:bg-black/5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3FA85C]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'JSON'}</span>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div 
          style={{ backgroundColor: '#FAF9F7' }} 
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-[#FAF9F7]"
        >
          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-card border border-hairline shadow-subtle">
                <div className="text-xs font-semibold text-[#8A8A85] mb-3 uppercase tracking-wider">
                  Case Metadata & Signal
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono text-[#5A5A55]">
                  <div>Signal: <span className="text-[#0A0A0A] font-medium">{getEventTypeLabel(event.event_type)}</span></div>
                  <div>Channel: <span className="text-[#0A0A0A] font-medium">{event.channel_pref} ({event.language_pref})</span></div>
                  <div>DND Registered: <span className={event.dnd_flag ? 'text-[#E85D8A] font-bold' : 'text-[#3FA85C] font-bold'}>{event.dnd_flag ? 'YES' : 'NO'}</span></div>
                  <div>24h Touches: <span className="text-[#0A0A0A] font-medium">{event.prior_contact_count_24h} / 2</span></div>
                  <div>Retry Count: <span className="text-[#0A0A0A] font-medium">{event.retry_count} / 3</span></div>
                  <div>Local Time: <span className="text-[#0A0A0A] font-medium">{event.local_hour}:00</span></div>
                </div>
              </div>

              {/* Connected State Progression Pipeline */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#8A8A85] uppercase tracking-wider">
                  LangGraph Multi-Agent Execution Path
                </div>
                <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-hairline">
                  {caseData.history.map((h, idx) => {
                    const agentColor = getAgentColor(h.agent);
                    const isLast = idx === caseData.history.length - 1;
                    const isVetoStep = h.step.includes('Veto') || h.step.includes('Blocked') || h.step.includes('Stopped');
                    const isSuccessStep = h.step.includes('Recovered') || h.step.includes('Resolved');

                    return (
                      <div
                        key={idx}
                        className="relative p-3.5 rounded-2xl bg-card border border-hairline flex items-start gap-3 shadow-subtle hover:border-[#D0D0C8] transition-colors"
                      >
                        {/* Dot on connecting vertical line */}
                        <div
                          className={`absolute -left-[1.85rem] top-4 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                            isVetoStep
                              ? 'bg-[#E85D8A]'
                              : isSuccessStep
                              ? 'bg-[#3FA85C]'
                              : isLast
                              ? 'bg-accent-blue ring-2 ring-accent-blue/30 animate-pulse'
                              : 'bg-[#0A0A0A]'
                          }`}
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${agentColor.bg} ${agentColor.text} ${agentColor.border}`}>
                                {h.agent}
                              </span>
                              <span className="text-xs font-bold text-[#0A0A0A]">{h.step}</span>
                            </div>
                            <span className="text-[11px] font-mono text-[#8A8A85]">{formatTime(h.timestamp)}</span>
                          </div>
                          <p className="text-xs text-[#5A5A55] leading-relaxed">{h.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLIANCE INSPECTOR */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isVetoed
                    ? 'bg-[#FDF0F4] border-[#F8CAD7] text-[#9E2A4F]'
                    : 'bg-[#EDF8F1] border-[#C8EAD2] text-[#2D7A42]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {isVetoed ? <ShieldAlert className="w-4 h-4 text-[#E85D8A]" /> : <ShieldCheck className="w-4 h-4 text-[#3FA85C]" />}
                  <span>Compliance Verdict: {isVetoed ? 'ACTION VETOED / BLOCKED' : 'PASSED (ALLOWED)'}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#5A5A55]">{compliance?.primary_reason}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#8A8A85] uppercase tracking-wider">
                  Inspected Guardrail Rules (Hard Gates)
                </div>

                {compliance?.checks.map((chk, i) => {
                  const isBlocked = chk.status === 'BLOCKED';
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        isBlocked
                          ? 'bg-[#FDF0F4] border-[#F8CAD7]'
                          : 'bg-card border-hairline shadow-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#0A0A0A] flex items-center gap-1.5">
                          {isBlocked ? (
                            <ShieldAlert className="w-4 h-4 text-[#E85D8A]" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-[#3FA85C]" />
                          )}
                          {chk.rule_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isBlocked
                              ? 'bg-[#E85D8A] text-white'
                              : 'bg-[#EDF8F1] text-[#2D7A42] border border-[#C8EAD2]'
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A5A55] leading-relaxed mt-1">{chk.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: OUTREACH & COPY */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              {intervention ? (
                <>
                  {/* Strategy Overview Header Card */}
                  <div className="p-4 rounded-2xl bg-card border border-hairline shadow-subtle space-y-2">
                    <div className="text-xs text-[#8A8A85] uppercase font-semibold">Formulated Autonomous Strategy</div>
                    <div className="text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
                      <span className="text-accent-blue">{intervention.intervention_type}</span>
                      <span className="text-[#8A8A85]">•</span>
                      <span>Channel: {intervention.channel}</span>
                    </div>
                    <div className="text-xs text-[#5A5A55] font-mono">
                      Timing: {intervention.timing} | Estimated Cost: ₹{intervention.estimated_cost.toFixed(2)} | Language: {event.language_pref.toUpperCase()}
                    </div>
                  </div>

                  {/* Simulated Authentic WhatsApp Thread UI */}
                  {intervention.copy_text && (
                    <div className="space-y-2">
                      <div className="text-xs text-[#8A8A85] uppercase font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#3FA85C]" />
                          <span>WhatsApp Business API Interactive Simulation</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#3FA85C] bg-accent-greenSoft px-2 py-0.5 rounded-full border border-[#C8EAD2]">
                          Meta Verified Merchant
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#DDD5CA] shadow-inner space-y-3 font-sans">
                        {/* Outbound Agent Message Bubble */}
                        <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-black/5 space-y-2.5 ml-0">
                          <div className="flex items-center justify-between text-[11px] text-[#3FA85C] font-semibold border-b border-black/5 pb-1">
                            <span>Recovery Support Assistant</span>
                            <span className="text-[10px] text-[#8A8A85] font-mono">{formatTime(event.timestamp)}</span>
                          </div>

                          <p className="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">
                            {intervention.copy_text}
                          </p>

                          <div className="flex items-center justify-end gap-1 text-[10px] text-[#8A8A85]">
                            <span>Delivered & Read</span>
                            <CheckCheck className="w-3.5 h-3.5 text-accent-blue" />
                          </div>

                          {/* Interactive Quick Reply CTA Buttons */}
                          <div className="pt-2 border-t border-black/5 space-y-1.5">
                            <div className="text-[10px] text-[#8A8A85] font-medium uppercase tracking-wider">
                              Interactive Payment CTAs
                            </div>
                            <button className="w-full py-2 px-3 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay {formatINR(event.amount)} via UPI (Instant)</span>
                            </button>
                            <button className="w-full py-1.5 px-3 rounded-xl bg-canvas hover:bg-white text-[#5A5A55] hover:text-[#0A0A0A] border border-hairline font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                              <RefreshCw className="w-3 h-3" />
                              <span>Update Auto-Debit Mandate</span>
                            </button>
                          </div>
                        </div>

                        {/* Customer Simulated Reply (if recovered) */}
                        {caseData.recovered_amount > 0 && (
                          <div className="max-w-[80%] bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3 shadow-xs ml-auto space-y-1">
                            <div className="text-[10px] font-bold text-[#0A0A0A] flex justify-between">
                              <span>{event.customer_name}</span>
                              <span className="text-[#5A5A55] font-mono">14:02</span>
                            </div>
                            <p className="text-xs text-[#0A0A0A]">
                              Paid using Google Pay. Thanks for the reminder!
                            </p>
                            <div className="text-[10px] text-[#2D7A42] font-mono text-right">
                              UPI Ref: 42910488201
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hinglish Voice Script & Audio Waveform Player */}
                  {intervention.voice_script && (
                    <div className="space-y-2">
                      <div className="text-xs text-[#8A8A85] uppercase font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-accent-blue" />
                          <span>Hinglish Voice Recovery Agent</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#5A5A55] bg-canvas px-2 py-0.5 rounded-full border border-hairline">
                          Deepgram / ElevenLabs Audio
                        </span>
                      </div>

                      {/* Interactive Audio Player Bar */}
                      <div className="p-4 rounded-2xl bg-card border border-hairline shadow-subtle space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <button
                            onClick={togglePlayVoice}
                            title="Play Voice Audio"
                            className="w-10 h-10 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm"
                          >
                            {isPlayingVoice ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>

                          {/* Animated Waveform */}
                          <div className="flex-1 flex items-center gap-1 h-8">
                            {Array.from({ length: 32 }).map((_, i) => {
                              const heights = [30, 60, 90, 45, 75, 100, 40, 85, 55, 95, 35, 70, 80, 50, 65, 90];
                              const h = heights[i % heights.length];
                              return (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-all duration-300 ${
                                    isPlayingVoice ? 'bg-accent-blue animate-pulse' : 'bg-[#D0D0C8]'
                                  }`}
                                  style={{ height: `${isPlayingVoice ? Math.max(20, h) : 25}%` }}
                                />
                              );
                            })}
                          </div>

                          <span className="font-mono text-xs text-[#8A8A85] shrink-0">
                            {isPlayingVoice ? '00:18 / 00:42' : '00:00 / 00:42'}
                          </span>
                        </div>

                        {/* Script Content */}
                        <div className="p-3 bg-canvas rounded-xl border border-hairline text-xs space-y-2">
                          <div>
                            <span className="text-accent-blue font-semibold font-mono">[Opening]: </span>
                            <span className="text-[#0A0A0A]">{intervention.voice_script.opening_line}</span>
                          </div>

                          {intervention.voice_script.objection_handling && (
                            <div className="pt-2 border-t border-hairline">
                              <span className="text-[#E8A23D] font-semibold font-mono">[Objection Handler]: </span>
                              <pre className="text-[11px] font-mono text-[#5A5A55] mt-1 whitespace-pre-wrap">
                                {JSON.stringify(intervention.voice_script.objection_handling, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bounded Execution Payload */}
                  {action_result && (
                    <div className="space-y-2">
                      <div className="text-xs text-[#8A8A85] uppercase font-semibold">Bounded Action Execution Log</div>
                      <div className="p-4 rounded-2xl bg-card border border-hairline shadow-subtle">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#E8A23D]">{action_result.action_type}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas border border-hairline text-[#5A5A55] font-mono">
                            {action_result.status}
                          </span>
                        </div>
                        <pre className="text-[11px] text-[#5A5A55] font-mono overflow-x-auto p-3 bg-canvas rounded-xl border border-hairline">
                          {JSON.stringify(action_result.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-[#8A8A85] text-xs">No intervention formulated yet.</div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="text-xs font-semibold text-[#8A8A85] uppercase tracking-wider mb-2">
                Append-Only Audit Log ({caseData.case_id})
              </div>
              {audit_trail.map((entry) => (
                <div key={entry.audit_id} className="p-3 rounded-2xl bg-card border border-hairline space-y-1 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-accent-blue font-bold">{entry.audit_id}</span>
                      <span className="text-[#8A8A85]">•</span>
                      <span className="text-[#0A0A0A] font-medium">{entry.agent}</span>
                      <span className="text-[#8A8A85]">[{entry.action}]</span>
                    </div>
                    <span className="text-[11px] text-[#8A8A85]">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div className="text-xs text-[#5A5A55] font-sans">{entry.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
