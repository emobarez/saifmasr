import { prisma } from "./db";

// User operations
export const userService = {
  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true
      }
    });
  },

  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: "CLIENT" | "ADMIN";
  }) {
    return prisma.user.create({
      data: {
        ...data,
        role: data.role || "CLIENT"
      }
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    status: "ACTIVE" | "INACTIVE" | "BANNED";
    role: "CLIENT" | "ADMIN";
  }>) {
    return prisma.user.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    });
  }
};

// Service operations
export const serviceService = {
  async getAll() {
    return prisma.service.findMany({
      include: {
        faqs: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { serviceRequests: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        faqs: {
          orderBy: { order: 'asc' }
        }
      }
    });
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    category?: string;
    price?: number;
    status?: "ACTIVE" | "INACTIVE";
    icon?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    features?: string[];
    ctaLabel?: string;
    ctaUrl?: string;
  }) {
    return prisma.service.create({
      data: {
        ...data,
        status: data.status || "ACTIVE"
      }
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    shortDescription: string;
    category: string;
    price: number;
    status: "ACTIVE" | "INACTIVE";
    icon: string;
    displayOrder: number;
    isFeatured: boolean;
    features: string[];
    ctaLabel: string;
    ctaUrl: string;
    slug: string;
  }>) {
    return prisma.service.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return prisma.service.delete({
      where: { id }
    });
  }
};

// Service Request operations
export const serviceRequestService = {
  async getAll(filters?: {
    userId?: string;
    serviceId?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  }) {
    return prisma.serviceRequest.findMany({
      where: filters,
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: string) {
    return prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  async create(data: {
    userId: string;
    serviceId: string;
    title: string;
    description: string;
    attachmentUrl?: string;
  }) {
    return prisma.serviceRequest.create({
      data: {
        ...data,
        status: "PENDING",
        priority: "MEDIUM"
      },
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }>) {
    return prisma.serviceRequest.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return prisma.serviceRequest.delete({
      where: { id }
    });
  }
};

// Activity Log operations
export const activityLogService = {
  async getAll(limit = 50) {
    return prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  async create(data: {
    userId?: string;
    actionType: string;
    description: string;
    metadata?: any;
  }) {
    return prisma.activityLog.create({
      data
    });
  }
};

// Employee Service
export const employeeService = {
  async getAll() {
    return await prisma.employee.findMany({
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: string) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    position: string;
    department?: string;
    salary?: number;
    hireDate: Date;
    status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  }) {
    return await prisma.employee.create({
      data,
      include: {
        assignments: true
      }
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    salary: number;
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  }>) {
    return await prisma.employee.update({
      where: { id },
      data,
      include: {
        assignments: true
      }
    });
  },

  async delete(id: string) {
    return await prisma.employee.delete({
      where: { id }
    });
  }
};

// Assignment Service
export const assignmentService = {
  async getAll() {
    return await prisma.assignment.findMany({
      include: {
        employee: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getByEmployeeId(employeeId: string) {
    return await prisma.assignment.findMany({
      where: { employeeId },
      include: {
        employee: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: {
    employeeId: string;
    title: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.assignment.create({
      data,
      include: {
        employee: true
      }
    });
  },

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate: Date;
    endDate: Date;
  }>) {
    return await prisma.assignment.update({
      where: { id },
      data,
      include: {
        employee: true
      }
    });
  },

  async delete(id: string) {
    return await prisma.assignment.delete({
      where: { id }
    });
  }
};

// Invoice Service
export const invoiceService = {
  async getAll() {
    return await prisma.invoice.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    }) as any;
  },

  async getById(id: string) {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    }) as any;
  },

  async getByUserId(userId: string) {
    return await prisma.invoice.findMany({
      where: { clientId: userId }, // العميل الذي تخصه الفاتورة
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    }) as any;
  },

  async create(data: {
    userId: string;
    clientId: string;
    serviceRequestId?: string;
    amount: number;
    currency?: string;
    description?: string;
    dueDate?: Date;
    taxAmount?: number;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const { items, ...invoiceData } = data;
    const totalAmount = data.amount + (data.taxAmount || 0);
    
    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });
    
    const nextNumber = lastInvoice ? 
      parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) + 1 : 1;
    const invoiceNumber = `INV-${nextNumber.toString().padStart(6, '0')}`;

    return await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        totalAmount,
        currency: data.currency || 'EGP',
        items: items ? {
          create: items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice
          }))
        } : undefined
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    }) as any;
  },

  async createFromServiceRequest(serviceRequestId: string, adminUserId: string, dueDate?: Date) {
    // Get service request with all related data
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        user: true,
        service: true
      }
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    if (!serviceRequest.service.price) {
      throw new Error('Service price not set');
    }

    // Note: Will check for duplicate invoices at creation time

    // Calculate amount based on service price multiplied by personnel count (for bodyguard services)
    // If personnelCount is not set (null/undefined), default to 1
    const personnelCount = serviceRequest.personnelCount || 1;
    const amount = serviceRequest.service.price * personnelCount;
    
    // Egyptian VAT rate is 14%
    const taxAmount = amount * 0.14;
    const totalAmount = amount + taxAmount;

    // Calculate due date (default: 30 days from now)
    const invoiceDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });
    
    const nextNumber = lastInvoice ? 
      parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) + 1 : 1;
    const invoiceNumber = `INV-${nextNumber.toString().padStart(6, '0')}`;

    // Create invoice with personnel count in description if applicable
    const itemDescription = personnelCount > 1 
      ? `${serviceRequest.service.name} (${personnelCount} أفراد)`
      : serviceRequest.service.name;
    
    const invoiceDescription = personnelCount > 1
      ? `فاتورة لخدمة: ${serviceRequest.service.name} - ${serviceRequest.title} (${personnelCount} أفراد × ${serviceRequest.service.price.toLocaleString('ar-EG')} جنيه)`
      : `فاتورة لخدمة: ${serviceRequest.service.name} - ${serviceRequest.title}`;

    // Create invoice
    return await prisma.invoice.create({
      data: {
        userId: adminUserId,
        clientId: serviceRequest.userId,
        serviceRequestId: serviceRequestId,
        invoiceNumber,
        amount,
        currency: 'EGP',
        status: 'PENDING',
        description: invoiceDescription,
        taxAmount,
        totalAmount,
        dueDate: invoiceDueDate,
        items: {
          create: [{
            description: itemDescription,
            quantity: personnelCount,
            unitPrice: serviceRequest.service.price,
            totalPrice: amount
          }]
        }
      } as any,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    }) as any;
  },

  async update(id: string, data: Partial<{
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
    description: string;
    dueDate: Date;
    taxAmount: number;
    paymentMethod: string;
    paidAt: Date;
  }>) {
    const updateData = { ...data } as any;
    
    if (data.amount !== undefined || data.taxAmount !== undefined) {
      const current = await prisma.invoice.findUnique({ where: { id } });
      if (current) {
        updateData.totalAmount = (data.amount ?? current.amount) + (data.taxAmount ?? current.taxAmount ?? 0);
      }
    }

    return await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });
  },

  async delete(id: string) {
    return await prisma.invoice.delete({
      where: { id }
    });
  },

  async getStats() {
    const [total, paid, pending, overdue] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } })
    ]);

    const [totalRevenue, pendingRevenue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      total,
      paid,
      pending,
      overdue,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingRevenue: pendingRevenue._sum.totalAmount || 0
    };
  }
};

