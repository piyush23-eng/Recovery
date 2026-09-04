import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, ArrowRight } from 'lucide-react';

export interface DateRange {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  comparison: string;
}

const PRESETS: Omit<DateRange, 'comparison'>[] = [
  { id: 'today', label: 'Today', startDate: '2026-09-05', endDate: '2026-09-05' },
  { id: '7d', label: 'Last 7 Days', startDate: '2026-08-30', endDate: '2026-09-05' },
  { id: '30d', label: 'Last 30 Days', startDate: '2026-08-07', endDate: '2026-09-05' },
  { id: 'mtd', label: 'Month to Date', startDate: '2026-09-01', endDate: '2026-09-05' },
  { id: 'oct26', label: 'Oct 1 – Oct 31, 2026', startDate: '2026-10-01', endDate: '2026-10-31' },
  { id: 'q3', label: 'Q3 2026', startDate: '2026-07-01', endDate: '2026-09-30' },
  { id: 'ytd', label: 'Year to Date (2026)', startDate: '2026-01-01', endDate: '2026-09-05' },
];

const COMPARISONS = [
  { id: 'prev_period', label: 'Previous period' },
  { id: 'prev_month', label: 'Previous month' },
  { id: 'prev_year', label: 'Previous year (YoY)' },
  { id: 'none', label: 'No comparison' },
];

interface DateRangePickerProps {
  selectedRange: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ selectedRange, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompOpen, setIsCompOpen] = useState(false);
  const [customStart, setCustomStart] = useState(selectedRange.startDate);
  const [customEnd, setCustomEnd] = useState(selectedRange.endDate);

  const containerRef = useRef<HTMLDivElement>(null);
  const compRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (compRef.current && !compRef.current.contains(e.target as Node)) {
        setIsCompOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: Omit<DateRange, 'comparison'>) => {
    onChange({
      ...preset,
      comparison: selectedRange.comparison,
    });
    setCustomStart(preset.startDate);
    setCustomEnd(preset.endDate);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onChange({
      id: 'custom',
      label: `${customStart} to ${customEnd}`,
      startDate: customStart,
      endDate: customEnd,
      comparison: selectedRange.comparison,
    });
    setIsOpen(false);
  };

  const handleSelectComparison = (comp: { id: string; label: string }) => {
    onChange({
      ...selectedRange,
      comparison: comp.label,
    });
    setIsCompOpen(false);
  };

  return (
    <div className="hidden xl:flex items-center gap-2 text-xs font-medium select-none">
      {/* Date Range Selector Button & Popover */}
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setIsCompOpen(false);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-subtle ${
            isOpen
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
              : 'bg-card border-hairline hover:border-[#D0D0C8] text-[#0A0A0A]'
          }`}
        >
          <CalendarIcon className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-[#8A8A85]'}`} />
          <span className="font-medium">{selectedRange.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180 text-white' : 'text-[#8A8A85]'}`} />
        </button>

        {/* Date Range Popover */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-hairline rounded-2card p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A85] font-semibold">
              Select Time Window
            </div>

            {/* Presets List */}
            <div className="space-y-1">
              {PRESETS.map((p) => {
                const isSelected = selectedRange.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#0A0A0A] text-white font-medium'
                        : 'text-[#5A5A55] hover:text-[#0A0A0A] hover:bg-[#FAF9F7]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Picker */}
            <div className="pt-3 border-t border-hairline space-y-2">
              <span className="text-[10px] font-mono text-[#8A8A85] uppercase tracking-wider font-semibold">
                Custom Range
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[#8A8A85] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2 py-1 bg-canvas border border-hairline rounded-lg text-xs font-mono focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8A8A85] block mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2 py-1 bg-canvas border border-hairline rounded-lg text-xs font-mono focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyCustom}
                className="w-full py-1.5 bg-[#0A0A0A] hover:bg-[#222] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer mt-1"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="text-[11px] text-[#8A8A85]">compared to</span>

      {/* Comparison Period Button & Dropdown */}
      <div className="relative" ref={compRef}>
        <button
          onClick={() => {
            setIsCompOpen(!isCompOpen);
            setIsOpen(false);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-subtle ${
            isCompOpen
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
              : 'bg-card border-hairline hover:border-[#D0D0C8] text-[#8A8A85] hover:text-[#0A0A0A]'
          }`}
        >
          <span>{selectedRange.comparison}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isCompOpen ? 'rotate-180 text-white' : 'text-[#8A8A85]'}`} />
        </button>

        {/* Comparison Dropdown */}
        {isCompOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-card border border-hairline rounded-2card p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8A8A85] font-semibold">
              Comparison Period
            </div>
            {COMPARISONS.map((c) => {
              const isSelected = selectedRange.comparison === c.label;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectComparison(c)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-white font-medium'
                      : 'text-[#5A5A55] hover:text-[#0A0A0A] hover:bg-[#FAF9F7]'
                  }`}
                >
                  <span>{c.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
