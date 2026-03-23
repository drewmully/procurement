import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
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

    if (search) {
      where.poNumber = { contains: search };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {} as Record<string, unknown>;
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: { id: true, companyName: true },
          },
          _count: {
            select: { lineItems: true },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to list purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to list purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-generate PO number
    const year = new Date().getFullYear();
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: `PO-${year}-` } },
      orderBy: { poNumber: "desc" },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNum = parseInt(lastPO.poNumber.split("-")[2], 10);
      nextNumber = lastNum + 1;
    }
    const poNumber = `PO-${year}-${String(nextNumber).padStart(5, "0")}`;

    // Calculate totals from line items
    const lineItems: Array<{
      vendorProductId: string;
      vendorSku: string;
      description: string;
      quantity: number;
      unitCost: number;
    }> = body.lineItems || [];

    let subtotal = 0;
    const lineItemsData = lineItems.map((item) => {
      const totalCost = item.unitCost * item.quantity;
      subtotal += totalCost;
      return {
        vendorProductId: item.vendorProductId,
        vendorSku: item.vendorSku,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
      };
    });

    const taxAmount = body.taxAmount || 0;
    const shippingCost = body.shippingCost || 0;
    const totalAmount = subtotal + taxAmount + shippingCost;

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          vendorId: body.vendorId,
          status: body.status || "DRAFT",
          subtotal,
          taxAmount,
          shippingCost,
          totalAmount,
          orderDate: body.orderDate ? new Date(body.orderDate) : null,
          expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
          shipTo: body.shipTo || "",
          shippingMethod: body.shippingMethod,
          internalNotes: body.internalNotes,
          vendorNotes: body.vendorNotes,
          createdBy: body.createdBy || "system",
          lineItems: {
            create: lineItemsData,
          },
        },
        include: {
          lineItems: true,
          vendor: { select: { id: true, companyName: true } },
        },
      });

      return po;
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
