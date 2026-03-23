"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Vendor {
  id: string;
  companyName: string;
  brandName: string | null;
}

interface VendorProduct {
  id: string;
  vendorSku: string;
  ourSku: string | null;
  productName: string;
  unitCost: number;
  moq: number | null;
}

interface LineItem {
  productId: string;
  vendorSku: string;
  ourSku: string | null;
  productName: string;
  unitCost: number;
  quantity: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const res = await fetch("/api/vendors?status=ACTIVE");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const json = await res.json();
      return json.data?.items ?? json.data ?? [];
    },
  });

  // Fetch vendor products when vendor is selected
  const { data: products, isLoading: productsLoading } = useQuery<
    VendorProduct[]
  >({
    queryKey: ["vendor-products", selectedVendorId],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${selectedVendorId}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!selectedVendorId,
  });

  const filteredVendors = (vendors ?? []).filter(
    (v) =>
      v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.brandName?.toLowerCase().includes(vendorSearch.toLowerCase()) ?? false)
  );

  const filteredProducts = (products ?? []).filter(
    (p) =>
      p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.vendorSku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedVendor = (vendors ?? []).find(
    (v) => v.id === selectedVendorId
  );

  const addLineItem = useCallback(
    (product: VendorProduct) => {
      const existing = lineItems.find((li) => li.productId === product.id);
      if (existing) return;
      setLineItems((prev) => [
        ...prev,
        {
          productId: product.id,
          vendorSku: product.vendorSku,
          ourSku: product.ourSku,
          productName: product.productName,
          unitCost: product.unitCost,
          quantity: product.moq ?? 1,
        },
      ]);
    },
    [lineItems]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setLineItems((prev) =>
        prev.map((li) =>
          li.productId === productId ? { ...li, quantity: Math.max(1, quantity) } : li
        )
      );
    },
    []
  );

  const removeLineItem = useCallback((productId: string) => {
    setLineItems((prev) => prev.filter((li) => li.productId !== productId));
  }, []);

  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.unitCost * li.quantity,
    0
  );
  const total = subtotal + shippingCost;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          lineItems: lineItems.map((li) => ({
            vendorProductId: li.productId,
            quantity: li.quantity,
            unitCost: li.unitCost,
          })),
          shippingCost,
          notes: notes || null,
          shippingAddress: shippingAddress || null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/purchase-orders/${json.data?.id ?? ""}`);
      }
    } catch {
      // Error handling - stay on page
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => router.push("/purchase-orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          New Purchase Order
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Create a new purchase order in {4 - step + 1 > 1 ? `${4 - step + 1} steps` : "1 step"}
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={`text-sm ${
                s === step ? "font-medium text-gray-900" : "text-gray-500"
              }`}
            >
              {s === 1
                ? "Select Vendor"
                : s === 2
                ? "Add Items"
                : s === 3
                ? "Review"
                : "Create"}
            </span>
            {s < 4 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Vendor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Vendor</CardTitle>
            <CardDescription>
              Choose a vendor for this purchase order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {vendorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No vendors found.
              </p>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredVendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      selectedVendorId === vendor.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedVendorId(vendor.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {vendor.companyName}
                      </p>
                      {vendor.brandName && (
                        <p className="text-xs text-gray-500">
                          {vendor.brandName}
                        </p>
                      )}
                    </div>
                    {selectedVendorId === vendor.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedVendorId}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Line Items */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Line Items</CardTitle>
              <CardDescription>
                Search and add products from {selectedVendor?.companyName}
                &apos;s catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>MOQ</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-gray-500 py-6"
                          >
                            No products found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => {
                          const isAdded = lineItems.some(
                            (li) => li.productId === product.id
                          );
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono text-sm">
                                {product.vendorSku}
                              </TableCell>
                              <TableCell>{product.productName}</TableCell>
                              <TableCell>
                                {formatCurrency(product.unitCost)}
                              </TableCell>
                              <TableCell>{product.moq ?? "-"}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={isAdded ? "secondary" : "default"}
                                  disabled={isAdded}
                                  onClick={() => addLineItem(product)}
                                >
                                  {isAdded ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <>
                                      <Plus className="mr-1 h-4 w-4" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Items */}
          {lineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Selected Items ({lineItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((li) => (
                      <TableRow key={li.productId}>
                        <TableCell>
                          <p className="font-medium">{li.productName}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {li.vendorSku}
                          </p>
                        </TableCell>
                        <TableCell>{formatCurrency(li.unitCost)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={li.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                li.productId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(li.unitCost * li.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(li.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="my-3" />
                <div className="flex justify-end">
                  <p className="text-sm font-medium">
                    Subtotal: {formatCurrency(subtotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={lineItems.length === 0}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Purchase Order</CardTitle>
              <CardDescription>
                Review details before creating the purchase order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vendor */}
              <div>
                <Label className="text-gray-500">Vendor</Label>
                <p className="font-medium">{selectedVendor?.companyName}</p>
              </div>

              {/* Line Items */}
              <div>
                <Label className="text-gray-500 mb-2 block">
                  Line Items
                </Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead className="text-right">
                          Line Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((li) => (
                        <TableRow key={li.productId}>
                          <TableCell className="font-mono text-sm">
                            {li.vendorSku}
                          </TableCell>
                          <TableCell>{li.productName}</TableCell>
                          <TableCell>{li.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(li.unitCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(li.unitCost * li.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea
                    id="shippingAddress"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter shipping address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Shipping Cost</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={shippingCost}
                    onChange={(e) =>
                      setShippingCost(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes for this PO"
                  rows={3}
                />
              </div>

              {/* Totals */}
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Purchase Order"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
