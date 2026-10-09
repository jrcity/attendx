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
      <div className="w-full max-w-md rounded-2xl bg-[#0e192c]/90 border border-[#21355a] p-8 text-center text-white shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-5 text-amber-400">
          <WifiOff className="w-8 h-8" />
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
    </div>
  );
}
