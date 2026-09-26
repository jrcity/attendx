# AttendX Hardware Integration & Firmware Contract Specification

## Overview
This document defines the complete API contract between AttendX physical terminals (ESP32-WROOM-32 with DY50 Optical Fingerprint Sensor and ESP32-CAM) and the Backend Cloud API.

All endpoints support both `camelCase` and `snake_case` keys, single JSON objects, direct JSON arrays (`[{...}]`), and batch objects (`{"batch": [...]}`).

---

## Endpoints

### 1. Telemetry & Heartbeat Polling
- **Route:** `POST /api/devices/telemetry` or `POST /api/v1/devices/telemetry`
- **Headers:** `Content-Type: application/json`
- **Interval:** Every 30 seconds
- **Request Payload:**
```json
{
  "deviceId": "DEV_TERM_01",
  "wifiStatus": "Connected",
  "rssi": -58,
  "ipAddress": "192.168.1.102",
  "macAddress": "24:0A:C4:B8:3A:1E",
  "powerStatus": "AC",
  "batteryStatus": 95,
  "voltage": "4.15V",
  "esp32Heap": "284 KB Free / 520 KB",
  "pendingRecords": 0,
  "firmwareVersion": "AttendX-FW v2.4.1",
  "maxSlots": 300,
  "enrolledFingerprints": 2,
  "lcdText": [
    "** ATTENDX TERMINAL **",
    "Ready for Scan...",
    "Time: Synced",
    "Net: CONNECTED"
  ]
}
```
- **Response Payload (HTTP 200 OK):**
```json
{
  "ok": true,
  "success": true,
  "deviceId": "DEV_TERM_01",
  "serverTime": "2026-09-24T18:30:00.000Z",
  "terminalStatus": "ACKNOWLEDGED",
  "nextHeartbeatIntervalSeconds": 30,
  "activeEnrolledFingerprints": 2,
  "commands": [
    {
      "commandId": "cmd_enroll_9021",
      "type": "ENROLL_FINGERPRINT",
      "userId": "USR001"
    }
  ]
}
```

---

### 2. Check-In & Check-Out (Fingerprint & Keypad PIN)
- **Routes:** 
  - `POST /api/attendance/checkin` or `POST /api/attendance/check-in`
  - `POST /api/attendance/checkout` or `POST /api/attendance/check-out`
  - `POST /api/v1/attendance/check-in` or `POST /api/v1/attendance/checkin`
  - `POST /api/v1/attendance/check-out` or `POST /api/v1/attendance/checkout`

#### A. Optical Fingerprint Scan (DY50 Match)
```json
{
  "deviceId": "DEV_TERM_01",
  "slotNumber": 2,
  "authMode": "fingerprint",
  "direction": "IN",
  "timestamp": "2026-09-24T08:52:14.000Z",
  "offlineBuffered": false
}
```

#### B. Keypad PIN Entry
```json
{
  "deviceId": "DEV_TERM_01",
  "userId": "USR001",
  "authMode": "pin",
  "direction": "IN",
  "timestamp": "2026-09-24T08:55:00.000Z",
  "offlineBuffered": false
}
```

#### C. Response Payload (HTTP 201 Created)
```json
{
  "ok": true,
  "success": true,
  "eventType": "CHECK_IN",
  "processedCount": 1,
  "attendanceId": "ATT_1727202720100_A9B2",
  "eventId": "ATT_1727202720100_A9B2",
  "userId": "USR001",
  "userName": "John Doe",
  "userRole": "Student",
  "status": "Present",
  "isLate": false,
  "lateMinutes": 0,
  "displayMessage": "WELCOME, JOHN!",
  "checkInTime": "2026-09-24T08:52:14.000Z",
  "checkOutTime": null,
  "serverTime": "2026-09-24T08:52:15.000Z"
}
```

---

### 3. Check-Out Event
When checking out (either by sending `direction: "OUT"`, calling `/api/attendance/checkout`, or scanning again later in the day), the backend updates `checkOutTime` and sets `displayMessage` to `"GOODBYE, <NAME>!"`:
```json
{
  "deviceId": "DEV_TERM_01",
  "slotNumber": 2,
  "authMode": "fingerprint",
  "direction": "OUT",
  "timestamp": "2026-09-24T17:15:00.000Z"
}
```
Response:
```json
{
  "ok": true,
  "success": true,
  "eventType": "CHECK_OUT",
  "attendanceId": "ATT_1727202720100_A9B2",
  "userId": "USR001",
  "userName": "John Doe",
  "displayMessage": "GOODBYE, JOHN!",
  "checkInTime": "2026-09-24T08:52:14.000Z",
  "checkOutTime": "2026-09-24T17:15:00.000Z",
  "serverTime": "2026-09-24T17:15:01.000Z"
}
```

---

### 4. Biometric Enrollment
- **Routes:** `POST /api/devices/enrollment` or `POST /api/v1/devices/enrollment`
```json
{
  "action": "COMPLETE_ENROLLMENT",
  "deviceId": "DEV_TERM_01",
  "userId": "USR001",
  "slotNumber": 3
}
```
Response:
```json
{
  "ok": true,
  "ack": true,
  "success": true,
  "status": "SUCCESS",
  "message": "Biometric fingerprint template enrolled for John Doe and persisted to central database.",
  "userId": "USR001",
  "userName": "John Doe",
  "slotNumber": 3,
  "deviceId": "DEV_TERM_01",
  "enrolledSlots": 3,
  "freeSlots": 297,
  "maxSlots": 300,
  "serverTime": "2026-09-24T09:15:30.000Z"
}
```

---

### 5. Offline Synchronization
- **Routes:** `POST /api/v1/sync` or `POST /api/sync`
When the terminal recovers Wi-Fi connection, it POSTs the array of offline-buffered records:
```json
[
  { "deviceId": "DEV_TERM_01", "slotNumber": 1, "timestamp": "2026-09-24T08:42:00.000Z", "offlineBuffered": true },
  { "deviceId": "DEV_TERM_01", "slotNumber": 2, "timestamp": "2026-09-24T08:49:10.000Z", "offlineBuffered": true },
  { "deviceId": "DEV_TERM_01", "userId": "USR003", "authMode": "pin", "timestamp": "2026-09-24T09:12:00.000Z", "offlineBuffered": true }
]
```
Response:
```json
{
  "ok": true,
  "success": true,
  "processedCount": 3,
  "syncCompleted": true,
  "offlineQueueAcknowledged": true,
  "serverTime": "2026-09-24T09:30:00.000Z"
}
```
