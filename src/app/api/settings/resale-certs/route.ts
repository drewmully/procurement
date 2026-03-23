import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const certificates = await prisma.resaleCertificate.findMany({
      orderBy: { state: "asc" },
    });

    return NextResponse.json({ data: certificates });
  } catch (error) {
    console.error("Failed to list resale certificates:", error);
    return NextResponse.json(
      { error: "Failed to list resale certificates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const certificate = await prisma.resaleCertificate.create({
      data: {
        state: body.state,
        certificateNumber: body.certificateNumber,
        issueDate: new Date(body.issueDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        fileUrl: body.fileUrl,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ data: certificate }, { status: 201 });
  } catch (error) {
    console.error("Failed to create resale certificate:", error);
    return NextResponse.json(
      { error: "Failed to create resale certificate" },
      { status: 500 }
    );
  }
}
