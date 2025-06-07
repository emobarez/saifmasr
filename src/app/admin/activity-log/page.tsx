
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History as HistoryIcon, Users, Briefcase, FileTextIcon, SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, limit } from "firebase/firestore";
import type { ActivityLogEntry, ActivityActionType } from "@/lib/activityLogger"; // Ensure ActivityLogEntry is exported
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 25; // Or implement pagination later

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    if (actionType.includes("CREATED") || actionType.includes("GENERATED") || actionType.includes("SUBMITTED")) return "text-green-600 dark:text-green-400";
    if (actionType.includes("UPDATED") || actionType.includes("APPENDED")) return "text-blue-600 dark:text-blue-400";
    if (actionType.includes("DELETED")) return "text-red-600 dark:text-red-400";
    if (actionType.includes("LOGIN") || actionType.includes("LOGOUT") || actionType.includes("REGISTERED")) return "text-purple-600 dark:text-purple-400";
    if (actionType.includes("SUGGESTED")) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getTargetIcon = (targetType?: string | null): React.ReactNode => {
    switch(targetType?.toLowerCase()){
      case "client": return <Users className="h-4 w-4 inline me-1" />;
      case "service": return <Briefcase className="h-4 w-4 inline me-1" />;
      case "report": return <FileTextIcon className="h-4 w-4 inline me-1" />;
      case "employee": return <Users className="h-4 w-4 inline me-1" />;
      case "invoice": return <Receipt className="h-4 w-4 inline me-1" />;
      case "servicerequest": return <ClipboardList className="h-4 w-4 inline me-1" />;
      case "settings": return <SettingsIcon className="h-4 w-4 inline me-1" />;
      default: return null;
    }
  }


  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "activityLogs"), 
          orderBy("timestamp", "desc"),
          limit(ITEMS_PER_PAGE * 2) // Fetch more for initial view, can implement proper pagination later
        );
        const querySnapshot = await getDocs(q);
        const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل سجل الأنشطة.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [toast]);

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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ms-3 text-lg text-muted-foreground">جارٍ تحميل سجل الأنشطة...</p>
            </div>
          ) : logs.length > 0 ? (
            <ScrollArea className="h-[65vh] w-full rounded-md border">
              <TooltipProvider>
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[160px]">الوقت والتاريخ</TableHead>
                    <TableHead className="min-w-[150px]">الفاعل</TableHead>
                    <TableHead className="min-w-[150px]">نوع الإجراء</TableHead>
                    <TableHead className="min-w-[250px]">الوصف</TableHead>
                    <TableHead className="min-w-[180px]">الهدف</TableHead>
                    <TableHead className="min-w-[200px]">تفاصيل إضافية</TableHead>
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
                        <span className={`font-medium ${getActionTypeColor(log.actionType)}`}>{log.actionType}</span>
                      </TableCell>
                      <TableCell className="leading-relaxed">{log.description}</TableCell>
                      <TableCell>
                        {log.target?.type && getTargetIcon(log.target.type)}
                        {log.target?.name || log.target?.id || "-"}
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 ? (
                           <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">عرض التفاصيل</Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-md bg-popover p-3 shadow-lg rounded-md text-popover-foreground">
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
          ) : (
            <p className="text-muted-foreground text-center py-10">لا توجد سجلات أنشطة لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
