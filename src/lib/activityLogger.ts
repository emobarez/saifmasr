
import { prisma } from '@/lib/db';

export type ActivityActionType = 
  | "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "EXPORT"
  | "LOGIN" | "LOGOUT" | "REGISTER"
  | "SYSTEM" | "ERROR" | "WARNING" | "INFO"
  | "CLIENT_CREATED" | "CLIENT_UPDATED" | "CLIENT_DELETED"
  | "SERVICE_CREATED" | "SERVICE_UPDATED" | "SERVICE_DELETED"
  | "EMPLOYEE_CREATED" | "EMPLOYEE_UPDATED" | "EMPLOYEE_DELETED" | "EMPLOYEE_PROFILE_PICTURE_UPDATED"
  | "INVOICE_CREATED" | "INVOICE_UPDATED" | "INVOICE_DELETED"
  | "REPORT_CREATED" | "REPORT_UPDATED" | "REPORT_DELETED"
  | "SERVICE_REQUEST_SUBMITTED" | "SERVICE_REQUEST_STATUS_UPDATED"
  | "SERVICE_REQUEST_DRAFT_CREATED" | "SERVICE_REQUEST_DRAFT_UPDATED" | "SERVICE_REQUEST_DRAFT_SUBMITTED" | "SERVICE_REQUEST_ATTACHMENT_ADDED" | "SERVICE_REQUEST_REMINDER_SENT"
  | "AI_REPORT_SUMMARY_GENERATED" | "AI_REPORT_IMPROVEMENTS_SUGGESTED" | "AI_REPORT_SECTION_GENERATED" | "AI_REPORT_SECTION_APPENDED"
  | "AI_SERVICE_CATEGORY_SUGGESTED" | "AI_SERVICE_FAQS_GENERATED"
  | "AI_TOOL_USAGE" | "AI_TOOL_ERROR"
  | "SETTINGS_UPDATED"
  | "CLIENT_PROFILE_PICTURE_UPDATED" | "CLIENT_PROFILE_INFO_UPDATED" | "CLIENT_PASSWORD_CHANGED"
  | "UNKNOWN_ACTION";

interface ActivityLogActor {
  id: string | null;
  role?: "client" | "admin" | null; 
  name?: string | null;
  email?: string | null;
}

interface ActivityLogTarget {
  id?: string | null;
  type?: string | null;
  name?: string | null;
}

