"use client"
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileBarChart, Download, FileSpreadsheet, Calendar, Filter, Sparkles } from 'lucide-react'
import { useSystemMode } from '@/context/SystemModeContext'

export default function ReportsPage() {
  const { isSimulationMode, simState } = useSystemMode()
  const [exporting, setExporting] = useState(false)
  
  // Report Config State
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [role, setRole] = useState("All Roles")
  const [method, setMethod] = useState("All Methods")
  const [status, setStatus] = useState("All Statuses")

  const handleExport = async () => {
    setExporting(true)
    
    try {
      let rawData: any[] = []

      if (isSimulationMode) {
        rawData = simState.attendance.map(a => {
          const u = simState.users.find(usr => usr.id === a.userId)
          return {
            ...a,
            user: { name: u?.name || 'Unknown', role: u?.role || 'Student' }
          }
        })
      } else {
        const res = await fetch('/api/attendance/history')
        if (!res.ok) throw new Error('Failed to load history from backend')
        rawData = await res.json().catch(() => [])
      }
      
      const filtered = (Array.isArray(rawData) ? rawData : []).filter((record: any) => {
        const d = record.date
        const matchesStart = !startDate || d >= startDate
        const matchesEnd = !endDate || d <= endDate
        const matchesRole = role === "All Roles" || record.user?.role === role
        const matchesMethod = method === "All Methods" || 
                              (record.checkInMode && record.checkInMode.toLowerCase() === method.toLowerCase()) ||
                              (record.checkOutMode && record.checkOutMode.toLowerCase() === method.toLowerCase())
        const matchesStatus = status === "All Statuses" || record.status === status
        
        return matchesStart && matchesEnd && matchesRole && matchesMethod && matchesStatus
      })

      if (filtered.length === 0) {
        alert("No records found for the selected configuration.")
        setExporting(false)
        return
      }

      const headers = ['Date', 'Time', 'Name', 'User ID', 'Role', 'Check-In Mode', 'Check-Out Mode', 'Status', 'Late Duration (m)', 'Device ID', 'Sync Status']
      const rows = filtered.map((r: any) => [
        r.date,
        new Date(r.checkInTime || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${r.user?.name || 'Unknown'}"`, 
        r.userId,
        r.user?.role || 'Student',
        r.checkInMode || '-',
        r.checkOutMode || '-',
        r.status,
        r.lateDurationMinutes || 0,
        r.deviceId,
        r.syncStatus
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map((e: any[]) => e.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `attendx_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error(err)
      alert("Failed to export report.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Reports & Exports</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export custom attendance logs, compliance records, and authentication audit trails.
          </p>
        </div>

        {isSimulationMode && (
          <span className="flex items-center text-xs text-purple-700 font-semibold bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600 animate-spin" /> Simulation Active (Zero DB Ops)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Filter Controls */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Export Criteria</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">From Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">To Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Roles</option>
                  <option>Student</option>
                  <option>Staff</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Auth Method</label>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Methods</option>
                  <option value="fingerprint">Fingerprint (DY50)</option>
                  <option value="pin">Keypad PIN</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Statuses</option>
                  <option>Present</option>
                  <option>Late</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Generating CSV Report..." : "Download CSV Attendance Export"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Information Cards */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Format Specifics</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Exported CSV files are compatible with Microsoft Excel, Google Sheets, and institutional payroll/SIS databases.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Auditing & Retention</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Attendance timestamps are recorded in UTC ISO-8601 format and synchronized across physical terminals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
