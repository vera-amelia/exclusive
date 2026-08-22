import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { configureCloudinary, cloudinary } from '@/lib/cloudinary-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const config = configureCloudinary();
    if (!config) return NextResponse.json({ error: 'Cloudinary belum dikonfigurasi pada runtime Railway. Pastikan CLOUDINARY_* ada di vera-amelia-web.' }, { status: 503 });
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'Maksimum upload langsung 100MB. Untuk video lebih besar gunakan URL media.' }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'vera-amelia', resource_type: resourceType }, (err, res) => err ? reject(err) : resolve(res));
      stream.end(buffer);
    });
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id, type: resourceType });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload gagal' }, { status: 400 });
  }
}
