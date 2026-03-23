import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), "uploads", "invoices");
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/invoices/${fileName}`;

    // Create invoice record with basic info
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
        originalFileUrl: fileUrl,
      },
      include: {
        vendor: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to upload invoice:", error);
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}
