import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendPurchaseOrderEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: { select: { companyName: true } },
      },
    });

    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentViaMethod: body.sentViaMethod,
        sentToEmail: body.sentToEmail,
      },
    });

    // If method is EMAIL, send the email
    if (body.sentViaMethod === "EMAIL" && body.sentToEmail) {
      // Generate a minimal PDF buffer placeholder - actual PDF generation would be a separate concern
      const pdfBuffer = Buffer.from("");
      const emailResult = await sendPurchaseOrderEmail(
        body.sentToEmail,
        po.poNumber,
        pdfBuffer,
        po.vendor.companyName
      );

      if (!emailResult.success) {
        console.error("Failed to send PO email:", emailResult.error);
        // PO is still marked as SENT even if email fails - log the error
      }
    }

    return NextResponse.json(updatedPO);
  } catch (error) {
    console.error("Failed to send purchase order:", error);
    return NextResponse.json(
      { error: "Failed to send purchase order" },
      { status: 500 }
    );
  }
}
