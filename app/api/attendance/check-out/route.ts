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
        message: 'Request body must be valid JSON',
        displayMessage: 'PAYLOAD ERROR'
      }, { status: 400 });
    }

    const { statusCode, data } = await processAttendancePayload(body, { forcedDirection: 'OUT' });
    return NextResponse.json(data, { status: statusCode });
  } catch (err) {
    console.error('Error in check-out handler:', err);
    return NextResponse.json({ 
      ok: false, 
      success: false, 
      error: 'SERVER_ERROR', 
      message: 'Failed to process check-out event: ' + (err instanceof Error ? err.message : String(err)),
      displayMessage: 'SYSTEM ERROR'
    }, { status: 500 });
  }
}
