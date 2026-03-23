import { createWorker } from "./queue";
import { prisma } from "@/lib/db";

export const checkAlertsWorker = createWorker("alerts", async (job) => {
  console.log("Checking alerts...");

  try {
    // Check for overdue invoices
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: { in: ["RECEIVED", "MATCHED", "APPROVED", "SCHEDULED"] },
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    // Check for expiring resale certificates (60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const expiringCerts = await prisma.resaleCertificate.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: sixtyDaysFromNow, gte: new Date() },
      },
    });

    if (expiringCerts.length > 0) {
      for (const cert of expiringCerts) {
        await prisma.activityLog.create({
          data: {
            action: "CERT_EXPIRING",
            entityType: "RESALE_CERT",
            entityId: cert.id,
            details: JSON.stringify({ state: cert.state, expiryDate: cert.expiryDate }),
          },
        });
      }
    }

    console.log(
      `Alerts check complete. ${overdueInvoices.count} invoices marked overdue, ${expiringCerts.length} certs expiring soon.`
    );
    return {
      success: true,
      overdueInvoices: overdueInvoices.count,
      expiringCerts: expiringCerts.length,
    };
  } catch (error) {
    console.error("Alerts check failed:", error);
    throw error;
  }
});
