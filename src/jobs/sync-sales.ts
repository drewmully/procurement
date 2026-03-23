import { createWorker } from "./queue";
import { prisma } from "@/lib/db";
import { fetchOrders, calculateSalesVelocity } from "@/lib/shopify";

export const syncSalesWorker = createWorker("sales-sync", async (job) => {
  console.log("Starting sales sync from Shopify...");

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const orders = await fetchOrders(thirtyDaysAgo.toISOString());

    const products = await prisma.vendorProduct.findMany({
      where: { shopifyVariantId: { not: null } },
    });

    let updated = 0;
    for (const product of products) {
      if (!product.shopifyVariantId) continue;
      const velocity = calculateSalesVelocity(product.shopifyVariantId, orders);
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: { salesVelocity: velocity },
      });
      updated++;
    }

    await prisma.activityLog.create({
      data: {
        action: "SALES_SYNCED",
        entityType: "SYSTEM",
        entityId: "shopify",
        details: JSON.stringify({ ordersProcessed: orders.length, productsUpdated: updated }),
      },
    });

    console.log(`Sales sync complete. Processed ${orders.length} orders, updated ${updated} products.`);
    return { success: true, ordersProcessed: orders.length, productsUpdated: updated };
  } catch (error) {
    console.error("Sales sync failed:", error);
    throw error;
  }
});
