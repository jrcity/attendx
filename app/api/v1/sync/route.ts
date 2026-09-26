import { NextResponse } from 'next/server';
import { processAttendancePayload } from '@/lib/attendanceService';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({
        ok: false,
        success: false,
        error: 'INVALID_JSON',
        message: 'Sync payload must be valid JSON',
        displayMessage: 'PAYLOAD ERROR'
      }, { status: 400 });
    }

    const { statusCode, data } = await processAttendancePayload(body);
    return NextResponse.json({
      ...data,
      syncCompleted: true,
      offlineQueueAcknowledged: true
    }, { status: statusCode });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      success: false,
      error: 'SYNC_ERROR',
      message: 'Failed to process offline sync: ' + (err instanceof Error ? err.message : String(err))
    }, { status: 500 });
  }
}
