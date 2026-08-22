import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await requireAdmin();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di Railway.' }, { status: 503 });
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'vera-amelia';
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (e: any) {
    const message = e?.message || 'Gagal membuat signature upload';
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : 403 });
  }
}
