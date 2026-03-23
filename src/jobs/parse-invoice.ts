import { createWorker } from "./queue";
import { prisma } from "@/lib/db";
import { parseInvoice } from "@/lib/ai";

interface ParseInvoiceJobData {
  invoiceId: string;
  fileBase64: string;
  mimeType: string;
}

export const parseInvoiceWorker = createWorker<ParseInvoiceJobData>(
  "invoice-parse",
  async (job) => {
    const { invoiceId, fileBase64, mimeType } = job.data;
    console.log(`Parsing invoice ${invoiceId}...`);

    try {
      const parsed = await parseInvoice(fileBase64, mimeType);

      // Try to auto-match vendor
      let vendorId: string | undefined;
      if (parsed.vendorName) {
        const vendor = await prisma.vendor.findFirst({
          where: {
            OR: [
              { companyName: { contains: parsed.vendorName } },
              { brandName: { contains: parsed.vendorName } },
            ],
          },
        });
        if (vendor) vendorId = vendor.id;
      }

      // Update the invoice with parsed data
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          parsedData: parsed as any,
          invoiceNumber: parsed.invoiceNumber || "PENDING",
          invoiceDate: parsed.invoiceDate ? new Date(parsed.invoiceDate) : new Date(),
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : new Date(),
          subtotal: parsed.subtotal || 0,
          taxAmount: parsed.tax || 0,
          shippingCost: parsed.shipping || 0,
          totalAmount: parsed.totalAmount || 0,
          ...(vendorId ? { vendorId } : {}),
        },
      });

      // Try to auto-match to a PO
      if (vendorId) {
        const matchingPO = await prisma.purchaseOrder.findFirst({
          where: {
            vendorId,
            status: { in: ["SENT", "ACKNOWLEDGED", "PARTIALLY_RECEIVED"] },
            totalAmount: {
              gte: (parsed.totalAmount || 0) * 0.95,
              lte: (parsed.totalAmount || 0) * 1.05,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (matchingPO) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              purchaseOrderId: matchingPO.id,
              status: "MATCHED",
              matchConfidence: 0.85,
            },
          });
        }
      }

      console.log(`Invoice ${invoiceId} parsed successfully.`);
      return { success: true, parsed };
    } catch (error) {
      console.error(`Invoice parsing failed for ${invoiceId}:`, error);
      throw error;
    }
  }
);
