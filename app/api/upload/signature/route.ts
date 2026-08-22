import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { configureCloudinary } from '@/lib/cloudinary-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await requireAdmin();
    const config = configureCloudinary();
    if (!config) {
      return NextResponse.json({
        error: 'Cloudinary belum dikonfigurasi pada runtime Railway. Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET ada di vera-amelia-web (bukan Postgres), lalu redeploy service.'
      }, { status: 503 });
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'vera-amelia';
    const signature = (await import('cloudinary')).v2.utils.api_sign_request({ folder, timestamp }, config.apiSecret);
    return NextResponse.json({ cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, signature });
  } catch (e: any) {
    const message = e?.message || 'Gagal membuat signature upload';
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : 403 });
  }
}
