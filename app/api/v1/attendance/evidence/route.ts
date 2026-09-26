import { POST as origPost } from '@/app/api/attendance/evidence/route';

export async function POST(req: Request) {
  return origPost(req);
}
