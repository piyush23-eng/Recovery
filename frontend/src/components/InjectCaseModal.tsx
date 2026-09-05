import React, { useState } from 'react';
import { 
  X, Sparkles, Play, ShieldAlert, ShieldCheck, 
  RotateCcw, ArrowRight, Zap, Check 
} from 'lucide-react';
import { useToast } from './Toast';

interface InjectCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseInjected: (caseId: string) => void;
}

export const InjectCaseModal: React.FC<InjectCaseModalProps> = ({ isOpen, onClose, onCaseInjected }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('Freshworks Enterprise Corp');
  const [amount, setAmount] = useState(48500);
  const [eventType, setEventType] = useState('payment_failed');
  const [customerSegment, setCustomerSegment] = useState('ENTERPRISE');
  const [channelPref, setChannelPref] = useState('whatsapp');
  const [languagePref, setLanguagePref] = useState('hinglish');
  const [dndFlag, setDndFlag] = useState(false);
  const [localHour, setLocalHour] = useState(14);
  const [priorContacts24h, setPriorContacts24h] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [declineCode, setDeclineCode] = useState('E91_ISSUER_TIMEOUT');
  const [isDisputed, setIsDisputed] = useState(false);
  const [repliedStop, setRepliedStop] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'dnd',
      title: 'TRAI DND Suppression Veto',
      desc: 'DND Flag = True, ₹4,999 Cart Drop',
      apply: () => {
        setCustomerName('Vikram Malhotra');
        setAmount(4999);
        setEventType('checkout_abandoned');
        setCustomerSegment('CONSUMER_PRO');
        setDndFlag(true);
        setLocalHour(14);
        setPriorContacts24h(0);
        setRetryCount(0);
        setIsDisputed(false);
        setRepliedStop(false);
      }
    },
    {
      id: 'quiet',
      title: 'Late-Night Quiet Hours Gate',
      desc: '11:00 PM (23:00 IST), ₹12,000 Failed Renewal',
      apply: () => {
        setCustomerName('Pooja Sharma');
        setAmount(12000);
        setEventType('subscription_failed');
        setCustomerSegment('SMB');
        setDndFlag(false);
        setLocalHour(23);
        setPriorContacts24h(0);
        setRetryCount(0);
        setIsDisputed(false);
        setRepliedStop(false);
      }
    },
    {
      id: 'b2b',
      title: 'High-Value B2B Dispute Escalation',
      desc: '₹85,000 Overdue Invoice with Commercial Dispute',
      apply: () => {
        setCustomerName('Zomato Media Logistics');
        setAmount(85000);
        setEventType('invoice_overdue');
        setCustomerSegment('ENTERPRISE');
        setDndFlag(false);
        setLocalHour(15);
        setPriorContacts24h(0);
        setRetryCount(0);
        setIsDisputed(true);
        setRepliedStop(false);
      }
    },
    {
      id: 'retry',
      title: 'Smart Gateway Auto-Retry',
      desc: '₹2,499 Bank Timeout (E91_ISSUER_TIMEOUT)',
      apply: () => {
        setCustomerName('Ananya Deshmukh');
        setAmount(2499);
        setEventType('payment_failed');
        setCustomerSegment('CONSUMER_RETAIL');
        setDndFlag(false);
        setLocalHour(14);
        setPriorContacts24h(0);
        setRetryCount(1);
        setDeclineCode('E91_ISSUER_TIMEOUT');
        setIsDisputed(false);
        setRepliedStop(false);
      }
    },
    {
      id: 'stop',
      title: 'Opt-Out STOP Keyword Honoring',
      desc: 'Customer sends "STOP" revocation',
      apply: () => {
        setCustomerName('Rahul Verma');
        setAmount(3499);
        setEventType('checkout_abandoned');
        setCustomerSegment('CONSUMER_RETAIL');
        setDndFlag(false);
        setLocalHour(14);
        setRepliedStop(true);
      }
    }
  ];

  const handleInject = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cases/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          amount: Number(amount),
          event_type: eventType,
          customer_segment: customerSegment,
          channel_pref: channelPref,
          language_pref: languagePref,
          dnd_flag: dndFlag,
          local_hour: Number(localHour),
          prior_contact_count_24h: Number(priorContacts24h),
          retry_count: Number(retryCount),
          decline_code: declineCode,
          is_disputed: isDisputed,
          replied_stop: repliedStop,
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast({
          title: 'Custom Case Injected & Processed',
          description: `Case ${data.case_id} executed through all 6 LangGraph agents.`,
          type: 'success'
        });
        onCaseInjected(data.case_id);
        onClose();
      } else {
        showToast({
          title: 'Injection Failed',
          description: 'Could not process custom event.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Network Error',
        description: 'Failed to contact backend API.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-hairline rounded-2card max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-blue" />
            <h3 className="font-semibold text-base text-[#0A0A0A]">Inject Custom Failure Event (Live Sandbox)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Quick Select Chips */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A85] font-semibold">
            One-Click Judge Presets:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {presets.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={p.apply}
                className="text-left p-2.5 rounded-xl border border-hairline bg-canvas hover:border-accent-blue/40 hover:bg-accent-blue/5 transition-all cursor-pointer group"
              >
                <div className="text-xs font-semibold text-[#0A0A0A] group-hover:text-accent-blue truncate">
                  {p.title}
                </div>
                <div className="text-[10px] text-[#8A8A85] mt-0.5 line-clamp-1">{p.desc}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {presets.slice(3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={p.apply}
                className="text-left p-2.5 rounded-xl border border-hairline bg-canvas hover:border-accent-blue/40 hover:bg-accent-blue/5 transition-all cursor-pointer group"
              >
                <div className="text-xs font-semibold text-[#0A0A0A] group-hover:text-accent-blue truncate">
                  {p.title}
                </div>
                <div className="text-[10px] text-[#8A8A85] mt-0.5 line-clamp-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 pt-2 border-t border-hairline text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="text-[#5A5A55] font-medium block mb-1">Customer / Merchant Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-[#5A5A55] font-medium block mb-1">Amount at Risk (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="text-[#5A5A55] font-medium block mb-1">Event Type Signal</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
              >
                <option value="payment_failed">Payment Failed (Gateway Degradation)</option>
                <option value="checkout_abandoned">Checkout Abandoned (Cart Drop-off)</option>
                <option value="subscription_failed">Subscription Renewal Failed</option>
                <option value="invoice_overdue">Overdue B2B Invoice</option>
              </select>
            </div>

            {/* Segment */}
            <div>
              <label className="text-[#5A5A55] font-medium block mb-1">Customer Segment</label>
              <select
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value)}
                className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
              >
                <option value="ENTERPRISE">Enterprise Account</option>
                <option value="SMB">SMB / Mid-Market</option>
                <option value="CONSUMER_PRO">Consumer Pro (High LTV)</option>
                <option value="CONSUMER_RETAIL">Consumer Retail</option>
              </select>
            </div>

            {/* Channel & Language */}
            <div>
              <label className="text-[#5A5A55] font-medium block mb-1">Channel & Localization</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={channelPref}
                  onChange={(e) => setChannelPref(e.target.value)}
                  className="px-2 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                >
                  <option value="whatsapp">WhatsApp API</option>
                  <option value="voice">AI Voice Call</option>
                  <option value="sms">SMS Gateway</option>
                  <option value="email">Email Notice</option>
                </select>
                <select
                  value={languagePref}
                  onChange={(e) => setLanguagePref(e.target.value)}
                  className="px-2 py-1.5 bg-canvas border border-hairline rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                >
                  <option value="hinglish">Hinglish</option>
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>

            {/* Local Hour */}
            <div>
              <div className="flex justify-between text-[#5A5A55] font-medium mb-1">
                <span>Customer Local Time:</span>
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
                <span className="text-accent-blue font-bold">14:00 (Permitted)</span>
                <span>23:00 (Quiet)</span>
              </div>
            </div>
          </div>

          {/* Hard Guardrail Simulation Toggles */}
          <div className="p-3.5 bg-canvas rounded-2xl border border-hairline space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A85] font-semibold">
              Compliance Hard Gates Configuration
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-2 text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={dndFlag}
                  onChange={(e) => setDndFlag(e.target.checked)}
                  className="rounded text-[#0A0A0A] focus:ring-0"
                />
                <span className="text-[11px]">TRAI DND Active</span>
              </label>

              <label className="flex items-center gap-2 text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDisputed}
                  onChange={(e) => setIsDisputed(e.target.checked)}
                  className="rounded text-[#0A0A0A] focus:ring-0"
                />
                <span className="text-[11px]">B2B Dispute Flag</span>
              </label>

              <label className="flex items-center gap-2 text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={repliedStop}
                  onChange={(e) => setRepliedStop(e.target.checked)}
                  className="rounded text-[#0A0A0A] focus:ring-0"
                />
                <span className="text-[11px]">Customer Replied "STOP"</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-hairline">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-hairline hover:bg-black/5 text-[#5A5A55] hover:text-[#0A0A0A] text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleInject}
            className="px-5 py-2 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-subtle disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSubmitting ? 'Running 6 Agents...' : 'Inject & Run Multi-Agent Loop'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
