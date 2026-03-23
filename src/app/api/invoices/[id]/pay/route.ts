import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidDate: new Date(),
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
      },
      include: {
        vendor: { select: { id: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Failed to record payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