interface ActivityLogPayload {
  actionType: ActivityActionType;
  description: string;
  actor?: ActivityLogActor;
  target?: ActivityLogTarget;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityLogEntry extends ActivityLogPayload { 
    id: string;
    createdAt: Date;
}

// Enhanced activity logger with better categorization
export async function logActivity(payload: ActivityLogPayload): Promise<void> {
  try {
    // Normalize action type for better categorization
    let normalizedActionType = payload.actionType;
    
    // Map specific actions to generic categories for filtering
    if (payload.actionType.includes('CREATED')) {
      normalizedActionType = 'CREATE';
    } else if (payload.actionType.includes('UPDATED')) {
      normalizedActionType = 'UPDATE';
    } else if (payload.actionType.includes('DELETED')) {
      normalizedActionType = 'DELETE';
    } else if (payload.actionType.includes('LOGIN')) {
      normalizedActionType = 'LOGIN';
    } else if (payload.actionType.includes('LOGOUT')) {
      normalizedActionType = 'LOGOUT';
    }

    await prisma.activityLog.create({
      data: {
        actionType: normalizedActionType,
        description: payload.description,
        userId: payload.actor?.id,
        metadata: JSON.parse(JSON.stringify({
          originalActionType: payload.actionType,
          actor: payload.actor,
          target: payload.target,
          details: payload.details,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          timestamp: new Date().toISOString(),
        })),
      },
    });
    console.log('Activity logged successfully:', payload.actionType);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw the error - logging failures shouldn't break the main functionality
  }
}

// Helper functions for common activities
export const ActivityLogger = {
  // User activities
  userLogin: (userId: string, userEmail: string, ipAddress?: string) => 
    logActivity({
      actionType: 'LOGIN',
      description: `تسجيل دخول المستخدم: ${userEmail}`,
      actor: { id: userId, email: userEmail },
      ipAddress
    }),

  userLogout: (userId: string, userEmail: string) => 
    logActivity({
      actionType: 'LOGOUT',
      description: `تسجيل خروج المستخدم: ${userEmail}`,
      actor: { id: userId, email: userEmail }
    }),

  userRegister: (userId: string, userEmail: string) => 
    logActivity({
      actionType: 'CREATE',
      description: `تسجيل مستخدم جديد: ${userEmail}`,
      actor: { id: userId, email: userEmail },
      details: { action: 'user_registration' }
    }),

  // CRUD operations
  create: (userId: string, entityType: string, entityId: string, entityName: string) => 
    logActivity({
      actionType: 'CREATE',
      description: `إنشاء ${entityType}: ${entityName}`,
      actor: { id: userId },
      target: { id: entityId, type: entityType, name: entityName }
    }),

  update: (userId: string, entityType: string, entityId: string, entityName: string, changes: Record<string, any>) => 
    logActivity({
      actionType: 'UPDATE',
      description: `تحديث ${entityType}: ${entityName}`,
      actor: { id: userId },
      target: { id: entityId, type: entityType, name: entityName },
      details: { changes }
    }),

  delete: (userId: string, entityType: string, entityId: string, entityName: string) => 
    logActivity({
      actionType: 'DELETE',
      description: `حذف ${entityType}: ${entityName}`,
      actor: { id: userId },
      target: { id: entityId, type: entityType, name: entityName }
    }),

  view: (userId: string, entityType: string, entityId: string, entityName: string) => 
    logActivity({
      actionType: 'VIEW',
      description: `عرض ${entityType}: ${entityName}`,
      actor: { id: userId },
      target: { id: entityId, type: entityType, name: entityName }
    }),

  export: (userId: string, dataType: string, filters?: Record<string, any>) => 
    logActivity({
      actionType: 'EXPORT',
      description: `تصدير بيانات: ${dataType}`,
      actor: { id: userId },
      details: { dataType, filters }
    }),

  // System activities
  systemError: (error: string, context?: Record<string, any>) => 
    logActivity({
      actionType: 'ERROR',
      description: `خطأ في النظام: ${error}`,
      details: { error, context }
    }),

  systemWarning: (warning: string, context?: Record<string, any>) => 
    logActivity({
      actionType: 'WARNING',
      description: `تحذير النظام: ${warning}`,
      details: { warning, context }
    }),

  systemInfo: (info: string, context?: Record<string, any>) => 
    logActivity({
      actionType: 'INFO',
      description: `معلومات النظام: ${info}`,
      details: { info, context }
    }),

  // Service Request detailed events
  serviceRequestDraftCreated: (userId: string, requestId: string, data: Record<string, any>) =>
    logActivity({
      actionType: 'SERVICE_REQUEST_DRAFT_CREATED',
      description: `إنشاء مسودة طلب خدمة: ${requestId}`,
      actor: { id: userId },
      target: { id: requestId, type: 'ServiceRequest' },
      details: data
    }),
  serviceRequestDraftUpdated: (userId: string, requestId: string, changes: Record<string, any>) =>
    logActivity({
      actionType: 'SERVICE_REQUEST_DRAFT_UPDATED',
      description: `تحديث مسودة طلب خدمة: ${requestId}`,
      actor: { id: userId },
      target: { id: requestId, type: 'ServiceRequest' },
      details: { changes }
    }),
  serviceRequestDraftSubmitted: (userId: string, requestId: string) =>
    logActivity({
      actionType: 'SERVICE_REQUEST_DRAFT_SUBMITTED',
      description: `إرسال مسودة طلب خدمة: ${requestId}`,
      actor: { id: userId },
      target: { id: requestId, type: 'ServiceRequest' }
    }),
  serviceRequestAttachmentAdded: (userId: string | null, requestId: string, attachmentCount: number) =>
    logActivity({
      actionType: 'SERVICE_REQUEST_ATTACHMENT_ADDED',
      description: `إضافة مرفقات (${attachmentCount}) لطلب خدمة: ${requestId}`,
      actor: { id: userId || null },
      target: { id: requestId, type: 'ServiceRequest' },
      details: { attachmentCount }
    }),
  serviceRequestReminderSent: (requestId: string, details: Record<string, any>) =>
    logActivity({
      actionType: 'SERVICE_REQUEST_REMINDER_SENT',
      description: `إرسال تذكير لطلب خدمة: ${requestId}`,
      target: { id: requestId, type: 'ServiceRequest' },
      details
    }),

  // Settings
  settingsUpdate: (userId: string, settingsType: string, changes: Record<string, any>) => 
    logActivity({
      actionType: 'UPDATE',
      description: `تحديث إعدادات: ${settingsType}`,
      actor: { id: userId },
      details: { settingsType, changes }
    }),
};

