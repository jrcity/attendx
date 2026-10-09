'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  History, 
  Camera, 
  FileBarChart, 
  HardDrive,
  Sparkles,
  Database,
  Cpu,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { useSystemMode } from '@/context/SystemModeContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Live Feed', href: '/attendance', icon: Clock },
  { name: 'History', href: '/attendance/history', icon: History },
  { name: 'PIN Evidence', href: '/attendance/evidence', icon: Camera },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Devices', href: '/devices', icon: HardDrive },
  { name: 'Admin Control', href: '/admin-control', icon: ShieldCheck },
  { name: 'Firmware Blueprint', href: '/contract', icon: FileCode },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isSimulationMode, toggleSimulationMode } = useSystemMode();

  return (
    <div className="flex h-full w-64 flex-col bg-[#162542] border-r border-[#21355a] flex-shrink-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[#21355a]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#136CFC] flex items-center justify-center font-bold text-white shadow-md shadow-[#136CFC]/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            ATTEND<span className="text-[#C4F84B]">X</span>
          </h1>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = (() => {
              if (item.href === '/') {
                return pathname === '/';
              }
              if (item.href === '/attendance') {
                return pathname === '/attendance';
              }
              return (
                pathname === item.href ||
                (pathname.startsWith(item.href + '/') &&
                  !navigation.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.length > item.href.length &&
                      pathname.startsWith(other.href)
                  ))
              );
            })();

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  isActive
                    ? 'bg-[#136CFC] text-white shadow-sm shadow-[#136CFC]/30'
                    : 'text-slate-300 hover:bg-[#21355a]/70 hover:text-white',
                  'group flex items-center rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                    'mr-3 h-4 w-4 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mode Status Footer */}
      <div className="p-4 border-t border-[#21355a] bg-[#0e192c]/70 flex flex-col gap-2">
        {isSimulationMode ? (
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulation Demo Mode</span>
            </div>
            <p className="text-[10px] text-purple-300/70 mt-1">
              Zero DB reads/writes. In-memory mock pipeline active.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#C4F84B]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C4F84B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C4F84B]"></span>
              </span>
              <span>Cloud Firestore (Live)</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate" title="ai-studio-attendx">
              Hardware ESP32 sync enabled
            </p>
          </div>
        )}
        
        {/* Mobile / Universal Toggle Button */}
        <button
          type="button"
          onClick={toggleSimulationMode}
          className="md:hidden mt-2 w-full py-1.5 rounded bg-[#21355a] hover:bg-[#28416d] text-[10px] text-slate-200 font-semibold border border-[#2d497c] transition-colors"
        >
          Switch to {isSimulationMode ? 'Live DB' : 'Simulation'}
        </button>
      </div>
    </div>
  );
}
