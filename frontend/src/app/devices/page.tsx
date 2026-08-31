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
  knoxWarranty: string;
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
  
  // Devices state
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "dev-938u-vzw1",
      name: "Mick's S25 Ultra",
      model: "SM-S938U",
      carrier: "Verizon (VZW)",
      trustScore: 100,
      quarantined: false,
      knoxWarranty: "0x0 (Intact)",
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
      carrier: "Verizon (VZW)",
      trustScore: 80,
      quarantined: false,
      knoxWarranty: "0x0 (Intact)",
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
      name: "Compromised S25 Target",
      model: "SM-S938U",
      carrier: "Unlocked (XAA)",
      trustScore: 0,
      quarantined: true,
      knoxWarranty: "0x1 (Tripped)", 
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
          score = 0; // cannot bypass tripped knox
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
        // Boost score / attest device
        const isCompromised = dev.id === 'dev-rooted-938';
        return {
          ...dev,
          trustScore: isCompromised ? 15 : 100, // Tripped warranty still gets penalty but attests chip presence
          timaRkp: "Active",
          selinux: "Enforcing"
        };
      }
      return dev;
    }));

    const targetDevice = devices.find(d => d.id === scannerDeviceTarget);
    
    addToast(
      `FIXTURE UPDATE: Simulated chip-detection result recorded for '${targetDevice?.name || 'Device'}'. No Knox attestation or certification occurred.`,
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
            disabled
            title="Unavailable until a verified device-attestation executor exists"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-600/30 bg-slate-700/20 px-3.5 py-1.5 text-xs font-bold text-slate-500 opacity-70"
          >
            <QrCode className="h-4 w-4" />
            Attestation Unavailable
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
                  {/* Knox Hardware Root */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Cpu className="h-4 w-4 text-[#2F58CD]" />
                      <span>Knox Hardware Root</span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-0.5">
                      <p>Warranty Void: <span className={dev.knoxWarranty.includes("0x0") ? "text-[#10B981] font-bold" : "text-red-500 font-bold"}>{dev.knoxWarranty}</span></p>
                      <p>SELinux State: <span className="text-slate-300">{dev.selinux}</span></p>
                    </div>
                  </div>

                  {/* Integrity status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Shield className="h-4 w-4 text-[#6C3483]" />
                      <span>Kernel Verification</span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-0.5">
                      <p>TIMA RKP Guard: <span className={dev.timaRkp === "Active" ? "text-[#10B981] font-bold" : "text-red-500 font-bold"}>{dev.timaRkp}</span></p>
                      <p>Bootloader Guard: <span className={dev.bootloader === "Locked" ? "text-[#10B981] font-bold" : "text-red-500 font-bold"}>{dev.bootloader}</span></p>
                    </div>
                  </div>

                  {/* CTIA Radio */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Radio className="h-4 w-4 text-[#F59E0B]" />
                      <span>CTIA OTA 3.8.2 RF Parameters</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-white">
                      <div>
                        <p className="text-slate-400">TRP (Total Radiated Power):</p>
                        <p className="text-slate-200 mt-0.5">{dev.trp} <span className="text-[10px] text-slate-500">(Target {`>=`} 23.0 dBm)</span></p>
                      </div>
                      <div>
                        <p className="text-slate-400">TIS (Isotropic Sensitivity):</p>
                        <p className="text-slate-200 mt-0.5">{dev.tis} <span className="text-[10px] text-slate-500">(Target {`<=`} -90.0 dBm)</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE DETAIL SECURE SECTION (SPARKLINE SCORE HISTORY) */}
                {isExpanded && (
                  <div className="border-t border-[#22314D] py-5 space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left graph space */}
                      <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="h-4 w-4 text-[#10B981]" />
                          <span>30-Day Fixture Trust-Score Trend (Simulation)</span>
                        </h4>

                        {/* Recharts Area sparkline graph */}
                        <div className="h-32 w-full bg-[#0B0F19]/60 rounded-xl p-2 border border-[#22314D]">
                          {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart 
                                 data={dev.history} 
                                 margin={{ top: 5, right: 5, left: -40, bottom: 0 }}
                                 style={{ pointerEvents: fullyExpandedIds.includes(dev.id) ? 'auto' : 'none' }}
                               >
                                 <defs>
                                   <linearGradient id={`grad-${dev.id}`} x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor={dev.quarantined ? "#EF4444" : "#10B981"} stopOpacity={0.25}/>
                                     <stop offset="95%" stopColor={dev.quarantined ? "#EF4444" : "#10B981"} stopOpacity={0.0}/>
                                   </linearGradient>
                                 </defs>
                                 <XAxis dataKey="day" hide={true} />
                                 <YAxis domain={[0, 100]} hide={true} />
                                 {fullyExpandedIds.includes(dev.id) && (
                                   <Tooltip 
                                     contentStyle={{
                                       backgroundColor: '#151D30',
                                       border: '1px solid #22314D',
                                       color: 'white',
                                       fontSize: '11px',
                                       borderRadius: '6px'
                                     }}
                                   />
                                 )}
                                 <Area 
                                   type="monotone" 
                                   dataKey="score" 
                                   stroke={dev.quarantined ? "#EF4444" : "#10B981"} 
                                   strokeWidth={2}
                                   fillOpacity={1} 
                                   fill={`url(#grad-${dev.id})`} 
                                   isAnimationActive={fullyExpandedIds.includes(dev.id)}
                                   animationDuration={450}
                                 />
                               </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">
                              Loading sparkline telemetry...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right metadata sub-checklist */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-400" />
                          <span>Firmware Integrity Fixture Checklist</span>
                        </h4>

                        <div className="bg-[#111827]/40 rounded-xl border border-[#22314D] p-3.5 space-y-2 text-[11px] font-semibold text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>Base System Hash Code:</span>
                            <span className="font-mono text-[#10B981]">FIXTURE_MATCH</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>OEM Keys Registered:</span>
                            <span className="font-mono text-[#10B981]">FIXTURE_VERIFIED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>TEE Integrity Attestation:</span>
                            <span className="font-mono text-[#10B981]">FIXTURE_SECURE</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>FRP Protection Status:</span>
                            <span className="font-mono text-slate-400">{dev.bootloader === 'Locked' ? 'ENFORCED' : 'BYPASSED'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom interactive metadata row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#22314D] pt-4 mt-2">
                  <div className="text-[10px] text-slate-500 font-semibold font-mono truncate max-w-lg">
                    Partition MD5 Stage: 3c59a35e1281e8c97ec59bfa11ef12345e6eb951fca28be8e09fa843110fae12
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
                    <button 
                      disabled
                      title="Unavailable until a verified device-attestation executor exists"
                      className="flex cursor-not-allowed items-center gap-1.5 text-xs font-bold text-slate-600"
                    >
                      <QrCode className="h-3.5 w-3.5 text-[#2F58CD]" />
                      <span>Attestation Unavailable</span>
                    </button>

                    <button 
                      onClick={() => toggleExpand(dev.id)}
                      className="text-xs font-bold flex items-center gap-1.5 text-[#2F58CD] hover:text-[#426df0] transition-colors"
                    >
                      <span>{isExpanded ? "Hide Telemetry" : "Expand Telemetry"}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-3xl animate-slideIn">
          <div className="glass-card bg-[#111827] border border-[#22314D] shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 glow-blue">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2F58CD]/10 rounded-lg text-[#2F58CD]">
                <Shield className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">
                  {selectedIds.length} Device{selectedIds.length === 1 ? '' : 's'} Selected
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Local fixture selection; device-changing operations are unavailable</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button 
                onClick={handleBulkRecalculate}
                className="px-3.5 py-2 rounded-xl bg-[#151D30] border border-[#22314D] hover:border-slate-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#2F58CD]" />
                Recalculate Fixtures
              </button>
              
              <button 
                disabled
                title="Unavailable until a verified device-policy executor exists"
                className="cursor-not-allowed rounded-xl border border-slate-600/20 bg-slate-700/10 px-3.5 py-2 text-xs font-bold text-slate-600"
              >
                Clear Quarantine Unavailable
              </button>

              <button 
                disabled
                title="Unavailable until a verified device-policy executor exists"
                className="flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-600/20 bg-slate-700/10 px-3.5 py-2 text-xs font-bold text-slate-600"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Quarantine Unavailable
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="p-2 text-slate-400 hover:text-white transition-all"
                title="Cancel selection"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIGH-TECH NEON QR CODE SCANNER OVERLAY / VIEWPORT */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111827] border border-[#22314D] w-full max-w-lg rounded-3xl p-6 relative overflow-hidden space-y-6 shadow-2xl">
            {/* Background design glow */}
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#2F58CD]/10 blur-3xl"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#22314D] pb-4">
              <div className="flex items-center gap-2.5">
                <QrCode className="h-5 w-5 text-[#2F58CD]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Knox Attestation Fixture Simulator</h3>
              </div>
              <button 
                onClick={() => setShowScanner(false)} 
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Neon viewfinder scanbox */}
            <div className="relative h-64 w-full border border-[#22314D] bg-[#0B0F19] rounded-2xl flex flex-col items-center justify-center overflow-hidden">
              
              {/* Scan box marker corners */}
              <div className="absolute top-8 left-12 w-6 h-6 border-t-2 border-l-2 border-[#10B981]"></div>
              <div className="absolute top-8 right-12 w-6 h-6 border-t-2 border-r-2 border-[#10B981]"></div>
              <div className="absolute bottom-8 left-12 w-6 h-6 border-b-2 border-l-2 border-[#10B981]"></div>
              <div className="absolute bottom-8 right-12 w-6 h-6 border-b-2 border-r-2 border-[#10B981]"></div>

              {/* Scanning neon line */}
              {scanningActive && (
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" style={{ top: '35%' }}></div>
              )}

              {/* Viewfinder payload static/mock content */}
              <div className="text-center space-y-2 relative z-10 px-8">
                <ScanLine className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-300">ALIGN CHIP QR SIGNATURE CODE</p>
                <p className="text-[10px] text-slate-500 max-w-xs font-medium">Animated demonstration only; no camera, device, Knox fuse, or RKP security data is accessed</p>
              </div>

              {/* Scanning status pill */}
              <div className="absolute bottom-4 bg-[#151D30] border border-[#22314D] px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#10B981] rounded-full animate-ping"></span>
                <span>FIXTURE ANIMATION ACTIVE</span>
              </div>
            </div>

            {/* Selection and Simulation control */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Device for Attestation</label>
                <select 
                  value={scannerDeviceTarget}
                  onChange={(e) => setScannerDeviceTarget(e.target.value)}
                  className="w-full bg-[#151D30] border border-[#22314D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2F58CD]/70 font-semibold cursor-pointer"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.model})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowScanner(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#151D30] border border-[#22314D] text-slate-300 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSimulateScanSuccess}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2F58CD] to-[#6C3483] text-white text-xs font-bold shadow-lg shadow-[#2F58CD]/20 hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Simulate Chip Detected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINT-ONLY COMPLIANCE REPORT CONTAINER (RENDERED DURING WINDOW.PRINT) */}
      {/* ==================================================================== */}
      <div className="print-report-container">
        <div className="print-title">
          SIMULATED DEVICE INTEGRITY FIXTURE REPORT — NOT A CERTIFICATE
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <strong>DOCUMENT ID:</strong> DEV-COMP-S938U-2026-VZW<br />
            <strong>GENERATED BY:</strong> Acing IU: Genesis Simulator<br />
            <strong>EXPORTED AT:</strong> {new Date().toUTCString()}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>DATA CLASSIFICATION:</strong> PUBLIC TEST FIXTURE<br />
            <strong>REGISTRY STATUS:</strong> SIMULATED / UNVERIFIED<br />
            <strong>TOTAL FIXTURE RECORDS:</strong> {devices.length}
          </div>
        </div>

        <div className="print-section-title">Simulated hardware-attestation and RF fixture values (not CTIA evidence)</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Device Name / Model</th>
              <th style={{ width: '15%' }}>Trust Score</th>
              <th style={{ width: '20%' }}>Knox Warranty</th>
              <th style={{ width: '15%' }}>TIMA Status</th>
              <th style={{ width: '25%' }}>RF (TRP / TIS)</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(dev => (
              <tr key={dev.id}>
                <td><strong>{dev.name}</strong><br /><span style={{ fontSize: '8pt', color: '#555' }}>{dev.model} • {dev.carrier}</span></td>
                <td>
                  <span className="print-badge" style={{ borderColor: dev.trustScore >= 85 ? 'green' : 'red', color: dev.trustScore >= 85 ? 'green' : 'red' }}>
                    {dev.trustScore} / 100
                  </span>
                </td>
                <td>{dev.knoxWarranty}</td>
                <td>{dev.timaRkp}</td>
                <td>TRP: {dev.trp}<br />TIS: {dev.tis}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '50px', borderTop: '1px solid #999', paddingTop: '10px', fontSize: '9pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div>
            <em>Generated from local fixture data; not digitally attested and not valid compliance evidence</em>
          </div>
          
          {/* Security Seal SVG Graphic Overlay */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <svg width="85" height="85" viewBox="0 0 100 100" style={{ opacity: 0.95, display: 'inline-block' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#000000" strokeWidth="2" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#000000" strokeWidth="1" />
              <circle cx="50" cy="50" r="35" fill="#F3F4F6" stroke="#000000" strokeWidth="1.5" />
              
              {/* Star graphics inside seal */}
              <path d="M50 22 L52.5 30 L61 30 L54 35 L56.5 43 L50 38 L43.5 43 L46 35 L39 30 L47.5 30 Z" fill="#000000" opacity="0.12" />
              
              {/* Checkmark in the center certifying integrity */}
              <path d="M41 51 L47 57 L59 43" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Curved assurance text path definition */}
              <path id="printSealTextPath" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" stroke="none" />
              
              <text fontSize="5.5" fontWeight="bold" fill="#000000" letterSpacing="0.4">
                <textPath href="#printSealTextPath" startOffset="50%" textAnchor="middle">
                  • SIMULATOR FIXTURE • NOT VERIFIED •
                </textPath>
              </text>
              
              <text x="50" y="68" fontSize="6" fontWeight="extrabold" fill="#000000" textAnchor="middle" fontFamily="monospace">
                FIXTURE MARK
              </text>
              <text x="50" y="75" fontSize="4.5" fill="#444444" textAnchor="middle" fontFamily="monospace">
                NOT ATTESTED
              </text>
            </svg>
            <div style={{ textAlign: 'right', fontSize: '9pt' }}>
              <strong>DEMONSTRATION REPORT ONLY</strong><br />
              Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
