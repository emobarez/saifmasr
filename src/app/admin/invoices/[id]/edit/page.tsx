"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Receipt,
  User,
  DollarSign,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
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
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    service: {
      name: string;
      price: number;
    };
  };
}

interface FormData {
  amount: string;
  description: string;
  dueDate: string;
  status: string;
  paymentMethod: string;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    dueDate: '',
    status: '',
    paymentMethod: ''
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
          setFormData({
            amount: data.amount.toString(),
            description: data.description || '',
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
            status: data.status,
            paymentMethod: data.paymentMethod || ''
          });
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

  const calculateTaxAndTotal = (amount: number) => {
    const taxAmount = amount * 0.14; // 14% VAT
    const totalAmount = amount + taxAmount;
    return { taxAmount, totalAmount };
  };

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      amount: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('يرجى إدخال مبلغ صحيح');
      }

      const { taxAmount, totalAmount } = calculateTaxAndTotal(amount);

      const updateData = {
        amount,
        taxAmount,
        totalAmount,
        description: formData.description,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        status: formData.status,
        paymentMethod: formData.paymentMethod || null,
        paidAt: formData.status === 'PAID' ? new Date().toISOString() : null
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "تم تحديث الفاتورة",
          description: "تم حفظ التغييرات بنجاح",
        });
        router.push(`/admin/invoices/${params.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "تعذر حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const currentAmount = parseFloat(formData.amount) || 0;
  const { taxAmount, totalAmount } = calculateTaxAndTotal(currentAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/invoices/${invoice.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة إلى تفاصيل الفاتورة
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تعديل الفاتورة</h1>
            <p className="text-muted-foreground">رقم الفاتورة: {invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">اسم العميل</Label>
                <p className="font-medium mt-1">{invoice.user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</Label>
                <p className="font-medium mt-1">{invoice.user.email}</p>
              </div>
              {invoice.serviceRequest && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">طلب الخدمة المرتبط</Label>
                  <p className="font-medium mt-1">{invoice.serviceRequest.title}</p>
                </div>
              )}
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
              <div>
                <Label htmlFor="status">حالة الفاتورة</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر حالة الفاتورة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">معلقة</SelectItem>
                    <SelectItem value="PAID">مدفوعة</SelectItem>
                    <SelectItem value="OVERDUE">متأخرة</SelectItem>
                    <SelectItem value="CANCELLED">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">نقدي</SelectItem>
                    <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                    <SelectItem value="CREDIT_CARD">بطاقة ائتمانية</SelectItem>
                    <SelectItem value="DIGITAL_WALLET">محفظة رقمية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="amount">المبلغ الأساسي</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="mt-1"
                  required
                />
                {currentAmount > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    {formatEGPSimple(currentAmount)}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ضريبة القيمة المضافة (14%)</Label>
                <div className="mt-1 p-3 bg-orange-50 rounded-md">
                  <p className="text-xl font-bold text-orange-600">
                    {formatEGPSimple(taxAmount)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">الإجمالي</Label>
                <div className="mt-1 p-3 bg-green-50 rounded-md">
                  <p className="text-xl font-bold text-green-600">
                    {formatEGPSimple(totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">وصف الفاتورة</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف تفصيلي للفاتورة..."
                rows={4}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/invoices/${invoice.id}`}>
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}