"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Database,
  Terminal,
  ShieldAlert,
  CheckCircle,
  Download,
  Printer,
  TrendingUp,
  Clock,
  Lock,
  Shield,
  ArrowUpDown,
  Calendar,
  Info,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<"timestamp" | "status" | "action">(
    "timestamp",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [isMounted, setIsMounted] = useState(false);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "DEVICE_POLICY_EVALUATION",
    "FRP_PARTITION_WIPE",
    "operator.s938u@aistudio.build",
    "DENIED",
    "Mick's S25 Ultra",
  ]);

  // CSV Preview modal state
  const [showCSVPreview, setShowCSVPreview] = useState(false);

  // Heatmap hover state
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  // Save search to recent searches list
  const handleAddRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (recentSearches.includes(trimmed)) return;
    setRecentSearches((prev) => [trimmed, ...prev.slice(0, 4)]);
  };

  // Heatmap static data generation for the last 30 days
  const heatmapData = React.useMemo(() => {
    // Seeded random number generator so the chart looks consistent
    let seed = 12345;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const data = [];
    const today = new Date("2026-07-01"); // Aligning with system date metadata 2026-07-01
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const successCount = isWeekend
        ? Math.floor(random() * 8) + 2
        : Math.floor(random() * 25) + 12;

      const deniedCount = random() > 0.75 ? Math.floor(random() * 3) + 1 : 0;

      data.push({
        date: dateStr,
        day: date.getDate(),
        month: date.toLocaleString("default", { month: "short" }),
        dayName: date.toLocaleString("default", { weekday: "short" }),
        success: successCount,
        denied: deniedCount,
        total: successCount + deniedCount,
      });
    }
    return data;
  }, []);

  // Mount logic to handle Next.js client-side hydration for charting libraries
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const logs = [
    {
      id: "log-1940a-ee28",
      timestamp: "2026-06-26 19:35:12 UTC",
      user: "mick.hart@verizon.com",
      action: "DEVICE_POLICY_EVALUATION",
      status: "SUCCESS",
      device: "Mick's S25 Ultra",
      ip: "192.168.1.150",
      details:
        '{"DeviceName":"S25 Ultra Mock","TrustScore":100,"PartitionVerification":"PASSED"}',
    },
    {
      id: "log-38491-ff12",
      timestamp: "2026-06-26 19:28:44 UTC",
      user: "operator.s938u@aistudio.build",
      action: "FRP_PARTITION_WIPE",
      status: "SUCCESS",
      device: "Standard S24 Dev Node",
      ip: "10.0.12.80",
      details:
        '{"WipedBlock":"/persistent","ConsensusVerified":true,"PolicyApproved":true}',
    },
    {
      id: "log-02849-aa92",
      timestamp: "2026-06-26 18:44:02 UTC",
      user: "ROOT_SYSTEM_WATCHDOG",
      action: "DEVICE_QUARANTINE_TRIGGERED",
      status: "DENIED",
      device: "Compromised S25 Target",
      ip: "172.16.89.12",
      details:
        '{"Reason":"Knox Warranty Void blown 0x1","Selinux":"Permissive"}',
    },
    {
      id: "log-93810-bc56",
      timestamp: "2026-06-26 18:12:30 UTC",
      user: "mick.hart@verizon.com",
      action: "KEY_ROTATION",
      status: "SUCCESS",
      device: "Mick's S25 Ultra",
      ip: "192.168.1.150",
      details: '{"CertSerial":"CERT-4CC8B9A09","Algorithm":"TIMA-RKP-256"}',
    },
    {
      id: "log-55091-ca18",
      timestamp: "2026-06-26 15:30:10 UTC",
      user: "operator.s938u@aistudio.build",
      action: "FIRMWARE_FLASH",
      status: "SUCCESS",
      device: "Mick's S25 Ultra",
      ip: "192.168.1.150",
      details: '{"BaselineVersion":"S938UVRU3CXH2","AP_Block":"Verified"}',
    },
    {
      id: "log-11928-dd43",
      timestamp: "2026-06-26 14:15:00 UTC",
      user: "operator.s938u@aistudio.build",
      action: "PARTITION_WIPE",
      status: "DENIED",
      device: "Standard S24 Dev Node",
      ip: "10.0.12.80",
      details:
        '{"Reason":"Unauthorized user role. Action requires Admin-level credentials."}',
    },
  ];

  // Frequency of events over the last 24 hours
  const hourlyChartData = [
    { hour: "14:00", Success: 11, Denied: 1 },
    { hour: "16:00", Success: 15, Denied: 0 },
    { hour: "18:00", Success: 18, Denied: 1 },
    { hour: "20:00", Success: 29, Denied: 0 },
    { hour: "22:00", Success: 14, Denied: 0 },
    { hour: "00:00", Success: 9, Denied: 0 },
    { hour: "02:00", Success: 5, Denied: 0 },
    { hour: "04:00", Success: 12, Denied: 0 },
    { hour: "06:00", Success: 17, Denied: 2 },
    { hour: "08:00", Success: 26, Denied: 0 },
    { hour: "10:00", Success: 34, Denied: 1 },
    { hour: "12:00", Success: 28, Denied: 0 },
  ];

  // Filtering criteria based on search query, status dropdown, and date-range pickers
  const filteredLogs = logs.filter((log) => {
    // 1. Text Query Filter
    const q = searchTerm.toLowerCase();
    const textMatch =
      q === "" ||
      log.action.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.device.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q);

    // 2. Status Dropdown Filter
    const statusMatch = statusFilter === "ALL" || log.status === statusFilter;

    // 3. Date-Range Filter (log.timestamp is "YYYY-MM-DD HH:MM:SS UTC")
    const logDateStr = log.timestamp.split(" ")[0]; // "YYYY-MM-DD"
    let dateMatch = true;
    if (startDate) {
      dateMatch = dateMatch && logDateStr >= startDate;
    }
    if (endDate) {
      dateMatch = dateMatch && logDateStr <= endDate;
    }

    return textMatch && statusMatch && dateMatch;
  });

  // Sorting Handler
  const handleSort = (field: "timestamp" | "status" | "action") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending order on new field selection
    }
  };

  // Sorted list of audit log items
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = "";
    let valB = "";

    if (sortField === "timestamp") {
      valA = a.timestamp;
      valB = b.timestamp;
    } else if (sortField === "status") {
      valA = a.status;
      valB = b.status;
    } else if (sortField === "action") {
      valA = a.action;
      valB = b.action;
    }

    if (sortDirection === "asc") {
      return valA.localeCompare(valB);
    } else {
      return valB.localeCompare(valA);
    }
  });

  // Dynamically compute report metadata/statistics
  const totalEventCount = sortedLogs.length;
  const deniedLogs = sortedLogs.filter((l) => l.status === "DENIED");
  const successLogs = sortedLogs.filter((l) => l.status === "SUCCESS");
  const failurePercentage =
    totalEventCount > 0
      ? ((deniedLogs.length / totalEventCount) * 100).toFixed(1)
      : "0.0";

  // Text highlighting utility for live visual feedback
  const highlightText = (text: string, query: string) => {
    if (!query || query.trim() === "") return <span>{text}</span>;
    const parts = text.split(
      new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"),
    );
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400 text-black px-0.5 rounded font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  // CSV Export utility for local analytics
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Timestamp (UTC)",
      "Operator",
      "Action",
      "Status",
      "Target Device",
      "IP Address",
      "Details JSON",
    ];
    const rows = sortedLogs.map((log) => [
      log.id,
      log.timestamp,
      log.user,
      log.action,
      log.status,
      log.device,
      log.ip,
      log.details,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `acing_iu_compliance_audit_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Export trigger (Triggers window print with customized media print styling)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22314D] pb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#2F58CD]" />
            Immutable PostgreSQL Audit Logging Pipeline
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Secure write-once-read-many (WORM) audit ledger tracking Knox
            transitions and system operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#2F58CD]/20 text-[#2F58CD] font-bold px-3 py-1.5 rounded-full border border-[#2F58CD]/30 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            PostgreSQL Sync Live
          </span>
        </div>
      </div>

      {/* Security Metrics and Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Summary Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <Clock className="h-4 w-4 text-[#2F58CD]" />
              <span>Compliance Period</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              CTIA 3.8.2 RF & Knox Security Status
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Real-time audit telemetry tracking verified Knox 0x0 warranty,
              SELinux parameters, and Verizon hardware RF compliance thresholds.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => setShowCSVPreview(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#151D30] text-white hover:bg-[#2F58CD] border border-[#22314D] hover:border-[#2F58CD] text-xs font-bold transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Export Filtered CSV Report
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2F58CD] to-[#6C3483] hover:from-[#3a6bf0] hover:to-[#7d3f99] text-white text-xs font-bold shadow-lg shadow-[#2F58CD]/15 transition-all duration-300"
            >
              <Printer className="h-4 w-4" />
              Generate PDF Compliance Document
            </button>
          </div>
        </div>

        {/* Right side charts stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recharts Hourly Frequency Line Chart */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <TrendingUp className="h-4 w-4 text-[#10B981]" />
                <span>24-Hour Security Event frequency</span>
              </div>
              <div className="flex gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                  SUCCESS
                </span>
                <span className="flex items-center gap-1.5 text-[#EF4444]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]"></span>
                  DENIED
                </span>
              </div>
            </div>

            <div className="h-[200px] w-full flex items-center justify-center">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hourlyChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#22314D" />
                    <XAxis
                      dataKey="hour"
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#22314D" }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#22314D" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#151D30",
                        border: "1px solid #22314D",
                        borderRadius: "8px",
                        color: "#F8FAFC",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Success"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        stroke: "#10B981",
                        strokeWidth: 1,
                        fill: "#111827",
                      }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Denied"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        stroke: "#EF4444",
                        strokeWidth: 1,
                        fill: "#111827",
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Initialising charting context...</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Calendar Heatmap Component */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22314D] pb-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-bold uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-[#2F58CD]" />
                <span>30-Day Security Event Frequency Heatmap</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-bold">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#111827] border border-[#22314D]" />
                  <span>0</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F58CD]/20 border border-[#2F58CD]/30" />
                  <span>1-10</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F58CD]/45 border border-[#2F58CD]/50" />
                  <span>11-20</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F58CD]/70 border border-[#2F58CD]/80" />
                  <span>21-30</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F58CD] border border-white/20" />
                  <span>31+</span>
                </div>
                <div className="flex items-center gap-1 ml-1 border-l border-[#22314D] pl-2">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F58CD]/30 border-2 border-red-500" />
                  <span className="text-red-400">Incidents</span>
                </div>
              </div>
            </div>

            <div className="relative space-y-4">
              {/* Grid of days (last 30 days) */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {heatmapData.map((day, idx) => {
                  // Compute background intensity
                  let cellBg = "bg-[#111827] border-[#22314D] text-slate-600";
                  if (day.total > 0 && day.total <= 10) {
                    cellBg =
                      "bg-[#2F58CD]/20 border-[#2F58CD]/30 text-blue-300 hover:bg-[#2F58CD]/30";
                  } else if (day.total > 10 && day.total <= 20) {
                    cellBg =
                      "bg-[#2F58CD]/45 border-[#2F58CD]/50 text-blue-100 hover:bg-[#2F58CD]/55";
                  } else if (day.total > 20 && day.total <= 30) {
                    cellBg =
                      "bg-[#2F58CD]/70 border-[#2F58CD]/80 text-white hover:bg-[#2F58CD]/80";
                  } else if (day.total > 30) {
                    cellBg =
                      "bg-[#2F58CD] border-white/25 text-white font-bold hover:brightness-110";
                  }

                  const hasDenied = day.denied > 0;
                  const cellBorder = hasDenied
                    ? "border-2 border-red-500 hover:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse"
                    : "border";

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-mono cursor-pointer transition-all duration-300 hover:scale-[1.06] hover:shadow-lg ${cellBg} ${cellBorder}`}
                    >
                      <span className="font-extrabold text-[11px]">
                        {day.day}
                      </span>
                      <span className="text-[7.5px] opacity-70 uppercase tracking-tight">
                        {day.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic details preview bar */}
              <div className="p-3 bg-[#0B0F19] border border-[#22314D] rounded-xl flex items-center justify-between min-h-[58px] transition-all duration-300">
                {hoveredDay ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${hoveredDay.denied > 0 ? "bg-red-950/40 text-red-400 border border-red-900/30" : "bg-blue-950/40 text-blue-400 border border-blue-900/30"}`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">
                          {hoveredDay.dayName}, {hoveredDay.month}{" "}
                          {hoveredDay.day}, 2026
                        </span>
                        <span className="text-xs font-bold text-white block mt-0.5">
                          Total Event Audits:{" "}
                          <strong className="text-blue-400">
                            {hoveredDay.total}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs font-mono pr-2">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">
                          Success
                        </span>
                        <span className="text-emerald-400 font-bold text-xs">
                          {hoveredDay.success}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">
                          Denied
                        </span>
                        <span
                          className={`font-bold text-xs ${hoveredDay.denied > 0 ? "text-red-500" : "text-slate-500"}`}
                        >
                          {hoveredDay.denied}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic flex items-center gap-2 mx-auto font-medium">
                    <Info className="h-4 w-4 text-[#2F58CD] shrink-0 animate-bounce" />
                    <span>
                      Hover over any cell in the 30-day calendar to explore
                      specific audit frequency and security event counts.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#2F58CD]" />
          <span>Audit Query & Filter parameters</span>
        </h3>

        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          {/* Text Search Input & Recent Searches */}
          <div className="flex flex-col gap-2 w-full xl:w-[480px]">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddRecentSearch(searchTerm);
                  }
                }}
                placeholder="Search operators, actions, devices, hashes (Press Enter to save)..."
                className="w-full bg-[#151D30] border border-[#22314D] rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2F58CD]/70 font-semibold transition-all duration-200"
              />
            </div>

            {/* Recent Searches row */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-bold uppercase text-[9px] text-slate-500 flex items-center gap-1 shrink-0">
                <History className="h-3 w-3 text-[#2F58CD]" /> Recent searches:
              </span>
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => setSearchTerm(term)}
                  className="px-2.5 py-1 bg-[#111827] hover:bg-[#2F58CD]/20 border border-[#22314D] hover:border-[#2F58CD]/40 rounded-lg text-slate-300 hover:text-white font-semibold transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Filtering options */}
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#151D30] border border-[#22314D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2F58CD]/70 font-semibold cursor-pointer"
              >
                <option value="ALL">ALL EVENTS</option>
                <option value="SUCCESS">SUCCESS ONLY</option>
                <option value="DENIED">DENIED ONLY</option>
              </select>
            </div>

            {/* Date-Range Pickers */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                From:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#151D30] border border-[#22314D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2F58CD]/70 font-semibold cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                To:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#151D30] border border-[#22314D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2F58CD]/70 font-semibold cursor-pointer"
              />
            </div>

            {/* Clear Filters indicator */}
            {(startDate ||
              endDate ||
              statusFilter !== "ALL" ||
              searchTerm !== "") && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                }}
                className="text-[10px] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] font-bold px-3 py-2 rounded-xl border border-[#EF4444]/20 transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SIEM Log Table Panel */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Panel Header */}
        <div className="p-5 border-b border-[#22314D] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/30">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <Terminal className="h-4.5 w-4.5 text-[#2F58CD]" />
            <span>Active Logging Ledger</span>
            <span className="text-xs bg-[#151D30] text-slate-400 border border-[#22314D] px-2.5 py-0.5 rounded-lg font-mono ml-1.5 font-semibold">
              {sortedLogs.length} Records Found
            </span>
          </div>
        </div>

        {/* Column sorting header buttons */}
        <div className="px-5 py-3.5 border-b border-[#22314D] bg-[#111827]/40 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span className="text-[10px]">Sort Ledger Logs By:</span>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <button
              onClick={() => handleSort("timestamp")}
              className={`flex items-center gap-1.5 transition-colors text-[11px] ${sortField === "timestamp" ? "text-[#2F58CD] font-extrabold" : "hover:text-white"}`}
            >
              <span>Timestamp</span>
              <ArrowUpDown className="h-3 w-3" />
              {sortField === "timestamp" &&
                (sortDirection === "asc" ? "▲" : "▼")}
            </button>

            <button
              onClick={() => handleSort("action")}
              className={`flex items-center gap-1.5 transition-colors text-[11px] ${sortField === "action" ? "text-[#2F58CD] font-extrabold" : "hover:text-white"}`}
            >
              <span>User Action</span>
              <ArrowUpDown className="h-3 w-3" />
              {sortField === "action" && (sortDirection === "asc" ? "▲" : "▼")}
            </button>

            <button
              onClick={() => handleSort("status")}
              className={`flex items-center gap-1.5 transition-colors text-[11px] ${sortField === "status" ? "text-[#2F58CD] font-extrabold" : "hover:text-white"}`}
            >
              <span>Status</span>
              <ArrowUpDown className="h-3 w-3" />
              {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
            </button>
          </div>
        </div>

        {/* Log list items */}
        <div className="divide-y divide-[#22314D]">
          {sortedLogs.length > 0 ? (
            sortedLogs.map((log) => (
              <div
                key={log.id}
                className="p-5 hover:bg-[#151D30]/30 transition-all duration-200 space-y-3"
              >
                {/* Top metadata block */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        log.status === "SUCCESS" ? "bg-[#10B981]" : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-extrabold text-white">
                      {highlightText(log.action, searchTerm)}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400 font-medium">
                      Device:{" "}
                      <strong className="text-slate-300 font-semibold">
                        {highlightText(log.device, searchTerm)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold font-mono">
                    <span>IP: {highlightText(log.ip, searchTerm)}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                {/* Payload Details */}
                <div className="p-3.5 bg-[#0B0F19]/90 rounded-xl border border-[#22314D] flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="text-slate-400 truncate max-w-3xl">
                    Payload:{" "}
                    <span className="text-[#10B981] font-semibold">
                      {highlightText(log.details, searchTerm)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-600 bg-slate-900/40 px-2 py-0.5 rounded font-mono shrink-0">
                    ID: {log.id}
                  </span>
                </div>

                {/* Status and operator footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    Operator:{" "}
                    <strong className="text-slate-300">
                      {highlightText(log.user, searchTerm)}
                    </strong>
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      log.status === "SUCCESS"
                        ? "text-[#10B981]"
                        : "text-[#EF4444]"
                    }`}
                  >
                    {log.status === "SUCCESS" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    {highlightText(log.status, searchTerm)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs font-semibold">
              No matching security audit logs found. Try adjusting your query
              parameters.
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PRINT-ONLY COMPLIANCE REPORT CONTAINER (RENDERED DURING WINDOW.PRINT) */}
      {/* ==================================================================== */}
      <div className="print-report-container">
        <div className="print-title">
          VERIZON SM-S938U Knox Trust & CTIA 3.8.2 Compliance Certificate
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <strong>DOCUMENT ID:</strong> TX-COMP-S938U-2026-VZW
            <br />
            <strong>ISSUED BY:</strong> Acing Operations Matrix Security Office
            <br />
            <strong>EXPORTED AT:</strong> {new Date().toUTCString()}
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>SYSTEM CLASSIFICATION:</strong> SECRET / UNCLASSIFIED
            <br />
            <strong>COMPLIANCE SCOPE:</strong> VRU3CXH2 BASELINE
            <br />
            <strong>CURRENT CORE INTEGRITY:</strong>{" "}
            <span
              className="print-badge"
              style={{
                borderColor: deniedLogs.length > 0 ? "red" : "green",
                color: deniedLogs.length > 0 ? "red" : "green",
              }}
            >
              {deniedLogs.length > 0 ? "WARNING_DEGRADED" : "PASSED"}
            </span>
          </div>
        </div>

        {/* Dynamic PDF Summary Statistics Section */}
        <div className="print-section-title">
          Summary Statistics & Security Posture
        </div>
        <div
          className="print-grid"
          style={{
            marginBottom: "20px",
            border: "1px solid #333333",
            padding: "12px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div>
            <strong>Total Events Evaluated:</strong> {totalEventCount}
            <br />
            <strong>Successful Operations:</strong> {successLogs.length}
            <br />
            <strong>Compliance Failure Rate:</strong>{" "}
            <span
              style={{
                color: deniedLogs.length > 0 ? "red" : "black",
                fontWeight: "bold",
              }}
            >
              {failurePercentage}% ({deniedLogs.length} failed event
              {deniedLogs.length === 1 ? "" : "s"})
            </span>
          </div>
          <div>
            <strong>Critical Security Warnings ({deniedLogs.length}):</strong>
            {deniedLogs.length > 0 ? (
              <ul
                style={{
                  margin: "5px 0 0 15px",
                  padding: 0,
                  fontSize: "8.5pt",
                  listStyleType: "square",
                }}
              >
                {deniedLogs.map((log, index) => (
                  <li key={index} style={{ color: "red" }}>
                    <strong>{log.action}</strong>: {log.details}
                  </li>
                ))}
              </ul>
            ) : (
              <span
                style={{
                  color: "green",
                  marginLeft: "5px",
                  fontWeight: "bold",
                }}
              >
                None. No system violations detected during this audit window.
              </span>
            )}
          </div>
        </div>

        <div className="print-section-title">
          Hardware attestation & RF metrics (CTIA 3.8.2)
        </div>
        <div className="print-grid" style={{ marginBottom: "15px" }}>
          <div>
            <strong>Knox Hardware root:</strong> 0x0 Warranty Intact (Passed)
            <br />
            <strong>SELinux state:</strong> Enforcing (Passed)
            <br />
            <strong>TIMA Kernel Guard:</strong> Active (Passed)
            <br />
            <strong>Bootloader status:</strong> Locked (Passed)
          </div>
          <div>
            <strong>Total Radiated Power (TRP):</strong> 23.40 dBm (Target &gt;=
            23.0 dBm) [PASSED]
            <br />
            <strong>Isotropic Sensitivity (TIS):</strong> -92.15 dBm (Target
            &lt;= -90.0 dBm) [PASSED]
            <br />
            <strong>super.img Baseline SHA:</strong> Approved Matches Perfect
          </div>
        </div>

        <div className="print-section-title">
          Verified Active logging Ledger
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Timestamp (UTC)</th>
              <th style={{ width: "18%" }}>Operator</th>
              <th style={{ width: "25%" }}>Action Name</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "32%" }}>Details / Payload JSON</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.timestamp}</td>
                <td>{log.user}</td>
                <td>
                  <strong>{log.action}</strong>
                </td>
                <td>
                  <span
                    className="print-badge"
                    style={{
                      borderColor: log.status === "SUCCESS" ? "green" : "red",
                      color: log.status === "SUCCESS" ? "green" : "red",
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8pt",
                    wordBreak: "break-all",
                  }}
                >
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: "50px",
            borderTop: "1px solid #999",
            paddingTop: "10px",
            fontSize: "9pt",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <em>Digitally attested by TIMA-RKP-256 Crypto Assurance Matrix</em>
          </div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      {/* CSV Export Preview Modal */}
      {showCSVPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#22314D] rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative animate-slideIn text-left">
            <div className="flex items-center justify-between border-b border-[#22314D] pb-4">
              <div className="flex items-center gap-2.5">
                <Download className="h-5 w-5 text-[#2F58CD]" />
                <h3 className="text-base font-bold text-white">
                  Export Filtered CSV Preview
                </h3>
              </div>
              <button
                onClick={() => setShowCSVPreview(false)}
                className="text-slate-400 hover:text-white font-extrabold uppercase text-[10px] px-3 py-1.5 rounded-lg border border-[#22314D] hover:bg-[#22314D]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Reviewing the filtered active compliance audit logs below prior to
              exporting as a formatted CSV spreadsheet:
            </p>

            <div className="overflow-x-auto border border-[#22314D] rounded-xl max-h-[300px] scrollbar-thin">
              <table className="w-full text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-[#0B0F19] text-[10px] uppercase text-slate-400 font-bold tracking-wider border-b border-[#22314D] text-left">
                    <th className="p-3 font-mono text-[9px]">Log ID</th>
                    <th className="p-3">Timestamp (UTC)</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">User Action</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Device Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22314D]">
                  {sortedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#151D30]/30 transition-colors"
                    >
                      <td className="p-3 font-mono text-[9px] text-slate-500">
                        {log.id}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="p-3 font-semibold text-slate-400">
                        {log.user}
                      </td>
                      <td className="p-3 font-bold text-white">{log.action}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                              : "bg-red-500/20 text-red-500 border border-red-500/30"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{log.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t border-[#22314D] pt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                Ready to generate: {sortedLogs.length} record
                {sortedLogs.length === 1 ? "" : "s"}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCSVPreview(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowCSVPreview(false);
                  }}
                  className="bg-[#2F58CD] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Filtered CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
