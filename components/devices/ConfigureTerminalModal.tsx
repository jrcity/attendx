'use client'

import React, { useState, useEffect } from 'react'
import { Device } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Settings, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Radio, 
  Camera, 
  Key, 
  Clock, 
  MapPin, 
  Tag, 
  Cpu,
  Layers,
  Save
} from 'lucide-react'
import { useSystemMode } from '@/context/SystemModeContext'

interface ConfigureTerminalModalProps {
  device: Device
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConfigureTerminalModal({
  device,
  isOpen,
  onClose,
  onSuccess
}: ConfigureTerminalModalProps) {
  const { isSimulationMode } = useSystemMode()
  const [name, setName] = useState(device.name || '')
  const [location, setLocation] = useState(device.location || '')
  const [maxSlots, setMaxSlots] = useState<number>(device.maxSlots || 300)
  const [heartbeatInterval, setHeartbeatInterval] = useState<number>(device.heartbeatIntervalSeconds || 30)
  const [pinFallbackEnabled, setPinFallbackEnabled] = useState<boolean>(device.pinFallbackEnabled ?? true)
  const [cameraEvidenceEnabled, setCameraEvidenceEnabled] = useState<boolean>(device.cameraEvidenceEnabled ?? true)
  const [lcdLine1, setLcdLine1] = useState(device.lcdText?.[0] || '** ATTENDX TERMINAL **')
  const [lcdLine2, setLcdLine2] = useState(device.lcdText?.[1] || 'Ready for Scan...')

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const updatedLcdText = [
      lcdLine1.substring(0, 20),
      lcdLine2.substring(0, 20),
      `Time: Synced [${device.wifiStatus}]`,
      `Net: OK | Bat:${device.batteryStatus}%`
    ]

    if (isSimulationMode) {
      // In simulation mode, strictly mutate in-memory without calling real backend API
      setMsg({ text: '[Simulation] Terminal configuration stored locally in simulation state!', type: 'success' })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 700)
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/devices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: device.id,
          name: name.trim() || device.id,
          location: location.trim() || 'Unassigned Location',
          maxSlots: Number(maxSlots),
          heartbeatIntervalSeconds: Number(heartbeatInterval),
          pinFallbackEnabled,
          cameraEvidenceEnabled,
          lcdText: updatedLcdText,
          freeSlots: Math.max(0, Number(maxSlots) - (device.enrolledFingerprints || 0))
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update terminal settings.')
      }

      setMsg({ text: 'Terminal configuration dispatched and stored successfully!', type: 'success' })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: unknown) {
      setMsg({ 
        text: err instanceof Error ? err.message : 'Error updating configuration', 
        type: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-xl shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-800 text-white rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Configure Terminal
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware ID: <strong className="font-mono text-slate-800">{device.id}</strong> • IP: {device.ipAddress || '192.168.1.102'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="p-6 space-y-6">
            {msg && (
              <div className={`p-3.5 rounded-lg text-xs flex items-center space-x-2 ${
                msg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {msg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1 text-slate-500" /> Terminal Alias
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Science Lab North"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> Installation Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Building C, Room 204"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Hardware Capacities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1 text-slate-500" /> Sensor Capacity (Slots)
                </label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={maxSlots}
                  onChange={(e) => setMaxSlots(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <p className="text-[11px] text-slate-500">DY50 default is 300 templates</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> Heartbeat Interval (sec)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <p className="text-[11px] text-slate-500">Telemetry heartbeat period (15–30s recommended)</p>
              </div>
            </div>

            {/* Peripheral Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subsystem Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinFallbackEnabled}
                    onChange={(e) => setPinFallbackEnabled(e.target.checked)}
                    className="w-4 h-4 text-slate-800 rounded border-slate-300 focus:ring-slate-800"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">4×4 Keypad Fallback</p>
                    <p className="text-slate-500 text-[11px]">Allow manual PIN input</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cameraEvidenceEnabled}
                    onChange={(e) => setCameraEvidenceEnabled(e.target.checked)}
                    className="w-4 h-4 text-slate-800 rounded border-slate-300 focus:ring-slate-800"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">ESP32-CAM Snapshot</p>
                    <p className="text-slate-500 text-[11px]">Capture JPEG on keypad auth</p>
                  </div>
                </label>
              </div>
            </div>

            {/* LCD Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <Radio className="w-3.5 h-3.5 mr-1 text-slate-500" /> 20×4 LCD Default Greeting
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  maxLength={20}
                  value={lcdLine1}
                  onChange={(e) => setLcdLine1(e.target.value)}
                  placeholder="Line 1 (Max 20 chars)"
                  className="text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <input
                  type="text"
                  maxLength={20}
                  value={lcdLine2}
                  onChange={(e) => setLcdLine2(e.target.value)}
                  placeholder="Line 2 (Max 20 chars)"
                  className="text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
