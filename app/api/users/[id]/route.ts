import { NextResponse } from 'next/server';
import { readDb, writeDb, deleteUserDoc, saveUserDoc, queueCommandForDevice } from '@/lib/db';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const db = await readDb();
    
    const userIndex = db.users.findIndex((u: any) => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Handle specific fields
    if (body.name !== undefined) db.users[userIndex].name = body.name.trim();
    if (body.role !== undefined) db.users[userIndex].role = body.role;
    if (body.status !== undefined) db.users[userIndex].status = body.status;
    
    // PIN management
    if (body.pin !== undefined) {
      if (body.pin) {
        db.users[userIndex].pinHash = `auth_hash_${body.pin}`;
      } else {
        delete db.users[userIndex].pinHash;
      }
    }
    
    // Fingerprint management
    if (body.enrollFingerprint) {
      // Hardware SFM-V1.7 assigns slots dynamically (1-10000). Disallow fabricating fake database templates.
      return NextResponse.json({
        error: 'Hardware enrollment required: Fingerprint slots cannot be fabricated synthetically. Please initiate interactive terminal enrollment via the Dashboard or POST /api/devices/enrollment with action: QUEUE_ENROLLMENT.'
      }, { status: 400 });
    } else if (body.removeFingerprint) {
      const userFps = db.fingerprints.filter(fp => fp.userId === params.id && fp.status === 'Active');
      for (const fp of userFps) {
        if (fp.slotNumber !== undefined) {
          const terminals = (fp.enrolledTerminals && fp.enrolledTerminals.length > 0)
            ? fp.enrolledTerminals
            : db.devices.map(d => d.id);
          for (const termId of terminals) {
            await queueCommandForDevice({
              commandId: `cmd_del_${Date.now().toString(36)}_${fp.slotNumber}`,
              type: 'DELETE_FINGERPRINT',
              deviceId: termId,
              userId: params.id,
              slotNumber: fp.slotNumber
            });
          }
        }
      }
      db.fingerprints = db.fingerprints.filter(fp => fp.userId !== params.id);
    }
    
    await writeDb(db);
    await saveUserDoc(db.users[userIndex]);
    
    return NextResponse.json({
      ...db.users[userIndex],
      hasFingerprint: db.fingerprints.some(fp => fp.userId === params.id && fp.status === 'Active'),
      hasPin: !!db.users[userIndex].pinHash
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const db = await readDb();
    
    const userIndex = db.users.findIndex((u: any) => u.id === params.id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Queue DELETE_FINGERPRINT commands on enrolled terminals for all active fingerprint slots
    const userFps = db.fingerprints.filter(fp => fp.userId === params.id && fp.status === 'Active');
    for (const fp of userFps) {
      if (fp.slotNumber !== undefined) {
        const terminals = (fp.enrolledTerminals && fp.enrolledTerminals.length > 0)
          ? fp.enrolledTerminals
          : db.devices.map(d => d.id);
        for (const termId of terminals) {
          await queueCommandForDevice({
            commandId: `cmd_del_${Date.now().toString(36)}_${fp.slotNumber}`,
            type: 'DELETE_FINGERPRINT',
            deviceId: termId,
            userId: params.id,
            slotNumber: fp.slotNumber
          });
        }
      }
    }

    // Permanently remove user and fingerprints from Firestore
    await deleteUserDoc(params.id);
    
    // Also remove from in-memory cache and commit
    db.users.splice(userIndex, 1);
    db.fingerprints = db.fingerprints.filter(fp => fp.userId !== params.id);
    
    await writeDb(db);
    
    return NextResponse.json({ success: true, message: `User ${params.id} deleted successfully and DELETE_FINGERPRINT queued for terminal(s).` });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
