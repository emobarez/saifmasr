"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody,
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Receipt, 
  Search, 
  Plus, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  TrendingUp,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useRouter } from "next/navigation";

// Interface for Invoice from API
interface Invoice {
  id: string;
  invoiceNumber: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  currency: string;
  description?: string;
  dueDate?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
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

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data || []);
      } else {
        console.error('Failed to fetch invoices');
        toast({
          title: "خطأ",
          description: "فشل في تحميل الفواتير",
          variant: "destructive",
        });
        setError('Failed to load invoices data');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "خطأ", 
        description: "حدث خطأ أثناء تحميل الفواتير",
        variant: "destructive",
      });
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Removed mock data - using real database only
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.user?.name || (invoice as any).clientName || '';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />مدفوع</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />في الانتظار</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />متأخر</Badge>;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Button handler functions
  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/admin/invoices/${invoice.id}`);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Create a simple invoice download
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.user?.name || 'غير محدد',
        amount: invoice.amount,
        taxAmount: invoice.taxAmount || 0,
        totalAmount: invoice.totalAmount || invoice.amount,
        createdAt: invoice.createdAt,
        dueDate: invoice.dueDate,
        status: invoice.status,
        description: invoice.description || '',
        serviceRequest: invoice.serviceRequest
      };

      // Generate PDF-like content (simplified)
      const content = `
فاتورة رقم: ${invoiceData.invoiceNumber}
العميل: ${invoiceData.clientName}
المبلغ: ${formatEGPSimple(invoiceData.amount)}
الضريبة: ${formatEGPSimple(invoiceData.taxAmount)}
الإجمالي: ${formatEGPSimple(invoiceData.totalAmount)}
تاريخ الإصدار: ${new Date(invoiceData.createdAt).toLocaleDateString('ar-EG')}
الحالة: ${invoiceData.status === 'PAID' ? 'مدفوعة' : invoiceData.status === 'PENDING' ? 'معلقة' : 'متأخرة'}
${invoiceData.serviceRequest ? `طلب الخدمة: ${invoiceData.serviceRequest.title}` : ''}
      `;

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceData.invoiceNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم تنزيل الفاتورة",
        description: `تم تنزيل الفاتورة رقم ${invoice.invoiceNumber} بنجاح`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "خطأ في التنزيل",
        description: "تعذر تنزيل الفاتورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/admin/invoices/${invoice.id}/edit`);
  };

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || i.amount), 0),
    pendingAmount: invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>جاري تحميل الفواتير...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
          <p className="text-muted-foreground">إدارة ومتابعة جميع الفواتير والمدفوعات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/invoices/new">
              <Plus className="h-4 w-4" />
              فاتورة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-2xl font-bold">{invoiceStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">مدفوعة</p>
                <p className="text-2xl font-bold">{invoiceStats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">متأخرة</p>
                <p className="text-2xl font-bold">{invoiceStats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{formatEGPSimple(invoiceStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الفواتير..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                الكل ({invoiceStats.total})
              </Button>
              <Button
                variant={statusFilter === 'PAID' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PAID')}
                size="sm"
              >
                مدفوع ({invoiceStats.paid})
              </Button>
              <Button
                variant={statusFilter === 'OVERDUE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('OVERDUE')}
                size="sm"
              >
                متأخر ({invoiceStats.overdue})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
          <CardDescription>
            إجمالي {filteredInvoices.length} فاتورة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            {/* Fixed Table Header */}
            <div className="overflow-hidden border-b bg-muted">
              <Table className="min-w-[1300px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-muted">رقم الفاتورة</TableHead>
                    <TableHead className="bg-muted">العميل</TableHead>
                    <TableHead className="bg-muted">طلب الخدمة</TableHead>
                    <TableHead className="bg-muted">المبلغ</TableHead>
                    <TableHead className="bg-muted">الضريبة</TableHead>
                    <TableHead className="bg-muted">الإجمالي</TableHead>
                    <TableHead className="bg-muted">الحالة</TableHead>
                    <TableHead className="bg-muted">تاريخ الإصدار</TableHead>
                    <TableHead className="bg-muted">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            
            {/* Scrollable Table Body */}
            <div className="w-full overflow-auto force-scrollbar max-h-[calc(75vh-60px)] min-h-[340px]">
              <Table className="min-w-[1300px]">
                <TableHeader className="invisible">
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>طلب الخدمة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الضريبة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <div className="font-bold">{invoice.invoiceNumber || `INV-${invoice.id}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.user?.name || (invoice as any).clientName || 'غير محدد'}</div>
                      <div className="text-sm text-muted-foreground">{invoice.user?.email || (invoice as any).clientEmail || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.serviceRequest ? (
                      <div>
                        <div className="font-medium text-blue-600">
                          <Link href={`/admin/service-requests/${invoice.serviceRequest.id}`} className="hover:underline">
                            {invoice.serviceRequest.title}
                          </Link>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.serviceRequest.service.name}
                        </div>
                        <Badge 
                          variant={invoice.serviceRequest.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {invoice.serviceRequest.status === 'PENDING' ? 'معلق' : 
                           invoice.serviceRequest.status === 'IN_PROGRESS' ? 'جاري' : 
                           invoice.serviceRequest.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">فاتورة يدوية</span>
                    )}
                  </TableCell>
                  <TableCell>{formatEGPSimple(invoice.amount)}</TableCell>
                  <TableCell>{formatEGPSimple(invoice.taxAmount || 0)}</TableCell>
                  <TableCell className="font-bold">
                    {formatEGPSimple(invoice.totalAmount || invoice.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="عرض تفاصيل الفاتورة"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="تنزيل الفاتورة"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'PENDING' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="تعديل الفاتورة"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">لا توجد فواتير</h3>
              <p className="text-gray-500">لم يتم العثور على فواتير تطابق البحث</p>
            </div>
          )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}