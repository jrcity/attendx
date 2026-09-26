import { POST as origPost } from '@/app/api/devices/commands/result/route';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return origPost(req);
}
