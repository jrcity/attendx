'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, LayoutDashboard, Cpu } from 'lucide-react';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#162542] flex items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#0e192c] p-1.5 flex items-center justify-center border border-[#136CFC]/40 shadow-lg shadow-[#136CFC]/20">
          <img src="/brand/logo.png" alt="AttendX Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-left">
          <h2 className="text-base font-extrabold text-white leading-none">
            ATTEND<span className="text-[#C4F84B]">X</span>
          </h2>
          <span className="text-[10px] font-bold text-[#00f2fe] uppercase tracking-wider">
            By Team RAMP
          </span>
        </div>
      </div>

      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
        <WifiOff className="w-7 h-7" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        Offline Mode
      </h1>
      <p className="text-xs text-slate-300 leading-relaxed mb-6">
        You are currently disconnected from the network. AttendX offline cache is active. Any scanned transactions buffered in terminal SPIFFS memory will synchronize automatically when your connection is restored.
      </p>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-[#21355a] text-left text-xs mb-6 space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
          <Cpu className="w-4 h-4 text-[#C4F84B]" />
          <span>Terminal Edge Buffering Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Physical ESP32 terminals store biometric logs locally in non-volatile flash until the cloud handshake re-establishes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleReload}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#136CFC] hover:bg-[#0d5ad4] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-[#136CFC]/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
        <Link
          href="/"
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#21355a] hover:bg-[#28416d] text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-white/10"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
