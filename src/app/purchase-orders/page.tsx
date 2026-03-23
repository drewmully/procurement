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
  Plus,
  Search,
  Loader2,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  totalAmount: number;
  itemCount: number;
}

const poStatusConfig: Record<string, { label: string; variant: string }> = {
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

const columnHelper = createColumnHelper<PurchaseOrder>();

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, error } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      const res = await fetch(`/api/purchase-orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      const json = await res.json();
      return json.data?.items ?? json.data ?? [];
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("poNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            PO Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <span className="font-medium font-mono">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("vendorName", {
        header: "Vendor",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const config = poStatusConfig[info.getValue()] ?? {
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
      columnHelper.accessor("orderDate", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
      }),
      columnHelper.accessor("expectedDeliveryDate", {
        header: "Expected Date",
        cell: (info) => {
          const val = info.getValue();
          return val ? format(new Date(val), "MMM d, yyyy") : "-";
        },
      }),
      columnHelper.accessor("totalAmount", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total ($)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("itemCount", {
        header: "Items",
        cell: (info) => info.getValue(),
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and track your purchase orders
          </p>
        </div>
        <Button onClick={() => router.push("/purchase-orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by PO number or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(poStatusConfig).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
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
          <p className="text-red-700">Failed to load purchase orders</p>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No purchase orders found</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first purchase order to get started.
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
                  onClick={() =>
                    router.push(`/purchase-orders/${row.original.id}`)
                  }
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
              {table.getFilteredRowModel().rows.length} purchase order(s)
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
