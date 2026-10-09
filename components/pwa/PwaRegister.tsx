'use client';

import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        });
    }

    // 2. Catch PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 5000);
      console.log('[PWA] App successfully installed');
    };

    // 3. Online/Offline network detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center space-x-2 shadow-md animate-in slide-in-from-top duration-200">
          <WifiOff className="w-4 h-4 text-slate-950" />
          <span>Working in Offline Mode. Buffered logs will sync once reconnected.</span>
        </div>
      )}

      {/* Installed Success Toast */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>AttendX installed successfully on your device!</span>
        </div>
      )}

      {/* Floating PWA Install Card */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-5 left-5 z-50 max-w-sm rounded-2xl bg-[#162542]/95 border border-[#136CFC]/40 p-4 shadow-2xl backdrop-blur-xl text-white animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#136CFC] flex items-center justify-center font-bold text-white shadow-md shadow-[#136CFC]/30">
                <span className="text-xs">AX</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Install AttendX App</h4>
                <p className="text-[10px] text-slate-300">Engineered by Team RAMP</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-normal mb-3">
            Add AttendX to your home screen or desktop for instant biometric monitoring and offline access.
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#136CFC] hover:bg-[#0d5ad4] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-[#136CFC]/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="py-1.5 px-3 rounded-lg bg-[#21355a] hover:bg-[#28416d] text-slate-300 text-xs font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
