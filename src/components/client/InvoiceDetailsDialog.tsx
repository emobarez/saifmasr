
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatEGPSimple, formatDateArabic } from "@/lib/egyptian-utils";

// Interface for invoice data from Firestore
interface Invoice {
  id: string; // Firestore document ID
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: "مستحقة" | "مدفوعة" | "متأخرة" | "ملغاة";
  description: string; // Added description
  // Optional: clientName if available and needed, though client knows it's theirs
}

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatDateForDialog = (date: Date | string | undefined): string => {
  if (!date) return "غير متوفر";
  const dateObj = date instanceof Date ? date : new Date(date);
  return formatDateArabic(dateObj);
};

const formatCurrencyForDialog = (amount: number): string => {
  return formatEGPSimple(amount);
};

const getStatusVariantForDialog = (status: Invoice["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "مدفوعة") return "outline"; 
    if (status === "مستحقة") return "default"; 
    if (status === "متأخرة") return "secondary"; 
    if (status === "ملغاة") return "destructive";
    return "default";
};

export function InvoiceDetailsDialog({ invoice, isOpen, onOpenChange }: InvoiceDetailsDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/90 backdrop-blur-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">تفاصيل الفاتورة: {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>عرض شامل لبيانات فاتورتك.</DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">رقم الفاتورة:</span>
            <span className="text-foreground">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">تاريخ الإصدار:</span>
            <span className="text-foreground">{formatDateForDialog(invoice.issueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">تاريخ الاستحقاق:</span>
            <span className="text-foreground">{formatDateForDialog(invoice.dueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">المبلغ الإجمالي:</span>
            <span className="text-foreground font-semibold">{formatCurrencyForDialog(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">الحالة:</span>
            <Badge variant={getStatusVariantForDialog(invoice.status)}>{invoice.status}</Badge>
          </div>
           <Separator className="my-2" />
          <div>
            <h4 className="font-medium mb-1 text-muted-foreground">الوصف/البيان:</h4>
            <p className="whitespace-pre-wrap p-2 bg-secondary/50 rounded-md text-foreground/90">{invoice.description || "لا يوجد وصف."}</p>
          </div>
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
