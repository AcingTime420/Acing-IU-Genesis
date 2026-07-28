import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Acing IU Security Center",
  description: "SM-S938U Verizon Firmware Trust & Zero-Trust Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden">
        {/* Persistent Sidebar Navigation */}
        <Sidebar />

        {/* Primary Screen Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Operational Status Bar */}
          <header className="h-16 border-b border-[#22314D] px-8 flex items-center justify-between shrink-0 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Acing Operations Grid — SM-S938U Baseline [VZW]
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span>Timezone: <strong className="text-slate-200">UTC-7</strong></span>
              <span>•</span>
              <span>Matrix Key: <strong className="text-slate-200">ACTIVE_TIMA_RKP</strong></span>
            </div>
          </header>

          {/* Page Content Container */}
          <div className="p-8 max-w-7xl w-full mx-auto flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
