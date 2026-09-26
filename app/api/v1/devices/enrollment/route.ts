import { GET as origGet, POST as origPost } from '@/app/api/devices/enrollment/route';

export async function GET(req: Request) {
  return origGet(req);
}

export async function POST(req: Request) {
  return origPost(req);
}
