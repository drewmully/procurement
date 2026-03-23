import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user (username: mully)
  const hashedPassword = await hash("procurement", 12);
  const admin = await prisma.user.upsert({
    where: { email: "mully@mymully.com" },
    update: {},
    create: {
      name: "Mully",
      email: "mully@mymully.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create sample vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      companyName: "Outdoor Brands Inc",
      brandName: "TrailMaster",
      website: "https://trailmaster.com",
      orderMethod: "EMAIL",
      paymentTerms: "Net 30",
      paymentMethods: JSON.stringify(["Credit Card", "ACH"]),
      preferredPayment: "ACH",
      status: "ACTIVE",
      tags: JSON.stringify(["outdoor", "apparel"]),
      contacts: {
        create: {
          name: "Sarah Johnson",
          email: "sarah@trailmaster.com",
          phone: "555-0101",
          role: "Sales Rep",
          isPrimary: true,
        },
      },
      products: {
        create: [
          {
            vendorSku: "TM-JKT-001",
            vendorProductName: "All-Weather Hiking Jacket",
            vendorColor: "Forest Green",
            vendorSize: "M",
            wholesaleCost: 45.0,
            msrp: 89.99,
            ourSku: "MM-TM-JKT-001",
            currentStock: 25,
            salesVelocity: 2.5,
            reorderPoint: 15,
            reorderQuantity: 50,
          },
          {
            vendorSku: "TM-BPK-002",
            vendorProductName: "Summit Daypack 30L",
            wholesaleCost: 32.0,
            msrp: 64.99,
            ourSku: "MM-TM-BPK-002",
            currentStock: 8,
            salesVelocity: 1.2,
            reorderPoint: 10,
            reorderQuantity: 30,
          },
        ],
      },
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      companyName: "Coastal Accessories LLC",
      brandName: "SunCoast",
      website: "https://suncoastacc.com",
      orderMethod: "PORTAL",
      orderPortalUrl: "https://b2b.suncoastacc.com",
      paymentTerms: "Net 60",
      paymentMethods: JSON.stringify(["Credit Card", "Check"]),
      status: "ACTIVE",
      tags: JSON.stringify(["accessories", "sunglasses"]),
      contacts: {
        create: {
          name: "Mike Chen",
          email: "mike@suncoastacc.com",
          role: "Account Manager",
          isPrimary: true,
        },
      },
      products: {
        create: [
          {
            vendorSku: "SC-SG-100",
            vendorProductName: "Polarized Sport Sunglasses",
            vendorColor: "Matte Black",
            wholesaleCost: 12.5,
            msrp: 29.99,
            ourSku: "MM-SC-SG-100",
            currentStock: 45,
            salesVelocity: 3.0,
            reorderPoint: 20,
            reorderQuantity: 100,
          },
        ],
      },
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      companyName: "EcoWear Co",
      status: "PENDING_SETUP",
      orderMethod: "EMAIL",
      paymentTerms: "COD",
      paymentMethods: JSON.stringify(["Credit Card"]),
      tags: JSON.stringify(["sustainable", "apparel"]),
    },
  });

  // Create a sample PO
  const products = await prisma.vendorProduct.findMany({
    where: { vendorId: vendor1.id },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-00001",
      vendorId: vendor1.id,
      status: "DRAFT",
      subtotal: 3850.0,
      taxAmount: 0,
      shippingCost: 0,
      totalAmount: 3850.0,
      shipTo: "MyMully Warehouse\n123 Commerce St\nAnytown, ST 12345",
      createdBy: admin.id,
      lineItems: {
        create: products.map((p) => ({
          vendorProductId: p.id,
          vendorSku: p.vendorSku,
          description: p.vendorProductName,
          quantity: 50,
          unitCost: p.wholesaleCost,
          totalCost: p.wholesaleCost * 50,
        })),
      },
    },
  });

  // Create a sample invoice
  await prisma.invoice.create({
    data: {
      vendorId: vendor2.id,
      invoiceNumber: "INV-2026-0042",
      status: "RECEIVED",
      subtotal: 1250.0,
      taxAmount: 100.0,
      totalAmount: 1350.0,
      invoiceDate: new Date("2026-03-15"),
      dueDate: new Date("2026-04-14"),
    },
  });

  // Create default settings
  const defaultSettings = [
    { key: "company_name", value: JSON.stringify("MyMully") },
    { key: "company_address", value: JSON.stringify("123 Commerce St, Anytown, ST 12345") },
    { key: "company_phone", value: JSON.stringify("555-000-0000") },
    { key: "company_email", value: JSON.stringify("info@mymully.com") },
    { key: "po_number_prefix", value: JSON.stringify("PO") },
    { key: "po_next_number", value: JSON.stringify(2) },
    { key: "po_approval_threshold", value: JSON.stringify(5000) },
    { key: "default_ship_to", value: JSON.stringify("MyMully Warehouse\n123 Commerce St\nAnytown, ST 12345") },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Create activity log entries
  await prisma.activityLog.create({
    data: {
      action: "VENDOR_CREATED",
      entityType: "VENDOR",
      entityId: vendor1.id,
      details: JSON.stringify({ companyName: vendor1.companyName }),
      userId: admin.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "PO_CREATED",
      entityType: "PURCHASE_ORDER",
      entityId: po.id,
      details: JSON.stringify({ poNumber: po.poNumber, vendorName: vendor1.companyName }),
      userId: admin.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log(`  - Admin user: mully@mymully.com / procurement`);
  console.log(`  - ${3} vendors created`);
  console.log(`  - ${1} purchase order created`);
  console.log(`  - ${1} invoice created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
