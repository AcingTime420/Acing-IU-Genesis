"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import {
  CheckSquare,
  Square,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Share2,
  CheckCircle,
  Cpu,
  Database,
  Smartphone,
  Layers,
  Terminal,
  FileText,
  Settings,
  Sliders,
  ClipboardList,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Package,
  Wrench,
  Download,
  CheckCircle2,
  AlertCircle,
  Play,
  Activity,
  HardDrive,
  FolderTree,
  Shield,
  ShieldAlert,
  Gauge,
  HelpCircle,
  Copy,
  Check,
  Lock,
  Unlock,
} from "lucide-react";

interface Task {
  id: string;
  module: string;
  title: string;
  desc: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
}

const initialBuildLogsHistory = [
  {
    id: "Build #1",
    filename: "build_1_log.txt",
    size: 610,
    duration: 240,
    ratio: 4.2,
    status: "success",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
      "  - Compression ratio: 4.2:1 - Reduced 2.8GB system workspace into 610MB SquashFS image.",
      "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (Build #1)",
      "* ISO NAME: RootMasterOS_b1.iso",
      "* SIZE: 610 MB",
      "* STATUS: Ready to flash",
    ],
  },
  {
    id: "Build #F1",
    filename: "build_f1_log.txt",
    size: 0,
    duration: 42,
    ratio: 0,
    status: "failed",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[ERROR] Stage 1 failed: corrupt archive signature detected in custom overlay payload.",
      "[ERROR] Build execution terminated.",
    ],
  },
  {
    id: "Build #2",
    filename: "build_2_log.txt",
    size: 625,
    duration: 215,
    ratio: 4.5,
    status: "success",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
      "  - Compression ratio: 4.5:1 - Reduced 2.8GB system workspace into 625MB SquashFS image.",
      "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (Build #2)",
      "* ISO NAME: RootMasterOS_b2.iso",
      "* SIZE: 625 MB",
      "* STATUS: Ready to flash",
    ],
  },
  {
    id: "Build #3",
    filename: "build_3_log.txt",
    size: 630,
    duration: 198,
    ratio: 4.6,
    status: "success",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
      "  - Compression ratio: 4.6:1 - Reduced 2.8GB system workspace into 630MB SquashFS image.",
      "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (Build #3)",
      "* ISO NAME: RootMasterOS_b3.iso",
      "* SIZE: 630 MB",
      "* STATUS: Ready to flash",
    ],
  },
  {
    id: "Build #F2",
    filename: "build_f2_log.txt",
    size: 0,
    duration: 89,
    ratio: 0,
    status: "failed",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[ERROR] chroot command failed: dpkg was interrupted, you must manually run 'sudo dpkg --configure -a' to correct the problem.",
      "[ERROR] Compilation failed during third stage run.",
    ],
  },
  {
    id: "Build #4",
    filename: "build_4_log.txt",
    size: 640,
    duration: 185,
    ratio: 4.7,
    status: "success",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
      "  - Compression ratio: 4.7:1 - Reduced 2.8GB system workspace into 640MB SquashFS image.",
      "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (Build #4)",
      "* ISO NAME: RootMasterOS_b4.iso",
      "* SIZE: 640 MB",
      "* STATUS: Ready to flash",
    ],
  },
  {
    id: "Build #5",
    filename: "build_5_log.txt",
    size: 642,
    duration: 172,
    ratio: 4.8,
    status: "success",
    logs: [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
      "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
      "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
      "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
      "  - Compression ratio: 4.8:1 - Reduced 2.8GB system workspace into 642MB SquashFS image.",
      "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (Build #5)",
      "* ISO NAME: RootMasterOS_b5.iso",
      "* SIZE: 642 MB",
      "* STATUS: Ready to flash",
    ],
  },
];

// Helper to generate a multi-file ZIP archive dynamically on the client
const getMultiFileZipBlob = (
  files: { filename: string; content: string }[],
) => {
  const encoder = new TextEncoder();
  const makeTable = () => {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  };
  const crcTable = makeTable();
  const crc32 = (data: Uint8Array) => {
    let crc = 0 ^ -1;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  };

  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let currentOffset = 0;

  files.forEach((file) => {
    const fileData = encoder.encode(file.content);
    const crc = crc32(fileData);
    const size = fileData.length;
    const nameBytes = encoder.encode(file.filename);
    const nameLen = nameBytes.length;

    // Local file header (30 bytes + filename length + file size)
    const lfh = new ArrayBuffer(30 + nameLen);
    const lfhView = new DataView(lfh);
    lfhView.setUint32(0, 0x04034b50, true); // signature
    lfhView.setUint16(4, 10, true); // version needed
    lfhView.setUint16(6, 0, true); // flags
    lfhView.setUint16(8, 0, true); // compression (0 = store)
    lfhView.setUint16(10, 0, true); // mod time
    lfhView.setUint16(12, 0, true); // mod date
    lfhView.setUint32(14, crc, true); // crc-32
    lfhView.setUint32(18, size, true); // compressed size
    lfhView.setUint32(22, size, true); // uncompressed size
    lfhView.setUint16(26, nameLen, true); // filename length
    lfhView.setUint16(28, 0, true); // extra field length

    const lfhBytes = new Uint8Array(lfh);
    const fileBlock = new Uint8Array(30 + nameLen + size);
    fileBlock.set(lfhBytes, 0);
    fileBlock.set(nameBytes, 30);
    fileBlock.set(fileData, 30 + nameLen);

    parts.push(fileBlock);

    // Central directory header (46 bytes + filename length)
    const cdh = new ArrayBuffer(46 + nameLen);
    const cdhView = new DataView(cdh);
    cdhView.setUint32(0, 0x02014b50, true); // signature
    cdhView.setUint16(4, 20, true); // version made by
    cdhView.setUint16(6, 10, true); // version needed
    cdhView.setUint16(8, 0, true); // flags
    cdhView.setUint16(10, 0, true); // compression method
    cdhView.setUint16(12, 0, true); // last mod file time
    cdhView.setUint16(14, 0, true); // last mod file date
    cdhView.setUint32(16, crc, true); // crc-32
    cdhView.setUint32(20, size, true); // compressed size
    cdhView.setUint32(24, size, true); // uncompressed size
    cdhView.setUint16(28, nameLen, true); // filename length
    cdhView.setUint16(30, 0, true); // extra field length
    cdhView.setUint16(32, 0, true); // file comment length
    cdhView.setUint16(34, 0, true); // disk number start
    cdhView.setUint16(36, 0, true); // internal file attrs
    cdhView.setUint32(38, 0, true); // external file attrs
    cdhView.setUint32(42, currentOffset, true); // relative offset of local header

    const cdhBytes = new Uint8Array(cdh);
    const cdBlock = new Uint8Array(46 + nameLen);
    cdBlock.set(cdhBytes, 0);
    cdBlock.set(nameBytes, 46);

    cdEntries.push(cdBlock);
    currentOffset += fileBlock.length;
  });

  const totalCdSize = cdEntries.reduce((acc, b) => acc + b.length, 0);

  // End of central directory record
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, 0x06054b50, true); // signature
  eocdView.setUint16(4, 0, true); // number of this disk
  eocdView.setUint16(6, 0, true); // disk where central directory starts
  eocdView.setUint16(8, files.length, true); // number of central directory records on this disk
  eocdView.setUint16(10, files.length, true); // total number of central directory records
  eocdView.setUint32(12, totalCdSize, true); // size of central directory
  eocdView.setUint32(16, currentOffset, true); // offset of central directory, relative to start of archive
  eocdView.setUint16(20, 0, true); // comment length

  const eocdBytes = new Uint8Array(eocd);
  // Combine everything into Blob-safe ArrayBuffer copies.
  const finalBlobParts: BlobPart[] = [...parts, ...cdEntries, eocdBytes].map(
    (bytes) => {
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      return copy.buffer;
    },
  );

  return new Blob(finalBlobParts, {
    type: "application/zip",
  });
};

const CustomBuildTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0B0F19] border-2 border-[#22314D] p-3.5 rounded-xl shadow-2xl text-[10px] font-mono space-y-2 text-left max-w-[220px] backdrop-blur-md">
        <div className="font-extrabold text-white text-[11px] border-b border-[#22314D] pb-1 uppercase tracking-wider flex items-center justify-between">
          <span>{label}</span>
          <span className="text-indigo-400 font-extrabold text-[9px] bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded">
            STATS
          </span>
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">ISO Size:</span>
            <span className="font-bold text-blue-400">
              {data.size || "N/A"} MB
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Duration:</span>
            <span className="font-bold text-amber-400">
              {data.duration ? `${data.duration} sec` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Compression Ratio:</span>
            <span className="font-bold text-emerald-400">
              {data.ratio ? `${data.ratio}:1` : "N/A"}
            </span>
          </div>
          {data.predictedDuration !== undefined &&
            data.predictedDuration !== null && (
              <div className="flex justify-between items-center gap-4 border-t border-[#22314D]/50 pt-1.5 mt-1.5">
                <span className="text-slate-400">Est. Build Time:</span>
                <span className="font-bold text-pink-400 animate-pulse">
                  {data.predictedDuration} sec
                </span>
              </div>
            )}
        </div>
      </div>
    );
  }

  return null;
};

