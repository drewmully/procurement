import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const lineItems: Array<{
      lineItemId: string;
      quantityReceived: number;
    }> = body.lineItems || [];

    if (!lineItems.length) {
      return NextResponse.json(
        { error: "lineItems array is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update each line item's quantityReceived
      for (const item of lineItems) {
        await tx.pOLineItem.update({
          where: { id: item.lineItemId },
          data: { quantityReceived: item.quantityReceived },
        });
      }

      // Fetch all line items to determine overall PO status
      const allLineItems = await tx.pOLineItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allFullyReceived = allLineItems.every(
        (li) => li.quantityReceived >= li.quantity
      );
      const anyReceived = allLineItems.some((li) => li.quantityReceived > 0);

      let newStatus: "RECEIVED" | "PARTIALLY_RECEIVED";
      const updateData: Record<string, unknown> = {};

      if (allFullyReceived) {
        newStatus = "RECEIVED";
        updateData.receivedDate = new Date();
      } else if (anyReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      } else {
        // No items received yet - keep current status
        const po = await tx.purchaseOrder.findUnique({
          where: { id },
          include: { lineItems: true },
        });
        return po;
      }

      updateData.status = newStatus;

      const po = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: { lineItems: true },
      });

      return po;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to record receipt:", error);
    return NextResponse.json(
      { error: "Failed to record receipt" },
      { status: 500 }
    );
  }
}
