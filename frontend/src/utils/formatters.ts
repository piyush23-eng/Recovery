import { CaseState, RiskEventType, DiagnosisCause } from '../types';

export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount.toFixed(0)}`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--:--';
  const d = new Date(isoString);
  return d.toTimeString().split(' ')[0];
}

export function formatShortDate(isoString?: string): string {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export function getStatusBadge(state: CaseState): { label: string; bg: string; text: string; dot: string } {
  switch (state) {
    case 'RECOVERED':
      return { label: 'Recovered', bg: 'bg-[#EDF8F1] border-[#C8EAD2]', text: 'text-[#2D7A42]', dot: 'bg-[#3FA85C]' };
    case 'STOPPED':
      return { label: 'Stopped', bg: 'bg-[#F2F2F0] border-[#E2E2DC]', text: 'text-[#6A6A64]', dot: 'bg-[#8A8A85]' };
    case 'ESCALATED':
      return { label: 'Escalated', bg: 'bg-[#F5F0FF] border-[#DDD0FA]', text: 'text-[#6939C4]', dot: 'bg-[#8B5CF6]' };
    case 'RETRY':
      return { label: 'Pending Retry', bg: 'bg-[#FEF7EC] border-[#FCE1B8]', text: 'text-[#9A6218]', dot: 'bg-[#E8A23D]' };
    case 'COMPLIANCE_CHECK':
      return { label: 'Compliance Gate', bg: 'bg-[#EEF4FF] border-[#C6DCFF]', text: 'text-[#2452B8]', dot: 'bg-[#3B6FE0]' };
    case 'ACTION_EXECUTED':
      return { label: 'Intervening', bg: 'bg-[#EBF8FE] border-[#C2E9FC]', text: 'text-[#0C6D9E]', dot: 'bg-[#0EA5E9]' };
    case 'STRATEGY_SELECTED':
      return { label: 'Strategizing', bg: 'bg-[#F0F2FE] border-[#D1D7FC]', text: 'text-[#3E4CB8]', dot: 'bg-[#6366F1]' };
    case 'DIAGNOSING':
      return { label: 'Diagnosing', bg: 'bg-[#F8F0FE] border-[#E8D1FB]', text: 'text-[#7C2DAE]', dot: 'bg-[#A855F7]' };
    case 'DETECTED':
    default:
      return { label: 'Detected', bg: 'bg-[#F5F5F3] border-[#E5E5DF]', text: 'text-[#5A5A55]', dot: 'bg-[#8A8A85]' };
  }
}

export function getAgentColor(agent: string = ''): { bg: string; text: string; border: string } {
  const a = (agent || '').toLowerCase();
  if (a.includes('signal') || a.includes('ingestion')) {
    return { bg: 'bg-[#EEF4FF]', text: 'text-[#2452B8]', border: 'border-[#C6DCFF]' };
  }
  if (a.includes('diagnosis') || a.includes('root')) {
    return { bg: 'bg-[#F8F0FE]', text: 'text-[#7C2DAE]', border: 'border-[#E8D1FB]' };
  }
  if (a.includes('strategy')) {
    return { bg: 'bg-[#F0F2FE]', text: 'text-[#3E4CB8]', border: 'border-[#D1D7FC]' };
  }
  if (a.includes('compliance') || a.includes('guardrail')) {
    return { bg: 'bg-[#FDF0F4]', text: 'text-[#9E2A4F]', border: 'border-[#F8CAD7]' };
  }
  if (a.includes('execution')) {
    return { bg: 'bg-[#FEF7EC]', text: 'text-[#9A6218]', border: 'border-[#FCE1B8]' };
  }
  if (a.includes('outcome') || a.includes('audit')) {
    return { bg: 'bg-[#EDF8F1]', text: 'text-[#2D7A42]', border: 'border-[#C8EAD2]' };
  }
  return { bg: 'bg-[#F5F5F3]', text: 'text-[#5A5A55]', border: 'border-[#E5E5DF]' };
}

export function getEventTypeLabel(type: RiskEventType): string {
  switch (type) {
    case 'payment_failed':
      return 'Payment Failed';
    case 'checkout_abandoned':
      return 'Cart Abandoned';
    case 'subscription_failed':
      return 'Subscription Renewal';
    case 'invoice_overdue':
      return 'Overdue Receivables';
    default:
      return type;
  }
}

export function getDiagnosisLabel(cause?: DiagnosisCause): string {
  if (!cause) return 'Pending Analysis';
  switch (cause) {
    case 'insufficient_funds':
      return 'Insufficient Funds';
    case 'expired_card':
      return 'Card Expired';
    case 'issuer_timeout':
      return 'Bank Issuer Timeout';
    case 'mandate_not_registered':
      return 'Mandate Missing';
    case 'price_sensitivity':
      return 'Price Sensitivity';
    case 'B2B_dispute':
      return 'B2B Invoice Dispute';
    case 'silent_churn':
      return 'Silent Churn Risk';
    default:
      return cause;
  }
}
