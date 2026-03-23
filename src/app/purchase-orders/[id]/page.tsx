"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Send,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

interface POLineItem {
  id: string;
  vendorSku: string;
  ourSku: string | null;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
}

interface LinkedInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  invoiceDate: string;
}

interface PODetail {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  notes: string | null;
  shippingAddress: string | null;
  lineItems: POLineItem[];
  linkedInvoices: LinkedInvoice[];
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  DRAFT: { label: "Draft", variant: "bg-gray-100 text-gray-700" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approved", variant: "bg-blue-100 text-blue-700" },
  SENT: { label: "Sent", variant: "bg-indigo-100 text-indigo-700" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "bg-purple-100 text-purple-700" },
  PARTIALLY_RECEIVED: { label: "Partially Received", variant: "bg-orange-100 text-orange-700" },
  RECEIVED: { label: "Received", variant: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", variant: "bg-red-100 text-red-700" },
  CLOSED: { label: "Closed", variant: "bg-gray-100 text-gray-600" },
};

const invoiceStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const poId = params.id as string;

  const { data: po, isLoading, error } = useQuery<PODetail>({
    queryKey: ["purchase-order", poId],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${poId}`);
      if (!res.ok) throw new Error("Failed to fetch PO");
      const json = await res.json();
      return json.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/purchase-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-700">Failed to load purchase order</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[po.status] ?? {
    label: po.status,
    variant: "bg-gray-100 text-gray-700",
  };

  const canSend = ["DRAFT", "APPROVED"].includes(po.status);
  const canReceive = ["SENT", "ACKNOWLEDGED", "PARTIALLY_RECEIVED"].includes(
    po.status
  );
  const canCancel = !["CANCELLED", "CLOSED", "RECEIVED"].includes(po.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => router.push("/purchase-orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
            <Badge variant="secondary" className={status.variant}>
              {status.label}
            </Badge>
          </div>
          <p className="text-gray-500">
            Vendor:{" "}
            <a
              href={`/vendors/${po.vendorId}`}
              className="text-blue-600 hover:underline"
            >
              {po.vendorName}
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSend && (
            <Button
              variant="default"
              onClick={() => updateStatus.mutate("SENT")}
              disabled={updateStatus.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          {canReceive && (
            <Button
              variant="default"
              onClick={() => updateStatus.mutate("RECEIVED")}
              disabled={updateStatus.isPending}
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Mark Received
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => updateStatus.mutate("CANCELLED")}
              disabled={updateStatus.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-500">Order Date</p>
            <p className="font-medium">
              {format(new Date(po.orderDate), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-500">Expected Delivery</p>
            <p className="font-medium">
              {po.expectedDeliveryDate
                ? format(new Date(po.expectedDeliveryDate), "MMM d, yyyy")
                : "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-500">Items</p>
            <p className="font-medium">{po.lineItems?.length ?? 0} line items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-500">Total</p>
            <p className="font-medium text-lg">
              {formatCurrency(po.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty Ordered</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(po.lineItems ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.vendorSku}
                      {item.ourSku && (
                        <span className="block text-xs text-gray-400">
                          Our: {item.ourSku}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.quantityOrdered}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.quantityReceived < item.quantityOrdered
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {item.quantityReceived}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(po.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{formatCurrency(po.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(po.totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {po.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {po.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Linked Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {(po.linkedInvoices ?? []).length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              <Receipt className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No invoices linked to this PO.</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.linkedInvoices.map((inv) => (
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
                            invoiceStatusColors[inv.status] ??
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(inv.invoiceDate), "MMM d, yyyy")}
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
        </CardContent>
      </Card>
    </div>
  );
}
