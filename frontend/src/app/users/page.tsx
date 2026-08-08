"use strict";

import React from 'react';
import { Users, Shield, UserCheck, Key, ShieldAlert } from 'lucide-react';

export default function UsersPage() {
  const users = [
    { 
      id: "usr-4927-aa31", 
      email: "mick.hart@verizon.com", 
      role: "Admin", 
      mfaEnabled: true, 
      status: "Active", 
      clearance: "L4 Global Security",
      keySignature: "SIG-KNOX-8501-A2"
    },
    { 
      id: "usr-8821-ff56", 
      email: "operator.s938u@aistudio.build", 
      role: "Operator", 
      mfaEnabled: true, 
      status: "Active", 
      clearance: "L3 Hardware Attestation",
      keySignature: "SIG-KNOX-3942-F1"
    },
    { 
      id: "usr-1102-cc90", 
      email: "micki.hart10041991@gmail.com", 
      role: "User", 
      mfaEnabled: false, 
      status: "Active", 
      clearance: "L1 Telemetry Read",
      keySignature: "SIG-KNOX-0041-C0"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22314D] pb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-[#2F58CD]" />
            Operator Access and Credentials
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage administrative roles, multi-factor keys, and security clearance logs for system-level actions.
          </p>
        </div>
        <span className="text-xs bg-[#6C3483]/20 text-[#6C3483] font-bold px-3 py-1.5 rounded-full border border-[#6C3483]/30">
          3 Personnel Loaded
        </span>
      </div>

      {/* Main Personnel Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {users.map((user, i) => (
          <div key={user.id} className="glass-card rounded-2xl p-6 hover:border-[#6C3483]/50 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Header card info */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">{user.id}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  user.role === 'Admin' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' :
                  user.role === 'Operator' ? 'bg-[#2F58CD]/10 text-[#2F58CD] border border-[#2F58CD]/20' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {user.role}
                </span>
              </div>

              {/* Email and Name */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight truncate">{user.email}</h3>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#2F58CD]" />
                  {user.clearance}
                </p>
              </div>

              {/* Key signatures */}
              <div className="p-3 bg-[#111827]/40 rounded-xl border border-[#22314D] font-mono text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Sign ID:</span>
                  <span className="text-white font-bold">{user.keySignature}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>MFA Status:</span>
                  <span className={user.mfaEnabled ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                    {user.mfaEnabled ? "VERIFIED_SECRET" : "NOT_ENROLLED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-4 border-t border-[#22314D] text-xs">
              <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
                <span className="h-1.5 w-1.5 bg-[#10B981] rounded-full"></span>
                {user.status}
              </span>
              <button className="text-slate-400 hover:text-white font-bold transition-colors">
                Audit Actions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security Tip banner */}
      <div className="p-4 rounded-xl border border-[#22314D] bg-[#111827]/30 flex items-start gap-3.5">
        <ShieldAlert className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300">Administrative Safeguards</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            System modifications require BOTH an Admin role with verified hardware multi-factor tokens and a compliant device trust score exceeding 85. Standard users are restricted from executing partitions wipes or security certificate key rotations.
          </p>
        </div>
      </div>
    </div>
  );
}
