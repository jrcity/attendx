import { NextRequest, NextResponse } from 'next/server';
import { resetDatabaseToCleanState, clearFingerprintsCollection } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let target = searchParams.get('target')?.toLowerCase();

    if (!target) {
      try {
        const body = await req.json();
        target = (body.target || body.action || '').toLowerCase();
      } catch {
        // Body optional
      }
    }

    if (target === 'fingerprints') {
      const result = await clearFingerprintsCollection();
      return NextResponse.json({
        success: true,
        message: `Successfully cleared all ${result.deletedCount} fingerprint templates from Firestore.`,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      });
    }

    await resetDatabaseToCleanState();
    return NextResponse.json({
      success: true,
      message: 'Persistent Firestore database successfully reset to clean zero-state across all sidebar pages (including fingerprints and commands).',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Reset endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset database', error: String(error) },
      { status: 500 }
    );
  }
}
