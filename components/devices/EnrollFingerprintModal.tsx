'use client'

import React, { useState, useEffect } from 'react'
import { Device } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Fingerprint, 
  X, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Radio, 
  RefreshCw, 
  Sliders, 
  Layers,
  HardDrive
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemMode } from '@/context/SystemModeContext'

interface UserOption {
  id: string
  name: string
  role: string
  status: string
  hasFingerprint: boolean
  slotNumber?: number
}

interface EnrollFingerprintModalProps {
  device: Device
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EnrollFingerprintModal({
  device,
  isOpen,
  onClose,
  onSuccess
}: EnrollFingerprintModalProps) {
  const { isSimulationMode, simState, triggerSimulatedEnrollment } = useSystemMode()
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [targetSlot, setTargetSlot] = useState<number>(1)
  
  // Status tracking
  const [status, setStatus] = useState<'IDLE' | 'ARMING' | 'PENDING_TERMINAL_PICKUP' | 'WAITING_FOR_FINGER' | 'SUCCESS' | 'FAILED'>('IDLE')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [enrolledResult, setEnrolledResult] = useState<{
    enrolledSlots: number
    freeSlots: number
    maxSlots: number
    slotNumber: number
    userName: string
  } | null>(null)
  const [failureReason, setFailureReason] = useState<string>('')

  // Terminal slot counts
  const maxSlots = device.maxSlots || 300
  const enrolledSlots = device.enrolledFingerprints !== undefined ? device.enrolledFingerprints : 2
  const freeSlots = device.freeSlots !== undefined ? device.freeSlots : Math.max(0, maxSlots - enrolledSlots)

  // Fetch users and find the next free slot
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    if (isSimulationMode) {
      // In simulation mode: zero API requests
      const mappedUsers: UserOption[] = simState.users.map((u, idx) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        status: u.status,
        hasFingerprint: idx < 2,
        slotNumber: idx < 2 ? idx + 1 : undefined
      }))
      setUsers(mappedUsers)
      const firstUnenrolled = mappedUsers.find(u => !u.hasFingerprint)
      if (firstUnenrolled) {
        setSelectedUserId(firstUnenrolled.id)
      } else if (mappedUsers.length > 0) {
        setSelectedUserId(mappedUsers[0].id)
      }
      setTargetSlot(3)
      setLoadingUsers(false)
      return
    }

    const loadData = async () => {
      try {
        const res = await fetch(`/api/devices/enrollment?deviceId=${encodeURIComponent(device.id)}`)
        const data = await res.json()
        if (!isMounted) return

        if (data.users) {
          const mappedUsers = data.users.map((u: {
            userId: string
            name: string
            role: string
            hasFingerprint: boolean
            slotNumber?: number
          }) => ({
            id: u.userId,
            name: u.name,
            role: u.role,
            status: 'Active',
            hasFingerprint: u.hasFingerprint,
            slotNumber: u.slotNumber
          }))
          setUsers(mappedUsers)

          // Pick the first user without fingerprint if available
          const firstUnenrolled = mappedUsers.find((u: UserOption) => !u.hasFingerprint)
          if (firstUnenrolled) {
            setSelectedUserId(firstUnenrolled.id)
          } else if (mappedUsers.length > 0) {
            setSelectedUserId(mappedUsers[0].id)
          }

          // Calculate next slot number
          const usedSlots = mappedUsers
            .map((u: UserOption) => u.slotNumber || 0)
            .filter((s: number) => s > 0)
          const nextAvailable = usedSlots.length > 0 ? Math.max(...usedSlots) + 1 : 1
          setTargetSlot(nextAvailable)
        }
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        if (isMounted) setLoadingUsers(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isOpen, device.id, isSimulationMode, simState.users])

  // When selected user changes, auto-suggest slot
  const handleUserChange = (uId: string) => {
    setSelectedUserId(uId)
    const user = users.find(u => u.id === uId)
    if (user?.slotNumber) {
      setTargetSlot(user.slotNumber)
    }
  }

  // Trigger enrollment command
  const handleTriggerEnrollment = async () => {
    if (!selectedUserId) return

    const selectedUser = users.find(u => u.id === selectedUserId)
    if (!selectedUser) return

    setStatus('ARMING')
    setStatusMessage(`Queuing enrollment command for terminal ${device.id}...`)
    setFailureReason('')
    setElapsedSeconds(0)

    if (isSimulationMode) {
      // In Simulation Mode: handle 100% locally with zero API interaction
      setStatus('WAITING_FOR_FINGER')
      setStatusMessage(`[Simulation] Terminal armed! Capturing simulated biometric scan for ${selectedUser.name}...`)
      setTimeout(() => {
        triggerSimulatedEnrollment(selectedUserId, targetSlot)
        setStatus('SUCCESS')
        setStatusMessage(`[Simulation] Successfully enrolled fingerprint for ${selectedUser.name} into Slot #${targetSlot}!`)
        setEnrolledResult({
          enrolledSlots: enrolledSlots + 1,
          freeSlots: Math.max(0, freeSlots - 1),
          maxSlots,
          slotNumber: Number(targetSlot),
          userName: selectedUser.name
        })
        onSuccess()
      }, 1200)
      return
    }

    try {
      // Step 1: Queue job in Firestore for ESP32
      const armRes = await fetch('/api/devices/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'QUEUE_ENROLLMENT',
          deviceId: device.id,
          userId: selectedUserId,
          slotNumber: Number(targetSlot)
        })
      })

      if (!armRes.ok) {
        throw new Error('Failed to queue terminal enrollment command.')
      }

      const armData = await armRes.json()
      const currentJobId = armData.job?.jobId

      setStatus('PENDING_TERMINAL_PICKUP')
      setStatusMessage(`Command queued in Firestore! Waiting for terminal ${device.id} to fetch command on next heartbeat...`)

      // Track elapsed seconds
      const startTime = Date.now()
      const timerInterval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      // Poll real job status from terminal
      let attempts = 0
      const maxAttempts = 45 // 90 seconds
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const pollRes = await fetch(`/api/devices/enrollment?jobId=${currentJobId}&deviceId=${encodeURIComponent(device.id)}`)
          if (pollRes.ok) {
            const pollData = await pollRes.json()

            if (pollData.status === 'PENDING_SCAN' || pollData.status === 'SCANNING' || pollData.status === 'EXECUTING') {
              setStatus('WAITING_FOR_FINGER')
              setStatusMessage(`Terminal armed & scanning! Waiting for ${selectedUser.name} to place finger twice on DY50 optical sensor (Slot #${targetSlot})...`)
            } else if (pollData.status === 'COMPLETED' || pollData.status === 'SUCCESS') {
              clearInterval(pollInterval)
              clearInterval(timerInterval)
              setStatus('SUCCESS')
              setStatusMessage(`Hardware confirmed! Successfully registered fingerprint for ${selectedUser.name} in Slot #${targetSlot}!`)
              setEnrolledResult({
                enrolledSlots: (device.enrolledFingerprints || 0) + 1,
                freeSlots: Math.max(0, (device.maxSlots || 300) - ((device.enrolledFingerprints || 0) + 1)),
                maxSlots: device.maxSlots || 300,
                slotNumber: Number(targetSlot),
                userName: selectedUser.name
              })
              onSuccess()
              return
            } else if (pollData.status === 'FAILED' || pollData.status === 'ERROR') {
              clearInterval(pollInterval)
              clearInterval(timerInterval)
              setStatus('FAILED')
              setFailureReason(pollData.job?.reason || pollData.reason || 'Terminal reported scan failure or sensor timeout.')
              return
            }
          }
        } catch {
          // Continue polling
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          clearInterval(timerInterval)
          setStatus('FAILED')
          setFailureReason('Enrollment timed out: No hardware scan completion received after 90 seconds. Ensure the ESP32 terminal is powered on, connected to Wi-Fi, and user places finger firmly twice on the DY50 sensor.')
        }
      }, 2000)

    } catch (err: unknown) {
      setStatus('FAILED')
      setFailureReason(err instanceof Error ? err.message : 'Error sending enrollment event')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Enroll Fingerprint on Terminal
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Terminal: <strong className="font-mono text-slate-800">{device.name || device.id}</strong> ({device.id}) • Optical Sensor: DY50
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

        <CardContent className="p-6 space-y-6">
          {/* Capacity Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Capacity</span>
              <p className="text-base font-bold text-slate-800">{maxSlots} Slots</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600">Enrolled Slots</span>
              <p className="text-base font-bold text-emerald-700">{enrolledSlots}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600">Available Free</span>
              <p className="text-base font-bold text-blue-700">{freeSlots}</p>
            </div>
          </div>

          {/* Form */}
          {status === 'IDLE' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-500" /> Select User to Enroll
                </label>
                {loadingUsers ? (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-400 animate-pulse">Loading database users...</div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id}) — {u.role} {u.hasFingerprint ? `[Currently in Slot #${u.slotNumber}]` : '[Pending Biometrics]'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-slate-500" /> Target EEPROM Slot Number (1–{maxSlots})
                  </span>
                  <span className="text-[11px] text-emerald-600 font-normal">Auto-assigned next free slot</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxSlots}
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Biometric Handshake Process
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Clicking <strong>&quot;Arm Terminal &amp; Begin Scan&quot;</strong> dispatches a command to the ESP32. 
                  The terminal LCD will prompt the user to place their finger twice on the optical sensor glass. 
                  Once stored in EEPROM Slot #{targetSlot}, the hardware confirms completion back to this dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerEnrollment}
                  disabled={!selectedUserId || loadingUsers}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5 mr-1.5" />
                  Arm Terminal &amp; Begin Scan
                </button>
              </div>
            </div>
          )}

          {/* Progress / Waiting Screen */}
          {(status === 'ARMING' || status === 'PENDING_TERMINAL_PICKUP' || status === 'WAITING_FOR_FINGER') && (
            <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                  <Radio className="w-4 h-4 mr-2 animate-pulse text-emerald-400" />
                  Live Terminal Biometric Session
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Elapsed: {elapsedSeconds}s
                </span>
              </div>

              {/* LCD Terminal Display Preview */}
              <div className="p-4 bg-black/80 rounded-lg border border-emerald-500/30 font-mono text-xs text-emerald-400 space-y-1 shadow-inner">
                <div>[LINE 1] ** ENROLL USER **</div>
                <div>[LINE 2] {status === 'WAITING_FOR_FINGER' ? 'PLACE FINGER (1/2)' : 'DISPATCHING CMD...'}</div>
                <div>[LINE 3] User ID: {selectedUserId} (Slot #{targetSlot})</div>
                <div>[LINE 4] {status === 'WAITING_FOR_FINGER' ? 'DY50 Prism Active' : 'Polling Heartbeat...'}</div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-slate-200 font-medium">{statusMessage}</p>
                <p className="text-[11px] text-slate-400">
                  Terminal ID: <code className="text-emerald-400">{device.id}</code> • Please have the student/staff touch the blue optical prism on the terminal.
                </p>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {status === 'SUCCESS' && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Enrollment Successfully Confirmed!</h4>
                  <p className="text-xs text-emerald-700">{statusMessage}</p>
                </div>
              </div>

              {enrolledResult && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-500">User:</span>
                    <p className="font-bold text-slate-800">{enrolledResult.userName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Slot:</span>
                    <p className="font-bold font-mono text-emerald-700">Slot #{enrolledResult.slotNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('IDLE')
                    onClose()
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Failure Screen */}
          {status === 'FAILED' && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-800">
                <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Enrollment Incomplete</h4>
                  <p className="text-xs text-rose-700">{failureReason || 'Terminal failed to capture fingerprint.'}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatus('IDLE')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
