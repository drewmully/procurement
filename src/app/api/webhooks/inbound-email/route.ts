import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Resend inbound email webhook
// Docs: https://resend.com/docs/dashboard/webhooks/introduction
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await request.json();

    // Resend sends webhook events with a `type` field
    // For inbound emails, the type is "email.received"
    const { type, data } = payload;

    if (type !== "email.received") {
      // Acknowledge non-email events
      return NextResponse.json({ status: "ignored", type });
    }

    const {
      from: fromRaw,
      to: toRaw,
      subject,
      text,
      html,
      attachments,
    } = data;

    const from = typeof fromRaw === "string" ? fromRaw : fromRaw?.[0] || "";
    const to = Array.isArray(toRaw) ? toRaw.join(", ") : toRaw || "";

    // Store the inbound email
    const inboundEmail = await prisma.inboundEmail.create({
      data: {
        from,
        to,
        subject: subject || "(no subject)",
        bodyText: text || null,
        bodyHtml: html || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        rawPayload: JSON.stringify(payload),
        status: "NEW",
      },
    });

    // Try to match sender to a known vendor contact
    const vendorContact = await prisma.contact.findFirst({
      where: {
        email: {
          equals: extractEmail(from),
        },
      },
      include: { vendor: true },
    });

    if (vendorContact) {
      await prisma.inboundEmail.update({
        where: { id: inboundEmail.id },
        data: {
          vendorId: vendorContact.vendorId,
          status: "PROCESSED",
        },
      });
    }

    // If there are PDF attachments, auto-create an invoice stub
    const pdfAttachments = (attachments || []).filter(
      (a: { filename?: string; content_type?: string }) =>
        a.content_type === "application/pdf" ||
        a.filename?.toLowerCase().endsWith(".pdf")
    );

    if (pdfAttachments.length > 0 && vendorContact) {
      // Extract a possible invoice number from subject
      const invoiceMatch = subject?.match(/(?:inv(?:oice)?|bill)[\s#:_-]*(\S+)/i);
      const invoiceNumber = invoiceMatch?.[1] || `EMAIL-${inboundEmail.id.slice(0, 8)}`;

      await prisma.invoice.create({
        data: {
          vendorId: vendorContact.vendorId,
          invoiceNumber,
          status: "RECEIVED",
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          parsedData: JSON.stringify({
            source: "email",
            inboundEmailId: inboundEmail.id,
            subject,
            from,
            attachmentCount: pdfAttachments.length,
          }),
        },
      });

      await prisma.inboundEmail.update({
        where: { id: inboundEmail.id },
        data: { status: "INVOICE_CREATED" },
      });
    }

    return NextResponse.json({ status: "ok", emailId: inboundEmail.id });
  } catch (error) {
    console.error("Inbound email webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractEmail(raw: string): string {
  // Handle formats like "Name <email@example.com>" or just "email@example.com"
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}
