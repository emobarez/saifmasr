"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Tag, 
  DollarSign,
  Clock,
  Download,
  Edit3,
  Loader2,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  currency: string;
  description?: string;
  dueDate?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    status: string;
    service: {
      id: string;
      name: string;
      price: number;
    };
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        } else {
          throw new Error('Failed to fetch invoice');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "تعذر تحميل تفاصيل الفاتورة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">مدفوعة</Badge>;
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">معلقة</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800">متأخرة</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">ملغاة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      const content = `
فاتورة رقم: ${invoice.invoiceNumber}
العميل: ${invoice.user.name}
البريد الإلكتروني: ${invoice.user.email}
المبلغ: ${formatEGPSimple(invoice.amount)}
الضريبة: ${formatEGPSimple(invoice.taxAmount)}
الإجمالي: ${formatEGPSimple(invoice.totalAmount)}
تاريخ الإصدار: ${new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
${invoice.dueDate ? `تاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString('ar-EG')}` : ''}
الحالة: ${invoice.status === 'PAID' ? 'مدفوعة' : invoice.status === 'PENDING' ? 'معلقة' : 'متأخرة'}
${invoice.description ? `الوصف: ${invoice.description}` : ''}
${invoice.serviceRequest ? `طلب الخدمة: ${invoice.serviceRequest.title}` : ''}

البنود:
${invoice.items?.map(item => 
  `- ${item.description}: ${item.quantity} × ${formatEGPSimple(item.unitPrice)} = ${formatEGPSimple(item.totalPrice)}`
).join('\n') || 'لا توجد بنود'}
      `;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم تنزيل الفاتورة",
        description: `تم تنزيل الفاتورة رقم ${invoice.invoiceNumber} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التنزيل",
        description: "تعذر تنزيل الفاتورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جارٍ تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة إلى قائمة الفواتير
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">لم يتم العثور على الفاتورة المحددة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة إلى قائمة الفواتير
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل الفاتورة</h1>
            <p className="text-muted-foreground">رقم الفاتورة: {invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تنزيل الفاتورة
          </Button>
          {invoice.status === 'PENDING' && (
            <Button asChild>
              <Link href={`/admin/invoices/${invoice.id}/edit`}>
                <Edit3 className="h-4 w-4 mr-2" />
                تعديل الفاتورة
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              معلومات العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">اسم العميل</label>
              <p className="font-medium">{invoice.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
              <p className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {invoice.user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              حالة الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">الحالة الحالية:</div>
              {getStatusBadge(invoice.status)}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">تاريخ الإصدار</label>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الاستحقاق</label>
                <p className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                </p>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الدفع</label>
                <p className="font-medium flex items-center text-green-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(invoice.paidAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            التفاصيل المالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">المبلغ الأساسي</label>
              <p className="text-2xl font-bold text-blue-600">
                {formatEGPSimple(invoice.amount)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ضريبة القيمة المضافة (14%)</label>
              <p className="text-2xl font-bold text-orange-600">
                {formatEGPSimple(invoice.taxAmount)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">الإجمالي</label>
              <p className="text-3xl font-bold text-green-600">
                {formatEGPSimple(invoice.totalAmount)}
              </p>
            </div>
          </div>
          {invoice.description && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-muted-foreground">وصف الفاتورة</label>
              <p className="text-gray-700">{invoice.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Request Link */}
      {invoice.serviceRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              طلب الخدمة المرتبط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{invoice.serviceRequest.title}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.serviceRequest.service.name} - {formatEGPSimple(invoice.serviceRequest.service.price)}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/admin/service-requests/${invoice.serviceRequest.id}`}>
                  عرض طلب الخدمة
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Items */}
      {invoice.items && invoice.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              بنود الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatEGPSimple(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-bold">{formatEGPSimple(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}