function DoughnutChart({
  successCount,
  failureCount,
}: {
  successCount: number;
  failureCount: number;
}) {
  const total = successCount + failureCount;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

  // SVG Circle calculations
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const successStrokeDashoffset =
    circumference - (successRate / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-[#0B0F19]/40 rounded-2xl border border-[#22314D]/40 w-full h-full min-h-[180px]">
      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center flex items-center gap-1.5 justify-center">
        <Activity className="h-3.5 w-3.5 text-blue-400" /> Build Health Ratio
      </h4>

      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle (Failed/Red) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#EF4444"
            strokeWidth={strokeWidth}
          />
          {/* Success circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={successStrokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-white leading-none">
            {successRate}%
          </span>
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
            Success
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-around w-full text-[10px] pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-slate-300 font-bold">{successCount} OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          <span className="text-slate-300 font-bold">{failureCount} FAIL</span>
        </div>
      </div>
    </div>
  );
}

function FirmwareBuildComparer({
  successfulBuilds,
}: {
  successfulBuilds: any[];
}) {
  const [buildAId, setBuildAId] = useState<string>("");
  const [buildBId, setBuildBId] = useState<string>("");

  // Initialize selected builds if not set
  useEffect(() => {
    if (successfulBuilds.length > 0) {
      if (!buildAId) setBuildAId(successfulBuilds[0].id);
      if (!buildBId && successfulBuilds.length > 1) {
        setBuildBId(successfulBuilds[1].id);
      } else if (!buildBId) {
        setBuildBId(successfulBuilds[0].id);
      }
    }
  }, [successfulBuilds, buildAId, buildBId]);

  const buildA = successfulBuilds.find((b) => b.id === buildAId);
  const buildB = successfulBuilds.find((b) => b.id === buildBId);

  if (!buildA || !buildB) return null;

  // Comparison metrics calculations
  const sizeDiff = buildB.size - buildA.size;
  const ratioDiff = Math.round((buildB.ratio - buildA.ratio) * 100) / 100;
  const durationDiff = buildB.duration - buildA.duration;

  // Helper to format values
  const getDiffBadge = (diff: number, lowerIsBetter: boolean, unit: string) => {
    if (diff === 0)
      return (
        <span className="text-slate-500 font-bold font-mono">
          0 {unit} (No Change)
        </span>
      );
    const sign = diff > 0 ? "+" : "";
    const isGood = lowerIsBetter ? diff < 0 : diff > 0;
    return (
      <span
        className={`font-extrabold font-mono text-[9px] px-2 py-0.5 rounded-md ${
          isGood
            ? "bg-emerald-950/55 text-emerald-400 border border-emerald-900/30"
            : "bg-red-950/55 text-red-400 border border-red-900/30"
        }`}
      >
        {sign}
        {diff} {unit} ({isGood ? "Optimized" : "Slower/Larger"})
      </span>
    );
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-5 bg-[#070B14]">
      <div className="flex items-center gap-2 border-b border-[#22314D] pb-3">
        <Sliders className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
          Firmware Build Comparer (Side-by-Side)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Build A Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Baseline Build (A)
          </label>
          <select
            value={buildAId}
            onChange={(e) => setBuildAId(e.target.value)}
            className="w-full bg-[#0B0F19] border border-[#22314D] text-white text-xs font-semibold rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
          >
            {successfulBuilds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} {b.status === "failed" ? "(Failed)" : `(${b.size} MB)`}
              </option>
            ))}
          </select>
        </div>

        {/* Build B Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Comparison Build (B)
          </label>
          <select
            value={buildBId}
            onChange={(e) => setBuildBId(e.target.value)}
            className="w-full bg-[#0B0F19] border border-[#22314D] text-white text-xs font-semibold rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
          >
            {successfulBuilds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} {b.status === "failed" ? "(Failed)" : `(${b.size} MB)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="space-y-4 pt-1">
        {/* Partition / Size */}
        <div className="p-4 rounded-xl border border-[#22314D]/40 bg-[#0B0F19]/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Partition Payload Size
            </span>
            {buildA.status !== "failed" &&
              buildB.status !== "failed" &&
              getDiffBadge(sizeDiff, true, "MB")}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildA.id}
              </span>
              <span className="text-sm font-black text-white">
                {buildA.status === "failed"
                  ? "N/A (Failed)"
                  : `${buildA.size} MB`}
              </span>
            </div>
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildB.id}
              </span>
              <span className="text-sm font-black text-white">
                {buildB.status === "failed"
                  ? "N/A (Failed)"
                  : `${buildB.size} MB`}
              </span>
            </div>
          </div>
        </div>

        {/* Compression Ratio */}
        <div className="p-4 rounded-xl border border-[#22314D]/40 bg-[#0B0F19]/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SquashFS Compression Ratio
            </span>
            {buildA.status !== "failed" &&
              buildB.status !== "failed" &&
              getDiffBadge(ratioDiff, false, ":1")}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildA.id}
              </span>
              <span className="text-sm font-black text-amber-400">
                {buildA.status === "failed"
                  ? "N/A (Failed)"
                  : `${buildA.ratio}:1`}
              </span>
            </div>
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildB.id}
              </span>
              <span className="text-sm font-black text-amber-400">
                {buildB.status === "failed"
                  ? "N/A (Failed)"
                  : `${buildB.ratio}:1`}
              </span>
            </div>
          </div>
        </div>

        {/* Build Duration */}
        <div className="p-4 rounded-xl border border-[#22314D]/40 bg-[#0B0F19]/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Compilation Duration
            </span>
            {buildA.status !== "failed" &&
              buildB.status !== "failed" &&
              getDiffBadge(durationDiff, true, "sec")}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildA.id}
              </span>
              <span className="text-sm font-black text-purple-400">
                {buildA.duration} sec
              </span>
            </div>
            <div className="p-2 bg-[#020617] rounded-lg border border-[#22314D]/30">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">
                {buildB.id}
              </span>
              <span className="text-sm font-black text-purple-400">
                {buildB.duration} sec
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildHistoryChart({
  successfulBuilds,
  onExportHistory,
}: {
  successfulBuilds: any[];
  onExportHistory: () => void;
}) {
  // Extract data for chart
  const successfulOnly = successfulBuilds.filter((b) => b.status !== "failed");
  const currentHistoryData = successfulOnly.map((b) => ({
    build: b.id,
    size: b.size,
    duration: b.duration,
    ratio: b.ratio,
  }));

  // Perform regression to predict duration based on ratio
  // duration = slope * ratio + intercept
  const n = currentHistoryData.length;
  let slope = 0;
  let intercept = 0;

  if (n > 1) {
    const durationValues = currentHistoryData.map((d) => d.duration || 0);
    const ratioValues = currentHistoryData.map((d) => d.ratio || 0);
    const sumX = ratioValues.reduce((a, b) => a + b, 0);
    const sumY = durationValues.reduce((a, b) => a + b, 0);
    const sumXY = ratioValues.reduce(
      (sum, r, i) => sum + r * durationValues[i],
      0,
    );
    const sumXX = ratioValues.reduce((sum, r) => sum + r * r, 0);

    const denom = n * sumXX - sumX * sumX;
    if (denom !== 0) {
      slope = (n * sumXY - sumX * sumY) / denom;
      intercept = (sumY - slope * sumX) / n;
    }
  }

  const chartData = currentHistoryData.map((d) => ({
    ...d,
    predictedDuration: d.ratio ? Math.round(slope * d.ratio + intercept) : null,
  }));

  // Predict the next ISO build time (e.g. at ratio 5.0 or last ratio + 0.1)
  const lastRatio = currentHistoryData[n - 1]?.ratio || 4.8;
  const nextRatio = Math.round((lastRatio + 0.2) * 10) / 10;
  const predictedNextDuration = Math.round(slope * nextRatio + intercept);

  chartData.push({
    build: "Next Build (Est.)",
    size: 650,
    duration: null as any,
    ratio: nextRatio,
    predictedDuration: predictedNextDuration,
  });

  const successCount = successfulBuilds.filter(
    (b) => b.status !== "failed",
  ).length;
  const failureCount = successfulBuilds.filter(
    (b) => b.status === "failed",
  ).length;

  return (
    <div className="glass-card p-5 rounded-2xl border border-[#22314D] space-y-4 bg-[#070B14]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22314D] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Build History & Performance
          </h3>
        </div>
        <button
          onClick={onExportHistory}
          className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-400 flex items-center gap-1 transition-all"
        >
          <Download className="h-3 w-3 text-indigo-400" />
          <span>Export Log History ({successfulBuilds.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 h-44 text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: -10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#22314D" />
              <XAxis dataKey="build" stroke="#94A3B8" />
              <YAxis yAxisId="left" stroke="#3B82F6" />
              <YAxis yAxisId="right" orientation="right" stroke="#A78BFA" />
              <RechartsTooltip content={<CustomBuildTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 5 }} />
              <Bar
                yAxisId="left"
                dataKey="size"
                name="ISO Size (MB)"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="duration"
                name="Duration (sec)"
                stroke="#F59E0B"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ratio"
                name="Ratio (x:1)"
                stroke="#10B981"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="predictedDuration"
                name="Predicted Build Time (sec)"
                stroke="#EC4899"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center">
          <DoughnutChart
            successCount={successCount}
            failureCount={failureCount}
          />
        </div>
      </div>
    </div>
  );
}

const partitionDetails = {
  "system.img": {
    fileCount: 24512,
    permissionsStatus: "98.5% Secure",
    subPartitions: [
      {
        name: "priv-app/SecSetupWizard",
        files: 34,
        permission: "rwxr-xr-x (0755)",
        context: "u:object_r:system_file:s0",
        rebrandingTarget: "Acing Setup Wizard",
        details:
          "Contains setup greeting, language, and network setup components. Configured for Acing welcome flow.",
      },
      {
        name: "priv-app/SystemUI",
        files: 145,
        permission: "rwxr-xr-x (0755)",
        context: "u:object_r:system_file:s0",
        rebrandingTarget: "Acing System UI",
        details:
          "Manages status bar, lock screen, and quick toggles. Custom Acing branding applied.",
      },
      {
        name: "media/bootsamsung.qmg",
        files: 1,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:system_file:s0",
        rebrandingTarget: "bootsamsung.qmg",
        details:
          "Samsung proprietary boot animation QMG format. Modified with Acing logo anim sequence.",
      },
      {
        name: "media/bootsamsungloop.qmg",
        files: 1,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:system_file:s0",
        rebrandingTarget: "bootsamsungloop.qmg",
        details:
          "Primary looping boot animation during system start. Rebranded with high-tech logo.",
      },
      {
        name: "framework/framework-res.apk",
        files: 82,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:system_file:s0",
        rebrandingTarget: "framework-res.apk",
        details:
          "Core system resources. Relabeled baseline One UI string descriptors to Acing IU.",
      },
    ],
  },
  "product.img": {
    fileCount: 8432,
    permissionsStatus: "100% Secure",
    subPartitions: [
      {
        name: "app/AcingWallet",
        files: 12,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:product_file:s0",
        rebrandingTarget: "Acing Wallet dApp",
        details:
          "Decentralized private key management app integrated with Knox trust chains.",
      },
      {
        name: "overlay/CarrierConfigOverlay",
        files: 4,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:product_file:s0",
        rebrandingTarget: "Verizon Custom Bypass",
        details:
          "XML configurations adjusting mobile registration and overriding default system blocks.",
      },
    ],
  },
  "vendor.img": {
    fileCount: 4120,
    permissionsStatus: "96.8% Secure",
    subPartitions: [
      {
        name: "bin/hw/android.hardware.biometrics.fingerprint@2.1-service",
        files: 1,
        permission: "rwxr-xr-x (0755)",
        context: "u:object_r:hal_fingerprint_default_exec:s0",
        rebrandingTarget: "Ultrasonic Biometrics Service",
        details:
          "Handles low-level Snapdragon ultrasonic fingerprint biometric matching for multi-action triggers.",
      },
      {
        name: "etc/init/android.hardware.biometrics.fingerprint@2.1-service.rc",
        files: 1,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:vendor_configs_file:s0",
        rebrandingTarget: "Fingerprint RC Daemon",
        details:
          "Init script registering bioservice daemon inside kernel workspace at boot.",
      },
    ],
  },
  "odm.img": {
    fileCount: 1248,
    permissionsStatus: "100% Secure",
    subPartitions: [
      {
        name: "etc/vintf/manifest_odm.xml",
        files: 1,
        permission: "rw-r--r-- (0644)",
        context: "u:object_r:vendor_configs_file:s0",
        rebrandingTarget: "ODM Manifest File",
        details:
          "Lists hardware abstraction interfaces (HAL) registered for local devices.",
      },
      {
        name: "firmware/soc_gpu.bin",
        files: 2,
        permission: "r--r--r-- (0444)",
        context: "u:object_r:vendor_firmware_file:s0",
        rebrandingTarget: "GPU Firmware Binary",
        details:
          "Microcode loading directly onto Adreno GPU inside Snapdragon 8 Elite chipset.",
      },
    ],
  },
};

function PartitionHierarchyD3({
  selectedPartition,
  viewMode,
}: {
  selectedPartition: any;
  viewMode: "tree" | "sunburst";
}) {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  useEffect(() => {
    if (!containerRef.current || !selectedPartition) return;

    const svg = d3.select(containerRef.current);
    svg.selectAll("*").remove();

    const width = 580;
    const height = 260;

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Get flat list of subPartitions
    const subPartitions =
      partitionDetails[selectedPartition.name as keyof typeof partitionDetails]
        ?.subPartitions || [];

    // Construct hierarchy
    const rootData: any = {
      name: selectedPartition.name,
      children: [],
    };

    subPartitions.forEach((sub) => {
      const parts = sub.name.split("/");
      let current = rootData;
      parts.forEach((part, index) => {
        const isLeaf = index === parts.length - 1;
        let existing = current.children.find((c: any) => c.name === part);
        if (!existing) {
          existing = { name: part, children: [] };
          if (isLeaf) {
            existing.value = sub.files || 1;
            existing.files = sub.files;
            existing.permission = sub.permission;
            existing.context = sub.context;
            existing.rebrandingTarget = sub.rebrandingTarget;
            delete existing.children; // leaves don't have children arrays in d3 sum operations
          }
          current.children.push(existing);
        }
        current = existing;
      });
    });

    if (viewMode === "tree") {
      // Tree view layout
      const margin = { top: 25, right: 130, bottom: 25, left: 65 };
      const treeLayout = d3
        .tree()
        .size([
          height - margin.top - margin.bottom,
          width - margin.left - margin.right,
        ]);
      const root = d3.hierarchy(rootData);
      treeLayout(root);

      // Links
      svg
        .selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#1E293B")
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d: any) => d.y + margin.left)
            .y((d: any) => d.x + margin.top) as any,
        );

      // Nodes
      const node = svg
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node cursor-pointer")
        .attr(
          "transform",
          (d: any) => `translate(${d.y + margin.left},${d.x + margin.top})`,
        )
        .on("mouseover", (event, d: any) => {
          d3.select(event.currentTarget)
            .select("circle")
            .transition()
            .duration(200)
            .attr("r", 8)
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 2);
          d3.select(event.currentTarget)
            .select("text")
            .transition()
            .duration(200)
            .attr("font-size", "10px")
            .attr("fill", "#FFFFFF");
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .style("transform", "scale(1.25)")
            .style(
              "transform-origin",
              `${d.y + margin.left}px ${d.x + margin.top}px`,
            );
          setHoveredNode(d.data);
        })
        .on("mouseout", (event, d: any) => {
          d3.select(event.currentTarget)
            .select("circle")
            .transition()
            .duration(200)
            .attr("r", 5)
            .attr("stroke", "#070B14")
            .attr("stroke-width", 1.5);
          d3.select(event.currentTarget)
            .select("text")
            .transition()
            .duration(200)
            .attr("font-size", "8.5px")
            .attr("fill", "#94A3B8");
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .style("transform", "scale(1)")
            .style(
              "transform-origin",
              `${d.y + margin.left}px ${d.x + margin.top}px`,
            );
          setHoveredNode(null);
        });

      node
        .append("circle")
        .attr("r", 5)
        .attr("fill", (d) => (d.children ? "#3B82F6" : "#10B981"))
        .attr("stroke", "#070B14")
        .attr("stroke-width", 1.5);

      node
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.children ? -8 : 8))
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .attr("fill", "#94A3B8")
        .attr("font-size", "8.5px")
        .attr("font-family", "monospace")
        .attr("font-weight", "semibold")
        .text((d) => d.data.name);
    } else {
      // Sunburst view layout
      const radius = Math.min(width, height) / 2 - 20;
      const root = d3.hierarchy(rootData).sum((d) => d.value || 0);

      const partitionLayout = d3.partition().size([2 * Math.PI, radius]);
      partitionLayout(root);

      const arc = d3
        .arc()
        .startAngle((d: any) => d.x0)
        .endAngle((d: any) => d.x1)
        .innerRadius((d: any) => d.y0)
        .outerRadius((d: any) => d.y1);

      const colors = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EC4899",
        "#818CF8",
        "#A78BFA",
      ];

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      // Draw partition slices
      g.selectAll("path")
        .data(root.descendants().filter((d) => d.depth > 0))
        .enter()
        .append("path")
        .attr("d", arc as any)
        .attr("fill", (d: any) => colors[d.depth % colors.length])
        .attr("stroke", "#070B14")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .attr("class", "cursor-pointer")
        .on("mouseover", function (event, d: any) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 1)
            .attr("stroke", "#FFFFFF")
            .style("transform", "scale(1.05)")
            .style("transform-origin", "center");
          setHoveredNode(d.data);
        })
        .on("mouseout", function (event, d: any) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 0.8)
            .attr("stroke", "#070B14")
            .style("transform", "scale(1)")
            .style("transform-origin", "center");
          setHoveredNode(null);
        });

      // Draw center circle
      g.append("circle")
        .attr(
          "r",
          (root as typeof root & { y1: number }).y1 / root.height || 15,
        )
        .attr("fill", "#0F172A")
        .attr("stroke", "#22314D")
        .attr("stroke-width", 1.5);

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#3B82F6")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .text(selectedPartition.label);
    }
  }, [selectedPartition, viewMode]);

  return (
    <div className="bg-[#0B0F19] border border-[#22314D] p-4 rounded-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-2 min-h-[24px]">
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          {viewMode === "tree"
            ? "Tree: Directory Node-Link Structure"
            : "Sunburst: Radial File Proportional Area"}
        </span>
        {hoveredNode && (
          <div className="text-[10px] bg-slate-900/95 px-2 py-0.5 rounded border border-slate-700/50 flex items-center gap-2 animate-pulse font-mono">
            <span className="font-bold text-white">{hoveredNode.name}</span>
            {hoveredNode.files !== undefined && (
              <span className="text-emerald-400 font-bold">
                ({hoveredNode.files} files)
              </span>
            )}
            {hoveredNode.permission && (
              <span className="text-purple-400 font-semibold">
                {hoveredNode.permission}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-full h-[260px] flex items-center justify-center bg-[#070B14]/40 rounded-lg border border-slate-900">
        <svg ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

function FirmwarePartitions() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredPartition, setHoveredPartition] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedPartition, setSelectedPartition] = useState<any | null>(null);
  const [hierarchyViewMode, setHierarchyViewMode] = useState<
    "tree" | "sunburst"
  >("tree");

  // Interactive partition state simulation
  const encryptionStates: Record<string, "encrypted" | "decrypted"> = {};
  const [integrityCheckStates, setIntegrityCheckStates] = useState<
    Record<string, "idle" | "simulating" | "fixture_match">
  >({});

  const runIntegrityVerify = (subName: string) => {
    setIntegrityCheckStates((prev) => ({
      ...prev,
      [subName]: "simulating",
    }));
    setTimeout(() => {
      setIntegrityCheckStates((prev) => ({
        ...prev,
        [subName]: "fixture_match",
      }));
    }, 1200);
  };

  const generateAndDownloadJSONSummary = () => {
    if (!selectedPartition) return;
    const details =
      partitionDetails[selectedPartition.name as keyof typeof partitionDetails];
    const summary = {
      artifact_type: "ACING_IU_FIXTURE_PARTITION_SUMMARY",
      fixture_only: true,
      verified_device_evidence: false,
      disclaimer:
        "Simulator-generated fixture data. No device partition, encryption state, hash, or security integrity was read or verified.",
      fixture_partition: selectedPartition.name,
      fixture_label: selectedPartition.label,
      fixture_size_bytes: selectedPartition.size,
      fixture_sha256_example: selectedPartition.sha256,
      fixture_security_integrity_example:
        details?.permissionsStatus || "FIXTURE_NOT_AVAILABLE",
      fixture_total_files: details?.fileCount || 0,
      fixture_encryption_state: "NOT_READ_OR_VERIFIED",
      fixture_sub_partitions:
        details?.subPartitions.map((sub) => ({
          name: sub.name,
          permission: sub.permission,
          files: sub.files,
          context: sub.context,
          rebranding_target: sub.rebrandingTarget || null,
          details: sub.details,
          fixture_integrity_status:
            integrityCheckStates[sub.name] || "FIXTURE_NOT_CHECKED",
        })) || [],
    };

    const jsonString = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rootmaster_fixture_${selectedPartition.name.replace(".img", "")}_summary.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear current drawings

    const width = 600;
    const height = 80;

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const partitions = [
      {
        name: "system.img",
        label: "/system",
        size: 2900000000,
        percentage: 48.4,
        color: "#3B82F6",
        sha256:
          "d8f36c561b34c264a91aef037e93081e7f3c1b002cbf7170104a081cf13f8992",
      },
      {
        name: "product.img",
        label: "/product",
        size: 1500000000,
        percentage: 25.1,
        color: "#818CF8",
        sha256:
          "f12a441e976cb3deca5e03fe01b3a58e5cbfe0128c94faee600df81acbe753d0",
      },
      {
        name: "vendor.img",
        label: "/vendor",
        size: 1100000000,
        percentage: 18.4,
        color: "#A78BFA",
        sha256:
          "b32a4e5e4184c1737e91d5bc7ea46a9e102f92f2b3e47acdf981df983a54b38d",
      },
      {
        name: "odm.img",
        label: "/odm",
        size: 482000000,
        percentage: 8.1,
        color: "#64748B",
        sha256:
          "3c1a2c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      },
    ];

    const totalSize = d3.sum(partitions, (d) => d.size);

    // Compute starting x for each partition
    let currentX = 0;
    const dataWithCoords = partitions.map((p) => {
      const w = (p.size / totalSize) * width;
      const x = currentX;
      currentX += w;
      return { ...p, x, w };
    });

    // Draw blocks
    const g = svg
      .selectAll("g")
      .data(dataWithCoords)
      .enter()
      .append("g")
      .attr("class", "partition-block cursor-pointer")
      .on("mouseover", (event, d) => {
        setHoveredPartition(d);
        d3.select(event.currentTarget)
          .select("rect")
          .attr("opacity", 0.85)
          .attr("stroke", "#FFFFFF")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (event) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltipPos({ x, y: y + 10 });
      })
      .on("mouseout", (event, d) => {
        setHoveredPartition(null);
        d3.select(event.currentTarget)
          .select("rect")
          .attr("opacity", 1)
          .attr("stroke", "none");
      })
      .on("click", (event, d) => {
        setSelectedPartition(d);
      });

    g.append("rect")
      .attr("x", (d) => d.x)
      .attr("y", 10)
      .attr("width", (d) => d.w - 2) // slight spacing between blocks
      .attr("height", 60)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", (d) => d.color);

    // Add labels
    g.append("text")
      .attr("x", (d) => d.x + d.w / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#FFFFFF")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d) => d.label);

    g.append("text")
      .attr("x", (d) => d.x + d.w / 2)
      .attr("y", 55)
      .attr("text-anchor", "middle")
      .attr("fill", "#E2E8F0")
      .attr("font-size", "8.5px")
      .text((d) => `${d.percentage}%`);
  }, []);

  return (
    <div className="relative border border-[#22314D] bg-[#070B14] p-4 rounded-xl mt-4">
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[10px] leading-relaxed text-amber-200">
        Simulator only: partition details, hashes, and integrity results are
        fixture data. This interface does not read, verify, unlock, flash, or
        otherwise modify a connected device.
      </div>
      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3">
        super.img Partition Byte-Size Distribution (D3.js Visualization)
      </h4>
      <div className="relative w-full h-24">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Tooltip Overlay */}
        {hoveredPartition && (
          <div
            className="absolute z-50 bg-[#0B0F19] border border-[#22314D] p-3 rounded-lg text-[10px] font-mono shadow-2xl space-y-1 pointer-events-none text-left max-w-xs"
            style={{
              left: `${Math.min(tooltipPos.x, 340)}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className="font-bold text-white uppercase flex justify-between gap-4">
              <span>{hoveredPartition.name}</span>
              <span style={{ color: hoveredPartition.color }}>
                {hoveredPartition.percentage}%
              </span>
            </div>
            <div className="text-slate-400">
              Byte Size: {hoveredPartition.size.toLocaleString()} bytes
            </div>
            <div className="text-[10px] text-indigo-400 font-semibold animate-pulse mt-0.5">
              Click block to open deconstruction details
            </div>
            <div className="text-purple-400 break-all leading-normal">
              SHA-256:
              <br />
              <span className="text-[9px] text-slate-300">
                {hoveredPartition.sha256}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay for Partition Details */}
      {selectedPartition && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPartition(null)}
        >
          <div
            className="bg-[#070B14] border border-[#22314D] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#22314D] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedPartition.color }}
                  />
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    {selectedPartition.name} Deconstruction details
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamic partition mount point:{" "}
                  <code className="text-blue-400 font-mono font-semibold">
                    {selectedPartition.label}
                  </code>
                </p>
              </div>
              <button
                onClick={() => setSelectedPartition(null)}
                className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition-all"
              >
                X
              </button>
            </div>

            {/* General Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0B0F19] border border-[#22314D] p-3 rounded-xl">
                <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block">
                  Total Bytes
                </span>
                <span className="text-xs font-bold text-white font-mono block mt-1">
                  {selectedPartition.size.toLocaleString()} B
                </span>
              </div>
              <div className="bg-[#0B0F19] border border-[#22314D] p-3 rounded-xl">
                <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block">
                  Total File Count
                </span>
                <span className="text-xs font-bold text-white font-mono block mt-1">
                  {partitionDetails[
                    selectedPartition.name as keyof typeof partitionDetails
                  ]?.fileCount.toLocaleString() || "N/A"}
                </span>
              </div>
              <div className="bg-[#0B0F19] border border-[#22314D] p-3 rounded-xl">
                <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block">
                  Security Integrity
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono block mt-1">
                  {partitionDetails[
                    selectedPartition.name as keyof typeof partitionDetails
                  ]?.permissionsStatus || "N/A"}
                </span>
              </div>
              <div className="bg-[#0B0F19] border border-[#22314D] p-3 rounded-xl">
                <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block">
                  SHA-256 Hash
                </span>
                <span
                  className="text-[9px] font-bold text-indigo-400 font-mono truncate block mt-1"
                  title={selectedPartition.sha256}
                >
                  {selectedPartition.sha256.substring(0, 10)}...
                </span>
              </div>
            </div>

            {/* Encryption Simulation Toggle */}
            {(() => {
              const isEncrypted =
                encryptionStates[selectedPartition.name] !== "decrypted";
              return (
                <div className="bg-[#0B0F19] border border-[#22314D] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0B0F19] to-[#0d162d]/40">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isEncrypted ? "bg-emerald-950/40 text-emerald-400" : "bg-amber-950/40 text-amber-500"}`}
                    >
                      {isEncrypted ? (
                        <Lock className="h-4.5 w-4.5 animate-pulse" />
                      ) : (
                        <Unlock className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">
                        Partition Encryption State
                      </span>
                      <span
                        className="text-xs font-bold font-mono block text-amber-400"
                      >
                        Fixture encryption state — no device state read
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Device encryption operations are unavailable in this simulator"
                    className="px-3.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1.5 border bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed"
                  >
                    Unavailable — Fixture Only
                  </button>
                </div>
              );
            })()}

            {/* Interactive D3 hierarchy visualization & View Mode Toggle */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  D3.js Directory Hierarchy Visualizer
                </h4>
                <div className="flex gap-1 bg-[#0F172A] p-0.5 border border-[#22314D] rounded-lg">
                  <button
                    onClick={() => setHierarchyViewMode("tree")}
                    className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-md transition-all ${hierarchyViewMode === "tree" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                  >
                    Tree View
                  </button>
                  <button
                    onClick={() => setHierarchyViewMode("sunburst")}
                    className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-md transition-all ${hierarchyViewMode === "sunburst" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                  >
                    Sunburst Chart
                  </button>
                </div>
              </div>

              {/* Render dynamic D3 component */}
              <PartitionHierarchyD3
                selectedPartition={selectedPartition}
                viewMode={hierarchyViewMode}
              />
            </div>

            {/* Sub-partition list */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Sub-Partition Components & File Permissions
              </h4>
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                {partitionDetails[
                  selectedPartition.name as keyof typeof partitionDetails
                ]?.subPartitions.map((sub, idx) => {
                  const isEncrypted =
                    encryptionStates[selectedPartition.name] !== "decrypted";
                  return (
                    <div
                      key={idx}
                      className="bg-[#0B0F19] border border-[#22314D] p-4 rounded-xl space-y-2 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-blue-950/40 pb-1.5">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-semibold">
                          {/* Integrity Verify Button */}
                          {integrityCheckStates[sub.name] === "simulating" ? (
                            <span className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                              Simulating Fixture Check...
                            </span>
                          ) : integrityCheckStates[sub.name] ===
                            "fixture_match" ? (
                            <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Fixture Hash Match
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                runIntegrityVerify(sub.name);
                              }}
                              className="bg-slate-900 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 px-2 py-0.5 rounded-md transition-all uppercase text-[8px] font-extrabold flex items-center gap-1"
                            >
                              <span>Simulate Hash Check</span>
                            </button>
                          )}

                          <span className="bg-purple-950/30 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md">
                            Perms: {sub.permission}
                          </span>
                          <span className="bg-blue-950/30 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md">
                            Files: {sub.files}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] leading-relaxed">
                        <div>
                          <span className="text-slate-500 font-bold block uppercase text-[8px]">
                            SELinux Security Context
                          </span>
                          <code className="text-pink-400 bg-pink-950/10 px-1 py-0.5 rounded border border-pink-500/10 text-[9px] font-mono break-all inline-block mt-0.5">
                            {sub.context}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block uppercase text-[8px]">
                            Encryption Context
                          </span>
                          <code
                            className={`px-1 py-0.5 rounded border text-[9px] font-mono break-all inline-block mt-0.5 ${
                              isEncrypted
                                ? "text-indigo-400 bg-indigo-950/10 border-indigo-500/10"
                                : "text-yellow-400 bg-yellow-950/10 border-yellow-500/10"
                            }`}
                          >
                            {isEncrypted
                              ? "aes-256-xts:fbe_policy"
                              : "decrypted_raw_inodes"}
                          </code>
                        </div>
                        {sub.rebrandingTarget ? (
                          <div>
                            <span className="text-slate-500 font-bold block uppercase text-[8px]">
                              Rebranding Component
                            </span>
                            <span className="text-emerald-400 font-bold block mt-0.5">
                              {sub.rebrandingTarget}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-500 font-bold block uppercase text-[8px]">
                              Hash Integrity Status
                            </span>
                            {integrityCheckStates[sub.name] ===
                            "fixture_match" ? (
                              <span className="text-emerald-400 font-bold block mt-0.5 font-mono text-[9px]">
                                FIXTURE MATCH (Not Device Verified)
                              </span>
                            ) : integrityCheckStates[sub.name] ===
                              "simulating" ? (
                              <span className="text-indigo-400 font-semibold block mt-0.5 font-mono text-[9px] animate-pulse">
                                Simulating fixture comparison...
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium block mt-0.5 font-mono text-[9px]">
                                Hash check pending
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-[10.5px] text-slate-400 leading-normal pt-1 border-t border-slate-900">
                        {sub.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2 border-t border-[#22314D]">
              <button
                onClick={generateAndDownloadJSONSummary}
                className="w-full sm:w-auto px-4 py-2 text-xs font-extrabold uppercase rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 border border-blue-400/30"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Metadata Summary JSON</span>
              </button>
              <button
                onClick={() => setSelectedPartition(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all"
              >
                Close Deconstruction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RootMasterLab() {
  // Master 100+ task backlog items structured from past sessions, S25 Ultra firmware parameters, and dynamic debugging.
  const defaultTasks: Task[] = useMemo(
    () => [
      // MODULE 7: DISSECTION & STORAGE OPTIMIZATION
      {
        id: "RM-DIS-01",
        module: "Dissection & Storage",
        title: "Extract S25 Ultra Stock2026_05_04.rar firmware archive",
        desc: "Verify RAR integrity and extract baseline AP, BL, CP, CSC tar packages.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DIS-02",
        module: "Dissection & Storage",
        title: "Extract super.img dynamic partition from AP tar.md5",
        desc: "Utilize simg2img tool to convert sparse system imagery into raw mountable ext4 images.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DIS-03",
        module: "Dissection & Storage",
        title: "Unzip and analyze IML TOOL PRO FREE repair suite",
        desc: "Identify system drivers, DLL payloads, and flash command endpoints.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DIS-04",
        module: "Dissection & Storage",
        title: "Parse firmware partition schema via IML dynamic reader",
        desc: "Map logical blocks for system, vendor, odm, product, and boot partitions.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DIS-05",
        module: "Dissection & Storage",
        title: "Clear Android device internal storage using ADB shell",
        desc: "Run logcat clear, purge /data/cache, and clean old log files to make room for 17GB stock file operations.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-DIS-06",
        module: "Dissection & Storage",
        title: "Verify boot.img kernel signature & headers",
        desc: "Analyze S938U boot image header version 4, extracting dtb (device tree blob) and ramdisk.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DIS-07",
        module: "Dissection & Storage",
        title: "Decompile bootloader BL_S938USQS3CXH2 trustlets",
        desc: "Analyze Secure World TA (Trusted Applications) binaries managing Knox Vault keys.",
        priority: "Low",
        status: "Pending",
      },
      {
        id: "RM-DIS-08",
        module: "Dissection & Storage",
        title: "Mount product.img and customize app overlays",
        desc: "Identify bloating carrier apk lists and verify where overlay packages reside.",
        priority: "Medium",
        status: "Pending",
      },

      // MODULE 1: EXECUTIVE DASHBOARD
      {
        id: "RM-DASH-01",
        module: "Executive Dashboard",
        title: "Build Project Lifecycle visual progress widgets",
        desc: "Design clean Material 3 linear telemetry meters tracking overall MVP milestone states.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DASH-02",
        module: "Executive Dashboard",
        title: "Implement dynamic AI Diagnostic status indicators",
        desc: "Add glowing widgets flashing real-time state changes for local neural firmware sweeps.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-DASH-03",
        module: "Executive Dashboard",
        title: "Create interactive Gantt timeline grid component",
        desc: "Visualize 3-year development plan containing critical path milestones.",
        priority: "Low",
        status: "Pending",
      },
      {
        id: "RM-DASH-04",
        module: "Executive Dashboard",
        title: "Integrate active device trust score matrix stats",
        desc: "Show distribution of client integrity values across current active fleet.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-DASH-05",
        module: "Executive Dashboard",
        title: "Add real-time workspace threat feeds panel",
        desc: "Display audit trail alarms on the dashboard with responsive flash animation.",
        priority: "High",
        status: "Pending",
      },

      // MODULE 2: DEVICE INVENTORY
      {
        id: "RM-DEV-01",
        module: "Device Inventory",
        title: "Design Samsung Galaxy S25 Ultra (SM-S938U) profile specs",
        desc: "Map critical attributes: Snapdragon 8 Elite SoC, Knox version 3.10, eSIM profile metadata.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DEV-02",
        module: "Device Inventory",
        title: "Configure Knox e-fuse hardware warranty tracker",
        desc: "Read Knox status register. If 0x1 (warranty void), instantly update compliance to QUARANTINED.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DEV-03",
        module: "Device Inventory",
        title: "Verify Verizon custom radio frequency standard parameters",
        desc: "Integrate RF diagnostics for LTE/5G bands (B13, B66, n2, n5, n77) matching CTIA limits.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-DEV-04",
        module: "Device Inventory",
        title: "Implement system-wide Quarantine isolation workflows",
        desc: "Allow admins to click isolation action, instantly severing tokens for substandard client states.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DEV-05",
        module: "Device Inventory",
        title: "Build dynamic device health telemetry list",
        desc: "Expose CPU temperature, battery health cycle count, and RAM headroom statistics.",
        priority: "Low",
        status: "Pending",
      },

      // MODULE 3: FIRMWARE RESEARCH CENTER
      {
        id: "RM-FIRM-01",
        module: "Firmware Research",
        title: "Map system.img file-system and verify SHA-256 hashes",
        desc: "Extract block-level checksums from stock partition images, comparing against VRU3CXH2 baseline.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-FIRM-02",
        module: "Firmware Research",
        title: "Create side-by-side firmware comparison workspace",
        desc: "Build comparative UI comparing system headers, kernel build numbers, and security patches.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-FIRM-03",
        module: "Firmware Research",
        title: "Develop delta-OTA update analyzer",
        desc: "Parse binary diffs inside Verizon OTA payloads to track changes in driver layouts.",
        priority: "Low",
        status: "Pending",
      },
      {
        id: "RM-FIRM-04",
        module: "Firmware Research",
        title: "Map SELinux rule compiler and check context bounds",
        desc: "Scan sepolicy binaries in vendor partition to search for permissive rules or context loopholes.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-FIRM-05",
        module: "Firmware Research",
        title: "Document RKP (Real-time Kernel Protection) hooks",
        desc: "Trace RKP hypervisor intercepts designed to block credential modifications in memory.",
        priority: "Medium",
        status: "Pending",
      },

      // MODULE 4: AI ASSISTANT WORKSPACE
      {
        id: "RM-AI-01",
        module: "AI Operations & Logs",
        title: "Build local firmware analysis prompt compiler",
        desc: "Create specialized prompt constructors instructing Gemini to dissect system crash dumps.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-AI-02",
        module: "AI Operations & Logs",
        title: "Design live Logcat parser with classification neural maps",
        desc: "Classify incoming log streams into INFO, DEBUG, WARNING, and CRITICAL_KNOX buckets.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-AI-03",
        module: "AI Operations & Logs",
        title: "Develop automatic script generator for Magisk injection",
        desc: "Generate custom post-fs-data shell scripts targeting modular system mounting.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-AI-04",
        module: "AI Operations & Logs",
        title: "Implement offline intelligence troubleshooting wiki",
        desc: "Cache detailed knowledge base containing common recovery loop resolutions.",
        priority: "Low",
        status: "Pending",
      },

      // MODULE 5: ROOTMASTEROS DESIGN LAB
      {
        id: "RM-DSN-01",
        module: "RootMasterOS Design Lab",
        title: "Apply One UI 8.1 geometric spacing system",
        desc: "Style interface elements utilizing the 40-60 reachability rule and rounded 28dp card models.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DSN-02",
        module: "RootMasterOS Design Lab",
        title: "Build interactive Quick Settings toggles constructor",
        desc: "Allow dragging, dropping, and configuring system buttons for Wi-Fi, Root Mode, and Safe Vault.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-DSN-03",
        module: "RootMasterOS Design Lab",
        title: "Configure AMOLED-friendly pure black theme stylesheet",
        desc: "Establish contrast bounds using background hex #000000 paired with vibrant blue #1A73FF.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-DSN-04",
        module: "RootMasterOS Design Lab",
        title: "Simulate custom Boot Animation designer",
        desc: "Upload PNG arrays to render a frame-by-frame loop representing Knox matrix boot streams.",
        priority: "Low",
        status: "Pending",
      },

      // MODULE 6: TESTING & COMPLIANCE
      {
        id: "RM-TEST-01",
        module: "Testing & Compliance",
        title: "Draft CTIA 3.8.2 RF Signal compliance reports",
        desc: "Generate official compliance records certifying total radiated power limits are achieved.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-TEST-02",
        module: "Testing & Compliance",
        title: "Develop automated system-test plan execution scheduler",
        desc: "Trigger dynamic verification lists evaluating API latency and biometric validation bounds.",
        priority: "Medium",
        status: "Pending",
      },
      {
        id: "RM-TEST-03",
        module: "Testing & Compliance",
        title: "Build immutable blockchain audit trail logging queue",
        desc: "Write cryptographically signed actions to local auditing tables for unalterable records.",
        priority: "High",
        status: "Pending",
      },
      {
        id: "RM-TEST-04",
        module: "Testing & Compliance",
        title: "Integrate dynamic PDF report print export with Security Seal",
        desc: "Ensure PDF reports dynamically overlay custom SVG Knox certified verification insignias.",
        priority: "High",
        status: "Pending",
      },
    ],
    [],
  );

  // Load state from localStorage or default
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeModule, setActiveModule] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"Priority" | "Status" | "None">("None");

  useEffect(() => {
    const savedSort = localStorage.getItem("rootmaster_sort");
    if (
      savedSort === "Priority" ||
      savedSort === "Status" ||
      savedSort === "None"
    ) {
      setSortBy(savedSort as any);
    }
  }, []);

  const handleSortChange = (newSort: "Priority" | "Status" | "None") => {
    setSortBy(newSort);
    localStorage.setItem("rootmaster_sort", newSort);
  };

  // Custom task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newModule, setNewModule] = useState("Dissection & Storage");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">(
    "Medium",
  );

  // Navigation Tabs inside RootMaster Lab
  const [activeTab, setActiveTab] = useState<
    "backlog" | "os-builder" | "dissection" | "storage" | "manual"
  >("os-builder");

  // OS Builder State Variables
  const [selectedZipFiles, setSelectedZipFiles] = useState({
    rootmaster: true,
    allinone: true,
    download: true,
  });
  const [isBuildingOS, setIsBuildingOS] = useState(false);
  const [osBuildProgress, setOsBuildProgress] = useState(0);
  const [osBuildLogs, setOsBuildLogs] = useState<string[]>([]);
  const [osBuildStepName, setOsBuildStepName] = useState("Idle");
  const [isoResultReady, setIsoResultReady] = useState(false);
  const buildTerminalEndRef = useRef<HTMLDivElement>(null);
  const [sandboxSize, setSandboxSize] = useState<number>(12);
  const [isResizingSandbox, setIsResizingSandbox] = useState<boolean>(false);

  // Firmware Dissection States
  const [selectedFirmwarePart, setSelectedFirmwarePart] = useState<
    "AP" | "BL" | "CP" | "CSC" | null
  >("AP");
  const [isDissecting, setIsDissecting] = useState(false);
  const [dissectProgress, setDissectProgress] = useState(0);
  const [dissectLogs, setDissectLogs] = useState<string[]>([]);
  const [superImageUnpacked, setSuperImageUnpacked] = useState(false);
  const dissectTerminalEndRef = useRef<HTMLDivElement>(null);

  // Storage Optimizer States
  const [adbConnected, setAdbConnected] = useState(true);
  const storageStats = {
    total: 512,
    used: 489.2,
    free: 22.8,
    trashCaches: 18.4,
    tempLogs: 3.1,
  };
  const storageLogs: string[] = [];
  const storageTerminalEndRef = useRef<HTMLDivElement>(null);

  // General UI state
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [successfulBuilds, setSuccessfulBuilds] = useState<any[]>(
    initialBuildLogsHistory,
  );

  // Integrity Check Simulation State
  const [integrityScanProgress, setIntegrityScanProgress] = useState(0);
  const [integrityScanActive, setIntegrityScanActive] = useState(false);
  const [currentScanningFile, setCurrentScanningFile] = useState<string>("");
  const [scannedFiles, setScannedFiles] = useState<
    Array<{
      partition: string;
      filepath: string;
      status: "fixture_match" | "fixture_mismatch" | "pending";
    }>
  >([
    { partition: "/system", filepath: "system/bin/init", status: "pending" },
    {
      partition: "/system",
      filepath: "system/lib64/libart.so",
      status: "pending",
    },
    { partition: "/system", filepath: "system/etc/hosts", status: "pending" },
    {
      partition: "/system",
      filepath: "system/framework/services.jar",
      status: "pending",
    },
    { partition: "/system", filepath: "system/etc/init.rc", status: "pending" },
    {
      partition: "/system",
      filepath: "system/bin/app_process64",
      status: "pending",
    },
    {
      partition: "/system",
      filepath: "system/framework/framework-res.apk",
      status: "pending",
    },
    {
      partition: "/system",
      filepath: "system/priv-app/SystemUI/SystemUI.apk",
      status: "pending",
    },
    {
      partition: "/system",
      filepath: "system/lib64/libc.so",
      status: "pending",
    },
    {
      partition: "/system",
      filepath: "system/etc/permissions/platform.xml",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/bin/hw/camera.service",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/lib/libunwind.so",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/etc/selinux/nonplat_sepolicy.cil",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/bin/hw/android.hardware.graphics.allocator@4.0-service",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/etc/init/hw/init.target.rc",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/firmware/keymaster.b01",
      status: "pending",
    },
    {
      partition: "/vendor",
      filepath: "vendor/manifest.xml",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/app/PrebuiltGmail.apk",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/overlay/NoOverlays.apk",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/etc/sysconfig/com.android.hotspot2.xml",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/media/bootanimation.zip",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/framework/product-framework.jar",
      status: "pending",
    },
    {
      partition: "/product",
      filepath: "product/priv-app/CarrierConfig/CarrierConfig.apk",
      status: "pending",
    },
    {
      partition: "/odm",
      filepath: "odm/etc/wifi/nvram.txt",
      status: "pending",
    },
    {
      partition: "/odm",
      filepath: "odm/lib64/libodm_hardware.so",
      status: "pending",
    },
    {
      partition: "/odm",
      filepath: "odm/etc/permissions/sku_vendor.xml",
      status: "pending",
    },
    { partition: "/odm", filepath: "odm/firmware/adsp.mdt", status: "pending" },
    {
      partition: "/odm",
      filepath: "odm/bin/hw/vendor.samsung.hardware.security.vault@1.0-service",
      status: "pending",
    },
  ]);

  const startIntegrityScan = () => {
    if (integrityScanActive) return;
    setIntegrityScanActive(true);
    setIntegrityScanProgress(0);
    setScannedFiles((prev) => prev.map((f) => ({ ...f, status: "pending" })));

    let currentIdx = 0;
    const fileCount = 28; // scannedFiles.length

    const interval = setInterval(() => {
      if (currentIdx < fileCount) {
        setScannedFiles((prev) => {
          const updated = [...prev];
          const file = updated[currentIdx];
          const finalStatus =
            file.filepath === "system/framework/services.jar" ||
            file.filepath === "vendor/etc/selinux/nonplat_sepolicy.cil"
              ? "fixture_mismatch"
              : "fixture_match";
          updated[currentIdx] = { ...file, status: finalStatus };
          setCurrentScanningFile(`${file.partition} -> ${file.filepath}`);
          return updated;
        });
        currentIdx++;
        setIntegrityScanProgress(Math.round((currentIdx / fileCount) * 100));
      } else {
        clearInterval(interval);
        setIntegrityScanActive(false);
        setCurrentScanningFile("Fixture Simulation Completed!");
        triggerNotification(
          "Partition fixture simulation complete. Example mismatches were generated; no payloads were inspected.",
        );
      }
    }, 180);
  };

  const handleSandboxResize = (val: number) => {
    setSandboxSize(val);
    setIsResizingSandbox(true);
  };

  useEffect(() => {
    if (isResizingSandbox) {
      const timer = setTimeout(() => {
        setIsResizingSandbox(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isResizingSandbox]);

  // Initialize Tasks
  useEffect(() => {
    const saved = localStorage.getItem("rootmaster_backlog");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, [defaultTasks]);

  // Save on state change
  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("rootmaster_backlog", JSON.stringify(updated));
  };

  // Toggle task status
  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus: "Pending" | "In Progress" | "Completed" =
          t.status === "Pending"
            ? "In Progress"
            : t.status === "In Progress"
              ? "Completed"
              : "Pending";

        triggerNotification(`Task ${t.id} set to ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    triggerNotification(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Delete task
  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    triggerNotification(`Task ${id} deleted.`);
  };

  // Reset to default
  const resetToDefault = () => {
    if (
      confirm(
        "Are you sure you want to restore the master task backlog? This will overwrite your current progress.",
      )
    ) {
      saveTasks(defaultTasks);
      triggerNotification("Master Backlog Restored");
    }
  };

  // Add custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `RM-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      module: newModule,
      title: newTitle,
      desc: newDesc || "No description provided.",
      priority: newPriority,
      status: "Pending",
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setNewTitle("");
    setNewDesc("");
    triggerNotification("Custom Task Added Successfully");
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesModule = activeModule === "All" || t.module === activeModule;
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesStatus && matchesSearch;
  });

  const priorityWeights = { High: 3, Medium: 2, Low: 1 };
  const statusWeights = { Pending: 3, "In Progress": 2, Completed: 1 };

  const filteredAndSortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Priority") {
      return (
        (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
      );
    }
    if (sortBy === "Status") {
      return (statusWeights[b.status] || 0) - (statusWeights[a.status] || 0);
    }
    return 0;
  });

  // Calculate statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const moduleCounts = tasks.reduce((acc: { [key: string]: number }, t) => {
    acc[t.module] = (acc[t.module] || 0) + 1;
    return acc;
  }, {});

  const modulesList = [
    "All",
    "Dissection & Storage",
    "Executive Dashboard",
    "Device Inventory",
    "Firmware Research",
    "AI Operations & Logs",
    "RootMasterOS Design Lab",
    "Testing & Compliance",
  ];

  // Auto Scroll Terminal Logs
  useEffect(() => {
    if (buildTerminalEndRef.current) {
      buildTerminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [osBuildLogs]);

  useEffect(() => {
    if (dissectTerminalEndRef.current) {
      dissectTerminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [dissectLogs]);

  useEffect(() => {
    if (storageTerminalEndRef.current) {
      storageTerminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [storageLogs]);

  // LIVE OS BUILD PIPELINE SIMULATION
  const runOSBuildAssembly = () => {
    if (isBuildingOS) return;

    // Check if zip dependencies are ready
    if (
      !selectedZipFiles.rootmaster ||
      !selectedZipFiles.allinone ||
      !selectedZipFiles.download
    ) {
      triggerNotification(
        "Error: You must check and verify all three ZIP archives first.",
      );
      return;
    }

    setIsBuildingOS(true);
    setIsoResultReady(false);
    setOsBuildProgress(0);
    setOsBuildLogs([]);

    const logs = [
      "Initializing RootMasterOS Bootable OS Builder Environment...",
      `[SANDBOX] Resizing isolated compile workspace to selected ${sandboxSize} GB boundary...`,
      `[SANDBOX] Successfully allocated ${sandboxSize} GB loopback RAMDisk mount.`,
      "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
      "[SYSTEM] Verifying build dependencies inside sandbox...",
      "  - debootstrap: INSTALLED",
      "  - squashfs-tools: INSTALLED",
      "  - xorriso: INSTALLED",
      "  - grub-pc-bin: INSTALLED",
      "  - mtools: INSTALLED",
      "  - nodejs (v18.19.0): INSTALLED",
      "  - npm (v10.2.3): INSTALLED",
      "[SYSTEM] Dependencies successfully attested inside resized sandbox. Proceeding to File Extraction...",
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setOsBuildLogs((prev) => [...prev, logs[logIndex]]);
        setOsBuildProgress(Math.min(10, (logIndex + 1) * 2));
        logIndex++;
      } else {
        clearInterval(interval);
        runStage1();
      }
    }, 400);

    // Stage 1: Unzip and Merge
    const runStage1 = () => {
      setOsBuildStepName("ZIP Extraction & Merging");
      const s1Logs = [
        " ",
        "=================================================================",
        "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
        "=================================================================",
        "[FS] Extracting RootMasterOS.zip (Base System) to ./rootmaster...",
        "  - Extracted: ./rootmaster/backend/ (14 source controllers, server.js)",
        "  - Extracted: ./rootmaster/frontend/ (Next.js layout, components, Tailwind layout)",
        "  - Extracted: ./rootmaster/modules/ (Syscore hooks, DB connections)",
        "[FS] Extracting All-in-One.zip (Web UI apps) to ./allinone...",
        "  - Extracted: dashboard.html, dynamic_charts.js, process_logger.js, compliance_checker.node",
        "[FS] Merging All-in-One apps into RootMasterOS UI layer...",
        "  - Command: cp -r temp_all/* rootmaster/frontend/apps/",
        "  - Success: App directory populated! Dynamic dashboard charts integrated.",
        "[FS] Extracting Download.zip (Android Knox Magisk toolset) to ./androidmod...",
        "  - Extracted: rootmaster_oneux/module.prop, post-fs-data.sh, service.sh, system.prop",
        "[FS] Merging Magisk module binder into /modules/android...",
        "  - Command: mkdir -p rootmaster/modules/android/bindhosts",
        "  - Command: cp -r temp_android/* rootmaster/modules/android/bindhosts/",
        "  - Success: Integrated RootMaster OneUX Knox bindhost modules into persistent cache.",
      ];

      let index = 0;
      const s1Interval = setInterval(() => {
        if (index < s1Logs.length) {
          setOsBuildLogs((prev) => [...prev, s1Logs[index]]);
          setOsBuildProgress(10 + Math.round((index + 1) * 1.5));
          index++;
        } else {
          clearInterval(s1Interval);
          runStage2();
        }
      }, 350);
    };

    // Stage 2: Debootstrap minimal system
    const runStage2 = () => {
      setOsBuildStepName("Ubuntu Debootstrap Installation");
      const s2Logs = [
        " ",
        "=================================================================",
        "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
        "=================================================================",
        "[BOOSTRAP] Executing: sudo debootstrap jammy rootfs http://archive.ubuntu.com/ubuntu/",
        "  - Downloading Packages: gnupg, gpgv, libgmp10, libnettle8, libc-bin, systemd...",
        "  - Resolving package dependency graph...",
        "  - Extracting core system binaries: tar, gzip, bash, apt, dpkg...",
        "  - Configuring basic networking, loopback interfaces, and nameservers...",
        "  - Attesting root password hashes & generating default shadow entries...",
        "  - Success: Minimal rootfs directory structure successfully assembled in ./rootfs",
      ];

      let index = 0;
      const s2Interval = setInterval(() => {
        if (index < s2Logs.length) {
          setOsBuildLogs((prev) => [...prev, s2Logs[index]]);
          setOsBuildProgress(40 + Math.round((index + 1) * 2.2));
          index++;
        } else {
          clearInterval(s2Interval);
          runStage3();
        }
      }, 400);
    };

    // Stage 3: Injecting OS UI, Node, and Auto Start
    const runStage3 = () => {
      setOsBuildStepName("Chroot Injection & Autostart Configurations");
      const s3Logs = [
        " ",
        "=================================================================",
        "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
        "=================================================================",
        "[INJECT] Writing RootMasterOS workspace into rootfs storage space...",
        "  - Command: sudo mkdir -p rootfs/opt/rootmaster",
        "  - Command: sudo cp -r rootmaster/* rootfs/opt/rootmaster/",
        "[CHROOT] Entering chroot environment to configure runtime drivers...",
        "  - Command: sudo chroot rootfs apt-get update",
        "  - Command: sudo chroot rootfs apt-get install -y nodejs npm xfce4 xfce4-terminal xserver-xorg xinit",
        "[STARTUP] Building /usr/bin/start-os launching script inside rootfs...",
        "  - Target file: rootfs/usr/bin/start-os",
        "  - Injected startup routines:",
        "      #!/bin/bash",
        "      echo '=== Launching RootMaster OS Core Engine ==='",
        "      cd /opt/rootmaster",
        "      node backend/server.js &",
        "      npm --prefix frontend start",
        "  - Set execution permissions: chmod +x rootfs/usr/bin/start-os",
        "[SHELL] Adjusting system default boot behaviors...",
        "  - Appending `/usr/bin/start-os` to rootfs/etc/profile login actions.",
        "  - Configuring autologin for system operator on tty1.",
      ];

      let index = 0;
      const s3Interval = setInterval(() => {
        if (index < s3Logs.length) {
          setOsBuildLogs((prev) => [...prev, s3Logs[index]]);
          setOsBuildProgress(65 + Math.round((index + 1) * 1.5));
          index++;
        } else {
          clearInterval(s3Interval);
          runStage4();
        }
      }, 350);
    };

    // Stage 4: GRUB Setup, SquashFS, and ISO compilation
    const runStage4 = () => {
      setOsBuildStepName("SquashFS Compression & GRUB ISO Packaging");
      const s4Logs = [
        " ",
        "=================================================================",
        "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
        "=================================================================",
        "[KERNEL] Extracting boot kernel components to ISO payload mapping...",
        "  - Copied Kernel: rootfs/boot/vmlinuz-6.8.0 -> iso/boot/vmlinuz",
        "  - Copied RAMDisk: rootfs/boot/initrd.img-6.8.0 -> iso/boot/initrd",
        "[GRUB] Constructing boot configuration settings...",
        "  - Target file: iso/boot/grub/grub.cfg",
        "  - Injected configuration schema:",
        "      set timeout=5",
        '      menuentry "RootMasterOS Bootable Distro (S25 Ultra Admin Tool)" {',
        "          linux /boot/vmlinuz boot=live quiet splash loglevel=3",
        "          initrd /boot/initrd",
        "      }",
        "[SQUASH] Compressing Linux base directory tree into high-density SquashFS container...",
        "  - Command: mksquashfs rootfs iso/filesystem.squashfs -e boot -comp xz",
        "  - Compression ratio: 4.8:1 - Reduced 2.8GB system workspace into 582MB SquashFS image.",
        "[COMPILE] Packaging directory payload into secure hybrid bootable ISO with xorriso...",
        "  - Command: grub-mkrescue -o RootMasterOS.iso iso/",
        "  - Adding isolinux, UEFI compatibility blocks, and El Torito boot images...",
        "  - Catalog file created. Root boot headers fully initialized.",
        " ",
        "=================================================================",
        "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED",
        "=================================================================",
        "* ISO NAME: RootMasterOS.iso",
        "* SIZE: 642 MB",
        "* SHA-256 HASH: a510f92b7c43df1290e21a81232ff4cd9481977e201bcf5a2de2cfc19929831c",
        "* STATUS: Ready to flash to USB or mount inside VirtualBox VM!",
      ];

      let index = 0;
      const s4Interval = setInterval(() => {
        if (index < s4Logs.length) {
          setOsBuildLogs((prev) => [...prev, s4Logs[index]]);
          setOsBuildProgress(80 + Math.round((index + 1) * 1.0));
          index++;
        } else {
          clearInterval(s4Interval);
          setIsBuildingOS(false);
          setOsBuildStepName("Successful Execution");
          setIsoResultReady(true);
          triggerNotification(
            "RootMasterOS bootable ISO successfully compiled!",
          );

          setSuccessfulBuilds((prev) => {
            const nextId = `Build #${prev.length + 1}`;
            const newBuildLogs = [
              "Initializing RootMasterOS Bootable OS Builder Environment...",
              "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
              "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
              "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
              "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
              "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
              "  - Compression ratio: 4.8:1 - Reduced 2.8GB system workspace into 582MB SquashFS image.",
              "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED (" +
                nextId +
                ")",
              "* ISO NAME: RootMasterOS_" +
                nextId.replace(" ", "_").toLowerCase() +
                ".iso",
              "* SIZE: 642 MB",
              "* STATUS: Ready to flash",
            ];
            return [
              ...prev,
              {
                id: nextId,
                filename: `build_${prev.length + 1}_log.txt`,
                size: 642,
                duration: 172,
                ratio: 4.8,
                logs: newBuildLogs,
              },
            ];
          });
        }
      }, 300);
    };
  };

  const exportLogHistoryZip = () => {
    const files = successfulBuilds.map((b) => ({
      filename: b.filename,
      content: b.logs.join("\n"),
    }));

    try {
      const blob = getMultiFileZipBlob(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rootmaster_log_history.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification(
        `All ${successfulBuilds.length} build logs exported as ZIP successfully!`,
      );
    } catch (error) {
      console.error(error);
      triggerNotification("Failed to export log history ZIP.");
    }
  };

  const exportBuildLogsZip = () => {
    const logsToExport =
      osBuildLogs.length > 0
        ? osBuildLogs
        : [
            "Initializing RootMasterOS Bootable OS Builder Environment...",
            "[SYSTEM] Host Architecture detected: x86_64, Linux Kernel Baseline v6.8.0",
            "[SYSTEM] Verifying build dependencies...",
            "  - debootstrap: INSTALLED",
            "  - squashfs-tools: INSTALLED",
            "  - xorriso: INSTALLED",
            "  - grub-pc-bin: INSTALLED",
            "  - mtools: INSTALLED",
            "[SYSTEM] Dependencies successfully attested. Proceeding to File Extraction...",
            "[STAGE 1] EXTRACTING AND MERGING USER ARCHIVES",
            "[FS] Extracting RootMasterOS.zip (Base System) to ./rootmaster...",
            "  - Extracted: ./rootmaster/backend/ (14 source controllers, server.js)",
            "  - Extracted: ./rootmaster/frontend/ (Next.js layout, components, Tailwind layout)",
            "  - Extracted: ./rootmaster/modules/ (Syscore hooks, DB connections)",
            "[FS] Extracting All-in-One.zip (Web UI apps) to ./allinone...",
            "  - Extracted: dashboard.html, dynamic_charts.js, process_logger.js, compliance_checker.node",
            "[FS] Merging All-in-One apps into RootMasterOS UI layer...",
            "[FS] Extracting Download.zip (Android Knox Magisk toolset) to ./androidmod...",
            "[FS] Merging Magisk module binder into /modules/android...",
            "[STAGE 2] CREATING MINIMAL UBUNTU BASE FILESYSTEM (debootstrap)",
            "[BOOSTRAP] Executing: sudo debootstrap jammy rootfs http://archive.ubuntu.com/ubuntu/",
            "[STAGE 3] INJECTING OS FILES, RUNTIMES, AND AUTOSTART CRONS",
            "[INJECT] Writing RootMasterOS workspace into rootfs storage space...",
            "[CHROOT] Entering chroot environment to configure runtime drivers...",
            "[STARTUP] Building /usr/bin/start-os launching script inside rootfs...",
            "[STAGE 4] COMPRESSING FILESYSTEM & REBUILDING GRUB BOOT SYSTEM",
            "[KERNEL] Extracting boot kernel components to ISO payload mapping...",
            "[GRUB] Constructing boot configuration settings...",
            "[SQUASH] Compressing Linux base directory tree into high-density SquashFS container...",
            "  - Compression ratio: 4.8:1 - Reduced 2.8GB system workspace into 582MB SquashFS image.",
            "[COMPILE] Packaging directory payload into secure hybrid bootable ISO with xorriso...",
            "=================================================================",
            "[COMPLETED] BOOTABLE ROOTMASTEROS ISO FULLY COMPILED",
            "=================================================================",
            "* ISO NAME: RootMasterOS.iso",
            "* SIZE: 642 MB",
            "* SHA-256 HASH: a510f92b7c43df1290e21a81232ff4cd9481977e201bcf5a2de2cfc19929831c",
            "* STATUS: Ready to flash to USB",
          ];

    const textContent = logsToExport.join("\n");

    // Simple uncompressed ZIP file generator
    const getZipBlob = (filename: string, content: string) => {
      const encoder = new TextEncoder();
      const fileData = encoder.encode(content);

      const makeTable = () => {
        let c;
        const table = [];
        for (let n = 0; n < 256; n++) {
          c = n;
          for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          }
          table[n] = c;
        }
        return table;
      };
      const crcTable = makeTable();
      const crc32 = (data: Uint8Array) => {
        let crc = 0 ^ -1;
        for (let i = 0; i < data.length; i++) {
          crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
        }
        return (crc ^ -1) >>> 0;
      };

      const crc = crc32(fileData);
      const size = fileData.length;
      const nameBytes = encoder.encode(filename);
      const nameLen = nameBytes.length;

      const lh = new ArrayBuffer(30 + nameLen + size);
      const lhView = new DataView(lh);
      lhView.setUint32(0, 0x04034b50, true);
      lhView.setUint16(4, 10, true);
      lhView.setUint16(6, 0, true);
      lhView.setUint16(8, 0, true);
      lhView.setUint16(10, 0, true);
      lhView.setUint16(12, 0, true);
      lhView.setUint32(14, crc, true);
      lhView.setUint32(18, size, true);
      lhView.setUint32(22, size, true);
      lhView.setUint16(26, nameLen, true);
      lhView.setUint16(28, 0, true);

      const lhBytes = new Uint8Array(lh);
      lhBytes.set(nameBytes, 30);
      lhBytes.set(fileData, 30 + nameLen);

      const cd = new ArrayBuffer(46 + nameLen);
      const cdView = new DataView(cd);
      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 10, true);
      cdView.setUint16(8, 0, true);
      cdView.setUint16(10, 0, true);
      cdView.setUint16(12, 0, true);
      cdView.setUint16(14, 0, true);
      cdView.setUint32(16, crc, true);
      cdView.setUint32(20, size, true);
      cdView.setUint32(24, size, true);
      cdView.setUint16(28, nameLen, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, 0, true);

      const cdBytes = new Uint8Array(cd);
      cdBytes.set(nameBytes, 46);

      const eocd = new ArrayBuffer(22);
      const eocdView = new DataView(eocd);
      eocdView.setUint32(0, 0x06054b50, true);
      eocdView.setUint16(4, 0, true);
      eocdView.setUint16(6, 0, true);
      eocdView.setUint16(8, 1, true);
      eocdView.setUint16(10, 1, true);
      eocdView.setUint32(12, 46 + nameLen, true);
      eocdView.setUint32(16, 30 + nameLen + size, true);
      eocdView.setUint16(20, 0, true);

      const eocdBytes = new Uint8Array(eocd);

      return new Blob([lhBytes, cdBytes, eocdBytes], {
        type: "application/zip",
      });
    };

    try {
      const blob = getZipBlob("build_logs.txt", textContent);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rootmaster_build_logs.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification("Build logs exported as ZIP successfully!");
    } catch (error) {
      console.error(error);
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rootmaster_build_logs.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification("Build logs exported as TXT!");
    }
  };

  // LIVE FIRMWARE DISSECTION PIPELINE SIMULATION
  const runFirmwareDissection = () => {
    if (isDissecting) return;
    if (!selectedFirmwarePart) {
      triggerNotification("Please select a firmware part to dissect first.");
      return;
    }

    setIsDissecting(true);
    setSuperImageUnpacked(false);
    setDissectProgress(0);
    setDissectLogs([]);

    const baseLogs = [
      `Initializing Reverse Engineering sweep for Galaxy S25 Ultra (SM-S938U) - Part: ${selectedFirmwarePart}...`,
      `[ARCHIVE] Verifying file presence: S25_Ultra_Stock2026_05_04.rar`,
      "[ARCHIVE] Rar integrity check: SUCCESS. SHA-256 baseline hashes match VRU3CXH2 baseline.",
      `[UNPACK] Extracting partition segments from ${selectedFirmwarePart}.tar.md5 payload...`,
    ];

    let baseIndex = 0;
    const interval = setInterval(() => {
      if (baseIndex < baseLogs.length) {
        setDissectLogs((prev) => [...prev, baseLogs[baseIndex]]);
        setDissectProgress(Math.min(25, (baseIndex + 1) * 6));
        baseIndex++;
      } else {
        clearInterval(interval);
        if (selectedFirmwarePart === "AP") {
          runAPDissection();
        } else if (selectedFirmwarePart === "BL") {
          runBLDissection();
        } else if (selectedFirmwarePart === "CP") {
          runCPDissection();
        } else {
          runCSCDissection();
        }
      }
    }, 450);

    const runAPDissection = () => {
      const apLogs = [
        "  - Extracted: boot.img (Kernel Image + Ramdisk)",
        "  - Extracted: init_boot.img (Android Init Header)",
        "  - Extracted: recovery.img (Stock Recovery Console)",
        "  - Extracted: super.img.lz4 (Sparse Dynamic Filesystem)",
        "  - Extracted: vbmeta.img (Android Verified Boot Security Blocks)",
        " ",
        "[lz4] Decompressing super.img.lz4 to super.img dynamic block device...",
        "  - Command: lz4 -d super.img.lz4 super.img",
        "  - Success: Uncompressed size matches expectations (8,941,222,912 bytes).",
        " ",
        "[SPARSE] Converting Android Sparse super.img to mountable RAW ext4 block format...",
        "  - Command: simg2img super.img super.raw.img",
        "  - Sparse conversion complete. Block structure validated.",
        " ",
        "[LPUNPACK] Extracting Dynamic Sub-Partitions with Android lpunpack suite...",
        "  - Target raw image: super.raw.img",
        "  - Output directory: output/super_extracted/",
        "  - Extracting partition: system.img (ext4, size: 2.9 GB)...",
        "  - Extracting partition: vendor.img (ext4, size: 1.1 GB)...",
        "  - Extracting partition: product.img (ext4, size: 1.5 GB)...",
        "  - Extracting partition: odm.img (ext4, size: 482 MB)...",
        " ",
        "[VALIDATE] Calculating block checksums for comparison with Stock Baseline VRU3CXH2...",
        "  - system.img SHA-256: d8f36c561b34c264a91aef037e93081e7f3c1b002cbf7170104a081cf13f8992 [MATCHED]",
        "  - vendor.img SHA-256: b32a4e5e4184c1737e91d5bc7ea46a9e102f92f2b3e47acdf981df983a54b38d [MATCHED]",
        "  - product.img SHA-256: f12a441e976cb3deca5e03fe01b3a58e5cbfe0128c94faee600df81acbe753d0 [MATCHED]",
        "  - odm.img SHA-256: 3c1a2c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b [MATCHED]",
        " ",
        "=================================================================",
        "[COMPLETED] AP DISSECTION SUCCESSFUL",
        "=================================================================",
        "* Extracted sub-partitions are ready for system overlay mounts!",
        "* Status registers and RKP kernel structures mapped cleanly.",
      ];

      let index = 0;
      const apInterval = setInterval(() => {
        if (index < apLogs.length) {
          setDissectLogs((prev) => [...prev, apLogs[index]]);
          setDissectProgress(25 + Math.round((index + 1) * 2.8));
          index++;
        } else {
          clearInterval(apInterval);
          setIsDissecting(false);
          setSuperImageUnpacked(true);
          triggerNotification(
            "AP Partition dissection complete! Dynamic sub-partitions exposed.",
          );
        }
      }, 350);
    };

    const runBLDissection = () => {
      const blLogs = [
        "  - Extracted: sboot.bin (Samsung Primary Bootloader)",
        "  - Extracted: param.bin (LCD parameters, bootscreens, logos)",
        "  - Extracted: tz.img (TrustZone runtime environment)",
        "  - Extracted: keymaster.bin (Knox Key Vault services)",
        " ",
        "[DECOMPILE] Analyzing Knox Secure World BL_S938USQS3CXH2 trustlet firmware modules...",
        "  - Loading security modules: /vendor/firmware/keymaster /vendor/firmware/gatekeeper",
        "  - Mapping Knox Vault Trusted Application (TA) interfaces in sboot...",
        "  - Scanning hardware register offsets managing Knox Warranty e-fuse status...",
        "  - Found Register Address: 0x0022AF3C (Knox Void Fuse Flag)",
        "  - Baseline Flag reading: 0x0 (Hardware Void Warranty intact)",
        " ",
        "=================================================================",
        "[COMPLETED] BL DISSECTION SUCCESSFUL",
        "=================================================================",
        "* Knox hardware Vault key parameters mapped cleanly.",
        "* Secure boot signature validations verified OK.",
      ];

      let index = 0;
      const blInterval = setInterval(() => {
        if (index < blLogs.length) {
          setDissectLogs((prev) => [...prev, blLogs[index]]);
          setDissectProgress(25 + Math.round((index + 1) * 6));
          index++;
        } else {
          clearInterval(blInterval);
          setIsDissecting(false);
          triggerNotification(
            "Bootloader signatures mapped and Knox registers exposed.",
          );
        }
      }, 400);
    };

    const runCPDissection = () => {
      const cpLogs = [
        "  - Extracted: modem.bin (Snapdragon X80 5G Baseband radio controller)",
        "  - Extracted: dsp.img (Digital Signal Processor instructions)",
        " ",
        "[DIAG] Reverse-engineering baseband frequency band configurations...",
        "  - Carrier standard CSC mapped: VZW (Verizon Wireless USA)",
        "  - Querying radio band access matrix limits:",
        "      - LTE B13 (Verizon baseline): ENABLED [CTIA Attestation OK]",
        "      - LTE B66 (Extended spectrum): ENABLED",
        "      - 5G NR n2 (C-band baseline): ENABLED",
        "      - 5G NR n5 (Sub-6 radio coverage): ENABLED",
        "      - 5G NR n77 (Ultra-Wideband C-band spectrum): ENABLED",
        "  - Cross-checking power thresholds against CTIA limits...",
        "  - Maximum Radiated Signal Power limit: +23dBm [COMPLIANT]",
        " ",
        "=================================================================",
        "[COMPLETED] CP BASEBAND RE-ENGINEERING COMPLETED",
        "=================================================================",
        "* Verizon baseband LTE/5G RF signal standard fully certified.",
      ];

      let index = 0;
      const cpInterval = setInterval(() => {
        if (index < cpLogs.length) {
          setDissectLogs((prev) => [...prev, cpLogs[index]]);
          setDissectProgress(25 + Math.round((index + 1) * 10));
          index++;
        } else {
          clearInterval(cpInterval);
          setIsDissecting(false);
          triggerNotification("CP baseband radio configurations analyzed.");
        }
      }, 450);
    };

    const runCSCDissection = () => {
      const cscLogs = [
        "  - Extracted: cache.img.ext4 (Carrier caching directories)",
        "  - Extracted: omr.img (Carrier customizations, APNs, carrier overlays)",
        " ",
        "[OVERLAYS] Parsing CSC customization blocks for S938U CSC (Verizon VZW)...",
        "  - Extracted APN profiles: 12 baseline profiles matching Verizon IMS servers.",
        "  - Extracted Carrier configuration policies: wifi_calling=true, rcs_enabled=true",
        "  - Identified carrier bloat packages in product overlays.",
        " ",
        "=================================================================",
        "[COMPLETED] CSC CUSTOMIZATION EXPOSURE SUCCESSFUL",
        "=================================================================",
        "* Carrier overlay mappings and APN lists fully detailed.",
      ];

      let index = 0;
      const cscInterval = setInterval(() => {
        if (index < cscLogs.length) {
          setDissectLogs((prev) => [...prev, cscLogs[index]]);
          setDissectProgress(25 + Math.round((index + 1) * 12));
          index++;
        } else {
          clearInterval(cscInterval);
          setIsDissecting(false);
          triggerNotification("CSC carrier customization parameters mapped.");
        }
      }, 450);
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200 min-h-screen">
      {/* Toast Notification overlay */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2F58CD] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 animate-slideIn">
          <Sparkles className="h-4.5 w-4.5 animate-pulse text-[#10B981]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {notification}
          </span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="relative p-8 rounded-3xl overflow-hidden border border-[#22314D] bg-gradient-to-r from-[#030712] via-[#091124] to-[#030712] shadow-[0_0_40px_rgba(47,88,205,0.15)]">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#2F58CD]/20 text-blue-400 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-[#2F58CD]/30">
                Acing Matrix Project Master Suite
              </span>
              <span className="bg-[#6C3483]/20 text-purple-400 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-[#6C3483]/30">
                Samsung S25 Ultra VRU3CXH2 Firmware
              </span>
              <span className="bg-[#10B981]/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-[#10B981]/30">
                Simulator / Fixture Data
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Acing IU: Genesis Lab Blueprint & OS Assembly
            </h1>
            <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-3xl">
              Demonstration blueprint using fixture data and timed UI
              simulations. This route does not build an ISO, connect to ADB,
              inspect firmware, verify hardware, root, unlock, flash, or modify
              any device.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-gradient-to-r from-[#2F58CD] to-[#6C3483] hover:from-[#3a6bf0] hover:to-[#813ea2] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-[#2F58CD]/10 flex items-center gap-2 border border-white/10 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              <span>Export Blueprint</span>
            </button>
            <button
              onClick={resetToDefault}
              className="bg-[#111827] hover:bg-[#151D30] text-slate-300 hover:text-white text-xs font-bold px-4 py-3 rounded-xl border border-[#22314D] flex items-center gap-2 transition-all duration-200"
              title="Reset tasks to default backlog"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Backlog</span>
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#2F58CD]/10 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-[#6C3483]/10 blur-3xl"></div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="flex bg-[#0B0F19] p-1.5 rounded-2xl border border-[#22314D] max-w-5xl overflow-x-auto whitespace-nowrap scrollbar-thin">
        <button
          onClick={() => setActiveTab("os-builder")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
            activeTab === "os-builder"
              ? "bg-[#2F58CD] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Cpu className="h-4.5 w-4.5" />
          <span>1. Bootable OS Builder</span>
        </button>
        <button
          onClick={() => setActiveTab("dissection")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
            activeTab === "dissection"
              ? "bg-[#2F58CD] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="h-4.5 w-4.5" />
          <span>2. Firmware Dissection</span>
        </button>
        <button
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
            activeTab === "storage"
              ? "bg-[#2F58CD] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HardDrive className="h-4.5 w-4.5" />
          <span>3. S25 Storage Console</span>
        </button>
        <button
          onClick={() => setActiveTab("backlog")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
            activeTab === "backlog"
              ? "bg-[#2F58CD] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ClipboardList className="h-4.5 w-4.5" />
          <span>4. Master Backlog</span>
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
            activeTab === "manual"
              ? "bg-[#2F58CD] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>5. Engineering Manual</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. BOOTABLE OS BUILDER */}
      {activeTab === "os-builder" && (
        <div className="space-y-8 animate-fadeIn">
          {/* OS Builder Header Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Build Control Console */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-6">
                <div className="flex items-center justify-between border-b border-[#22314D] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-5 w-5 text-blue-400 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Live ISO Builder Environment
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-[#10B981]/20 border border-[#10B981]/30 text-emerald-400 rounded-md">
                    BUILD HOST: READY
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Select & Verify Package Sources:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* RootMasterOS.zip Card */}
                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14] hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <Package className="h-8 w-8 text-blue-500" />
                        <input
                          type="checkbox"
                          checked={selectedZipFiles.rootmaster}
                          onChange={(e) =>
                            setSelectedZipFiles({
                              ...selectedZipFiles,
                              rootmaster: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500 bg-slate-900 border-slate-700 h-4.5 w-4.5 focus:ring-0"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">
                          RootMasterOS.zip
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Base Distro & Express Files
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED OK
                      </span>
                    </div>

                    {/* All-in-One.zip Card */}
                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <Smartphone className="h-8 w-8 text-purple-500" />
                        <input
                          type="checkbox"
                          checked={selectedZipFiles.allinone}
                          onChange={(e) =>
                            setSelectedZipFiles({
                              ...selectedZipFiles,
                              allinone: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500 bg-slate-900 border-slate-700 h-4.5 w-4.5 focus:ring-0"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">
                          All-in-One.zip
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Unified Web Control Interface
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED OK
                      </span>
                    </div>

                    {/* Download.zip Card */}
                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <Layers className="h-8 w-8 text-purple-400" />
                        <input
                          type="checkbox"
                          checked={selectedZipFiles.download}
                          onChange={(e) =>
                            setSelectedZipFiles({
                              ...selectedZipFiles,
                              download: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500 bg-slate-900 border-slate-700 h-4.5 w-4.5 focus:ring-0"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">
                          Download.zip (bindhosts)
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Magisk Knox Android Module
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED OK
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Sandbox Resizing Console */}
                <div className="p-5 rounded-2xl border border-[#22314D] bg-[#070B14] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22314D]/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                          Isolated Build Sandbox Allocation
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Adjust the dedicated workspace memory limits for
                          compiling files safely.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          isResizingSandbox
                            ? "bg-amber-950/40 text-yellow-400 animate-pulse border border-yellow-800/20"
                            : "bg-blue-950/40 text-blue-400 border border-blue-900/20"
                        }`}
                      >
                        {isResizingSandbox
                          ? "REALLOCATING BOUNDS..."
                          : "STATUS: OPTIMIZED"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300">
                        Virtual Storage Limit:{" "}
                        <span className="text-indigo-400 font-extrabold font-mono text-sm">
                          {sandboxSize} GB
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase">
                        Min: 4GB / Max: 64GB
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="4"
                        max="64"
                        value={sandboxSize}
                        onChange={(e) =>
                          handleSandboxResize(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-[#0B0F19] rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Virtual partition stats breakdown based on sandboxSize */}
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#22314D]/40 text-center">
                        <span className="text-[8px] text-slate-500 font-bold block uppercase">
                          SquashFS RAM
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {(sandboxSize * 0.45).toFixed(1)} GB
                        </span>
                      </div>
                      <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#22314D]/40 text-center">
                        <span className="text-[8px] text-slate-500 font-bold block uppercase">
                          Decompress Temp
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {(sandboxSize * 0.35).toFixed(1)} GB
                        </span>
                      </div>
                      <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#22314D]/40 text-center">
                        <span className="text-[8px] text-slate-500 font-bold block uppercase">
                          Unallocated Gap
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {(sandboxSize * 0.2).toFixed(1)} GB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compile Actions */}
                <div className="space-y-4 pt-4 border-t border-[#22314D]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 text-blue-400" /> Compile
                        Engine Status
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Construct custom Ubuntu-Live squashfs filesystem
                        injecting your merged files & GRUB menu entry.
                      </p>
                    </div>

                    <button
                      onClick={runOSBuildAssembly}
                      disabled={isBuildingOS}
                      className={`px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                        isBuildingOS
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02]"
                      }`}
                    >
                      {isBuildingOS ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                          <span>Assembling OS ({osBuildProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-white text-white" />
                          <span>Assemble Bootable OS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Build Progress Indicator */}
                  {isBuildingOS && (
                    <div className="space-y-2 p-4 rounded-xl bg-blue-950/20 border border-blue-900/30">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-blue-400 uppercase tracking-widest animate-pulse">
                          ACTIVE STAGE: {osBuildStepName}
                        </span>
                        <span className="text-white">{osBuildProgress}%</span>
                      </div>
                      <div className="w-full bg-[#070B14] h-2.5 rounded-full overflow-hidden border border-[#22314D]">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${osBuildProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal Output Stream */}
              <div className="glass-card rounded-2xl border border-[#22314D] bg-[#020617] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between bg-[#0B0F19] px-5 py-3 border-b border-[#22314D]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 ml-2 font-bold uppercase tracking-wider">
                      build_iso.sh - Shell Logcat
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportBuildLogsZip}
                      className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-all"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export Build Logs</span>
                    </button>
                    <button
                      onClick={() => setOsBuildLogs([])}
                      className="text-[9px] font-extrabold uppercase px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                <div className="p-5 font-mono text-[11px] leading-relaxed text-blue-400/90 h-96 overflow-y-auto scrollbar-thin flex flex-col space-y-1">
                  {osBuildLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-20 flex flex-col items-center justify-center space-y-3">
                      <Terminal className="h-8 w-8 text-slate-600 animate-bounce" />
                      <span>
                        {
                          'Console idle. Click "Assemble Bootable OS" to begin compilation stream.'
                        }
                      </span>
                    </div>
                  ) : (
                    osBuildLogs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes("[STAGE") || log.includes("[COMPLETED")
                            ? "text-purple-400 font-extrabold border-y border-[#22314D] py-1.5 my-1"
                            : log.includes("Error")
                              ? "text-red-500 font-extrabold"
                              : log.includes("Success") ||
                                  log.includes("VERIFIED OK")
                                ? "text-emerald-400 font-bold"
                                : "text-slate-300"
                        }
                      >
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={buildTerminalEndRef} />
                </div>
              </div>
            </div>

            {/* Sidebar ISO metadata & upgrade paths */}
            <div className="space-y-6">
              {/* Ready ISO Card */}
              {isoResultReady ? (
                <div className="p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-950/10 shadow-[0_0_25px_rgba(16,185,129,0.1)] space-y-5 animate-pulse-slow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        COMPILATION SUCCESSFUL
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Firmware OS package compiled.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">FILE_NAME:</span>
                      <span className="font-bold text-white">
                        RootMasterOS.iso
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SIZE:</span>
                      <span className="font-bold text-white">642.8 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">MD5_SUM:</span>
                      <span className="font-bold text-white">
                        cf83a9032d91...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">KERNEL:</span>
                      <span className="font-bold text-white">
                        Linux 6.8-generic
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DESKTOP:</span>
                      <span className="font-bold text-white">
                        XFCE UI Light
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() =>
                        triggerNotification(
                          "RootMasterOS.iso download started!",
                        )
                      }
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <Download className="h-4.5 w-4.5 text-slate-950" />
                      <span>Download Ready ISO</span>
                    </button>

                    <button
                      onClick={exportBuildLogsZip}
                      className="w-full bg-[#0B0F19] border border-[#22314D] hover:border-blue-500/50 text-blue-400 text-xs font-extrabold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="h-4.5 w-4.5 text-blue-400" />
                      <span>Export Build Logs (.ZIP)</span>
                    </button>

                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          "sudo dd if=RootMasterOS.iso of=/dev/sdX bs=4M status=progress",
                          "DD Flash Command",
                        )
                      }
                      className="w-full bg-[#0B0F19] border border-[#22314D] hover:border-slate-500 text-slate-300 text-[10px] font-mono py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Terminal className="h-4 w-4" />
                      <span>Copy dd USB Flash Code</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-[#22314D] bg-[#070B14] space-y-4 text-center">
                  <Package className="h-12 w-12 text-slate-500 mx-auto animate-pulse" />
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    No Iso File Generated Yet
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Once the Live ISO build pipeline completes, the custom
                    bootable system image will populate here with credentials
                    and checksum hashes.
                  </p>
                </div>
              )}

              {/* Build History Performance Chart using Recharts */}
              <BuildHistoryChart
                successfulBuilds={successfulBuilds}
                onExportHistory={exportLogHistoryZip}
              />

              {/* Side-by-Side Firmware Build Comparer */}
              <FirmwareBuildComparer successfulBuilds={successfulBuilds} />

              {/* OS Upgrades Info Panel */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#22314D] pb-3">
                  <Activity className="h-4.5 w-4.5 text-purple-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Advanced OS Integrations
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    You can scale this dynamic framework into several robust
                    custom distribution profiles by replacing the base
                    debootstrap target or overlays:
                  </p>

                  <div className="space-y-2.5">
                    <div
                      className="p-3 rounded-xl border border-blue-950/30 bg-blue-950/10 hover:border-blue-500/30 transition-all cursor-pointer"
                      onClick={() =>
                        triggerNotification(
                          "Upgrade Profile: Kali Baseline configured.",
                        )
                      }
                    >
                      <strong className="text-white block text-[11px]">
                        1. Kali Security Linux Baseline
                      </strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-normal">
                        Inject cybersecurity audit tools (nmap, aircrack-ng,
                        firmware-mod-kit) straight into the live SquashFS.
                      </span>
                    </div>

                    <div
                      className="p-3 rounded-xl border border-purple-950/30 bg-purple-950/10 hover:border-purple-500/30 transition-all cursor-pointer"
                      onClick={() =>
                        triggerNotification(
                          "Upgrade Profile: Persistent Live storage enabled.",
                        )
                      }
                    >
                      <strong className="text-white block text-[11px]">
                        2. Live Persistence storage
                      </strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-normal">
                        Utilize dual-partition flashing setups. Partition A
                        loads live SquashFS; Partition B auto-mounts as crypt-fs
                        home space.
                      </span>
                    </div>

                    <div
                      className="p-3 rounded-xl border border-emerald-950/30 bg-emerald-950/10 hover:border-emerald-500/30 transition-all cursor-pointer"
                      onClick={() =>
                        triggerNotification(
                          "Upgrade Profile: Android SDK & ADB Bridge set up.",
                        )
                      }
                    >
                      <strong className="text-white block text-[11px]">
                        3. Unified Android SDK Bridge
                      </strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5 leading-normal">
                        Include ADB client, fastboot triggers, and a local
                        headless Android Emulator to execute Magisk payload
                        sweeps natively.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. FIRMWARE DISSECTION */}
      {activeTab === "dissection" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              {/* Firmware Part Selector */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-blue-400" /> S25 Ultra
                    Firmware Package Deconstructor
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target baseline:{" "}
                    <code className="text-blue-400 font-mono">
                      S938USQS3CXH2
                    </code>{" "}
                    (Android 16, binary 3, CSC: VZW Verizon).
                  </p>
                </div>

                {/* Part selector row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["AP", "BL", "CP", "CSC"].map((part) => (
                    <button
                      key={part}
                      onClick={() => setSelectedFirmwarePart(part as any)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        selectedFirmwarePart === part
                          ? "border-blue-500 bg-blue-950/10 shadow-lg"
                          : "border-[#22314D] bg-[#070B14] hover:border-slate-500"
                      }`}
                    >
                      <span className="block text-lg font-black text-white">
                        {part}
                      </span>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-relaxed">
                        {part === "AP"
                          ? "System & APPs"
                          : part === "BL"
                            ? "Secure Bootloader"
                            : part === "CP"
                              ? "Modem Baseband"
                              : "Customizations"}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono font-semibold">
                        {part === "AP"
                          ? "12.8 GB"
                          : part === "BL"
                            ? "32.1 MB"
                            : part === "CP"
                              ? "91.4 MB"
                              : "482 MB"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Explanatory banner */}
                {selectedFirmwarePart && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 text-xs text-slate-300 leading-relaxed space-y-1.5">
                      <strong className="text-white block font-extrabold">
                        Selected Target details:{" "}
                        {selectedFirmwarePart === "AP"
                          ? "AP_S938USQS3CXH2_AP.tar.md5"
                          : selectedFirmwarePart === "BL"
                            ? "BL_S938USQS3CXH2_BL.tar.md5"
                            : selectedFirmwarePart === "CP"
                              ? "CP_S938USQS3CXH2_CP.tar.md5"
                              : "CSC_OMC_VZW_S938USQS3CXH2.tar.md5"}
                      </strong>
                      <span className="block text-[11px] text-slate-400">
                        {selectedFirmwarePart === "AP"
                          ? "Houses critical Android OS logic. Contains boot.img (kernel), system.img (Android files), and super.img which structures system, vendor, product, and odm partitions into a dynamic partition framework."
                          : selectedFirmwarePart === "BL"
                            ? "Bootloader sector. Handles Samsung sboot parameters, hardware Knox Fuse registers, Tz (TrustZone), and hardware warranty verification routines."
                            : selectedFirmwarePart === "CP"
                              ? "Cellular Baseband. Manages Snapdragon modem instructions, RF standard power parameters, and carriers band access layouts."
                              : "CSC custom files. Houses regional product overlays, IMS parameters, APNs, and carrier-specific packages."}
                      </span>
                    </div>

                    {/* Tar.md5 File Index with a custom styled scroll bar */}
                    <div className="space-y-2.5 p-4 rounded-xl border border-[#22314D] bg-[#070B14]">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Payload Archive Contents (
                          {selectedFirmwarePart === "AP"
                            ? "12"
                            : selectedFirmwarePart === "BL"
                              ? "9"
                              : selectedFirmwarePart === "CP"
                                ? "2"
                                : "4"}{" "}
                          files)
                        </span>
                        <span className="text-[9px] text-[#2F58CD] font-bold uppercase font-mono">
                          scrollable payload index
                        </span>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-[#070B14] space-y-1 text-[11px] font-mono">
                        {selectedFirmwarePart === "AP" &&
                          [
                            { name: "boot.img", size: "96.0 MB" },
                            { name: "recovery.img", size: "112.4 MB" },
                            { name: "super.img", size: "11.8 GB" },
                            { name: "userdata.img", size: "482.1 MB" },
                            { name: "init_boot.img", size: "16.0 MB" },
                            { name: "dtbo.img", size: "24.0 MB" },
                            { name: "pvmfw.img", size: "4.0 MB" },
                            { name: "vbmeta.img", size: "64 KB" },
                            { name: "vbmeta_system.img", size: "64 KB" },
                            { name: "vbmeta_vendor.img", size: "64 KB" },
                            { name: "vendor_boot.img", size: "96.0 MB" },
                            { name: "vendor_kernel_boot.img", size: "96.0 MB" },
                          ].map((f) => (
                            <div
                              key={f.name}
                              className="flex justify-between items-center p-2 rounded bg-[#030712]/50 border border-[#22314D]/30 hover:border-blue-500/30 transition-all"
                            >
                              <span className="text-white font-bold">
                                {f.name}
                              </span>
                              <div className="flex gap-3 text-slate-400">
                                <span>{f.size}</span>
                                <span className="text-emerald-400 text-[10px] font-bold">
                                  OK
                                </span>
                              </div>
                            </div>
                          ))}
                        {selectedFirmwarePart === "BL" &&
                          [
                            { name: "sboot.bin", size: "4.2 MB" },
                            { name: "param.bin", size: "2.1 MB" },
                            { name: "tz.img", size: "3.5 MB" },
                            { name: "keymaster.img", size: "1.2 MB" },
                            { name: "up_param.bin", size: "1.8 MB" },
                            { name: "abl.elf", size: "2.4 MB" },
                            { name: "vaultkeeper.img", size: "820 KB" },
                            { name: "xbl.elf", size: "5.6 MB" },
                            { name: "uefi.elf", size: "10.5 MB" },
                          ].map((f) => (
                            <div
                              key={f.name}
                              className="flex justify-between items-center p-2 rounded bg-[#030712]/50 border border-[#22314D]/30 hover:border-purple-500/30 transition-all"
                            >
                              <span className="text-white font-bold">
                                {f.name}
                              </span>
                              <div className="flex gap-3 text-slate-400">
                                <span>{f.size}</span>
                                <span className="text-emerald-400 text-[10px] font-bold">
                                  OK
                                </span>
                              </div>
                            </div>
                          ))}
                        {selectedFirmwarePart === "CP" &&
                          [
                            { name: "modem.bin", size: "84.6 MB" },
                            { name: "dsp.bin", size: "6.8 MB" },
                          ].map((f) => (
                            <div
                              key={f.name}
                              className="flex justify-between items-center p-2 rounded bg-[#030712]/50 border border-[#22314D]/30 hover:border-blue-500/30 transition-all"
                            >
                              <span className="text-white font-bold">
                                {f.name}
                              </span>
                              <div className="flex gap-3 text-slate-400">
                                <span>{f.size}</span>
                                <span className="text-emerald-400 text-[10px] font-bold">
                                  OK
                                </span>
                              </div>
                            </div>
                          ))}
                        {selectedFirmwarePart === "CSC" &&
                          [
                            { name: "cache.img", size: "240.2 MB" },
                            { name: "omr.img", size: "182.5 MB" },
                            { name: "prism.img", size: "40.1 MB" },
                            { name: "optics.img", size: "19.2 MB" },
                          ].map((f) => (
                            <div
                              key={f.name}
                              className="flex justify-between items-center p-2 rounded bg-[#030712]/50 border border-[#22314D]/30 hover:border-emerald-500/30 transition-all"
                            >
                              <span className="text-white font-bold">
                                {f.name}
                              </span>
                              <div className="flex gap-3 text-slate-400">
                                <span>{f.size}</span>
                                <span className="text-emerald-400 text-[10px] font-bold">
                                  OK
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-[#22314D]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Info className="h-4 w-4" /> Ready to decompile and verify
                    headers
                  </span>

                  <button
                    onClick={runFirmwareDissection}
                    disabled={isDissecting}
                    className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isDissecting
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white hover:scale-[1.01]"
                    }`}
                  >
                    {isDissecting
                      ? "Dissecting Partition..."
                      : "Run Decompile Sweep"}
                  </button>
                </div>
              </div>

              {/* Extraction stream */}
              <div className="glass-card rounded-2xl border border-[#22314D] bg-[#020617] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between bg-[#0B0F19] px-5 py-3 border-b border-[#22314D]">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Firmware Decompile Log Output
                  </span>
                  <div className="flex items-center gap-3">
                    {isDissecting && (
                      <span className="h-4.5 w-4.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {dissectProgress}%
                    </span>
                  </div>
                </div>

                <div className="p-5 font-mono text-[11px] leading-relaxed text-indigo-400 h-80 overflow-y-auto scrollbar-thin flex flex-col space-y-1">
                  {dissectLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-20">
                      {
                        'Terminal empty. Select a firmware block and click "Run Decompile Sweep" to view dynamic decompression, sparse conversions, and SHA-256 checksum maps.'
                      }
                    </div>
                  ) : (
                    dissectLogs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes("[COMPLETED")
                            ? "text-purple-400 font-extrabold border-y border-[#22314D] py-1 my-1"
                            : log.includes("Error")
                              ? "text-red-500 font-extrabold"
                              : log.includes("[MATCHED]") ||
                                  log.includes("SUCCESSFUL")
                                ? "text-emerald-400 font-bold"
                                : "text-slate-300"
                        }
                      >
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={dissectTerminalEndRef} />
                </div>
              </div>

              {/* Partition integrity fixture simulation card */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] bg-[#070B14] space-y-4">
                <div className="flex items-center justify-between border-b border-[#22314D] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-400 animate-pulse" />
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Partition Integrity Fixture Simulator
                    </h3>
                  </div>
                  <button
                    onClick={startIntegrityScan}
                    disabled={integrityScanActive}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 ${
                      integrityScanActive
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30"
                    }`}
                  >
                    <Play className="h-3 w-3" />
                    <span>
                      {integrityScanActive
                        ? "Simulating..."
                        : "Start Fixture Simulation"}
                    </span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span className="font-mono">
                      {currentScanningFile ||
                        "Ready to simulate fixture comparisons"}
                    </span>
                    <span>{integrityScanProgress}%</span>
                  </div>
                  <div className="w-full bg-[#0B0F19] h-2.5 rounded-full overflow-hidden border border-[#22314D]">
                    <div
                      className="bg-gradient-to-r from-red-500 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${integrityScanProgress}%` }}
                    />
                  </div>
                </div>

                {/* Partitions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {["/system", "/vendor", "/product", "/odm"].map((part) => {
                    const partFiles = scannedFiles.filter(
                      (f) => f.partition === part,
                    );
                    const verifiedCount = partFiles.filter(
                      (f) => f.status === "fixture_match",
                    ).length;
                    const corruptedCount = partFiles.filter(
                      (f) => f.status === "fixture_mismatch",
                    ).length;

                    return (
                      <div
                        key={part}
                        className="p-4 bg-[#0B0F19]/60 rounded-xl border border-[#22314D]/50 space-y-3"
                      >
                        <div className="flex justify-between items-center border-b border-[#22314D]/30 pb-1.5">
                          <span className="text-[11px] font-black text-white">
                            {part} files
                          </span>
                          <div className="flex gap-2 text-[9px] font-extrabold">
                            {verifiedCount > 0 && (
                              <span className="text-emerald-400 font-mono">
                                {verifiedCount} OK
                              </span>
                            )}
                            {corruptedCount > 0 && (
                              <span className="text-red-400 font-mono">
                                {corruptedCount} FAIL
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-[125px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-[#070B14]">
                          {partFiles.map((file) => (
                            <div
                              key={file.filepath}
                              className="flex justify-between items-center text-[10px] font-mono py-1 border-b border-[#22314D]/20 last:border-0"
                            >
                              <span
                                className="text-slate-400 truncate max-w-[150px]"
                                title={file.filepath}
                              >
                                {file.filepath.split("/").pop()}
                              </span>
                              {file.status === "fixture_match" ? (
                                <span className="text-emerald-400 flex items-center gap-1 text-[9px] font-bold">
                                  <Check className="h-3 w-3 stroke-[3]" />{" "}
                                  Fixture Match
                                </span>
                              ) : file.status === "fixture_mismatch" ? (
                                <span className="text-red-400 flex items-center gap-1 text-[9px] font-bold animate-pulse">
                                  <ShieldAlert className="h-3 w-3" /> Fixture Mismatch
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[9px]">
                                  Pending
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Partition Viewer */}
            <div className="space-y-6">
              {/* Dynamic Super Partition Layout Tree */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-4">
                <div className="flex items-center justify-between border-b border-[#22314D] pb-3">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4.5 w-4.5 text-blue-400" />
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      super.img Extracted Map
                    </h3>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      superImageUnpacked
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {superImageUnpacked ? "UNPACKED" : "SPARSE"}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* System.img Block */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      superImageUnpacked
                        ? "border-blue-900/40 bg-blue-950/5"
                        : "border-[#22314D] bg-[#070B14]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-blue-400 text-[11px]">
                        /system (system.img)
                      </span>
                      <span className="text-[9px] text-slate-400">2.9 GB</span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Contains core Android framework (init, bin, app system
                      configs).
                    </span>
                  </div>

                  {/* Vendor.img Block */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      superImageUnpacked
                        ? "border-purple-900/40 bg-purple-950/5"
                        : "border-[#22314D] bg-[#070B14]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-purple-400 text-[11px]">
                        /vendor (vendor.img)
                      </span>
                      <span className="text-[9px] text-slate-400">1.1 GB</span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Snapdragon 8 Elite hardware drivers and sepolicy security
                      contexts.
                    </span>
                  </div>

                  {/* Product.img Block */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      superImageUnpacked
                        ? "border-indigo-900/40 bg-indigo-950/5"
                        : "border-[#22314D] bg-[#070B14]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-indigo-400 text-[11px]">
                        /product (product.img)
                      </span>
                      <span className="text-[9px] text-slate-400">1.5 GB</span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Preinstalled apps, fonts, and theme configs.
                    </span>
                  </div>

                  {/* Odm.img Block */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      superImageUnpacked
                        ? "border-slate-800 bg-slate-950/20"
                        : "border-[#22314D] bg-[#070B14]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-slate-300 text-[11px]">
                        /odm (odm.img)
                      </span>
                      <span className="text-[9px] text-slate-400">482 MB</span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Samsung hardware custom integrations and carrier
                      descriptors.
                    </span>
                  </div>

                  {/* D3.js Firmware Partitions multi-block layout component */}
                  <FirmwarePartitions />
                </div>
              </div>

              {/* Knox Security Status Panel */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#22314D] pb-3">
                  <Shield className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Samsung Knox Attestation Fixture
                  </h3>
                </div>

                <div className="space-y-3 font-mono text-[10px] text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>Knox Warranty Bit Fixture:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-900/30">
                      EXAMPLE 0x0 (NOT VERIFIED)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Secure Bootloader Fixture:</span>
                    <span className="text-slate-400">
                      EXAMPLE LOCKED
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>SELinux Policy Fixture:</span>
                    <span className="text-slate-400">EXAMPLE ENFORCING</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>RKP Engine Fixture:</span>
                    <span className="text-amber-400">EXAMPLE ACTIVE</span>
                  </div>

                  <p className="text-[10px] leading-relaxed text-slate-500 font-sans mt-2 pt-2 border-t border-[#22314D]">
                    Fixture display only. No Knox attestation or device state is
                    read, and no package-writing operation is available here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. STORAGE OPTIMIZER */}
      {activeTab === "storage" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              {/* Storage Analyzer & Cleanup */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive className="h-4.5 w-4.5 text-blue-400" /> S25
                      Ultra Space Optimizer
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fixture-only storage optimization demonstration. No ADB
                      connection or device cleanup is performed.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                      FIXTURE — NO ADB CONNECTION
                    </span>
                  </div>
                </div>

                {/* Storage Telemetry */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14]">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">
                        TOTAL MEMORY
                      </span>
                      <span className="text-xl font-black text-white">
                        {storageStats.total} GB
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14]">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">
                        USED SPACE
                      </span>
                      <span className="text-xl font-black text-white">
                        {storageStats.used} GB
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14]">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">
                        FREE STORAGE
                      </span>
                      <span className="text-xl font-black text-emerald-400">
                        {storageStats.free} GB
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#22314D] bg-[#070B14]">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">
                        STAGNANT CACHES
                      </span>
                      <span
                        className={`text-xl font-black ${storageStats.trashCaches > 0 ? "text-yellow-500" : "text-emerald-400"}`}
                      >
                        {storageStats.trashCaches} GB
                      </span>
                    </div>
                  </div>

                  {/* Horizontal visual meter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>STORAGE ALLOCATION</span>
                      <span>
                        {Math.round(
                          (storageStats.used / storageStats.total) * 100,
                        )}
                        % ALLOCATED
                      </span>
                    </div>
                    <div className="w-full bg-[#070B14] h-3.5 rounded-full overflow-hidden border border-[#22314D] flex">
                      <div
                        className="bg-blue-600 h-full"
                        style={{
                          width: `${Math.round((storageStats.used / storageStats.total) * 100)}%`,
                        }}
                      ></div>
                      <div
                        className="bg-yellow-500 h-full"
                        style={{
                          width: `${Math.round((storageStats.trashCaches / storageStats.total) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex gap-4 text-[9px] text-slate-500 font-bold uppercase mt-1">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>{" "}
                        Active Files
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-yellow-500"></span>{" "}
                        Stagnant Caches
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#22314D]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Info className="h-4 w-4" /> Device cleanup executor not implemented
                  </span>

                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Unavailable until a verified device executor exists"
                    className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Cache Optimizer Unavailable
                  </button>
                </div>
              </div>

              {/* ADB Shell Console */}
              <div className="glass-card rounded-2xl border border-[#22314D] bg-[#020617] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between bg-[#0B0F19] px-5 py-3 border-b border-[#22314D]">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      ADB Shell Interface Console
                    </span>
                  </div>
                </div>

                <div className="p-5 font-mono text-[11px] leading-relaxed text-emerald-400 h-80 overflow-y-auto scrollbar-thin flex flex-col space-y-1">
                  {storageLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-20">
                      {
                        "Fixture console inactive. ADB cleanup is unavailable because no verified device executor exists."
                      }
                    </div>
                  ) : (
                    storageLogs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes("[SUCCESS")
                            ? "text-purple-400 font-extrabold border-y border-[#22314D] py-1 my-1"
                            : log.includes("Error")
                              ? "text-red-500 font-extrabold"
                              : log.includes("adb shell") ||
                                  log.includes("trim")
                                ? "text-yellow-400"
                                : "text-slate-300"
                        }
                      >
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={storageTerminalEndRef} />
                </div>
              </div>
            </div>

            {/* Sidebar quick specs */}
            <div className="space-y-6">
              {/* ADB shell syntax guide */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#22314D] pb-3">
                  <Wrench className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Useful ADB Storage Codes
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Manually execute space optimizations inside the S25 Ultra
                    shell with these validated terminal syntaxes:
                  </p>

                  <div className="space-y-3 font-mono text-[10px]">
                    <div>
                      <span className="text-white font-bold">
                        {"// 1. Free dynamic packages cache (e.g. 10G)"}
                      </span>
                      <code className="block bg-[#070B14] border border-[#22314D] p-2 rounded mt-1 text-purple-400">
                        adb shell pm trim-caches 10G
                      </code>
                    </div>

                    <div>
                      <span className="text-white font-bold">
                        {"// 2. Trigger hardware storage FSTRIM routine"}
                      </span>
                      <code className="block bg-[#070B14] border border-[#22314D] p-2 rounded mt-1 text-purple-400">
                        adb shell fstrim -v /data
                      </code>
                    </div>

                    <div>
                      <span className="text-white font-bold">
                        {"// 3. Purge Android system logcat buffers"}
                      </span>
                      <code className="block bg-[#070B14] border border-[#22314D] p-2 rounded mt-1 text-purple-400">
                        adb logcat -c
                      </code>
                    </div>

                    <div>
                      <span className="text-white font-bold">
                        {"// 4. Clean user application temporary spaces"}
                      </span>
                      <code className="block bg-[#070B14] border border-[#22314D] p-2 rounded mt-1 text-purple-400">
                        adb shell rm -rf /data/local/tmp/*
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. MASTER BACKLOG & CHECKLIST */}
      {activeTab === "backlog" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Dynamic Telemetry Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Progress */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-[#22314D] hover:border-[#2F58CD]/30 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#2F58CD]" /> Total Progress
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {completionPercentage}%
                </h2>
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden border border-[#22314D]">
                  <div
                    className="bg-gradient-to-r from-[#2F58CD] to-[#10B981] h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>
                    {completedCount} OF {totalCount} DONE
                  </span>
                  <span>COMPLETED</span>
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-[#22314D] hover:border-slate-700 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-400" />{" "}
                  Pending Tasks
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {pendingCount}
                </h2>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#22314D] pt-3 text-[10px] font-bold text-slate-500">
                <span>READY FOR TRACE</span>
                <span>BACKLOG</span>
              </div>
            </div>

            {/* In Progress */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-[#22314D] hover:border-[#6C3483]/30 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#6C3483]" /> Under
                  Active Trace
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {inProgressCount}
                </h2>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#22314D] pt-3 text-[10px] font-bold text-[#6C3483]">
                <span>ACTIVE SESSION</span>
                <span>DECOMPILING</span>
              </div>
            </div>

            {/* Completed */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-[#22314D] hover:border-[#10B981]/30 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />{" "}
                  Attested compliance
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {completedCount}
                </h2>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#22314D] pt-3 text-[10px] font-bold text-[#10B981]">
                <span>VERIFIED OK</span>
                <span>SIGNATURE HASHED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Task List Grid Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Header & Module Filter Rail */}
              <div className="glass-card p-5 rounded-2xl space-y-4 border border-[#22314D]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks, hashes, or modules..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/80 border border-[#22314D] rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#2F58CD] transition-all"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <SlidersHorizontal className="h-3.5 w-3.5" /> State:
                    </span>
                    <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-[#22314D]">
                      {["All", "Pending", "In Progress", "Completed"].map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                              statusFilter === st
                                ? "bg-[#2F58CD] text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {st}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Modules Horizontal Scrolling Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {modulesList.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => setActiveModule(mod)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap border transition-all duration-200 ${
                        activeModule === mod
                          ? "bg-[#2F58CD]/20 border-[#2F58CD] text-white"
                          : "bg-transparent border-[#22314D] text-slate-400 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      {mod} {mod !== "All" && `(${moduleCounts[mod] || 0})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting and Summary Control Strip */}
              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Displaying {filteredAndSortedTasks.length} tasks</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">
                    Sort By:
                  </span>
                  <div className="flex bg-[#0B0F19] p-0.5 rounded-lg border border-[#22314D]">
                    {(["None", "Priority", "Status"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSortChange(option)}
                        className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase transition-all ${
                          sortBy === option
                            ? "bg-blue-600/20 border border-blue-500 text-blue-400"
                            : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Tasks list */}
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredAndSortedTasks.length === 0 ? (
                  <div className="glass-card p-12 text-center rounded-2xl border border-[#22314D]">
                    <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">
                      No Matching Backlog Tasks Found
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Refine your keyword search or change module/status filters
                      to view corresponding program records.
                    </p>
                  </div>
                ) : (
                  filteredAndSortedTasks.map((task) => {
                    const isCompleted = task.status === "Completed";
                    const isInProgress = task.status === "In Progress";

                    return (
                      <div
                        key={task.id}
                        className={`glass-card p-5 rounded-xl border relative transition-all duration-400 flex items-start gap-4 ${
                          isCompleted
                            ? "border-[#10B981]/40 bg-[#10B981]/5 hover:border-[#10B981]/60"
                            : isInProgress
                              ? "border-[#6C3483]/40 bg-[#6C3483]/5 hover:border-[#6C3483]/60"
                              : "border-[#22314D] hover:border-[#2F58CD]/40"
                        }`}
                      >
                        {/* Checkbox selector */}
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-1 text-[#2F58CD] hover:scale-110 active:scale-95 transition-transform"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5.5 w-5.5 text-[#10B981]" />
                          ) : isInProgress ? (
                            <div className="h-5.5 w-5.5 rounded-full border-2 border-dashed border-[#6C3483] animate-spin flex items-center justify-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#6C3483]"></span>
                            </div>
                          ) : (
                            <Square className="h-5.5 w-5.5 text-slate-500" />
                          )}
                        </button>

                        {/* Task Info details */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 font-extrabold">
                              {task.id}
                            </span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md uppercase font-bold">
                              {task.module}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                task.priority === "High"
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : task.priority === "Medium"
                                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                          </div>

                          <h4
                            className={`text-xs font-bold text-white transition-all ${isCompleted ? "line-through text-slate-500" : ""}`}
                          >
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            {task.desc}
                          </p>
                        </div>

                        {/* Action buttons (Copy and Delete) */}
                        <div className="flex flex-col gap-1 self-start">
                          <button
                            onClick={() =>
                              handleCopyToClipboard(
                                JSON.stringify(task, null, 2),
                                `Task ${task.id}`,
                              )
                            }
                            className="text-slate-500 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                            title="Copy task details (ID, title, description, priority, and status) to clipboard as JSON."
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-500 hover:text-[#EF4444] p-1.5 rounded-lg hover:bg-[#EF4444]/10 transition-colors"
                            title="Permanently delete this task from the RootMaster backlog database. This cannot be undone."
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Dynamic Interactive Panel Suite (Add Task, Storage Guide, Firmware info) */}
            <div className="space-y-6">
              {/* Add Custom Task Form */}
              <div className="glass-card p-6 rounded-2xl border border-[#22314D] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#22314D] pb-3">
                  <Plus className="h-4.5 w-4.5 text-[#2F58CD]" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Add Custom Blueprint Task
                  </h3>
                </div>

                <form onSubmit={handleAddTask} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Mount odm.img partition and trace keys"
                      className="w-full bg-[#0B0F19] border border-[#22314D] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2F58CD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Module / Category
                    </label>
                    <select
                      value={newModule}
                      onChange={(e) => setNewModule(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-[#22314D] rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#2F58CD]"
                    >
                      {modulesList
                        .filter((m) => m !== "All")
                        .map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Priority
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full bg-[#0B0F19] border border-[#22314D] rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-[#2F58CD] hover:bg-[#3a6bf0] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Create Task</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Detailed description (Optional)
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Detail exact partition offsets, expected SHA-256 hashes, or terminal commands to run..."
                      rows={2}
                      className="w-full bg-[#0B0F19] border border-[#22314D] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2F58CD]"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ENGINEERING MANUAL */}
      {activeTab === "manual" && (
        <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-3xl border border-[#22314D] space-y-8 bg-gradient-to-b from-[#030712] to-[#070b14]">
            {/* Header */}
            <div className="border-b border-[#22314D] pb-6 space-y-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <FileText className="h-6 w-6 text-blue-500" /> ACING IU: GENESIS
                ENGINEERING MANUAL
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official architectural specification sheet details. Coordinates
                extraction, base bootstrapping, chroot setups, and bootloaders.
              </p>
            </div>

            {/* Part 1 */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-l-2 border-blue-500 pl-3">
                1. System Architecture Layout (RootMasterOS.iso)
              </h3>

              <div className="bg-[#020617] p-5 rounded-2xl border border-[#22314D] font-mono text-[11px] leading-relaxed text-slate-300">
                <span className="text-slate-500 font-sans block mb-2 font-bold">
                  {"// Compressed hybrid ISO image structure:"}
                </span>
                RootMasterOS.iso
                <br />
                |-- boot/{" "}
                <span className="text-slate-500">Bootloader components</span>
                <br />| |-- vmlinuz{" "}
                <span className="text-slate-500">Linux Kernel v6.8 image</span>
                <br />| |-- initrd{" "}
                <span className="text-slate-500">RAMDisk load state</span>
                <br />| |-- grub/{" "}
                <span className="text-slate-500">GRUB environment configs</span>
                <br />| | `-- grub.cfg{" "}
                <span className="text-slate-500">
                  Bootloader display list menu
                </span>
                <br />
                |-- filesystem.squashfs{" "}
                <span className="text-slate-500">
                  Ultra-compressed read-only rootfs (Ubuntu base + UI + apps)
                </span>
                <br />
                `-- EFI/{" "}
                <span className="text-slate-500">
                  UEFI secure startup modules
                </span>
              </div>
            </div>

            {/* Part 2 */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-l-2 border-blue-500 pl-3">
                2. Step-by-Step ISO Compiling Commands
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compile on any baremetal x86_64 Ubuntu machine with this exact
                sequence:
              </p>

              <div className="space-y-4 font-mono text-[11px]">
                {/* Step A */}
                <div className="p-4 rounded-xl border border-[#22314D] bg-[#020617] space-y-2">
                  <div className="flex justify-between items-center text-white font-sans text-xs">
                    <strong className="text-blue-400">
                      Step A: Install Compile Toolchain
                    </strong>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          "sudo apt update && sudo apt install -y debootstrap squashfs-tools xorriso grub-pc-bin mtools nodejs npm",
                          "Apt Command",
                        )
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <code className="text-purple-400 block">
                    sudo apt update && sudo apt install -y debootstrap
                    squashfs-tools xorriso grub-pc-bin mtools nodejs npm
                  </code>
                </div>

                {/* Step B */}
                <div className="p-4 rounded-xl border border-[#22314D] bg-[#020617] space-y-2">
                  <div className="flex justify-between items-center text-white font-sans text-xs">
                    <strong className="text-blue-400">
                      Step B: Debootstrap Ubuntu jammy
                    </strong>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          "sudo debootstrap jammy rootfs http://archive.ubuntu.com/ubuntu/",
                          "Debootstrap Command",
                        )
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <code className="text-purple-400 block">
                    sudo debootstrap jammy rootfs
                    http://archive.ubuntu.com/ubuntu/
                  </code>
                </div>

                {/* Step C */}
                <div className="p-4 rounded-xl border border-[#22314D] bg-[#020617] space-y-3 text-slate-300">
                  <div className="flex justify-between items-center text-white font-sans text-xs">
                    <strong className="text-blue-400">
                      Step C: Configure Startup `/usr/bin/start-os`
                    </strong>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          "#!/bin/bash\ncd /opt/rootmaster\nnode backend/server.js &\nnpm --prefix frontend start",
                          "Startup Script",
                        )
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    {"// Injected into rootfs/usr/bin/start-os:"}
                  </span>
                  <code className="text-purple-400 block whitespace-pre">
                    {`#!/bin/bash
cd /opt/rootmaster
node backend/server.js &
npm --prefix frontend start`}
                  </code>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    {"// Grant execution permission:"}
                  </span>
                  <code className="text-purple-400 block">
                    sudo chmod +x rootfs/usr/bin/start-os
                  </code>
                </div>

                {/* Step D */}
                <div className="p-4 rounded-xl border border-[#22314D] bg-[#020617] space-y-3">
                  <div className="flex justify-between items-center text-white font-sans text-xs">
                    <strong className="text-blue-400">
                      Step D: SquashFS Compression & ISO Output
                    </strong>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          "sudo mksquashfs rootfs iso/filesystem.squashfs -e boot\ngrub-mkrescue -o RootMasterOS.iso iso/",
                          "Compile command",
                        )
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <code className="text-purple-400 block">
                    sudo mksquashfs rootfs iso/filesystem.squashfs -e boot
                    <br />
                    grub-mkrescue -o RootMasterOS.iso iso/
                  </code>
                </div>
              </div>
            </div>

            {/* Part 3 */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-l-2 border-blue-500 pl-3">
                3. GRUB Configuration Spec (`grub.cfg`)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controls the initial boot options when loading the ISO inside
                any Virtual machine:
              </p>

              <div className="p-5 rounded-2xl border border-[#22314D] bg-[#020617] font-mono text-[11px] text-purple-400 space-y-1">
                <span>set timeout=5</span>
                <br />
                <span>
                  {
                    'menuentry "RootMasterOS Bootable Distro (Micki Hart Admin System)" {'
                  }
                </span>
                <br />
                <span className="pl-4">
                  linux /boot/vmlinuz boot=live quiet splash loglevel=3
                </span>
                <br />
                <span className="pl-4">initrd /boot/initrd</span>
                <br />
                <span>{"}"}</span>
              </div>
            </div>

            {/* Footnotes */}
            <div className="border-t border-[#22314D] pt-6 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
              <span>ACING IU: GENESIS ENGINEERING COOPERATIVE</span>
              <span>EST. 2026 - COMPLIANT CTIA 3.8.2</span>
            </div>
          </div>
        </div>
      )}

      {/* Export Blueprints Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#22314D] rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative animate-slideIn text-left">
            <div className="flex items-center justify-between border-b border-[#22314D] pb-4">
              <div className="flex items-center gap-2.5">
                <Package className="h-5 w-5 text-[#2F58CD]" />
                <h3 className="text-base font-bold text-white">
                  Acing IU: Genesis Master Project Blueprint Spec Export
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white font-extrabold uppercase text-[10px] px-3 py-1.5 rounded-lg border border-[#22314D] hover:bg-[#22314D]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              The following structured system specifications, bootloader
              parameters, database relationships, and 100+ Master Backlog tasks
              are ready for deployment or project integration.
            </p>

            <div className="bg-[#0B0F19] border border-[#22314D] rounded-xl p-4 max-h-[380px] overflow-y-auto font-mono text-[10px] text-purple-400 space-y-5 scrollbar-thin selection:bg-[#2F58CD]/30 selection:text-white">
              <div>
                <span className="text-white font-bold">
                  {
                    "// ========================================================================="
                  }
                </span>
                <br />
                <span className="text-white font-bold">
                  {
                    "// ACING IU: GENESIS LAB PROJECT SPECIFICATION & BACKLOG BLUEPRINT"
                  }
                </span>
                <br />
                <span className="text-white font-bold">
                  {
                    "// Target Platform: Samsung Galaxy S25 Ultra (SM-S938U Verizon Baseline)"
                  }
                </span>
                <br />
                <span className="text-white font-bold">
                  {
                    "// Bootable OS Base: Ubuntu Minimal ISO (debootstrap Linux Kernel v6.8)"
                  }
                </span>
                <br />
                <span className="text-white font-bold">
                  {
                    "// ========================================================================="
                  }
                </span>
                <br />
              </div>

              <div>
                <span className="text-blue-400 font-bold">
                  # 1. LIVE OS COMPILING ARCHITECTURE SCHEMA
                </span>
                <br />
                <span>* ISO NAME: RootMasterOS.iso</span>
                <br />
                <span>
                  {'* GRUB MENU ENTRY: "RootMasterOS Bootable Distro"'}
                </span>
                <br />
                <span>
                  * STARTUP ACTION: Auto Login to XFCE -&gt; Launch
                  `/usr/bin/start-os` script
                </span>
                <br />
                <span>* SERVICES RUNNING:</span>
                <br />
                <span> - Node.js backend/server.js (port 5000)</span>
                <br />
                <span> - React/Next.js frontend dev-server (port 3000)</span>
                <br />
                <span> - Android Magisk dynamic bindhost mounting loops</span>
                <br />
              </div>

              <div>
                <span className="text-blue-400 font-bold">
                  # 2. SUGGESTED DATABASE SCHEMA REPRESENTATIONS
                </span>
                <br />
                <span className="text-slate-500 font-sans">
                  {
                    "// Entities represent PostgreSQL relationships backed by Redis caching:"
                  }
                </span>
                <br />
                <span>
                  * Users (id UUID PRIMARY KEY, email VARCHAR UNIQUE,
                  password_hash VARCHAR, clearance_level INT)
                </span>
                <br />
                <span>
                  * Devices (id UUID, serial_number VARCHAR, model_code VARCHAR,
                  trust_score INT, status VARCHAR)
                </span>
                <br />
                <span>
                  * FirmwareRecords (id UUID, build_number VARCHAR,
                  system_img_sha256 VARCHAR, patch_date DATE)
                </span>
                <br />
                <span>
                  * BacklogTasks (id VARCHAR PRIMARY KEY, module_name VARCHAR,
                  title VARCHAR, priority VARCHAR, status VARCHAR)
                </span>
                <br />
                <span>
                  * AuditLogs (id UUID, operator_id UUID, timestamp TIMESTAMP,
                  action VARCHAR, signature VARCHAR)
                </span>
                <br />
              </div>

              <div>
                <span className="text-blue-400 font-bold">
                  # 3. ACING IU: GENESIS BACKLOG CHECKLIST PROGRESS DATA (
                  {completedCount} of {totalCount} completed)
                </span>
                <br />
                {tasks.map((t) => (
                  <div key={t.id} className="pl-4">
                    <span>{`[${t.status === "Completed" ? "x" : " "}] ${t.id} (${t.priority}): ${t.title}`}</span>
                    <br />
                    <span className="text-slate-500 pl-8">{`-> ${t.desc}`}</span>
                    <br />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#22314D] pt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                COMPILED BY ACING DECENTRALIZED COMPILER
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(tasks, null, 2));
                  triggerNotification("Backlog copied to clipboard!");
                }}
                className="bg-[#2F58CD] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:bg-blue-600"
                title="Copies the full array of task metadata objects (including titles, descriptions, priorities, and statuses) to clipboard as raw formatted JSON data."
              >
                Copy Raw Backlog JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
