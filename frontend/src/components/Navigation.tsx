import React from 'react';
import { Activity, Layers, BarChart3, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export type ScreenTab = 'live_ops' | 'cases' | 'analytics' | 'audit_log';

interface NavigationProps {
  activeTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  casesCount: number;
  blockedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  casesCount,
  blockedCount,
}) => {
  const tabs = [
    {
      id: 'live_ops' as ScreenTab,
      label: 'Live Ops',
      icon: Activity,
      badge: null,
      description: 'Real-time Trace & Stream',
    },
    {
      id: 'cases' as ScreenTab,
      label: 'Cases',
      icon: Layers,
      badge: casesCount > 0 ? `${casesCount}` : null,
      description: 'Filterable Ledger & Drawer',
    },
    {
      id: 'analytics' as ScreenTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
      description: 'Waterfall & Funnel ROI',
    },
    {
      id: 'audit_log' as ScreenTab,
      label: 'Audit Log',
      icon: ShieldCheck,
      badge: blockedCount > 0 ? `${blockedCount}` : null,
      badgeColor: 'bg-rose-900/80 text-rose-300 border-rose-700/60',
      description: 'Immutable Compliance Trail',
    },
  ];

  return (
    <aside className="w-16 md:w-56 bg-panel border-r border-border flex flex-col justify-between select-none shrink-0 z-20">
      <div className="py-3 px-2 flex flex-col gap-1">
        <div className="hidden md:block px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
          Navigation
        </div>

        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 shadow-sm'
                  : 'text-zinc-400 hover:text-gray-200 hover:bg-panel-hover border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {t.badge && (
                  <span
                    className={`md:hidden absolute -top-2 -right-2 text-[9px] font-mono px-1 py-0.2 rounded-full ${
                      t.badgeColor || 'bg-blue-900 text-blue-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold tracking-tight ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                    {t.label}
                  </span>
                  {t.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        t.badgeColor || 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 truncate">{t.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / System Specification */}
      <div className="p-3 border-t border-border hidden md:block text-[11px] text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-blue-400" />
            <span>LANGGRAPH</span>
          </span>
          <span className="text-zinc-400">v1.2</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>COMPLIANCE</span>
          <span className="text-emerald-400 font-semibold">HARD VETO</span>
        </div>
      </div>
    </aside>
  );
};
