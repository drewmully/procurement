"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Loader2,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface Vendor {
  id: string;
  companyName: string;
  brandName: string | null;
  status: string;
  paymentTerms: string | null;
  openPOCount: number;
  unpaidInvoiceCount: number;
  lastOrderedAt: string | null;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  ACTIVE: { label: "Active", variant: "bg-green-100 text-green-700" },
  PENDING_SETUP: {
    label: "Pending Setup",
    variant: "bg-yellow-100 text-yellow-700",
  },
  INACTIVE: { label: "Inactive", variant: "bg-gray-100 text-gray-700" },
  ON_HOLD: { label: "On Hold", variant: "bg-red-100 text-red-700" },
};

const columnHelper = createColumnHelper<Vendor>();

export default function VendorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<Vendor[]>({
    queryKey: ["vendors", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      const res = await fetch(`/api/vendors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const json = await res.json();
      return json.data?.items ?? json.data ?? [];
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("companyName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("brandName", {
        header: "Brand",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const config = statusConfig[info.getValue()] ?? {
            label: info.getValue(),
            variant: "bg-gray-100 text-gray-700",
          };
          return (
            <Badge variant="secondary" className={config.variant}>
              {config.label}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("paymentTerms", {
        header: "Payment Terms",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("openPOCount", {
        header: "Open POs",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("unpaidInvoiceCount", {
        header: "Unpaid Invoices",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("lastOrderedAt", {
        header: "Last Ordered",
        cell: (info) => {
          const val = info.getValue();
          return val ? format(new Date(val), "MMM d, yyyy") : "Never";
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your vendor relationships
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Enter the vendor details to create a new vendor record.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const body = {
                  companyName: formData.get("companyName"),
                  brandName: formData.get("brandName") || null,
                  website: formData.get("website") || null,
                  paymentTerms: formData.get("paymentTerms") || null,
                  notes: formData.get("notes") || null,
                };
                const res = await fetch("/api/vendors", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });
                if (res.ok) {
                  const json = await res.json();
                  setDialogOpen(false);
                  router.push(`/vendors/${json.data?.id ?? ""}`);
                }
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    required
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    name="brandName"
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select name="paymentTerms">
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NET_30">Net 30</SelectItem>
                      <SelectItem value="NET_60">Net 60</SelectItem>
                      <SelectItem value="NET_15">Net 15</SelectItem>
                      <SelectItem value="DUE_ON_RECEIPT">
                        Due on Receipt
                      </SelectItem>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any initial notes about this vendor"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Vendor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING_SETUP">Pending Setup</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">Failed to load vendors</p>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No vendors found</p>
          <p className="text-gray-400 text-sm mt-1">
            Add your first vendor to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/vendors/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {table.getFilteredRowModel().rows.length} vendor(s)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
