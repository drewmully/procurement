import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where: { vendorId: id },
        skip,
        take: pageSize,
        orderBy: { vendorProductName: "asc" },
        select: {
          id: true,
          vendorSku: true,
          vendorProductName: true,
          vendorColor: true,
          vendorSize: true,
          wholesaleCost: true,
          msrp: true,
          shopifyProductId: true,
          shopifyVariantId: true,
          ourSku: true,
          currentStock: true,
          salesVelocity: true,
          leadTimeDays: true,
          reorderPoint: true,
          reorderQuantity: true,
          isActive: true,
          lastOrdered: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.vendorProduct.count({ where: { vendorId: id } }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to list vendor products:", error);
    return NextResponse.json(
      { error: "Failed to list vendor products" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const product = await prisma.vendorProduct.create({
      data: {
        vendorId: id,
        vendorSku: body.vendorSku,
        vendorProductName: body.vendorProductName,
        vendorColor: body.vendorColor,
        vendorSize: body.vendorSize,
        wholesaleCost: body.wholesaleCost,
        msrp: body.msrp,
        shopifyProductId: body.shopifyProductId,
        shopifyVariantId: body.shopifyVariantId,
        ourSku: body.ourSku,
        currentStock: body.currentStock,
        salesVelocity: body.salesVelocity,
        leadTimeDays: body.leadTimeDays,
        reorderPoint: body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor product:", error);
    return NextResponse.json(
      { error: "Failed to create vendor product" },
      { status: 500 }
    );
  }
}
