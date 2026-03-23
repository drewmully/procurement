import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contacts = await prisma.contact.findMany({
      where: { vendorId: id },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Failed to list contacts:", error);
    return NextResponse.json(
      { error: "Failed to list contacts" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const contact = await prisma.contact.create({
      data: {
        vendorId: id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        isPrimary: body.isPrimary || false,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
