import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {z} from 'zod';

const schema=z.object({
  title:z.string().min(1),
  description:z.string().optional(),
  type:z.enum(['IMAGE','VIDEO']),
  url:z.url(),
  thumbnail:z.url(),
  tierId:z.string(),
  published:z.boolean().optional()
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireAdmin();
    const {id}=await params;
    const body=schema.parse(await req.json());
    const c=await prisma.content.update({where:{id},data:{...body,published:body.published??true}});
    return NextResponse.json(c);
  }catch(e:any){return NextResponse.json({error:e?.message||'Gagal memperbarui konten'},{status:400})}
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();const {id}=await params;await prisma.content.delete({where:{id}});return NextResponse.json({ok:true})}
  catch(e:any){return NextResponse.json({error:e?.message||'Gagal menghapus konten'},{status:400})}
}
