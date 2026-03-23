import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// One-time seed endpoint to create the default admin user
// Call POST /api/auth/seed to create the default user
export async function POST() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "mully@mymully.com" },
    });

    if (existing) {
      return NextResponse.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash("procurement", 12);
    await prisma.user.create({
      data: {
        name: "Mully",
        email: "mully@mymully.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ message: "Default user created" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed" },
      { status: 500 }
    );
  }
}
