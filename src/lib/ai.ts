import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// ============================================================================
// Types
// ============================================================================

export interface ParsedInvoiceData {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  tax: number | null;
  shipping: number | null;
  totalAmount: number | null;
  currency: string;
  lineItems: Array<{
    description: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentTerms: string | null;
  notes: string | null;
}

export interface ParsedCatalogData {
  products: Array<{
    vendorSku: string;
    name: string;
    description: string | null;
    unitPrice: number;
    casePackQty: number | null;
    moq: number | null;
    leadTimeDays: number | null;
    category: string | null;
    upc: string | null;
  }>;
  unmappedColumns: string[];
  confidence: number;
}

// ============================================================================
// Invoice Parsing
// ============================================================================

export async function parseInvoice(
  fileBase64: string,
  mimeType: string
): Promise<ParsedInvoiceData> {
  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: fileBase64,
            },
          },
          {
            type: 'text',
            text: `Extract all invoice data from this image. Return a JSON object with these fields:
{
  "vendorName": string or null,
  "invoiceNumber": string or null,
  "invoiceDate": "YYYY-MM-DD" or null,
  "dueDate": "YYYY-MM-DD" or null,
  "subtotal": number or null,
  "tax": number or null,
  "shipping": number or null,
  "totalAmount": number or null,
  "currency": "USD" (default),
  "lineItems": [{ "description": string, "sku": string or null, "quantity": number, "unitPrice": number, "total": number }],
  "paymentTerms": string or null,
  "notes": string or null
}

Return ONLY valid JSON, no other text.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text) as ParsedInvoiceData;
  return parsed;
}

// ============================================================================
// Catalog Parsing
// ============================================================================

export async function parseCatalog(
  csvContent: string,
  vendorName: string
): Promise<ParsedCatalogData> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are parsing a product catalog CSV from vendor "${vendorName}". Map the columns to our schema and extract all products.

Our product schema fields:
- vendorSku (required): The vendor's SKU/item number
- name (required): Product name/title
- description: Product description
- unitPrice (required): Price per unit as a number
- casePackQty: Units per case/pack
- moq: Minimum order quantity
- leadTimeDays: Lead time in days
- category: Product category
- upc: UPC/barcode

CSV content:
${csvContent}

Return a JSON object:
{
  "products": [{ "vendorSku": string, "name": string, "description": string|null, "unitPrice": number, "casePackQty": number|null, "moq": number|null, "leadTimeDays": number|null, "category": string|null, "upc": string|null }],
  "unmappedColumns": ["columns that didn't map to our schema"],
  "confidence": 0.0 to 1.0
}

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text) as ParsedCatalogData;
  return parsed;
}

// ============================================================================
// Reorder Quantity Suggestion
// ============================================================================

export async function suggestReorderQuantity(params: {
  currentStock: number;
  reorderPoint: number;
  salesVelocity: number;
  leadTimeDays: number;
  moq: number;
  casePackQty: number;
  avgOrderQty: number;
  seasonalityFactor?: number;
}): Promise<number> {
  const {
    currentStock,
    salesVelocity,
    leadTimeDays,
    moq,
    casePackQty,
    avgOrderQty,
    seasonalityFactor = 1.0,
  } = params;

  // Calculate demand during lead time plus a safety buffer of 14 days
  const safetyBufferDays = 14;
  const demandDuringLeadTime = salesVelocity * (leadTimeDays + safetyBufferDays) * seasonalityFactor;

  // Target stock level: enough to cover lead time + safety buffer
  const targetStock = Math.ceil(demandDuringLeadTime);

  // Quantity needed to reach target
  let suggestedQty = Math.max(0, targetStock - currentStock);

  // Round up to MOQ
  if (suggestedQty > 0 && suggestedQty < moq) {
    suggestedQty = moq;
  }

  // Round up to case pack quantity
  if (casePackQty > 1 && suggestedQty > 0) {
    suggestedQty = Math.ceil(suggestedQty / casePackQty) * casePackQty;
  }

  // Consider average historical order quantity as a reference
  if (suggestedQty > 0 && suggestedQty < avgOrderQty * 0.5) {
    suggestedQty = Math.ceil(avgOrderQty / casePackQty) * casePackQty;
  }

  return suggestedQty;
}
