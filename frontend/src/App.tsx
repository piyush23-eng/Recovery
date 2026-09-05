import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Header, ScreenTab } from './components/Header';
import { HatchSvgDefs } from './components/HatchPattern';
import { Overview } from './pages/Overview';
import { Cases } from './pages/Cases';
import { LiveOps } from './pages/LiveOps';
import { Compliance } from './pages/Compliance';
import { Analytics } from './pages/Analytics';
import { AuditLog } from './pages/AuditLog';
import { CaseDrawer } from './components/CaseDrawer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { InjectCaseModal } from './components/InjectCaseModal';
import { AttestationModal } from './components/AttestationModal';
import { ToastProvider, useToast } from './components/Toast';
import { DateRange } from './components/DateRangePicker';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const {
    isConnected,
    stats,
    traces,
    cases,
    casesMap,
    simulationStatus,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    setSpeedMultiplier,
    runInstant,
  } = useWebSocket();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ScreenTab>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isInjectOpen, setIsInjectOpen] = useState(false);
  const [isAttestationOpen, setIsAttestationOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    id: 'oct26',
    label: 'Oct 1 – Oct 31, 2026',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    comparison: 'Previous period',
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (simulationStatus.is_running && !simulationStatus.is_paused) {
          pauseSimulation();
          showToast({ title: 'Simulation Paused', type: 'info' });
        } else {
          startSimulation();
          showToast({ title: 'Batch Processing Active', type: 'success' });
        }
      } else if (e.key === 's' || e.key === 'S') {
        stepSimulation();
        showToast({ title: 'Stepped 1 Case', type: 'info' });
      } else if (e.key === '1') {
        setActiveTab('overview');
      } else if (e.key === '2') {
        setActiveTab('cases');
      } else if (e.key === '3') {
        setActiveTab('interventions');
      } else if (e.key === '4') {
        setActiveTab('compliance');
      } else if (e.key === '5') {
        setActiveTab('reports');
      } else if (e.key === '6') {
        setActiveTab('audit_log');
      } else if (e.key === 'i' || e.key === 'I') {
        setIsInjectOpen((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedCaseId(null);
        setIsShortcutsOpen(false);
        setIsInjectOpen(false);
        setIsAttestationOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simulationStatus, startSimulation, pauseSimulation, stepSimulation, showToast]);

  const selectedCase = selectedCaseId ? casesMap[selectedCaseId] || null : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-[#0A0A0A] font-sans antialiased select-none">
      {/* Scalable SVG Pattern Defs for Hatch Fill */}
      <HatchSvgDefs />

      {/* Disconnection Notice Banner */}
      {!isConnected && (
        <div className="bg-[#FDF0F4] border-b border-[#F8CAD7] px-4 py-1.5 flex items-center justify-between text-xs text-[#9E2A4F] z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#E85D8A]" />
            <span className="font-medium">Backend WebSocket Disconnected. Live trace and state streaming paused.</span>
          </div>
          <span className="text-[11px] font-mono text-[#E85D8A]">Reconnecting automatically...</span>
        </div>
      )}

      {/* Top Header with Pill Navigation & Batch Controls */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        isConnected={isConnected}
        simulationStatus={simulationStatus}
        selectedDateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          showToast({ title: `Time window set to ${range.label}`, type: 'info' });
        }}
        onStart={() => {
          startSimulation();
          showToast({ title: 'Simulation Batch Started', type: 'success' });
        }}
        onPause={() => {
          pauseSimulation();
          showToast({ title: 'Simulation Batch Paused', type: 'info' });
        }}
        onStep={() => {
          stepSimulation();
          showToast({ title: 'Stepped 1 Case Forward', type: 'info' });
        }}
        onReset={() => {
          resetSimulation(300);
          showToast({ title: 'Dataset Reset (300 fresh cases)', type: 'info' });
        }}
        onSetSpeed={(speed) => {
          setSpeedMultiplier(speed);
          showToast({ title: `Speed Multiplier: ${speed}x`, type: 'info' });
        }}
        onRunInstant={() => {
          runInstant();
          showToast({ title: 'Instant Batch Execution Started', type: 'success' });
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenInjectModal={() => setIsInjectOpen(true)}
        onOpenAttestation={() => setIsAttestationOpen(true)}
      />

      {/* Main Screen Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden bg-canvas">
        {activeTab === 'overview' && (
          <Overview
            stats={stats}
            cases={cases}
            onNavigateToCases={() => setActiveTab('cases')}
            onNavigateToAudit={() => setActiveTab('audit_log')}
            onStartSimulation={startSimulation}
          />
        )}

        {activeTab === 'cases' && (
          <Cases
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => setSelectedCaseId(id)}
          />
        )}

        {activeTab === 'interventions' && (
          <LiveOps
            traces={traces}
            cases={cases}
            onSelectCase={(id) => setSelectedCaseId(id)}
          />
        )}

        {activeTab === 'compliance' && <Compliance stats={stats} />}

        {activeTab === 'reports' && <Analytics stats={stats} />}

        {activeTab === 'audit_log' && (
          <AuditLog onSelectCase={(id) => setSelectedCaseId(id)} />
        )}
      </main>

      {/* Global Slide-Over Case Drawer */}
      {selectedCase && (
        <CaseDrawer caseData={selectedCase} onClose={() => setSelectedCaseId(null)} />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Live Custom Event Injection Sandbox Modal */}
      <InjectCaseModal
        isOpen={isInjectOpen}
        onClose={() => setIsInjectOpen(false)}
        onCaseInjected={(caseId) => {
          setSelectedCaseId(caseId);
          setActiveTab('cases');
        }}
      />

      {/* Compliance Certification Attestation Modal */}
      <AttestationModal
        isOpen={isAttestationOpen}
        onClose={() => setIsAttestationOpen(false)}
        stats={stats}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
