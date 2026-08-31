"use strict";

import React from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  AlertTriangle, 
  Settings, 
  ArrowRight, 
  Layers, 
  Radio, 
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'S938U Knox Trust', value: 'Fixture 100 / 100', status: 'Simulator', color: 'text-[#F59E0B]', desc: 'No device attestation' },
    { name: 'Active Policies', value: '4 Demo Rules', status: 'Simulator', color: 'text-[#F59E0B]', desc: 'Not enforced' },
    { name: 'CTIA 3.8.2 RF Signal', value: 'Fixture 23.40 dBm', status: 'Simulator', color: 'text-[#F59E0B]', desc: 'No RF validation' },
    { name: 'Security Quarantine', value: 'Fixture 0 Devices', status: 'Simulator', color: 'text-[#F59E0B]', desc: 'No live monitoring' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl overflow-hidden border border-[#22314D] bg-gradient-to-r from-[#111827] via-[#151D30] to-[#111827] glow-blue">
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Acing Matrix Security Operations
          </h1>
          <p className="max-w-2xl text-sm font-medium text-slate-400">
            Simulator dashboard for planned firmware, Knox, policy, RF, and quarantine workflows. All displayed values are fixtures; no live device state is read, verified, monitored, or enforced.
          </p>
        </div>
        {/* Dynamic decorative backdrop circles */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#2F58CD]/10 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-[#6C3483]/10 blur-3xl"></div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-[#2F58CD]/50 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.name}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">{stat.value}</h2>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#22314D] pt-3 text-xs">
              <span className={`font-bold ${stat.color}`}>{stat.status}</span>
              <span className="text-slate-500 font-medium">{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Partition integrity schema details */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#22314D] pb-4">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-[#2F58CD]" />
              <h3 className="text-base font-bold text-white">S938U super.img Partition Schema (VZW)</h3>
            </div>
            <span className="text-xs bg-[#2F58CD]/20 text-[#2F58CD] font-bold px-2.5 py-1 rounded-full border border-[#2F58CD]/30">
              Approved Baseline VRU3CXH2
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Simulator data illustrates a planned SHA-256 partition comparison workflow. These values are fixtures only; no device, firmware image, or Knox integrity state has been verified.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#22314D] bg-[#111827]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">system.img</span>
                  <span className="text-[10px] text-[#F59E0B] font-extrabold uppercase">Simulator</span>
                </div>
                <div className="w-full bg-[#22314D] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2F58CD] h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Size: 3,420,540,210 Bytes</span>
                  <span>Approved Hash: 3c59a35e...</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#22314D] bg-[#111827]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">vendor.img</span>
                  <span className="text-[10px] text-[#F59E0B] font-extrabold uppercase">Simulator</span>
                </div>
                <div className="w-full bg-[#22314D] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2F58CD] h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Size: 950,230,112 Bytes</span>
                  <span>Approved Hash: a5732f98...</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#22314D] bg-[#111827]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">product.img</span>
                  <span className="text-[10px] text-[#F59E0B] font-extrabold uppercase">Simulator</span>
                </div>
                <div className="w-full bg-[#22314D] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2F58CD] h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Size: 1,850,302,510 Bytes</span>
                  <span>Approved Hash: b5722f98...</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#22314D] bg-[#111827]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">odm.img</span>
                  <span className="text-[10px] text-[#F59E0B] font-extrabold uppercase">Simulator</span>
                </div>
                <div className="w-full bg-[#22314D] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2F58CD] h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Size: 240,430,900 Bytes</span>
                  <span>Approved Hash: c44cb89a...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Policy Matrix */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#22314D] pb-4">
              <Lock className="h-5 w-5 text-[#6C3483]" />
              <h3 className="text-base font-bold text-white">Acing Matrix Policies</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">System Modification Policy</h4>
                  <p className="text-[10px] text-slate-400">Requires Trust {`>=`} 80, MFA verified, Admin/Operator roles.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Partition Wipe Protection</h4>
                  <p className="text-[10px] text-slate-400">Requires Trust {`>=`} 90, MFA verified, Admin only.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Firmware Update Flash Limit</h4>
                  <p className="text-[10px] text-slate-400">Requires Trust {`>=`} 85, MFA verified, Admin/Operator roles.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111827]/40 p-4 rounded-xl border border-[#22314D] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">CTIA RF Validation</span>
              <span className="text-[#F59E0B] font-bold">Fixture Example</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Simulator example: TRP baseline target {`>=`} 23.0 dBm with a
              fixture value of 23.40 dBm. No RF measurement or CTIA validation
              was performed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
