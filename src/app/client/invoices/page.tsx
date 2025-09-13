"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, CreditCard, Calendar, DollarSign } from "lucide-react";

// Mock data for demonstration
const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    amount: 15000,
    status: "paid",
    service: "حراسة أمنية - مكتب الرياض",
    period: "يناير 2024"
  },
  {
    id: "INV-2024-002",
    date: "2024-01-20",
    dueDate: "2024-02-20",
    amount: 8500,
    status: "pending",
    service: "تأمين فعالية - جدة",
    period: "يناير 2024"
  },
  {
    id: "INV-2024-003",
    date: "2024-01-10",
    dueDate: "2024-02-10",
    amount: 12000,
    status: "overdue",
    service: "استشارات أمنية",
    period: "ديسمبر 2023"
  },
  {
    id: "INV-2024-004",
    date: "2024-01-05",
    dueDate: "2024-02-05",
    amount: 25000,
    status: "paid",
    service: "حراسة أمنية شاملة",
    period: "ديسمبر 2023"
  }
];

const statusConfig = {
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-800" },
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-800" },
  cancelled: { label: "ملغاة", color: "bg-gray-100 text-gray-800" }
};

export default function ClientInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoices] = useState(mockInvoices);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الفواتير</h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">إجمالي الفواتير</div>
                <div className="text-lg font-bold">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">المدفوع</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">قيد الانتظار</div>
                <div className="text-lg font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">متأخرة</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث برقم الفاتورة أو الخدمة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="overdue">متأخرة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{invoice.id}</h3>
                      <Badge className={statusConfig[invoice.status as keyof typeof statusConfig].color}>
                        {statusConfig[invoice.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">الخدمة:</p>
                        <p className="font-medium">{invoice.service}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">فترة الخدمة:</p>
                        <p className="font-medium">{invoice.period}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تاريخ الإصدار:</p>
                        <p className="font-medium">{invoice.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تاريخ الاستحقاق:</p>
                        <p className="font-medium">{invoice.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:text-right space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        عرض
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        تحميل PDF
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CreditCard className="h-4 w-4 mr-2" />
                          دفع الآن
                        </Button>
                      )}
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
                <p className="text-muted-foreground">لا توجد فواتير مطابقة لمعايير البحث</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">طرق الدفع المتاحة:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>البطاقات الائتمانية (فيزا، ماستركارد، مدى)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span>التحويل البنكي</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span>المحافظ الرقمية (STCPay، Urpay)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">شروط الدفع:</h4>
              <ul className="space-y-1 text-sm">
                <li>• استحقاق الدفع خلال 30 يوم من تاريخ الإصدار</li>
                <li>• رسوم تأخير 2% شهرياً على المبالغ المتأخرة</li>
                <li>• خصم 2% للدفع المبكر (خلال 10 أيام)</li>
                <li>• جميع الأسعار شاملة ضريبة القيمة المضافة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}