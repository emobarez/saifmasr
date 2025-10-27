import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Found" : "Not found");

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN"
      }
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      
      // Check if we have activity logs
      const logCount = await prisma.activityLog.count();
      console.log("Activity logs count:", logCount);
      
      if (logCount === 0) {
        console.log("Creating sample activity logs...");
        
        // Create some sample activity logs
        const sampleLogs = [
          {
            userId: existingAdmin.id,
            actionType: "LOGIN",
            description: "تسجيل دخول المدير إلى النظام",
            metadata: { ipAddress: "127.0.0.1" }
          },
          {
            userId: existingAdmin.id,
            actionType: "USER_CREATE",
            description: "إنشاء حساب مستخدم جديد",
            metadata: { targetUserId: existingAdmin.id }
          },
          {
            userId: existingAdmin.id,
            actionType: "SETTINGS_UPDATE",
            description: "تحديث إعدادات النظام",
            metadata: { changedFields: ["portalName", "locale"] }
          },
          {
            userId: existingAdmin.id,
            actionType: "SERVICE_CREATE",
            description: "إنشاء خدمة جديدة",
            metadata: { serviceName: "خدمة تجريبية" }
          },
          {
            userId: existingAdmin.id,
            actionType: "INVOICE_CREATE",
            description: "إنشاء فاتورة جديدة",
            metadata: { invoiceId: "INV-001", amount: 1000 }
          }
        ];

        for (const log of sampleLogs) {
          await prisma.activityLog.create({
            data: log
          });
        }

        console.log("Sample activity logs created successfully");
      }
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: "مدير النظام",
        email: "admin@system.com",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date()
      }
    });

    console.log("Admin user created successfully:", adminUser.email);
    console.log("Password: admin123");

    // Create some sample activity logs
    const sampleLogs = [
      {
        userId: adminUser.id,
        actionType: "LOGIN",
        description: "تسجيل دخول المدير إلى النظام",
        metadata: { ipAddress: "127.0.0.1" }
      },
      {
        userId: adminUser.id,
        actionType: "USER_CREATE",
        description: "إنشاء حساب مستخدم جديد",
        metadata: { targetUserId: adminUser.id }
      },
      {
        userId: adminUser.id,
        actionType: "SETTINGS_UPDATE",
        description: "تحديث إعدادات النظام",
        metadata: { changedFields: ["portalName", "locale"] }
      }
    ];

    for (const log of sampleLogs) {
      await prisma.activityLog.create({
        data: log
      });
    }

    console.log("Sample activity logs created");

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();