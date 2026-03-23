const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  barcode: string | null;
  price: string;
  inventory_item_id: number;
  inventory_quantity: number;
}

interface ShopifyImage {
  id: number;
  src: string;
}

interface ShopifyOrder {
  id: number;
  created_at: string;
  line_items: ShopifyOrderLineItem[];
}

interface ShopifyOrderLineItem {
  variant_id: number;
  quantity: number;
  sku: string;
}

async function shopifyFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SHOPIFY_STORE_URL}/admin/api/2024-01/${endpoint}.json`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let pageInfo: string | null = null;

  // Paginate through all products (max 250 per page)
  do {
    const params: Record<string, string> = { limit: '250' };
    if (pageInfo) {
      params.page_info = pageInfo;
    }

    const data = await shopifyFetch<{ products: ShopifyProduct[] }>('products', params);
    allProducts.push(...data.products);

    // Simplified pagination - stop if we get fewer than 250
    if (data.products.length < 250) {
      pageInfo = null;
    } else {
      // In production, parse the Link header for cursor-based pagination
      break;
    }
  } while (pageInfo);

  return allProducts;
}

export async function fetchOrders(sinceDate: string): Promise<ShopifyOrder[]> {
  const allOrders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;

  do {
    const params: Record<string, string> = {
      limit: '250',
      status: 'any',
      created_at_min: sinceDate,
    };
    if (pageInfo) {
      params.page_info = pageInfo;
    }

    const data = await shopifyFetch<{ orders: ShopifyOrder[] }>('orders', params);
    allOrders.push(...data.orders);

    if (data.orders.length < 250) {
      pageInfo = null;
    } else {
      break;
    }
  } while (pageInfo);

  return allOrders;
}

export function calculateSalesVelocity(
  variantId: number | string,
  orders: ShopifyOrder[]
): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let totalUnitsSold = 0;

  for (const order of orders) {
    const orderDate = new Date(order.created_at);
    if (orderDate < thirtyDaysAgo) continue;

    for (const lineItem of order.line_items) {
      if (lineItem.variant_id === variantId) {
        totalUnitsSold += lineItem.quantity;
      }
    }
  }

  // Units per day over 30-day window
  const daysInWindow = 30;
  return totalUnitsSold / daysInWindow;
}
