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
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function InvoicesPage() {
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
        // Fallback to mock data
        setInvoices(mockInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "خطأ", 
        description: "حدث خطأ أثناء تحميل الفواتير",
        variant: "destructive",
      });
      // Fallback to mock data
      setInvoices(mockInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Mock data for fallback
  const mockInvoices: (Invoice & {
    clientName?: string;
    clientEmail?: string;
    serviceType?: string;
    tax?: number;
    issueDate?: string;
    dueDate?: string;
    paidDate?: string;
  })[] = [
    {
      id: "1",
      invoiceNumber: "INV-2024-001",
      user: {
        id: "user-1",
        name: "أحمد محمد الشهري",
        email: "ahmed@security.com"
      },
      description: "حراسة شخصية",
      amount: 15000,
      taxAmount: 2250,
      totalAmount: 17250,
      status: "PAID",
      currency: "EGP",
      createdAt: "2024-11-01",
      updatedAt: "2024-11-01",
      paidAt: "2024-11-25",
      paymentMethod: "تحويل بنكي"
    },
    {
      id: "2",
      invoiceNumber: "INV-2024-002",
      user: {
        id: "user-2",
        name: "فاطمة خالد السالم",
        email: "fatima@security.com"
      },
      description: "أنظمة مراقبة",
      amount: 25000,
      taxAmount: 3750,
      totalAmount: 28750,
      status: "PENDING",
      currency: "EGP",
      createdAt: "2024-11-15",
      updatedAt: "2024-11-15"
    },
    {
      id: "3",
      invoiceNumber: "INV-2024-003",
      user: {
        id: "user-3",
        name: "محمد عبدالله النمر",
        email: "mohammed@shield.com"
      },
      description: "أمن مباني",
      amount: 50000,
      taxAmount: 7500,
      totalAmount: 57500,
      status: "OVERDUE",
      currency: "EGP",
      createdAt: "2024-10-01",
      updatedAt: "2024-10-01"
    },
    {
      id: "4",
      invoiceNumber: "INV-2024-004",
      user: {
        id: "user-4",
        name: "سارة عبدالعزيز القحطاني",
        email: "sara@training.com"
      },
      description: "تدريب أمني",
      amount: 8000,
      taxAmount: 1200,
      totalAmount: 9200,
      status: "PENDING",
      currency: "EGP",
      createdAt: "2024-12-01",
      updatedAt: "2024-12-01"
    },
    {
      id: "5",
      invoiceNumber: "INV-2024-005",
      user: {
        id: "user-5",
        name: "عبدالرحمن محمد القرشي",
        email: "abdulrahman@corp.com"
      },
      description: "خدمات أمنية متنوعة",
      amount: 30000,
      taxAmount: 4500,
      totalAmount: 34500,
      status: "PAID",
      currency: "EGP",
      createdAt: "2024-11-20",
      updatedAt: "2024-11-20",
      paidAt: "2024-12-01",
      paymentMethod: "بطاقة ائتمان"
    }
  ];

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
    <div className="overflow-x-auto overflow-y-auto force-scrollbar" style={{minHeight: '100vh', minWidth: '100vw'}}>
      <div className="space-y-6 force-scrollbar" style={{minHeight: '100vh', minWidth: '800px', paddingBottom: '2rem'}}>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الوصف</TableHead>
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
                  <TableCell>{invoice.description || (invoice as any).serviceType || 'خدمة عامة'}</TableCell>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'PENDING' && (
                        <Button variant="ghost" size="sm">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
              <p className="text-gray-500">لم يتم العثور على فواتير تطابق البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}