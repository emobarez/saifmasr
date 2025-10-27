import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function getAdminCredentials() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log("Found admin users:");
    console.log("==================");
    
    for (const admin of admins) {
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log("==================");
    }

    if (admins.length === 0) {
      console.log("No admin users found!");
    } else {
      console.log("\nNote: For the user 'admin@saifmasr.com', the password should be 'admin123' if created by the seeding script.");
    }

  } catch (error) {
    console.error("Error fetching admin users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getAdminCredentials();