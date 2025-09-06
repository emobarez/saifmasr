import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/services - Get all services
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        faqs: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { serviceRequests: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, category, price, status, faqs } = await request.json();

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        price: price ? parseFloat(price) : null,
        status: status || "ACTIVE",
        faqs: faqs ? {
          create: faqs.map((faq: any, index: number) => ({
            question: faq.question,
            answer: faq.answer,
            order: index
          }))
        } : undefined
      },
      include: {
        faqs: true
      }
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}