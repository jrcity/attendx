import { NextResponse } from 'next/server';
import { generateContractPdf } from '@/lib/generateContractPdf';

export async function GET() {
  try {
    const doc = generateContractPdf();
    const pdfArrayBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="AttendX_Firmware_Backend_Handshake_Blueprint_v2.4.pdf"',
      },
    });
  } catch (err) {
    console.error('Failed to export PDF blueprint:', err);
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 });
  }
}
