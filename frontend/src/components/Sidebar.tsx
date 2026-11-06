"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Smartphone, FileText, CheckCircle, Database, Cpu } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Shield },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Devices', path: '/devices', icon: Smartphone },
    { name: 'Audit Logs', path: '/audit', icon: FileText },
    { name: 'RootMaster Lab', path: '/rootmaster', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-cyberDark border-r border-cyberBorder flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Branding Area */}
        <div className="p-6 border-b border-cyberBorder flex items-center gap-3">
          <div className="bg-linear-to-tr from-[#2F58CD] to-[#6C3483] p-2.5 rounded-xl">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase">Acing IU</h1>
            <p className="text-[10px] text-slate-400 font-medium">Security Center</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-royalBlue text-white shadow-lg shadow-[#2F58CD]/20'
                    : 'text-slate-400 hover:text-white hover:bg-cyberCard'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Indicators (Bottom of Sidebar) */}
      <div className="p-4 border-t border-cyberBorder space-y-3.5 bg-[#111827]/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Cpu className="h-3.5 w-3.5 text-royalBlue" />
            <span>KSP Integrity</span>
          </div>
          <span className="text-cyberGreen font-bold">ACTIVE</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Database className="h-3.5 w-3.5 text-vividViolet" />
            <span>PostgreSQL</span>
          </div>
          <span className="text-cyberGreen font-bold">CONNECTED</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-cyberCard rounded-lg border border-cyberBorder text-[10px] text-slate-400">
          <CheckCircle className="h-3.5 w-3.5 text-cyberGreen shrink-0" />
          <span className="font-medium">SM-S938U Baseline Synced</span>
        </div>
      </div>
    </aside>
  );
}
