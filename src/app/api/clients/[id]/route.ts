import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/clients/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await (prisma as any).user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        address: true,
        status: true,
        createdAt: true
      }
    });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PATCH /api/clients/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.email === 'string') data.email = body.email;
    if (typeof body.phone === 'string') data.phone = body.phone;
    if (typeof body.company === 'string') data.company = body.company;
    if (typeof body.address === 'string') data.address = body.address;
    if (typeof body.status === 'string') data.status = body.status.toUpperCase();

    const updated = await (prisma as any).user.update({
      where: { id: params.id },
      data,
      select: { id: true }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
