import { Resend } from 'resend';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set. Emails will not be sent.");
    return null;
  }
  return new Resend(apiKey);
}
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'ap@mullybox.com';

export async function sendPurchaseOrderEmail(
  to: string,
  poNumber: string,
  pdfBuffer: Buffer,
  vendorName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email not configured" };
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject: `Purchase Order ${poNumber} from MyMully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Purchase Order ${poNumber}</h2>
          <p>Dear ${vendorName},</p>
          <p>Please find attached the purchase order <strong>${poNumber}</strong> from MyMully.</p>
          <p>Please review and confirm receipt of this order at your earliest convenience.</p>
          <br/>
          <p>Thank you,</p>
          <p><strong>MyMully Procurement Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `${poNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    return { success: false, error: message };
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email not configured" };
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    return { success: false, error: message };
  }
}
