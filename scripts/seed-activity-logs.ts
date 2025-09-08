import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ActivityLogger } from '../src/lib/activityLogger';

const prisma = new PrismaClient();

async function seedActivityLogs() {
  console.log('🌱 Adding sample activity logs...');

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('❌ No admin user found. Creating sample admin user...');
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@saifmasr.com',
        name: 'المدير العام',
        role: 'ADMIN',
        password: '$2a$10$dummy.hash.for.testing', // This is a dummy hash
        status: 'ACTIVE'
      }
    });

    console.log('✅ Created admin user:', newAdmin.email);
  }

  const admin = adminUser || await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!admin) {
    console.log('❌ Could not find or create admin user');
    return;
  }

  // Create sample activity logs
  const sampleActivities = [
    {
      actionType: 'LOGIN',
      description: 'تسجيل دخول المدير العام',
      userId: admin.id,
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        originalActionType: 'USER_LOGIN'
      }
    },
    {
      actionType: 'CREATE',
      description: 'إنشاء خدمة جديدة: خدمة الحراسة الشخصية',
      userId: admin.id,
      metadata: {
        originalActionType: 'SERVICE_CREATED',
        target: { id: 'service_1', type: 'service', name: 'خدمة الحراسة الشخصية' }
      }
    },
    {
      actionType: 'UPDATE',
      description: 'تحديث معلومات العميل: أحمد محمد',
      userId: admin.id,
      metadata: {
        originalActionType: 'CLIENT_UPDATED',
        target: { id: 'client_1', type: 'client', name: 'أحمد محمد' },
        changes: { phone: 'updated', address: 'updated' }
      }
    },
    {
      actionType: 'VIEW',
      description: 'عرض تقرير المبيعات الشهرية',
      userId: admin.id,
      metadata: {
        originalActionType: 'REPORT_VIEWED',
        target: { id: 'report_1', type: 'report', name: 'تقرير المبيعات الشهرية' }
      }
    },
    {
      actionType: 'EXPORT',
      description: 'تصدير قائمة العملاء',
      userId: admin.id,
      metadata: {
        originalActionType: 'DATA_EXPORTED',
        dataType: 'clients',
        filters: { status: 'active', dateRange: '30d' }
      }
    },
    {
      actionType: 'DELETE',
      description: 'حذف طلب خدمة منتهي الصلاحية',
      userId: admin.id,
      metadata: {
        originalActionType: 'SERVICE_REQUEST_DELETED',
        target: { id: 'request_1', type: 'service_request', name: 'طلب خدمة #001' }
      }
    },
    {
      actionType: 'SYSTEM',
      description: 'تشغيل مهمة النسخ الاحتياطي اليومي',
      userId: null,
      metadata: {
        originalActionType: 'SYSTEM_BACKUP',
        details: { backupSize: '2.4GB', duration: '15 minutes' }
      }
    },
    {
      actionType: 'WARNING',
      description: 'تحذير: مساحة القرص الصلب منخفضة',
      userId: null,
      metadata: {
        originalActionType: 'SYSTEM_WARNING',
        warning: 'Low disk space',
        details: { availableSpace: '5GB', threshold: '10GB' }
      }
    },
    {
      actionType: 'INFO',
      description: 'تحديث النظام إلى الإصدار 2.1.0',
      userId: null,
      metadata: {
        originalActionType: 'SYSTEM_UPDATE',
        version: '2.1.0',
        previousVersion: '2.0.8'
      }
    },
    {
      actionType: 'CREATE',
      description: 'إنشاء فاتورة جديدة للعميل: شركة الأمن المتقدم',
      userId: admin.id,
      metadata: {
        originalActionType: 'INVOICE_CREATED',
        target: { id: 'invoice_1', type: 'invoice', name: 'فاتورة #INV-001' },
        details: { amount: 5000, currency: 'EGP' }
      }
    }
  ];

  // Add activities with different timestamps
  for (let i = 0; i < sampleActivities.length; i++) {
    const activity = sampleActivities[i];
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - (i * 2)); // Spread over last few hours
    
    await prisma.activityLog.create({
      data: {
        ...activity,
        createdAt
      }
    });
  }

  // Add some older activities for testing date filters
  const olderActivities = [
    {
      actionType: 'LOGIN',
      description: 'تسجيل دخول من جهاز مختلف',
      userId: admin.id,
      metadata: { ipAddress: '192.168.1.105' }
    },
    {
      actionType: 'UPDATE',
      description: 'تحديث إعدادات النظام',
      userId: admin.id,
      metadata: { settingsType: 'general', changes: { theme: 'dark' } }
    }
  ];

  for (let i = 0; i < olderActivities.length; i++) {
    const activity = olderActivities[i];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (i + 3)); // Few days ago
    
    await prisma.activityLog.create({
      data: {
        ...activity,
        createdAt
      }
    });
  }

  console.log('✅ Successfully added sample activity logs');
}

async function main() {
  try {
    await seedActivityLogs();
  } catch (error) {
    console.error('❌ Error seeding activity logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run only if called directly
if (require.main === module) {
  main();
}