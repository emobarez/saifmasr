
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  History as HistoryIcon, 
  Users, 
  Briefcase, 
  FileTextIcon, 
  SettingsIcon as PageSettingsIcon,
  Receipt, 
  ClipboardList,
  PlusCircleIcon,
  Edit3Icon,
  Trash2Icon,
  LogInIcon,
  LogOutIcon,
  LightbulbIcon,
  SparklesIcon,
  InfoIcon,
  ImageUpIcon, 
  CheckCircle2Icon,
  FilePlus2, 
  FileEditIcon, 
  MessageSquarePlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, limit, startAfter, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { ActivityLogEntry, ActivityActionType } from "@/lib/activityLogger"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 25;

const translateActionType = (actionType: ActivityActionType): string => {
  switch (actionType) {
    case "CLIENT_CREATED": return "إنشاء عميل جديد";
    case "CLIENT_UPDATED": return "تحديث بيانات عميل";
    case "CLIENT_DELETED": return "حذف عميل";
    case "SERVICE_CREATED": return "إنشاء خدمة جديدة";
    case "SERVICE_UPDATED": return "تحديث بيانات خدمة";
    case "SERVICE_DELETED": return "حذف خدمة";
    case "EMPLOYEE_CREATED": return "إضافة موظف جديد";
    case "EMPLOYEE_UPDATED": return "تحديث بيانات موظف";
    case "EMPLOYEE_DELETED": return "حذف موظف";
    case "EMPLOYEE_PROFILE_PICTURE_UPDATED": return "تحديث صورة ملف موظف";
    case "INVOICE_CREATED": return "إنشاء فاتورة جديدة";
    case "INVOICE_UPDATED": return "تحديث بيانات فاتورة";
    case "INVOICE_DELETED": return "حذف فاتورة";
    case "REPORT_CREATED": return "إنشاء تقرير جديد";
    case "REPORT_UPDATED": return "تحديث بيانات تقرير";
    case "REPORT_DELETED": return "حذف تقرير";
    case "SERVICE_REQUEST_SUBMITTED": return "تقديم طلب خدمة";
    case "SERVICE_REQUEST_STATUS_UPDATED": return "تحديث حالة طلب خدمة";
    case "AI_REPORT_SUMMARY_GENERATED": return "إنشاء ملخص تقرير (AI)";
    case "AI_REPORT_IMPROVEMENTS_SUGGESTED": return "اقتراح تحسينات لتقرير (AI)";
    case "AI_REPORT_SECTION_GENERATED": return "إنشاء قسم تقرير (AI)";
    case "AI_REPORT_SECTION_APPENDED": return "إضافة قسم لتقرير (AI)";
    case "AI_SERVICE_CATEGORY_SUGGESTED": return "اقتراح فئة خدمة (AI)";
    case "AI_SERVICE_FAQS_GENERATED": return "إنشاء أسئلة شائعة (AI)";
    case "SETTINGS_UPDATED": return "تحديث إعدادات النظام";
    case "USER_LOGIN": return "تسجيل دخول مستخدم";
    case "USER_LOGOUT": return "تسجيل خروج مستخدم";
    case "USER_REGISTERED": return "تسجيل مستخدم جديد";
    case "CLIENT_PROFILE_PICTURE_UPDATED": return "تحديث صورة الملف الشخصي (عميل)";
    case "CLIENT_PROFILE_INFO_UPDATED": return "تحديث معلومات الملف الشخصي (عميل)";
    case "CLIENT_PASSWORD_CHANGED": return "تغيير كلمة المرور (عميل)";
    case "UNKNOWN_ACTION": return "إجراء غير معروف";
    default: return actionType; // Fallback to the original type if not mapped
  }
};

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const { toast } = useToast();

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return "غير متوفر";
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return "تاريخ غير صالح";
    }
    return new Intl.DateTimeFormat('ar-EG', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).format(date);
  };

  const getActionTypeColor = (actionType: ActivityActionType): string => {
    if (actionType.includes("CREATED") || actionType.includes("GENERATED") || actionType.includes("SUBMITTED") || actionType.includes("REGISTERED")) return "text-green-600 dark:text-green-400";
    if (actionType.includes("UPDATED") || actionType.includes("APPENDED")) return "text-blue-600 dark:text-blue-400";
    if (actionType.includes("DELETED")) return "text-red-600 dark:text-red-400";
    if (actionType.includes("LOGIN") || actionType.includes("LOGOUT")) return "text-purple-600 dark:text-purple-400";
    if (actionType.includes("SUGGESTED")) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getActionTypeIcon = (actionType: ActivityActionType): React.ReactNode => {
    const lowerActionType = actionType.toLowerCase();
    if (lowerActionType.includes("created") || lowerActionType.includes("registered")) return <PlusCircleIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType === "ai_report_summary_generated") return <SparklesIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType === "ai_report_section_generated") return <FilePlus2 className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType === "ai_service_faqs_generated") return <MessageSquarePlus className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("generated")) return <SparklesIcon className="h-4 w-4 inline me-1.5" />; 
    if (lowerActionType.includes("submitted")) return <CheckCircle2Icon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType === "ai_report_section_appended") return <FileEditIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("updated") && !lowerActionType.includes("status") && !lowerActionType.includes("picture")) return <Edit3Icon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("appended")) return <Edit3Icon className="h-4 w-4 inline me-1.5" />; 
    if (lowerActionType.includes("deleted")) return <Trash2Icon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("login")) return <LogInIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("logout")) return <LogOutIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("suggested")) return <LightbulbIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("ai_") && !lowerActionType.includes("generated") && !lowerActionType.includes("appended")) return <SparklesIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("picture_updated")) return <ImageUpIcon className="h-4 w-4 inline me-1.5" />;
    if (lowerActionType.includes("status_updated") || lowerActionType.includes("settings_updated")) return <Edit3Icon className="h-4 w-4 inline me-1.5" />;
    return <InfoIcon className="h-4 w-4 inline me-1.5" />;
  };

  const getTargetIcon = (targetType?: string | null): React.ReactNode => {
    switch(targetType?.toLowerCase()){
      case "client": return <Users className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "service": return <Briefcase className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "report": return <FileTextIcon className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "reportsection": return <FileTextIcon className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "employee": return <Users className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "invoice": return <Receipt className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "servicerequest": return <ClipboardList className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "settings": return <PageSettingsIcon className="h-4 w-4 inline me-1 text-muted-foreground" />;
      case "userprofile": return <Users className="h-4 w-4 inline me-1 text-muted-foreground" />; 
      default: return null;
    }
  }

  const fetchLogs = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setLogs([]); 
      setLastVisibleDoc(null);
      setHasMoreLogs(true);
    }

    try {
      let q;
      if (loadMore && lastVisibleDoc) {
        q = query(
          collection(db, "activityLogs"), 
          orderBy("timestamp", "desc"),
          startAfter(lastVisibleDoc),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "activityLogs"), 
          orderBy("timestamp", "desc"),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
      
      if (loadMore) {
        setLogs(prevLogs => [...prevLogs, ...fetchedLogs]);
      } else {
        setLogs(fetchedLogs);
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisibleDoc(lastDoc);
      setHasMoreLogs(fetchedLogs.length === ITEMS_PER_PAGE);

    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل سجل الأنشطة.", variant: "destructive" });
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []); 

  const handleLoadMore = () => {
    if (hasMoreLogs && !isLoadingMore) {
      fetchLogs(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-7 w-7 text-primary" />
            <CardTitle className="font-headline text-xl text-primary">سجل الأنشطة</CardTitle>
          </div>
          <CardDescription>عرض لآخر الأنشطة والأحداث التي تمت في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ms-3 text-lg text-muted-foreground">جارٍ تحميل سجل الأنشطة...</p>
            </div>
          ) : logs.length > 0 ? (
            <>
              <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-260px)] w-full rounded-md border">
                <TooltipProvider>
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[160px]">الوقت والتاريخ</TableHead>
                      <TableHead className="min-w-[150px]">الفاعل</TableHead>
                      <TableHead className="min-w-[200px]">نوع الإجراء</TableHead>
                      <TableHead className="min-w-[250px]">الوصف</TableHead>
                      <TableHead className="min-w-[180px]">الهدف</TableHead>
                      <TableHead className="min-w-[120px]">تفاصيل إضافية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="text-xs hover:bg-muted/30">
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          {log.actor?.name || log.actor?.email || log.actor?.id || "نظام"}
                          {log.actor?.role && <Badge variant="outline" className="ms-2 text-xs">{log.actor.role}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center font-medium ${getActionTypeColor(log.actionType)}`}>
                            {getActionTypeIcon(log.actionType)}
                            <span>{translateActionType(log.actionType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="leading-relaxed">{log.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                             {log.target?.type && getTargetIcon(log.target.type)}
                             <span className="truncate">{log.target?.name || log.target?.id || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                             <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">عرض التفاصيل</Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs bg-popover p-3 shadow-lg rounded-md text-popover-foreground">
                                  <pre className="text-xs whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                  </pre>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </TooltipProvider>
              </ScrollArea>
              {hasMoreLogs && (
                <div className="flex justify-center mt-6">
                  <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : "تحميل المزيد"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-10">لا توجد سجلات أنشطة لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
