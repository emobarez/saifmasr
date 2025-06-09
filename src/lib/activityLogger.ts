
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export type ActivityActionType = 
  | "CLIENT_CREATED" | "CLIENT_UPDATED" | "CLIENT_DELETED"
  | "SERVICE_CREATED" | "SERVICE_UPDATED" | "SERVICE_DELETED"
  | "EMPLOYEE_CREATED" | "EMPLOYEE_UPDATED" | "EMPLOYEE_DELETED" | "EMPLOYEE_PROFILE_PICTURE_UPDATED"
  | "INVOICE_CREATED" | "INVOICE_UPDATED" | "INVOICE_DELETED"
  | "REPORT_CREATED" | "REPORT_UPDATED" | "REPORT_DELETED"
  | "SERVICE_REQUEST_SUBMITTED" | "SERVICE_REQUEST_STATUS_UPDATED"
  | "AI_REPORT_SUMMARY_GENERATED" | "AI_REPORT_IMPROVEMENTS_SUGGESTED" | "AI_REPORT_SECTION_GENERATED" | "AI_REPORT_SECTION_APPENDED"
  | "AI_SERVICE_CATEGORY_SUGGESTED" | "AI_SERVICE_FAQS_GENERATED"
  | "SETTINGS_UPDATED"
  | "USER_LOGIN" | "USER_LOGOUT" | "USER_REGISTERED" 
  | "CLIENT_PROFILE_PICTURE_UPDATED" | "CLIENT_PROFILE_INFO_UPDATED" | "CLIENT_PASSWORD_CHANGED"
  | "UNKNOWN_ACTION";

interface ActivityLogActor {
  id: string | null;
  role?: "client" | "admin" | null; 
  name?: string | null;
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
}

export interface ActivityLogEntry extends ActivityLogPayload { 
    id: string;
    timestamp: Timestamp;
}


export async function logActivity(payload: ActivityLogPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      ...payload,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

