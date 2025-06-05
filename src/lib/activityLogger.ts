
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type ActivityActionType = 
  | "CLIENT_CREATED" | "CLIENT_UPDATED" | "CLIENT_DELETED"
  | "SERVICE_CREATED" | "SERVICE_UPDATED" | "SERVICE_DELETED"
  | "EMPLOYEE_CREATED" | "EMPLOYEE_UPDATED" | "EMPLOYEE_DELETED"
  | "INVOICE_CREATED" | "INVOICE_UPDATED" | "INVOICE_DELETED"
  | "REPORT_CREATED" | "REPORT_UPDATED" | "REPORT_DELETED"
  | "SERVICE_REQUEST_SUBMITTED" | "SERVICE_REQUEST_STATUS_UPDATED"
  | "AI_REPORT_SUMMARY_GENERATED" | "AI_REPORT_IMPROVEMENTS_SUGGESTED" | "AI_REPORT_SECTION_GENERATED"
  | "AI_SERVICE_CATEGORY_SUGGESTED" | "AI_SERVICE_FAQS_GENERATED"
  | "SETTINGS_UPDATED"
  | "USER_LOGIN" | "USER_LOGOUT" | "USER_REGISTERED"
  | "UNKNOWN_ACTION";

interface ActivityLogPayload {
  actionType: ActivityActionType;
  description: string;
  actor?: {
    id: string | null;
    role?: "client" | "admin" | string | null;
    name?: string | null; 
  };
  target?: {
    id?: string | null;
    type?: string | null; // e.g., "client", "service"
    name?: string | null;
  };
  details?: Record<string, any>;
}

export async function logActivity(payload: ActivityLogPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      ...payload,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Optionally, handle this error more gracefully (e.g., report to an error service)
  }
}
