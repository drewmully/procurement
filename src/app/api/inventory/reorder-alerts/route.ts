import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.vendorProduct.findMany({
      where: {
        isActive: true,
        reorderPoint: { not: null },
        currentStock: { not: null },
      },
      include: {
        vendor: {
          select: { id: true, companyName: true, brandName: true },
        },
      },
      orderBy: { vendorProductName: "asc" },
    });

    // Filter to only products where currentStock <= reorderPoint
    const alerts = products
      .filter(
        (p) =>
          p.currentStock !== null &&
          p.reorderPoint !== null &&
          p.currentStock <= p.reorderPoint
      )
      .map((product) => {
        const suggestedQty = product.reorderQuantity || (product.reorderPoint! * 2 - product.currentStock!);

        return {
          ...product,
          suggestedQty,
        };
      });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Failed to get reorder alerts:", error);
    return NextResponse.json(
      { error: "Failed to get reorder alerts" },
      { status: 500 }
    );
  }
}
