import { NextResponse } from 'next/server';
import { readDb, saveUserDoc, generateNextKeypadUserId, isValidKeypadUserId } from '@/lib/db';
import { User } from '@/types';

export async function GET() {
  try {
    const db = await readDb();
    
    // Sort users by name
    const sorted = [...db.users].sort((a, b) => a.name.localeCompare(b.name));
    
    // Enrich with auth setup status
    const enriched = sorted.map(user => {
      const hasFingerprint = db.fingerprints.some(fp => fp.userId === user.id && fp.status === 'Active');
      const hasPin = !!user.pinHash;
      return {
        ...user,
        hasFingerprint,
        hasPin
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await readDb();
    
    const role = (body.role || 'Student') as 'Student' | 'Staff' | 'Admin';
    let targetId = body.id ? String(body.id).trim().toUpperCase() : '';

    // If ID not supplied or does not match Keypad ID format (digits + single letter), auto-generate keypad ID
    if (!targetId || !isValidKeypadUserId(targetId)) {
      targetId = generateNextKeypadUserId(db.users, role);
    }

    // Prevent duplicate ID collision
    if (db.users.some(u => u.id === targetId)) {
      targetId = generateNextKeypadUserId(db.users, role);
    }

    const newUser: User = {
      id: targetId,
      name: body.name?.trim() || 'New User',
      role,
      status: (body.status || 'Active') as 'Active' | 'Inactive',
      dateRegistered: new Date().toISOString(),
      totalAttendance: 0,
      lateOccurrences: 0,
    };

    // Save directly to Firestore collection 'users'
    await saveUserDoc(newUser);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
