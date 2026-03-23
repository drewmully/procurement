import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        contacts: true,
        products: {
          take: 100,
          orderBy: { vendorProductName: "asc" },
        },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            orderDate: true,
            createdAt: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            invoiceDate: true,
            dueDate: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error("Failed to get vendor:", error);
    return NextResponse.json(
      { error: "Failed to get vendor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (body.resaleCertExpiry) {
      body.resaleCertExpiry = new Date(body.resaleCertExpiry);
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error("Failed to update vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
