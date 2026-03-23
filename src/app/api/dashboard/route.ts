import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Run all queries in parallel
    const [
      draftPOs,
      unmatchedInvoices,
      overdueInvoices,
      lowStockProducts,
      incompleteVendors,
      expiringCerts,
      openPOs,
      unpaidInvoices,
      invoicesDueThisWeek,
      activeVendorCount,
      recentActivity,
    ] = await Promise.all([
      // Action items: Draft POs
      prisma.purchaseOrder.count({
        where: { status: "DRAFT" },
      }),

      // Action items: Unmatched invoices (RECEIVED status, no linked PO)
      prisma.invoice.count({
        where: {
          status: "RECEIVED",
          purchaseOrderId: null,
        },
      }),

      // Action items: Overdue invoices
      prisma.invoice.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["PAID"] },
        },
      }),

      // Action items: Low stock items
      prisma.vendorProduct.count({
        where: {
          isActive: true,
          reorderPoint: { not: null },
          currentStock: { not: null },
          AND: {
            currentStock: { lte: prisma.vendorProduct.fields?.reorderPoint as any },
          },
        },
      }).catch(() =>
        // Fallback: fetch and count manually if raw field comparison fails
        prisma.vendorProduct
          .findMany({
            where: {
              isActive: true,
              reorderPoint: { not: null },
              currentStock: { not: null },
            },
            select: { currentStock: true, reorderPoint: true },
          })
          .then(
            (products) =>
              products.filter(
                (p) =>
                  p.currentStock !== null &&
                  p.reorderPoint !== null &&
                  p.currentStock <= p.reorderPoint
              ).length
          )
      ),

      // Action items: Incomplete vendor onboarding
      prisma.vendor.count({
        where: { status: "PENDING_SETUP" },
      }),

      // Action items: Expiring certificates (within 30 days)
      prisma.resaleCertificate.count({
        where: {
          isActive: true,
          expiryDate: {
            not: null,
            lte: thirtyDaysFromNow,
            gte: now,
          },
        },
      }),

      // Summary stats: Open POs (not RECEIVED, not CANCELLED)
      prisma.purchaseOrder.aggregate({
        where: {
          status: { notIn: ["RECEIVED", "CANCELLED"] },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),

      // Summary stats: Unpaid invoices
      prisma.invoice.aggregate({
        where: {
          status: { notIn: ["PAID"] },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),

      // Summary stats: Invoices due this week
      prisma.invoice.count({
        where: {
          dueDate: { gte: now, lte: endOfWeek },
          status: { notIn: ["PAID"] },
        },
      }),

      // Summary stats: Active vendor count
      prisma.vendor.count({
        where: { status: "ACTIVE" },
      }),

      // Recent activity
      prisma.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      actionItems: {
        draftPOs,
        unmatchedInvoices,
        overdueInvoices,
        lowStockItems: lowStockProducts,
        incompleteVendorOnboarding: incompleteVendors,
        expiringCerts,
      },
      summaryStats: {
        openPOs: {
          count: openPOs._count,
          value: openPOs._sum.totalAmount || 0,
        },
        unpaidInvoices: {
          count: unpaidInvoices._count,
          value: unpaidInvoices._sum.totalAmount || 0,
        },
        invoicesDueThisWeek,
        activeVendorCount,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to get dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard data" },
      { status: 500 }
    );
  }
}
