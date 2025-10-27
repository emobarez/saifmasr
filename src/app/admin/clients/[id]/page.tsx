"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  User, 
  Building, 
  FileText, 
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Activity,
  ArrowLeft,
  Eye
} from "lucide-react";
import Link from "next/link";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  service: {
    name: string;
    price: number;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface ClientStats {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  totalSpent: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  
  const [client, setClient] = useState<any | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load client basic info
        const clientRes = await fetch(`/api/clients/${id}`);
        if (!clientRes.ok) throw new Error('تعذر تحميل بيانات العميل');
        const clientData = await clientRes.json();
        setClient(clientData);

        // Load service requests
        const requestsRes = await fetch(`/api/service-requests?userId=${id}&extended=1`);
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setServiceRequests(requestsData);

          // Calculate stats from service requests
          const totalRequests = requestsData.length;
          const completedRequests = requestsData.filter((r: any) => r.status === 'COMPLETED').length;
          const pendingRequests = requestsData.filter((r: any) => ['PENDING', 'IN_PROGRESS'].includes(r.status)).length;

          // Load invoices
          const invoicesRes = await fetch(`/api/invoices?clientId=${id}`);
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            setInvoices(invoicesData);

            const totalInvoices = invoicesData.length;
            const paidInvoices = invoicesData.filter((inv: any) => inv.status === 'PAID').length;
            const unpaidInvoices = invoicesData.filter((inv: any) => inv.status !== 'PAID').length;
            const totalSpent = invoicesData
              .filter((inv: any) => inv.status === 'PAID')
              .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

            setStats({
              totalRequests,
              completedRequests,
              pendingRequests,
              totalSpent,
              totalInvoices,
              paidInvoices,
              unpaidInvoices
            });
          }
        }

        // Load activity logs
        const logsRes = await fetch(`/api/activity-log?userId=${id}&limit=20`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setActivityLogs(logsData.logs || []);
        }

      } catch (e: any) {
        setError(e?.message || 'خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string; icon: any } } = {
      'PENDING': { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'IN_PROGRESS': { label: 'قيد التنفيذ', className: 'bg-blue-100 text-blue-800', icon: Activity },
      'COMPLETED': { label: 'مكتمل', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'CANCELLED': { label: 'ملغي', className: 'bg-red-100 text-red-800', icon: XCircle },
      'ON_HOLD': { label: 'معلق', className: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Package };
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      'PAID': { label: 'مدفوعة', variant: 'default' },
      'PENDING': { label: 'معلقة', variant: 'secondary' },
      'OVERDUE': { label: 'متأخرة', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">خطأ في التحميل</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة إلى قائمة العملاء
          </Button>
        </div>
      </div>
    );
  }

  if (!client) return <div className="p-6">العميل غير موجود</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            عودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ملف العميل الكامل</h1>
            <p className="text-muted-foreground">جميع التفاصيل والسجلات</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/clients/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2"/>
            تعديل البيانات
          </Link>
        </Button>
      </div>

      {/* Client Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.name || '-'}</h2>
                <div className="flex items-center gap-4 flex-wrap mt-2">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 ml-1"/>{client.email}
                  </span>
                  {client.phone && (
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 ml-1"/>{client.phone}
                    </span>
                  )}
                </div>
                {client.company && (
                  <div className="flex items-center gap-2 mt-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{client.company}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">عميل منذ</p>
              <p className="text-lg font-semibold">
                {new Date(client.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold">{stats.totalRequests}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الطلبات المكتملة</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedRequests}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإنفاق</p>
                  <p className="text-2xl font-bold text-purple-600">{formatEGPSimple(stats.totalSpent)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الفواتير</p>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.paidInvoices} مدفوعة · {stats.unpaidInvoices} معلقة
                  </p>
                </div>
                <FileText className="h-10 w-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for detailed information */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">
            <ShoppingCart className="h-4 w-4 mr-2" />
            الحجوزات ({serviceRequests.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            الفواتير ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            السجل
          </TabsTrigger>
        </TabsList>

        {/* Service Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الخدمة</CardTitle>
              <CardDescription>جميع الحجوزات والطلبات المقدمة من العميل</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد طلبات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Package className="h-3 w-3 ml-1" />
                            {request.service.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 ml-1" />
                            {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 ml-1" />
                            {formatEGPSimple(request.service.price)}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/service-requests/${request.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          عرض
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الفواتير</CardTitle>
              <CardDescription>جميع الفواتير الخاصة بالعميل</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد فواتير بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                          {getInvoiceStatusBadge(invoice.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 ml-1" />
                            {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          {invoice.dueDate && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 ml-1" />
                              استحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left ml-4">
                        <p className="text-lg font-bold">{formatEGPSimple(invoice.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEGPSimple(invoice.amount)} + {formatEGPSimple(invoice.taxAmount)} ضريبة
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          عرض
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل النشاط</CardTitle>
              <CardDescription>جميع الأنشطة والعمليات المتعلقة بالعميل</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا يوجد نشاط مسجل</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border-r-2 border-blue-500 bg-gray-50 rounded">
                      <Activity className="h-4 w-4 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.action}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline ml-1" />
                          {new Date(log.createdAt).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الاتصال والعنوان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {client.company && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الشركة</p>
                    <p className="font-medium">{client.company}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-medium">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
