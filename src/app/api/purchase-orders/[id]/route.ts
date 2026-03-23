import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        lineItems: {
          include: { vendorProduct: true },
        },
        invoices: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: purchaseOrder });
  } catch (error) {
    console.error("Failed to get purchase order:", error);
    return NextResponse.json(
      { error: "Failed to get purchase order" },
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

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT purchase orders can be edited" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (body.lineItems) {
        await tx.pOLineItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        let subtotal = 0;
        const lineItemsData = body.lineItems.map(
          (item: {
            vendorProductId: string;
            vendorSku: string;
            description: string;
            quantity: number;
            unitCost: number;
          }) => {
            const totalCost = item.unitCost * item.quantity;
            subtotal += totalCost;
            return {
              purchaseOrderId: id,
              vendorProductId: item.vendorProductId,
              vendorSku: item.vendorSku,
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost,
            };
          }
        );

        await tx.pOLineItem.createMany({ data: lineItemsData });

        const taxAmount = body.taxAmount ?? existing.taxAmount;
        const shippingCost = body.shippingCost ?? existing.shippingCost;
        const totalAmount = subtotal + taxAmount + shippingCost;

        body.subtotal = subtotal;
        body.taxAmount = taxAmount;
        body.shippingCost = shippingCost;
        body.totalAmount = totalAmount;
      }

      const { lineItems: _, ...updateData } = body;

      if (updateData.orderDate) {
        updateData.orderDate = new Date(updateData.orderDate);
      }
      if (updateData.expectedDate) {
        updateData.expectedDate = new Date(updateData.expectedDate);
      }

      const po = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          lineItems: { include: { vendorProduct: true } },
          vendor: { select: { id: true, companyName: true } },
        },
      });

      return po;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to update purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}
