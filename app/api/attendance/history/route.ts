import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const role = searchParams.get('role');
    const mode = searchParams.get('mode');
    
    const db = await readDb();
    
    let records = [...db.attendance].sort((a, b) => {
      const timeB = Math.max(
        new Date(b.checkOutTime || 0).getTime(),
        new Date(b.checkInTime || b.createdAt).getTime()
      );
      const timeA = Math.max(
        new Date(a.checkOutTime || 0).getTime(),
        new Date(a.checkInTime || a.createdAt).getTime()
      );
      return timeB - timeA;
    });
    
    // Enrich early to allow filtering by role
    let enriched = records.map(record => {
      const user = db.users.find(u => u.id === record.userId);
      const hasImage = db.images.some(img => img.attendanceId === record.id);
      const isCheckedOut = Boolean(record.checkOutTime);
      return {
        ...record,
        user: { name: user?.name || 'Unknown', role: user?.role || 'Unknown' },
        hasImage,
        isCheckedOut,
        lastEventType: isCheckedOut ? 'CHECK_OUT' : 'CHECK_IN',
        lastEventTime: record.checkOutTime || record.checkInTime || record.createdAt
      };
    });

    if (date) enriched = enriched.filter(r => r.date === date);
    if (role && role !== 'All' && role !== 'All Roles') enriched = enriched.filter(r => r.user.role === role);
    if (mode && mode !== 'All' && mode !== 'All Methods') {
      const targetMode = mode.toLowerCase();
      enriched = enriched.filter(r => 
        (r.checkInMode && r.checkInMode.toLowerCase() === targetMode) || 
        (r.checkOutMode && r.checkOutMode.toLowerCase() === targetMode)
      );
    }

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
