"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  CheckCircle,
  DollarSign,
  Link2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  linkedPOId: string | null;
  linkedPONumber: string | null;
  notes: string | null;
  lineItems: InvoiceLineItem[];
  parsedData: Record<string, string> | null;
  fileUrl: string | null;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  PAID: { label: "Paid", variant: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", variant: "bg-red-100 text-red-700" },
  RECEIVED: { label: "Received", variant: "bg-blue-100 text-blue-700" },
  MATCHED: { label: "Matched", variant: "bg-yellow-100 text-yellow-700" },
  PENDING: { label: "Pending", variant: "bg-gray-100 text-gray-700" },
  APPROVED: { label: "Approved", variant: "bg-blue-100 text-blue-700" },
  DISPUTED: { label: "Disputed", variant: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Cancelled", variant: "bg-gray-100 text-gray-600" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (!res.ok) throw new Error("Failed to fetch invoice");
        const json = await res.json();
        setInvoice(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve invoice");
      const json = await res.json();
      setInvoice(json.data);
    } catch {
      // Action failed
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentDate: paymentDate,
          reference: paymentRef,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      const json = await res.json();
      setInvoice(json.data);
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentDate("");
      setPaymentRef("");
    } catch {
      // Payment failed
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkPO = async () => {
    const poNumber = prompt("Enter PO number to link:");
    if (!poNumber) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/link-po`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poNumber }),
      });
      if (!res.ok) throw new Error("Failed to link PO");
      const json = await res.json();
      setInvoice(json.data);
    } catch {
      // Link failed
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-700">Failed to load invoice</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[invoice.status] ?? {
    label: invoice.status,
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
            onClick={() => router.push("/invoices")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <Badge variant="secondary" className={config.variant}>
              {config.label}
            </Badge>
          </div>
          <p className="text-gray-500">
            Vendor: {invoice.vendorName} | Invoiced:{" "}
            {format(new Date(invoice.invoiceDate), "MMM d, yyyy")} | Due:{" "}
            {format(new Date(invoice.dueDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== "PAID" &&
            invoice.status !== "CANCELLED" &&
            invoice.status !== "APPROVED" && (
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                variant="outline"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            )}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Dialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment for invoice {invoice.invoiceNumber}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentAmount">Amount</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={invoice.totalAmount.toFixed(2)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentRef">Reference / Check #</Label>
                    <Input
                      id="paymentRef"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={actionLoading || !paymentAmount}
                  >
                    {actionLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {!invoice.linkedPOId && (
            <Button
              variant="outline"
              onClick={handleLinkPO}
              disabled={actionLoading}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Link to PO
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          {(invoice.lineItems ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parsed Data */}
          {invoice.parsedData &&
            Object.keys(invoice.parsedData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Parsed Invoice Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {Object.entries(invoice.parsedData).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-gray-500 capitalize">
                          {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.linkedPONumber && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked PO</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() =>
                    router.push(`/purchase-orders/${invoice.linkedPOId}`)
                  }
                >
                  {invoice.linkedPONumber}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
