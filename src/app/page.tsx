"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Receipt,
  CalendarClock,
  Building2,
  AlertTriangle,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ActionItem, DashboardStats } from "@/types";

interface DashboardData {
  stats: DashboardStats;
  actionItems: ActionItem[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }[];
}

const actionTypeConfig: Record<
  string,
  { icon: typeof FileText; color: string; bg: string }
> = {
  po_approval: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  invoice_due: {
    icon: Receipt,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  reorder_alert: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  price_change: {
    icon: DollarSign,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  receiving: {
    icon: Package,
    color: "text-green-600",
    bg: "bg-green-50",
  },
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

const activityTypeIcons: Record<string, typeof FileText> = {
  po_created: FileText,
  po_sent: FileText,
  invoice_received: Receipt,
  invoice_paid: DollarSign,
  vendor_added: Building2,
  inventory_received: Package,
  po_approved: CheckCircle,
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-700 font-medium">Failed to load dashboard</p>
        <p className="text-red-600 text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  const stats = data?.stats;
  const actionItems = data?.actionItems ?? [];
  const recentActivity = data?.recentActivity ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your procurement operations
        </p>
      </div>

      {/* Action Items Panel */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Action Items</CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionItems.map((item) => {
                const config = actionTypeConfig[item.type] ?? {
                  icon: Clock,
                  color: "text-gray-600",
                  bg: "bg-gray-50",
                };
                const Icon = config.icon;
                return (
                  <a
                    key={item.id}
                    href={item.link}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={priorityColors[item.priority]}
                    >
                      {item.priority}
                    </Badge>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Open POs</p>
                <p className="text-2xl font-bold">
                  {stats?.openPOCount ?? 0}
                </p>
                <p className="text-xs text-gray-400">
                  {formatCurrency(stats?.openPOValue ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unpaid Invoices</p>
                <p className="text-2xl font-bold">
                  {stats?.unpaidInvoiceCount ?? 0}
                </p>
                <p className="text-xs text-gray-400">
                  {formatCurrency(stats?.unpaidInvoiceValue ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <CalendarClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Due This Week</p>
                <p className="text-2xl font-bold">
                  {stats?.invoicesDueThisWeek ?? 0}
                </p>
                <p className="text-xs text-gray-400">invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Vendors</p>
                <p className="text-2xl font-bold">
                  {stats?.activeVendorCount ?? 0}
                </p>
                <p className="text-xs text-gray-400">vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Last 20 activities across the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {recentActivity.map((activity, idx) => {
                const Icon =
                  activityTypeIcons[activity.type] ?? TrendingUp;
                return (
                  <div key={activity.id} className="flex gap-3 pb-4">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white">
                        <Icon className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      {idx < recentActivity.length - 1 && (
                        <div className="flex-1 w-px bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activity.user} &middot;{" "}
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
