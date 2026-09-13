"use client";

import React from "react";
import {
  ShieldAlert,
  Lock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

/**
 * RootMaster operator surface is intentionally disabled.
 *
 * Issue #63 (claim-surface blocker) requires that no public UI present
 * unsupported Knox/certification/firmware/root/bootloader/flash claims
 * or affordances that could be read as live device operations.
 *
 * Re-enable only after:
 * - capability-to-evidence mapping is reviewed
 * - destructive actions are gated behind auth + device allowlist
 * - all remaining labels use explicit fixture / not-available language
 */
export default function RootMasterLab() {
  return (
    <div className="space-y-8 animate-fadeIn text-slate-200 min-h-screen max-w-3xl mx-auto py-10">
      <div className="rounded-2xl border-2 border-red-500/70 bg-red-950/50 p-8 space-y-5">
        <div className="flex items-center gap-3 text-red-300">
          <ShieldAlert className="h-8 w-8 shrink-0" />
          <h1 className="text-xl font-extrabold uppercase tracking-wider">
            RootMaster unavailable
          </h1>
        </div>

        <p className="text-sm leading-relaxed text-red-100 font-medium">
          This operator surface is <strong>disabled</strong>. It does not root,
          unlock, flash, decompile, inject modules, read hardware fuses, perform
          attestation, or modify any physical device.
        </p>

        <div className="rounded-xl border border-red-500/40 bg-black/30 p-4 space-y-2 text-xs text-red-100/90">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>
              All simulated build, Magisk, bootloader, warranty-fuse, and
              certification workflows have been removed from the public UI until
              safety gates and claim evidence are complete (see issue #63).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              No Knox, carrier-certification, or hardware-attestation claims are
              operational from this application.
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
          Research and fixture work continues in non-operator documentation and
          internal branches. Re-enabling this page requires an explicit review
          that every remaining control is either fixture-only or backed by
          verified device safety controls.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2F58CD] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to simulator dashboard
        </Link>
      </div>
    </div>
  );
}
