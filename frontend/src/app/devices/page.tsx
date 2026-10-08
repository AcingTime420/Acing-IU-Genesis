"use client";

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ShieldAlert, 
  Cpu, 
  Radio, 
  Shield, 
  CheckCircle, 
  Activity,
  QrCode,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Sparkles,
  Info,
  ScanLine,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// Interface definitions
interface Device {
  id: string;
  name: string;
  model: string;
  carrier: string;
  trustScore: number;
  quarantined: boolean;
  warrantyFlag: string;  // fixture only — not a live Knox fuse
  selinux: string;
  timaRkp: string;
  bootloader: string;
  trp: string;
  tis: string;
  history: Array<{ day: string; score: number }>;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
}

export default function DevicesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toasts state
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Devices state — all records are local demonstration fixtures only
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "dev-938u-vzw1",
      name: "Demo S25 Ultra Fixture",
      model: "SM-S938U",
      carrier: "Demo Carrier",
      trustScore: 100,
      quarantined: false,
      warrantyFlag: "0x0 (Intact)",
      selinux: "Enforcing",
      timaRkp: "Active",
      bootloader: "Locked",
      trp: "23.40 dBm",
      tis: "-92.15 dBm",
      history: [
        { day: "Day 1", score: 100 }, { day: "Day 5", score: 100 },
        { day: "Day 10", score: 100 }, { day: "Day 15", score: 100 },
        { day: "Day 20", score: 100 }, { day: "Day 25", score: 100 },
        { day: "Day 30", score: 100 }
      ]
    },
    {
      id: "dev-s918-demo",
      name: "Standard S24 Dev Node",
      model: "SM-S918U",
      carrier: "Demo Carrier",
      trustScore: 80,
      quarantined: false,
      warrantyFlag: "0x0 (Intact)",
      selinux: "Enforcing",
      timaRkp: "Active",
      bootloader: "Unlocked", 
      trp: "22.85 dBm", 
      tis: "-91.20 dBm",
      history: [
        { day: "Day 1", score: 90 }, { day: "Day 5", score: 85 },
        { day: "Day 10", score: 80 }, { day: "Day 15", score: 85 },
        { day: "Day 20", score: 80 }, { day: "Day 25", score: 80 },
        { day: "Day 30", score: 80 }
      ]
    },
    {
      id: "dev-rooted-938",
      name: "Compromised Target Fixture",
      model: "SM-S938U",
      carrier: "Unlocked (XAA)",
      trustScore: 0,
      quarantined: true,
      warrantyFlag: "0x1 (Tripped)", 
      selinux: "Permissive",
      timaRkp: "Disabled",
      bootloader: "Unlocked",
      trp: "19.50 dBm",
      tis: "-81.40 dBm",
      history: [
        { day: "Day 1", score: 100 }, { day: "Day 5", score: 100 },
        { day: "Day 10", score: 100 }, { day: "Day 15", score: 100 },
        { day: "Day 20", score: 95 }, { day: "Day 25", score: 0 },
        { day: "Day 30", score: 0 }
      ]
    }
  ]);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Expanded detail state
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  // Track fully expanded states for rendering high-performance animations and interaction
  const [fullyExpandedIds, setFullyExpandedIds] = useState<string[]>([]);
  
  // QR Code Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerDeviceTarget, setScannerDeviceTarget] = useState<string>('dev-938u-vzw1');
  const [scanningActive, setScanningActive] = useState(false);

  // Mount logic
  useEffect(() => {
    setIsMounted(true);
    
    // Initial fixture-only toast; no device is contacted or changed.
    const timer = setTimeout(() => {
      addToast(
        "FIXTURE ALERT: The simulated compromised-device record starts in a quarantined display state.",
        "error"
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Toast adder function
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const newToast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep last 5 toasts
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Handle bulk checkbox toggling
  const toggleSelectAll = () => {
    if (selectedIds.length === devices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(devices.map(d => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle detail expansion
  const toggleExpand = (id: string) => {
    const isCurrentlyExpanded = expandedIds.includes(id);
    if (!isCurrentlyExpanded) {
      setExpandedIds(prev => [...prev, id]);
      // Delay to allow CSS expansion transition to finish before initiating chart animations and interaction
      setTimeout(() => {
        setFullyExpandedIds(prev => [...prev, id]);
      }, 400);
    } else {
      setExpandedIds(prev => prev.filter(item => item !== id));
      setFullyExpandedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Execute bulk operations
  const handleBulkQuarantine = (quarantine: boolean) => {
    if (selectedIds.length === 0) return;

    setDevices(prev => prev.map(dev => {
      if (selectedIds.includes(dev.id)) {
        const updatedScore = quarantine ? 0 : (dev.id === 'dev-rooted-938' ? 0 : 85);
        return {
          ...dev,
          quarantined: quarantine,
          trustScore: updatedScore
        };
      }
      return dev;
    }));

    addToast(
      `FIXTURE UPDATE: ${selectedIds.length} simulated device record(s) marked ${quarantine ? 'QUARANTINED' : 'NOT QUARANTINED'} locally. No device operation occurred.`,
      quarantine ? 'warning' : 'success'
    );
    
    setSelectedIds([]);
  };

  const handleBulkRecalculate = () => {
    if (selectedIds.length === 0) return;

    setDevices(prev => prev.map(dev => {
      if (selectedIds.includes(dev.id)) {
        let score = dev.trustScore;
        // recalculate logic
        if (dev.id === 'dev-rooted-938') {
          score = 0; // cannot bypass tripped warranty flag (fixture)
        } else if (dev.id === 'dev-938u-vzw1') {
          score = 100;
        } else {
          score = 80;
        }
        return { ...dev, trustScore: score };
      }
      return dev;
    }));

    addToast(
      `FIXTURE UPDATE: Recalculated local demonstration scores for ${selectedIds.length} record(s). No cryptographic or device verification occurred.`,
      'info'
    );
    setSelectedIds([]);
  };

  // Simulated QR Code Chip Signature scan handler
  const triggerScannerFlow = (deviceId: string) => {
    setScannerDeviceTarget(deviceId);
    setShowScanner(true);
    setScanningActive(true);
  };

  const handleSimulateScanSuccess = () => {
    setScanningActive(false);
    
    // Update the device in the local state
    setDevices(prev => prev.map(dev => {
      if (dev.id === scannerDeviceTarget) {
        // Boost score in this fixture simulation only
        const isCompromised = dev.id === 'dev-rooted-938';
        return {
          ...dev,
          trustScore: isCompromised ? 15 : 100, // Tripped warranty flag still gets penalty in this fixture simulation
          timaRkp: "Active",
          selinux: "Enforcing"
        };
      }
      return dev;
    }));

    const targetDevice = devices.find(d => d.id === scannerDeviceTarget);
    
    addToast(
      `FIXTURE UPDATE: Simulated chip-detection result recorded for '${targetDevice?.name || 'Device'}'. No hardware attestation or certification occurred.`,
      'success'
    );

    setShowScanner(false);
  };

  // Filter based on search query
  const filteredDevices = devices.filter(dev => {
    const q = searchTerm.toLowerCase();
    return (
      dev.name.toLowerCase().includes(q) ||
      dev.model.toLowerCase().includes(q) ||
      dev.carrier.toLowerCase().includes(q) ||
      dev.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn relative pb-24">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
        <strong>Simulator fixture only.</strong> All devices, trust scores, firmware states, radio values, charts, and reports on this page are demonstration data. This page does not connect to, attest, certify, quarantine, or modify a physical device.
      </div>
      
      {/* Persistent Floating Selected Devices Counter */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-28 right-6 z-40 animate-slideIn">
          <div className="bg-[#151D30]/95 backdrop-blur-md border-2 border-[#2F58CD] text-white px-4.5 py-2.5 rounded-full flex items-center gap-2.5 shadow-[0_0_25px_rgba(47,88,205,0.35)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
              {selectedIds.length} Device{selectedIds.length === 1 ? '' : 's'} Selected
            </span>
          </div>
        </div>
      )}
      
      {/* Real-Time Toast Notifications Overlay */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 animate-slideIn ${
              toast.type === 'error' ? 'bg-red-950/95 border-red-500/50 text-red-100' :
              toast.type === 'warning' ? 'bg-amber-950/95 border-amber-500/50 text-amber-100' :
              toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100' :
              'bg-[#151D30]/95 border-[#2F58CD]/50 text-slate-100'
            }`}
          >
            {toast.type === 'error' && <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Bell className="h-5 w-5 text-[#2F58CD] shrink-0 mt-0.5" />}
            
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              <span className="text-[10px] text-slate-400 block font-medium">{toast.timestamp}</span>
            </div>

            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-white transition-colors self-start"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22314D] pb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-[#2F58CD]" />
            Simulated Device Trust and Radio Fixtures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Local demonstration records only; no cryptographic audit, hardware attestation, or RF measurement is performed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerScannerFlow(devices[0].id)}
            title="Open a local fixture animation; no device is contacted"
            className="flex items-center gap-2 rounded-lg border border-[#2F58CD]/30 bg-[#2F58CD]/15 px-3.5 py-1.5 text-xs font-bold text-[#2F58CD] transition-all hover:bg-[#2F58CD]/30"
          >
            <QrCode className="h-4 w-4" />
            Open Fixture Scanner
          </button>
          <span className="text-xs bg-[#10B981]/20 text-[#10B981] font-bold px-3 py-1.5 rounded-full border border-[#10B981]/30">
            Fixture Registry
          </span>
        </div>
      </div>

      {/* Search and Selection Header Controls */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by device name, carrier, id..." 
            className="w-full bg-[#151D30] border border-[#22314D] rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2F58CD]/70 font-semibold transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={toggleSelectAll}
            className="text-xs bg-[#151D30] text-slate-300 border border-[#22314D] px-3.5 py-2.5 rounded-xl font-bold hover:text-white transition-all"
          >
            {selectedIds.length === devices.length ? "Deselect All" : "Select All Devices"}
          </button>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="space-y-6">
        {filteredDevices.map((dev) => {
          const isSelected = selectedIds.includes(dev.id);
          const isExpanded = expandedIds.includes(dev.id);
          
          return (
            <div 
              key={dev.id} 
              className={`glass-card rounded-2xl p-6 border relative ${
                isSelected ? 'selected-card border-[#2F58CD]/80 shadow-[0_0_20px_rgba(47,88,205,0.25)]' : dev.quarantined ? 'border-red-500/30 hover:border-red-500/60 bg-red-950/5' : 'hover:border-[#2F58CD]/50'
              }`}
            >
              {/* Select Checkbox Indicator */}
              <div className="absolute top-6 left-6 z-10">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleSelectOne(dev.id)}
                  className="w-4.5 h-4.5 rounded border-[#22314D] bg-[#151D30] text-[#2F58CD] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Main Content Layout with spacing for Checkbox */}
              <div className="pl-8">
                {/* Top Row Header info */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#22314D]">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-xl ${dev.quarantined ? 'bg-red-500/10' : 'bg-[#2F58CD]/10'}`}>
                      <Smartphone className={`h-5 w-5 ${dev.quarantined ? 'text-red-500' : 'text-[#2F58CD]'}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {dev.name}
                        <span className="text-xs text-slate-400 font-mono font-medium">({dev.model})</span>
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">{dev.carrier} • ID: <span className="font-mono">{dev.id}</span></p>
                    </div>
                  </div>

                  {/* Score indicators */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acing Trust Score</p>
                      <p className={`text-lg font-extrabold ${
                        dev.trustScore >= 85 ? 'text-[#10B981]' : dev.trustScore >= 50 ? 'text-[#F59E0B]' : 'text-red-500'
                      }`}>
                        {dev.trustScore} / 100
                      </p>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      dev.quarantined 
                        ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                        : dev.trustScore >= 85 
                          ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20' 
                          : 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20'
                    }`}>
                      {dev.quarantined ? "Quarantined" : dev.trustScore >= 85 ? "Trusted Core" : "Elevated State"}
                    </span>
                  </div>
                </div>

                {/* Middle telemetry metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-5">
                  {/* Hardware Root Flags (fixture) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Cpu className="h-4 w-4 text-[#2F58CD]" />
                      <span>Hardware Root Flags (fixture)</span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-0.5">
                      <p>Warranty Void: <span className={dev.warrantyFlag.includes("0x0") ? "text-[#10B981] font-bold" : "text-red-500 font-bold"}>{dev.warrantyFlag}</span></p>
                      <p>SELinux State: <span className="text-slate-300">{dev.selinux}</span></p>
                    </div>
                  </div>

                  {/* Integrity status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Shield className="h-4 w-4 text-[#2F58CD]" />
                      <span>Integrity Status (fixture)</span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-0.5">
                      <p>TIMA/RKP: <span className="text-slate-300">{dev.timaRkp}</span></p>
                      <p>Bootloader: <span className="text-slate-300">{dev.bootloader}</span></p>
                    </div>
                  </div>

                  {/* Radio metrics */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Radio className="h-4 w-4 text-[#2F58CD]" />
                      <span>RF Metrics (fixture)</span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-0.5">
                      <p>TRP: <span className="text-slate-300">{dev.trp}</span></p>
                      <p>TIS: <span className="text-slate-300">{dev.tis}</span></p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Activity className="h-4 w-4 text-[#2F58CD]" />
                      <span>Fixture Actions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleExpand(dev.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded border border-[#22314D] text-slate-300 hover:text-white"
                      >
                        {isExpanded ? 'Hide' : 'Expand'}
                      </button>
                      <button
                        onClick={() => triggerScannerFlow(dev.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded border border-[#2F58CD]/40 text-[#2F58CD] hover:bg-[#2F58CD]/10"
                      >
                        Scan Fixture
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-[#22314D] space-y-4">
                    <p className="text-xs text-slate-400">
                      Expanded view shows demonstration score history only. No live device telemetry is read.
                    </p>
                    {fullyExpandedIds.includes(dev.id) && (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dev.history}>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="#2F58CD" fill="#2F58CD33" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-3 bg-[#151D30]/95 border border-[#2F58CD] rounded-2xl px-5 py-3 shadow-xl">
          <button
            onClick={() => handleBulkQuarantine(true)}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30"
          >
            Mark Quarantined (fixture)
          </button>
          <button
            onClick={() => handleBulkQuarantine(false)}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          >
            Clear Quarantine (fixture)
          </button>
          <button
            onClick={handleBulkRecalculate}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-[#2F58CD]/20 text-[#2F58CD] border border-[#2F58CD]/30"
          >
            Recalculate Scores (fixture)
          </button>
        </div>
      )}

      {/* Scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 space-y-4 border border-[#2F58CD]/40">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Chip-Detection Fixture Simulator</h3>
            <p className="text-[10px] text-slate-500 max-w-xs font-medium">Animated demonstration only; no camera, device, warranty fuse, or RKP security data is accessed</p>
            <div className="h-40 rounded-xl border border-dashed border-[#22314D] flex items-center justify-center text-slate-500 text-xs">
              {scanningActive ? 'Simulating scan…' : 'Ready'}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowScanner(false)}
                className="text-xs font-bold px-3 py-2 rounded-lg border border-[#22314D] text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateScanSuccess}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-[#2F58CD] text-white"
              >
                Complete Fixture Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-friendly demo table */}
      <div className="hidden print:block">
        <div className="print-section-title">Simulated hardware-attestation and RF fixture values (not evidence)</div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>Name</th>
              <th>Model</th>
              <th style={{ width: '20%' }}>Warranty Flag (fixture)</th>
              <th>Trust</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(dev => (
              <tr key={dev.id}>
                <td>{dev.name}</td>
                <td>{dev.model}</td>
                <td>{dev.warrantyFlag}</td>
                <td>{dev.trustScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[10px] text-slate-500 mt-4">
          <strong>DEMONSTRATION REPORT ONLY</strong><br />
          Page 1 of 1
        </div>
      </div>
    </div>
  );
}
