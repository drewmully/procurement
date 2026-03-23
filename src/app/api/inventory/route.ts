import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const skip = (page - 1) * pageSize;

    const products = await prisma.vendorProduct.findMany({
      where: { isActive: true },
      skip,
      take: pageSize,
      orderBy: { vendorProductName: "asc" },
      include: {
        vendor: {
          select: { id: true, companyName: true, brandName: true },
        },
      },
    });

    const inventory = products.map((product) => {
      const currentStock = product.currentStock || 0;
      const salesVelocity = product.salesVelocity || 0;
      const reorderPoint = product.reorderPoint || 0;

      const daysRemaining =
        salesVelocity > 0 ? Math.round(currentStock / salesVelocity) : null;

      let inventoryStatus: string;
      if (currentStock === 0) {
        inventoryStatus = "outOfStock";
      } else if (reorderPoint > 0 && currentStock <= reorderPoint * 0.5) {
        inventoryStatus = "critical";
      } else if (reorderPoint > 0 && currentStock <= reorderPoint) {
        inventoryStatus = "low";
      } else {
        inventoryStatus = "good";
      }

      return {
        ...product,
        daysRemaining,
        inventoryStatus,
      };
    });

    const filtered = status
      ? inventory.filter((item) => item.inventoryStatus === status)
      : inventory;

    return NextResponse.json({
      inventory: filtered,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
    });
  } catch (error) {
    console.error("Failed to get inventory:", error);
    return NextResponse.json(
      { error: "Failed to get inventory" },
      { status: 500 }
    );
  }
}
