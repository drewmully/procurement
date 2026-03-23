"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Receipt, Search, Upload } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  linkedPONumber: string | null;
  linkedPOId: string | null;
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

export default function InvoicesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const json = await res.json();
        setInvoices(json.data?.items ?? json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      if (json.data?.id) {
        router.push(`/invoices/${json.data.id}`);
      } else {
        // Refresh the list
        const listRes = await fetch("/api/invoices");
        if (listRes.ok) {
          const listJson = await listRes.json();
          setInvoices(listJson.data?.items ?? listJson.data ?? []);
        }
      }
    } catch {
      // Upload failed
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">Failed to load invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage vendor invoices and payments
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Invoice
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No invoices found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search
              ? "Try a different search term."
              : "Upload your first invoice to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Linked PO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => {
                const config = statusConfig[inv.status] ?? {
                  label: inv.status,
                  variant: "bg-gray-100 text-gray-700",
                };
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>{inv.vendorName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={config.variant}>
                        {config.label}
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
                    <TableCell>
                      {inv.linkedPONumber ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inv.linkedPOId) {
                              router.push(
                                `/purchase-orders/${inv.linkedPOId}`
                              );
                            }
                          }}
                        >
                          {inv.linkedPONumber}
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