// Report Service
export const reportService = {
  async getAll() {
    return await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: string) {
    return await prisma.report.findUnique({
      where: { id }
    });
  },

  async create(data: {
    title: string;
    content: string;
    summary?: string;
    type?: string;
    clientId?: string;
    serviceId?: string;
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.report.create({
      data
    });
  },

  async update(id: string, data: Partial<{
    title: string;
    content: string;
    summary: string;
    status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED";
    type: string;
    clientId: string;
    serviceId: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
  }>) {
    return await prisma.report.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return await prisma.report.delete({
      where: { id }
    });
  },

  async getStats() {
    const [total, draft, published, underReview] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'DRAFT' } }),
      prisma.report.count({ where: { status: 'PUBLISHED' } }),
      prisma.report.count({ where: { status: 'UNDER_REVIEW' } })
    ]);

    return {
      total,
      draft,
      published,
      underReview
    };
  }
};

// System Settings operations
export const settingsService = {
  async get() {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "general" }
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.systemSettings.create({
        data: {
          id: "general",
          portalName: "سيف مصر الوطنية للأمن",
          maintenanceMode: false,
          adminEmail: "admin@saifmasr.com",
          companyPhone: "+20 2 1234 5678",
          companyAddress: "القاهرة، جمهورية مصر العربية",
          publicEmail: "info@saifmasr.com",
          currency: "EGP",
          locale: "ar-EG",
          timezone: "Africa/Cairo",
          taxRate: 14.0
        }
      });
    }

    return settings;
  },

  async update(data: Partial<{
    portalName: string;
    maintenanceMode: boolean;
    adminEmail: string;
    companyPhone: string;
    companyAddress: string;
    publicEmail: string;
    currency: string;
    locale: string;
    timezone: string;
    taxRate: number;
    facebookUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
  }>) {
    return prisma.systemSettings.upsert({
      where: { id: "general" },
      update: data,
      create: {
        id: "general",
        portalName: "سيف مصر الوطنية للأمن",
        maintenanceMode: false,
        adminEmail: "admin@saifmasr.com",
        companyPhone: "+20 2 1234 5678",
        companyAddress: "القاهرة، جمهورية مصر العربية",
        publicEmail: "info@saifmasr.com",
        currency: "EGP",
        locale: "ar-EG",
        timezone: "Africa/Cairo",
        taxRate: 14.0,
        ...data
      }
    });
  }
};