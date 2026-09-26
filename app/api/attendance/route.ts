import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { processAttendancePayload } from '@/lib/attendanceService';

export async function GET() {
  try {
    const db = await readDb();
    const sorted = [...db.attendance].sort((a, b) => {
      const timeB = Math.max(new Date(b.checkOutTime || 0).getTime(), new Date(b.checkInTime || b.createdAt).getTime());
      const timeA = Math.max(new Date(a.checkOutTime || 0).getTime(), new Date(a.checkInTime || a.createdAt).getTime());
      return timeB - timeA;
    });

    const enriched = sorted.map(record => {
      const user = db.users.find(u => u.id === record.userId);
      const matchedImage = db.images.find(img => img.attendanceId === record.id);
      return {
        ...record,
        user: { name: user?.name || 'Unknown', role: user?.role || 'Unknown' },
        hasImage: Boolean(matchedImage),
        imageStorageRef: matchedImage?.storageRef
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { statusCode, data } = await processAttendancePayload(body);
    return NextResponse.json(data, { status: statusCode });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to process attendance' }, { status: 500 });
  }
}
