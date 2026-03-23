import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const overdue = searchParams.get("overdue");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) {
        (where.invoiceDate as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.invoiceDate as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    if (overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ["PAID"] };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: { id: true, companyName: true },
          },
          purchaseOrder: {
            select: { id: true, poNumber: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to list invoices:", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const invoice = await prisma.invoice.create({
      data: {
        vendorId: body.vendorId,
        purchaseOrderId: body.purchaseOrderId || null,
        invoiceNumber: body.invoiceNumber,
        status: body.status || "RECEIVED",
        subtotal: body.subtotal,
        taxAmount: body.taxAmount || 0,
        shippingCost: body.shippingCost || 0,
        totalAmount: body.totalAmount,
        invoiceDate: new Date(body.invoiceDate),
        dueDate: new Date(body.dueDate),
        originalFileUrl: body.originalFileUrl,
        parsedData: body.parsedData,
      },
      include: {
        vendor: { select: { id: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
