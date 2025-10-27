
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { Paperclip, AlertTriangle, Info, ThumbsUp, MinusCircle } from "lucide-react";
import type { PrioritizeClientRequestOutput } from "@/ai/flows/prioritize-client-request";

interface ServiceRequest {
  id: string;
  serviceType: string;
  requestTitle: string;
  requestDetails: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Date;
  attachmentURL?: string;
  attachmentFilename?: string;
  aiPriority?: PrioritizeClientRequestOutput["priority"];
  aiReasoning?: PrioritizeClientRequestOutput["reasoning"];
  aiError?: string;
}

interface AdminServiceRequestDetailsDialogProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "غير متوفر";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getServiceTypeName = (typeKey: string): string => {
  const types: {[key: string]: string} = {
      "consulting": "خدمات استشارية",
      "security": "حلول أمنية",
      "reports": "إدارة التقارير",
      "audit": "التدقيق والمراجعة",
      "other": "أخرى"
  };
  return types[typeKey] || typeKey;
};

const getStatusVariant = (status: ServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "جديد": return "default";
    case "قيد المعالجة": return "secondary";
    case "مكتمل": return "outline";
    case "ملغى": return "destructive";
    default: return "default";
  }
};

const getPriorityIcon = (priority?: PrioritizeClientRequestOutput["priority"]) => {
    if (!priority) return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    switch (priority) {
      case "عالية": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "متوسطة": return <Info className="h-4 w-4 text-yellow-500" />; 
      case "منخفضة": return <ThumbsUp className="h-4 w-4 text-green-500" />; 
      default: return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    }
};

export function AdminServiceRequestDetailsDialog({ request, isOpen, onOpenChange }: AdminServiceRequestDetailsDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">{request.requestTitle}</DialogTitle>
          <DialogDescription>تفاصيل طلب الخدمة المقدم من العميل: {request.clientName}.</DialogDescription>
        </DialogHeader>
        <Separator className="my-3" />
        <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div>
                <span className="font-medium text-muted-foreground">اسم العميل:</span>
                <p className="text-foreground">{request.clientName} ({request.clientEmail})</p>
            </div>
            <div>
                <span className="font-medium text-muted-foreground">نوع الخدمة:</span>
                <p className="text-foreground">{getServiceTypeName(request.serviceType)}</p>
            </div>
            <div>
                <span className="font-medium text-muted-foreground">تاريخ التقديم:</span>
                <p className="text-foreground">{formatDate(request.createdAt)}</p>
            </div>
             <div>
                <span className="font-medium text-muted-foreground">الحالة الحالية:</span>
                <p><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></p>
            </div>
            {request.aiPriority && (
                <>
                    <div>
                        <span className="font-medium text-muted-foreground">الأولوية (AI):</span>
                        <p className="flex items-center gap-1">
                            {getPriorityIcon(request.aiPriority)}
                            <span className="text-foreground">{request.aiPriority}</span>
                        </p>
                    </div>
                    {(request.aiReasoning || request.aiError) && (request.aiReasoning?.length || 0) > 0 && ( // Only show if there's reasoning
                        <div>
                            <span className="font-medium text-muted-foreground">سبب الأولوية (AI):</span>
                            <p className="text-foreground text-xs">{request.aiReasoning}</p>
                        </div>
                    )}
                </>
            )}
            {request.aiError && (
                 <div>
                    <span className="font-medium text-muted-foreground">خطأ تحديد الأولوية (AI):</span>
                    <p className="text-destructive text-xs">{request.aiError}</p>
                </div>
            )}
          </div>
          
          <Separator className="my-2" />
          <div>
            <h4 className="font-medium mb-1 text-muted-foreground">تفاصيل الطلب:</h4>
            <p className="whitespace-pre-wrap p-2 bg-secondary/30 rounded-md text-foreground/90">{request.requestDetails}</p>
          </div>

          {request.attachmentURL && (
            <div>
              <h4 className="font-medium mb-1 text-muted-foreground">المرفق:</h4>
              <Button variant="link" asChild className="p-0 h-auto text-primary">
                <a href={request.attachmentURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  {request.attachmentFilename || "عرض المرفق"}
                </a>
              </Button>
            </div>
          )}
        </div>
        <Separator className="mt-3" />
        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


