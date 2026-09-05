import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', label: 'Start / Pause Simulation Batch' },
    { key: 'S', label: 'Step 1 Case Forward' },
    { key: '1', label: 'Go to Overview Tab' },
    { key: '2', label: 'Go to Cases Tab' },
    { key: '3', label: 'Go to Interventions & LiveOps' },
    { key: '4', label: 'Go to Compliance & Guardrails' },
    { key: '5', label: 'Go to Reports & Analytics' },
    { key: '6', label: 'Go to Audit Log' },
    { key: '?', label: 'Toggle Keyboard Shortcuts' },
    { key: 'Esc', label: 'Close Drawer / Modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 isolate">
      <div 
        style={{ backgroundColor: '#FFFFFF' }}
        className="bg-white border border-[#D0D0C8] rounded-2card max-w-md w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline select-none">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="font-semibold text-sm text-[#0A0A0A]">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs py-1">
              <span className="text-[#5A5A55]">{s.label}</span>
              <kbd className="px-2.5 py-1 bg-canvas border border-hairline rounded-lg font-mono text-[11px] font-semibold text-[#0A0A0A] shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-hairline text-center text-[11px] text-[#8A8A85]">
          Press <kbd className="px-1.5 py-0.5 bg-canvas border border-hairline rounded text-[10px] font-mono">Esc</kbd> anytime to dismiss
        </div>
      </div>
    </div>
  );
};
