import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCloudinaryConfig } from '@/lib/cloudinary-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const explicit = {
      cloudName: Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()),
      apiKey: Boolean(process.env.CLOUDINARY_API_KEY?.trim()),
      apiSecret: Boolean(process.env.CLOUDINARY_API_SECRET?.trim()),
      url: Boolean(process.env.CLOUDINARY_URL?.trim()),
    };
    const config = getCloudinaryConfig();
    return NextResponse.json({ configured: Boolean(config), explicit, resolvedCloudName: config?.cloudName ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unauthorized' }, { status: 401 });
  }
}
