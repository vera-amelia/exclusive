import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireAdmin();
    const {id}=await params;
    const b=await req.json();
    const t=await prisma.tier.update({
      where:{id},
      data:{
        name:b.name,
        description:b.description,
        price:Number(b.price),
        color:b.color || '#d98bb3',
        active:Boolean(b.active),
        thumbnail:b.thumbnail?.trim() || null,
      }
    });
    return NextResponse.json(t)
  }catch(e:any){return NextResponse.json({error:e.message},{status:400})}
}
