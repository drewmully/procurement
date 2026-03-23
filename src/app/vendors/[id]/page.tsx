"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  Upload,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

interface VendorContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}

interface VendorProduct {
  id: string;
  vendorSku: string;
  ourSku: string | null;
  productName: string;
  unitCost: number;
  moq: number | null;
  leadTimeDays: number | null;
  isActive: boolean;
}

interface VendorPO {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  totalAmount: number;
  itemCount: number;
}

interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
}

interface VendorDetail {
  id: string;
  companyName: string;
  brandName: string | null;
  status: string;
  website: string | null;
  paymentTerms: string | null;
  currency: string;
  minimumOrderValue: number | null;
  leadTimeDays: number | null;
  shippingAddress: string | null;
  billingAddress: string | null;
  taxId: string | null;
  notes: string | null;
  onboardingChecklist: Record<string, boolean> | null;
  contacts: VendorContact[];
  products: VendorProduct[];
  purchaseOrders: VendorPO[];
  invoices: VendorInvoice[];
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  ACTIVE: { label: "Active", variant: "bg-green-100 text-green-700" },
  PENDING_SETUP: { label: "Pending Setup", variant: "bg-yellow-100 text-yellow-700" },
  INACTIVE: { label: "Inactive", variant: "bg-gray-100 text-gray-700" },
  ON_HOLD: { label: "On Hold", variant: "bg-red-100 text-red-700" },
};

const poStatusConfig: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  SENT: "bg-indigo-100 text-indigo-700",
  ACKNOWLEDGED: "bg-purple-100 text-purple-700",
  PARTIALLY_RECEIVED: "bg-orange-100 text-orange-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const invoiceStatusConfig: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  DISPUTED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const onboardingItems = [
  { key: "contact_info", label: "Primary contact information added" },
  { key: "payment_terms", label: "Payment terms agreed" },
  { key: "tax_info", label: "Tax / W-9 information collected" },
  { key: "resale_cert", label: "Resale certificate sent" },
  { key: "catalog_loaded", label: "Product catalog loaded" },
  { key: "first_po", label: "First purchase order placed" },
];

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const { data: vendor, isLoading, error } = useQuery<VendorDetail>({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (!res.ok) throw new Error("Failed to fetch vendor");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/vendors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vendors
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-700">Failed to load vendor details</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[vendor.status] ?? {
    label: vendor.status,
    variant: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => router.push("/vendors")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {vendor.companyName}
            </h1>
            <Badge variant="secondary" className={status.variant}>
              {status.label}
            </Badge>
          </div>
          {vendor.brandName && (
            <p className="text-gray-500">Brand: {vendor.brandName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {vendor.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Website
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="catalog">
                Catalog ({vendor.products?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="purchase-orders">
                Purchase Orders ({vendor.purchaseOrders?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices ({vendor.invoices?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  {(vendor.contacts ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No contacts added yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {vendor.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {contact.name}
                              </p>
                              {contact.isPrimary && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-50 text-blue-700"
                                >
                                  Primary
                                </Badge>
                              )}
                            </div>
                            {contact.role && (
                              <p className="text-xs text-gray-500">
                                {contact.role}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ordering Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ordering Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Lead Time</dt>
                      <dd className="font-medium">
                        {vendor.leadTimeDays
                          ? `${vendor.leadTimeDays} days`
                          : "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Minimum Order</dt>
                      <dd className="font-medium">
                        {vendor.minimumOrderValue
                          ? formatCurrency(vendor.minimumOrderValue)
                          : "None"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Currency</dt>
                      <dd className="font-medium">{vendor.currency ?? "USD"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Payment Terms</dt>
                      <dd className="font-medium">
                        {vendor.paymentTerms ?? "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Tax ID</dt>
                      <dd className="font-medium">
                        {vendor.taxId ?? "Not provided"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Shipping Address
                      </p>
                      <p className="whitespace-pre-line">
                        {vendor.shippingAddress ?? "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Billing Address
                      </p>
                      <p className="whitespace-pre-line">
                        {vendor.billingAddress ?? "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {vendor.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {vendor.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Catalog Tab */}
            <TabsContent value="catalog" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {vendor.products?.length ?? 0} products
                </p>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
              {(vendor.products ?? []).length === 0 ? (
                <div className="rounded-lg border bg-white p-12 text-center">
                  <p className="text-gray-500">No products in catalog.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor SKU</TableHead>
                        <TableHead>Our SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>MOQ</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">
                            {product.vendorSku}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.ourSku ?? "-"}
                          </TableCell>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell>
                            {formatCurrency(product.unitCost)}
                          </TableCell>
                          <TableCell>{product.moq ?? "-"}</TableCell>
                          <TableCell>
                            {product.leadTimeDays
                              ? `${product.leadTimeDays}d`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                product.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Purchase Orders Tab */}
            <TabsContent value="purchase-orders" className="mt-4">
              {(vendor.purchaseOrders ?? []).length === 0 ? (
                <div className="rounded-lg border bg-white p-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-gray-500">No purchase orders yet.</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push("/purchase-orders/new")}
                  >
                    Create PO
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.purchaseOrders.map((po) => (
                        <TableRow
                          key={po.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            router.push(`/purchase-orders/${po.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {po.poNumber}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                poStatusConfig[po.status] ??
                                "bg-gray-100 text-gray-700"
                              }
                            >
                              {po.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(po.orderDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {po.expectedDeliveryDate
                              ? format(
                                  new Date(po.expectedDeliveryDate),
                                  "MMM d, yyyy"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>{po.itemCount}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(po.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-4">
              {(vendor.invoices ?? []).length === 0 ? (
                <div className="rounded-lg border bg-white p-12 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-gray-500">No invoices yet.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.invoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                        >
                          <TableCell className="font-medium">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                invoiceStatusConfig[inv.status] ??
                                "bg-gray-100 text-gray-700"
                              }
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(inv.invoiceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(inv.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inv.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <div className="rounded-lg border bg-white p-12 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No documents yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Upload contracts, certificates, and other vendor documents.
                </p>
                <Button size="sm" variant="outline" className="mt-3">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Onboarding Sidebar */}
        {vendor.status === "PENDING_SETUP" && (
          <div className="w-72 shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Onboarding Checklist
                </CardTitle>
                <CardDescription>
                  Complete these steps to activate this vendor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {onboardingItems.map((item) => {
                    const checked =
                      vendor.onboardingChecklist?.[item.key] ?? false;
                    return (
                      <div
                        key={item.key}
                        className="flex items-start gap-2"
                      >
                        {checked ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            checked
                              ? "text-gray-500 line-through"
                              : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <p className="text-xs text-gray-400">
                  {
                    onboardingItems.filter(
                      (i) => vendor.onboardingChecklist?.[i.key]
                    ).length
                  }{" "}
                  of {onboardingItems.length} complete
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
