import { POST as originalPost } from '@/app/api/devices/telemetry/route';

export async function POST(req: Request) {
  return originalPost(req);
}
