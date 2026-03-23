import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const vendorId = formData.get("vendorId") as string | null;
    const invoiceNumber = formData.get("invoiceNumber") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blobPath = `invoices/${timestamp}-${sanitizedName}`;

    const blob = await put(blobPath, file, {
      access: "public",
    });

    // Create invoice record with blob URL
    const invoice = await prisma.invoice.create({
      data: {
        vendorId,
        invoiceNumber: invoiceNumber || `UPLOAD-${timestamp}`,
        status: "RECEIVED",
        subtotal: 0,
        taxAmount: 0,
        shippingCost: 0,
        totalAmount: 0,
        invoiceDate: new Date(),
        dueDate: new Date(),
        originalFileUrl: blob.url,
      },
      include: {
        vendor: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload invoice:", error);
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}
