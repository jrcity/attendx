"use client"
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Download, Filter, ChevronLeft, ChevronRight, RefreshCw, LogIn, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemMode } from '@/context/SystemModeContext'

export default function HistoryPage() {
  const { isSimulationMode, simState } = useSystemMode()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("All Roles")
  const [modeFilter, setModeFilter] = useState("All Methods")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const fetchHistory = useCallback(() => {
    if (isSimulationMode) return

    fetch('/api/attendance/history')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [isSimulationMode])

  useEffect(() => {
    if (!isSimulationMode) {
      fetchHistory()
      const interval = setInterval(fetchHistory, 5000)
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [isSimulationMode, fetchHistory])

  // Derive simulation history in-memory with zero API calls
  const simulationDerivedHistory = useMemo(() => {
    if (!isSimulationMode) return []
    return simState.attendance.map(a => {
      const user = simState.users.find(u => u.id === a.userId)
      const hasImage = simState.images.some(img => img.attendanceId === a.id)
      const isCheckedOut = Boolean(a.checkOutTime)
      return {
        ...a,
        user: { name: user?.name || 'Unknown', role: user?.role || 'Student' },
        hasImage,
        isCheckedOut,
        lastEventType: isCheckedOut ? 'CHECK_OUT' : 'CHECK_IN',
        lastEventTime: a.checkOutTime || a.checkInTime || a.createdAt
      }
    }).sort((a, b) => {
      const timeB = Math.max(new Date(b.checkOutTime || 0).getTime(), new Date(b.checkInTime || b.createdAt).getTime())
      const timeA = Math.max(new Date(a.checkOutTime || 0).getTime(), new Date(a.checkInTime || a.createdAt).getTime())
      return timeB - timeA
    })
  }, [isSimulationMode, simState])

  const activeHistory = isSimulationMode ? simulationDerivedHistory : history

  const filteredHistory = activeHistory.filter(record => {
    const userName = record?.user?.name || ''
    const userId = record?.userId || ''
    const userRole = record?.user?.role || ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          userId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || record.date === dateFilter
    const matchesRole = roleFilter === "All Roles" || userRole === roleFilter
    const matchesMode = modeFilter === "All Methods" || 
                        (record.checkInMode && record.checkInMode.toLowerCase() === modeFilter.toLowerCase()) ||
                        (record.checkOutMode && record.checkOutMode.toLowerCase() === modeFilter.toLowerCase())
    
    return matchesSearch && matchesDate && matchesRole && matchesMode
  })

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize))
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const startIndex = filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(filteredHistory.length, currentPage * pageSize)

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'User ID', 'Name', 'Role', 'Check-In Mode', 'Check-Out Mode', 'Status', 'Late Duration (mins)', 'Device ID', 'Sync Status']
    const rows = filteredHistory.map(r => [
      r.date,
      new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      r.userId,
      `"${r.user?.name || 'Unknown'}"`,
      r.user?.role || 'Unknown',
      r.checkInMode || '-',
      r.checkOutMode || '-',
      r.status,
      r.lateDurationMinutes || 0,
      r.deviceId,
      r.syncStatus
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendx_history_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attendance History Logs</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSimulationMode ? 'Simulated transaction ledger. Zero DB operations.' : 'Audit trail of all biometric and keypad authentication events received from ESP32 terminals.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isSimulationMode && (
            <span className="flex items-center text-xs text-purple-700 font-semibold bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600 animate-spin" /> Simulation Active
            </span>
          )}
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 h-10 px-4 py-2 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Export Filtered CSV
          </button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or User ID..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Roles</option>
              <option>Student</option>
              <option>Staff</option>
            </select>
            <select 
              value={modeFilter}
              onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Methods</option>
              <option value="fingerprint">Fingerprint (DY50)</option>
              <option value="pin">Keypad PIN</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Date & Timestamp</th>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Event Type</th>
                <th className="px-6 py-4 font-medium">Auth Mode</th>
                <th className="px-6 py-4 font-medium">Status / Late</th>
                <th className="px-6 py-4 font-medium">Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isSimulationMode && loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <div className="inline-flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((record) => {
                  const isCheckedOut = Boolean(record.checkOutTime)
                  const displayTime = isCheckedOut ? record.checkOutTime : (record.checkInTime || record.createdAt)
                  const displayMode = isCheckedOut ? (record.checkOutMode || record.checkInMode) : record.checkInMode

                  return (
                    <tr key={record.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{record.date}</div>
                        <div className="text-slate-400">
                          {displayTime ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{record.user?.name || 'Unknown'}</div>
                        <div className="font-mono text-xs text-slate-500">{record.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-full inline-block",
                          record.user?.role === 'Student' ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                        )}>
                          {record.user?.role || 'Student'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isCheckedOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <LogOut className="w-3 h-3 mr-1" /> Check-Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <LogIn className="w-3 h-3 mr-1" /> Check-In
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase font-mono tracking-wider",
                          displayMode === 'fingerprint' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        )}>
                          {displayMode || 'fingerprint'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-semibold",
                            record.status === 'Present' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {record.status}
                          </span>
                          {record.lateDurationMinutes > 0 && (
                            <span className="text-xs text-amber-600 font-medium">
                              +{record.lateDurationMinutes}m late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {record.deviceId}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{startIndex}</span> to{" "}
            <span className="font-semibold text-slate-800">{endIndex}</span> of{" "}
            <span className="font-semibold text-slate-800">{filteredHistory.length}</span> records
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors",
                currentPage === 1 
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50" 
                  : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                  currentPage === pageNum
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm font-semibold"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={cn(
                "inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors",
                currentPage === totalPages || totalPages === 0
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50" 
                  : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
              )}
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
