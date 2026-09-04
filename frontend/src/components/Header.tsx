import React from 'react';
import { 
  Calendar, ChevronDown, Play, Pause, StepForward, 
  RotateCcw, FastForward, Activity, Check, Command,
  Sparkles, ShieldCheck 
} from 'lucide-react';
import { LedgerStats } from '../types';
import { DateRangePicker, DateRange } from './DateRangePicker';

export type ScreenTab = 'overview' | 'cases' | 'interventions' | 'compliance' | 'reports' | 'audit_log';

interface HeaderProps {
  activeTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  stats: LedgerStats;
  isConnected: boolean;
  simulationStatus: {
    is_running: boolean;
    is_paused: boolean;
    current_index: number;
    total_cases: number;
    speed: number;
  };
  selectedDateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onRunInstant: () => void;
  onOpenShortcuts: () => void;
  onOpenInjectModal: () => void;
  onOpenAttestation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  stats,
  isConnected,
  simulationStatus,
  selectedDateRange,
  onDateRangeChange,
  onStart,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
  onRunInstant,
  onOpenShortcuts,
  onOpenInjectModal,
  onOpenAttestation,
}) => {
  const navItems: { id: ScreenTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'cases', label: 'Cases' },
    { id: 'interventions', label: 'Interventions' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'reports', label: 'Reports' },
    { id: 'audit_log', label: 'Audit Log' },
  ];

  const speeds = [
    { label: '1x', val: 1.0 },
    { label: '2x', val: 2.0 },
    { label: '5x', val: 5.0 },
    { label: '10x', val: 10.0 },
  ];

  return (
    <header className="relative bg-canvas border-b border-hairline px-6 py-3 flex items-center justify-between gap-6 select-none shrink-0 z-30">
      {/* Left: Brand Logo & Wordmark + Horizontal Pill Nav */}
      <div className="flex items-center gap-8">
        {/* Logo Mark + Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white shadow-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V2M12 22V20M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-base tracking-tight text-[#0A0A0A]">Recovery</span>
        </div>

        {/* Horizontal Navigation Pill Group */}
        <nav className="flex items-center gap-1.5 font-medium text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white font-medium shadow-xs'
                    : 'text-[#8A8A85] hover:text-[#0A0A0A] hover:bg-black/4'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Date Range Pickers + Batch Controls */}
      <div className="flex items-center gap-4">
        {/* Interactive Date Range Picker with Presets & Custom Range */}
        <DateRangePicker selectedRange={selectedDateRange} onChange={onDateRangeChange} />

        {/* Live Simulation Control Pills */}
        <div className="flex items-center gap-1.5 bg-card border border-hairline rounded-full p-1 shadow-subtle">
          {/* Start / Pause */}
          {!simulationStatus.is_running || simulationStatus.is_paused ? (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-medium transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{simulationStatus.current_index > 0 ? 'Resume' : 'Start Batch'}</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8A23D] hover:bg-[#D9932E] text-white text-xs font-medium transition-all cursor-pointer"
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* Step Button */}
          <button
            onClick={onStep}
            title="Step 1 Case"
            className="p-1.5 rounded-full hover:bg-black/5 text-[#5A5A55] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 border-l border-hairline pl-1.5 pr-0.5 font-mono text-[11px]">
            {speeds.map((s) => (
              <button
                key={s.label}
                onClick={() => onSetSpeed(s.val)}
                className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  simulationStatus.speed === s.val
                    ? 'bg-black/8 text-[#0A0A0A] font-bold'
                    : 'text-[#8A8A85] hover:text-[#0A0A0A]'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={onRunInstant}
              title="Instant batch calculation"
              className="px-2 py-0.5 rounded-full text-accent-blue hover:bg-accent-blue/10 transition-all cursor-pointer font-bold flex items-center gap-0.5"
            >
              <FastForward className="w-3 h-3" />
              <span>Instant</span>
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={onReset}
            title="Reset Dataset"
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#E85D8A] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Scenario Inject Event Button */}
        <button
          onClick={onOpenInjectModal}
          title="Inject and run custom failure scenario live"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-blueHover text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inject Event</span>
        </button>

        {/* Batch Case Count Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono bg-card border border-hairline px-2.5 py-1 rounded-full text-[#5A5A55] shadow-subtle">
          <span className="text-[#8A8A85]">Batch:</span>
          <span className="font-semibold text-[#0A0A0A]">{stats.processed_cases}</span>
          <span className="text-[#8A8A85]">/</span>
          <span>{stats.total_cases}</span>
        </div>

        {/* Compliance Policy Simulation Report Trigger Button */}
        <button
          onClick={onOpenAttestation}
          title="View Compliance Policy Simulation Report"
          className="p-1.5 rounded-full bg-card border border-hairline hover:border-[#D0D0C8] text-[#8A8A85] hover:text-[#3FA85C] transition-colors cursor-pointer shadow-subtle flex items-center justify-center"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="p-1.5 rounded-full bg-card border border-hairline hover:border-[#D0D0C8] text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer shadow-subtle flex items-center justify-center"
        >
          <Command className="w-3.5 h-3.5" />
        </button>

        {/* Live WS Status Dot */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#8A8A85]">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#3FA85C]' : 'bg-[#E85D8A]'}`} />
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Hairline Progress Bar along the bottom border of header */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
        <div
          className="h-full bg-accent-blue transition-all duration-300"
          style={{
            width: `${
              stats.total_cases > 0
                ? Math.min(100, Math.round((stats.processed_cases / stats.total_cases) * 100))
                : 0
            }%`,
          }}
        />
      </div>
    </header>
  );
};
