const SHIPHERO_API_TOKEN = process.env.SHIPHERO_API_TOKEN!;
const SHIPHERO_API_URL = 'https://public-api.shiphero.com/graphql';

interface ShipHeroInventoryItem {
  sku: string;
  on_hand: number;
  available: number;
  allocated: number;
  backorder: number;
  warehouse_id: string;
  warehouse_name: string;
}

interface ShipHeroInventoryResponse {
  data: {
    inventory: {
      request_id: string;
      data: {
        edges: Array<{
          node: {
            sku: string;
            warehouse_products: Array<{
              on_hand: number;
              available: number;
              allocated: number;
              backorder: number;
              warehouse_id: string;
              warehouse: {
                legacy_id: number;
                identifier: string;
              };
            }>;
          };
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  };
}

async function shipheroQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(SHIPHERO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SHIPHERO_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`ShipHero API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(`ShipHero GraphQL error: ${result.errors[0].message}`);
  }

  return result as T;
}

export async function fetchInventory(): Promise<ShipHeroInventoryItem[]> {
  const allItems: ShipHeroInventoryItem[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query($after: String) {
        inventory(after: $after, first: 100) {
          request_id
          data {
            edges {
              node {
                sku
                warehouse_products {
                  on_hand
                  available
                  allocated
                  backorder
                  warehouse_id
                  warehouse {
                    legacy_id
                    identifier
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const result: ShipHeroInventoryResponse = await shipheroQuery<ShipHeroInventoryResponse>(query, {
      after: cursor,
    });

    const { edges, pageInfo } = result.data.inventory.data;

    for (const edge of edges) {
      const { sku, warehouse_products } = edge.node;
      for (const wp of warehouse_products) {
        allItems.push({
          sku,
          on_hand: wp.on_hand,
          available: wp.available,
          allocated: wp.allocated,
          backorder: wp.backorder,
          warehouse_id: wp.warehouse_id,
          warehouse_name: wp.warehouse.identifier,
        });
      }
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return allItems;
}
