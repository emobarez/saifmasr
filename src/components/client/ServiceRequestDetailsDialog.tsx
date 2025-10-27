
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Paperclip } from "lucide-react";

interface ServiceRequest {
  id: string;
  serviceType: string;
  requestTitle: string;
  requestDetails: string;
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Date;
  attachmentURL?: string;
  attachmentFilename?: string;
}

interface ServiceRequestDetailsDialogProps {
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
}

const getStatusVariant = (status: ServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "جديد": return "default";
    case "قيد المعالجة": return "secondary";
    case "مكتمل": return "outline";
    case "ملغى": return "destructive";
    default: return "default";
  }
};

export function ServiceRequestDetailsDialog({ request, isOpen, onOpenChange }: ServiceRequestDetailsDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">{request.requestTitle}</DialogTitle>
          <DialogDescription>تفاصيل طلب الخدمة المقدم.</DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">نوع الخدمة:</span>
            <span>{getServiceTypeName(request.serviceType)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">تاريخ التقديم:</span>
            <span>{formatDate(request.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">الحالة:</span>
            <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
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
        <Separator className="mt-4" />
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

