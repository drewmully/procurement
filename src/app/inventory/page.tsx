"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  AlertTriangle,
  Package,
  RefreshCw,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ReorderAlert } from "@/types";

interface InventoryProduct {
  id: string;
  ourSku: string;
  productName: string;
  vendorName: string;
  currentStock: number;
  reorderPoint: number;
  salesVelocity: number;
  daysRemaining: number;
  lastSyncedAt: string | null;
}

interface InventoryData {
  products: InventoryProduct[];
  reorderAlerts: ReorderAlert[];
  lastSyncedAt: string | null;
}

function getStockStatus(daysRemaining: number, currentStock: number) {
  if (currentStock === 0)
    return { label: "Out of Stock", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
  if (daysRemaining < 15)
    return { label: "Critical", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
  if (daysRemaining <= 30)
    return { label: "Low", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" };
  return { label: "Good", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
}

export default function InventoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery<InventoryData>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const json = await res.json();
      return json.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
  });

  const reorderAlerts = data?.reorderAlerts ?? [];
  const products = data?.products ?? [];

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.ourSku.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor stock levels and reorder alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.lastSyncedAt && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last synced:{" "}
              {new Date(data.lastSyncedAt).toLocaleString()}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                syncMutation.isPending ? "animate-spin" : ""
              }`}
            />
            Sync Now
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-700">Failed to load inventory data</p>
        </div>
      ) : (
        <>
          {/* Reorder Alerts */}
          {reorderAlerts.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg text-red-700">
                    Reorder Alerts ({reorderAlerts.length})
                  </CardTitle>
                </div>
                <CardDescription>
                  These items are below their reorder point and need to be
                  restocked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">
                          Current Stock
                        </TableHead>
                        <TableHead className="text-right">
                          Reorder Point
                        </TableHead>
                        <TableHead className="text-right">
                          Days Remaining
                        </TableHead>
                        <TableHead className="text-right">
                          Suggested Qty
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reorderAlerts.map((alert) => (
                        <TableRow key={alert.productId}>
                          <TableCell className="font-mono text-sm">
                            {alert.ourSku}
                          </TableCell>
                          <TableCell className="font-medium">
                            {alert.productName}
                          </TableCell>
                          <TableCell>{alert.vendorName}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {alert.currentStock}
                          </TableCell>
                          <TableCell className="text-right">
                            {alert.reorderPoint}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                alert.daysRemaining < 7
                                  ? "text-red-600 font-medium"
                                  : "text-orange-600"
                              }
                            >
                              {alert.daysRemaining}d
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {alert.suggestedQty}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push("/purchase-orders/new")
                              }
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Create PO
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Inventory Overview Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                No inventory items found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(
                  product.daysRemaining,
                  product.currentStock
                );
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-mono text-xs text-gray-400">
                          {product.ourSku}
                        </p>
                        <Badge
                          variant="secondary"
                          className={stockStatus.color}
                        >
                          {stockStatus.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-1 line-clamp-2">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {product.vendorName}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Stock</span>
                          <p className="font-medium text-lg">
                            {product.currentStock}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">
                            Days Remaining
                          </span>
                          <p className="font-medium text-lg">
                            {product.currentStock === 0
                              ? "0"
                              : product.daysRemaining}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs text-gray-400">
                        <span>
                          Velocity: {product.salesVelocity}/day
                        </span>
                        <span>ROP: {product.reorderPoint}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
