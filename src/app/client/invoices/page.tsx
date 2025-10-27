"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  dueDate?: string;
}

const statusConfig = {
  PAID: { label: "مدفوعة", color: "bg-green-100 text-green-800" },
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  OVERDUE: { label: "متأخرة", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "ملغاة", color: "bg-gray-100 text-gray-800" }
};

export default function ClientInvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/client/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        } else {
          throw new Error('Failed to fetch invoices');
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "خطأ في تحميل الفواتير",
          description: "تعذر تحميل الفواتير. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchInvoices();
    }
  }, [user, toast]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">الفواتير</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>جاري تحميل الفواتير...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                        <Badge className={statusConfig[invoice.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800"}>
                          {statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">تاريخ الإصدار:</p>
                          <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">تاريخ الاستحقاق:</p>
                          <p className="font-medium">
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">المبلغ الأساسي:</p>
                          <p className="font-medium">{formatEGPSimple(invoice.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">الضريبة:</p>
                          <p className="font-medium">{formatEGPSimple(invoice.taxAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatEGPSimple(invoice.totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          الإجمالي شامل الضريبة
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
                  <p className="text-gray-500">لم يتم إنشاء أي فواتير بعد</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
