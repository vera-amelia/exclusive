import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const tiers = await prisma.tier.findMany({
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        _count: {
          select: {
            contents: true,
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json(tiers);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 403 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const b = await req.json();

    const tier = await prisma.tier.create({
      data: {
        name: b.name,
        slug: b.slug,
        description: b.description || "",
        price: Number(b.price),
        sortOrder: Number(b.sortOrder),
        color: b.color || "#d98bb3",
      },
    });

    return NextResponse.json(tier);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 400 }
    );
  }
}