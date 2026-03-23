import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { brandName: { contains: search } },
        { accountNumber: { contains: search } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { companyName: "asc" },
        include: {
          _count: {
            select: {
              purchaseOrders: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({ data: vendors });
  } catch (error) {
    console.error("Failed to list vendors:", error);
    return NextResponse.json(
      { error: "Failed to list vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyName) {
      return NextResponse.json(
        { error: "companyName is required" },
        { status: 400 }
      );
    }

    if (!body.paymentTerms) {
      return NextResponse.json(
        { error: "paymentTerms is required" },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        companyName: body.companyName,
        brandName: body.brandName,
        website: body.website,
        orderMethod: body.orderMethod || "EMAIL",
        orderPortalUrl: body.orderPortalUrl,
        orderNotes: body.orderNotes,
        minimumOrderAmount: body.minimumOrderAmount,
        minimumOrderUnits: body.minimumOrderUnits,
        paymentTerms: body.paymentTerms,
        paymentMethods: body.paymentMethods ? JSON.stringify(body.paymentMethods) : "[]",
        preferredPayment: body.preferredPayment,
        creditLimit: body.creditLimit,
        accountNumber: body.accountNumber,
        resaleCertRequired: body.resaleCertRequired ?? true,
        resaleCertOnFile: body.resaleCertOnFile ?? false,
        resaleCertExpiry: body.resaleCertExpiry
          ? new Date(body.resaleCertExpiry)
          : undefined,
        resaleCertFileUrl: body.resaleCertFileUrl,
        taxExempt: body.taxExempt ?? false,
        w9OnFile: body.w9OnFile ?? false,
        status: body.status || "PENDING_SETUP",
        onboardingChecklist: body.onboardingChecklist,
        notes: body.notes,
        tags: body.tags ? JSON.stringify(body.tags) : "[]",
      },
    });

    return NextResponse.json({ data: vendor }, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
