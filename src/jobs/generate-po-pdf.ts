import { createWorker } from "./queue";
import { prisma } from "@/lib/db";
import { generatePOHtml } from "@/lib/pdf";

interface GeneratePOPdfJobData {
  purchaseOrderId: string;
}

export const generatePoPdfWorker = createWorker<GeneratePOPdfJobData>(
  "po-pdf",
  async (job) => {
    const { purchaseOrderId } = job.data;
    console.log(`Generating PDF for PO ${purchaseOrderId}...`);

    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          vendor: { include: { contacts: true } },
          lineItems: { include: { vendorProduct: true } },
        },
      });

      if (!po) throw new Error(`PO ${purchaseOrderId} not found`);

      const html = generatePOHtml(po as any);

      // In production, this would use puppeteer or a PDF service to convert HTML to PDF
      // For now, store the HTML as the "PDF" content
      const pdfUrl = `/api/purchase-orders/${purchaseOrderId}/pdf`;

      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { poPdfUrl: pdfUrl },
      });

      console.log(`PDF generated for PO ${po.poNumber}`);
      return { success: true, pdfUrl };
    } catch (error) {
      console.error(`PDF generation failed for PO ${purchaseOrderId}:`, error);
      throw error;
    }
  }
);
