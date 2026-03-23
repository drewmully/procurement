import { createWorker } from "./queue";
import { prisma } from "@/lib/db";
import { fetchInventory } from "@/lib/shiphero";

export const syncInventoryWorker = createWorker("inventory-sync", async (job) => {
  console.log("Starting inventory sync from ShipHero...");

  try {
    const inventory = await fetchInventory();

    for (const item of inventory) {
      await prisma.vendorProduct.updateMany({
        where: { ourSku: item.sku },
        data: { currentStock: item.available },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "INVENTORY_SYNCED",
        entityType: "SYSTEM",
        entityId: "shiphero",
        details: JSON.stringify({ itemsUpdated: inventory.length }),
      },
    });

    console.log(`Inventory sync complete. Updated ${inventory.length} items.`);
    return { success: true, itemsUpdated: inventory.length };
  } catch (error) {
    console.error("Inventory sync failed:", error);
    throw error;
  }
});
