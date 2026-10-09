import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const viewport: Viewport = {
  themeColor: '#162542',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'AttendX | Smart Biometric Attendance Management',
  description: 'Reliable attendance system with ESP32-CAM, SFM-V1.7 optical fingerprint, and PIN fallback. Built by Team RAMP.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AttendX',
  },
  icons: {
    icon: '/brand/logo.png',
    apple: '/icons/icon-192.png',
    shortcut: '/brand/logo.png',
  },
  openGraph: {
    title: 'AttendX',
    description: 'Smart Attendance Management System by Team RAMP.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AttendX',
    description: 'Smart Attendance Management System by Team RAMP.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex antialiased" suppressHydrationWarning>
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
