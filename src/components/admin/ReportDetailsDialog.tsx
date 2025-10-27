
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Report {
  id: string;
  title: string;
  description: string;
  content: string;
  status: "مسودة" | "قيد المراجعة" | "منشور" | "مؤرشف";
  createdAt: Date;
  updatedAt: Date;
}

interface ReportDetailsDialogProps {
  report: Report | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatDateForDialog = (date: Date | string | undefined): string => {
  if (!date) return "غير متوفر";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusVariantForDialog = (status: Report["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "منشور") return "outline";
    if (status === "قيد المراجعة") return "secondary";
    if (status === "مسودة") return "default";
    if (status === "مؤرشف") return "destructive";
    return "default";
};

export function ReportDetailsDialog({ report, isOpen, onOpenChange }: ReportDetailsDialogProps) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">{report.title}</DialogTitle>
          <DialogDescription>{report.description}</DialogDescription>
        </DialogHeader>
        <Separator className="my-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-2">
          <div className="flex justify-between md:justify-start md:gap-2">
            <span className="font-medium text-muted-foreground">الحالة:</span>
            <Badge variant={getStatusVariantForDialog(report.status)}>{report.status}</Badge>
          </div>
           <div className="flex justify-between md:justify-start md:gap-2">
            <span className="font-medium text-muted-foreground">تاريخ الإنشاء:</span>
            <span className="text-foreground">{formatDateForDialog(report.createdAt)}</span>
          </div>
          <div className="flex justify-between md:justify-start md:gap-2">
            <span className="font-medium text-muted-foreground">آخر تحديث:</span>
            <span className="text-foreground">{formatDateForDialog(report.updatedAt)}</span>
          </div>
        </div>
        <Separator className="mb-3" />
        <div className="flex-grow overflow-hidden">
          <h4 className="font-medium mb-2 text-md text-muted-foreground">محتوى التقرير:</h4>
          <ScrollArea className="h-full rounded-md border p-3 bg-secondary/30">
            <div className="whitespace-pre-wrap text-sm text-foreground/90 p-2">
                {report.content || "لا يوجد محتوى لهذا التقرير."}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 mt-auto">
          <DialogClose asChild>
            <Button type="button" variant="outline">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    

