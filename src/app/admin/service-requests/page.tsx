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
  ClipboardList, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Check, 
  X,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Phone,
  Plus,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

export default function AdminServiceRequestsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load service requests from database
  const fetchServiceRequests = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch('/api/service-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        throw new Error('Failed to fetch service requests');
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "تعذر تحميل طلبات الخدمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const handleRefresh = () => {
    fetchServiceRequests(true);
  };

  // Button action handlers
  const handleViewRequest = (request: ServiceRequest) => {
    router.push(`/admin/service-requests/${request.id}`);
  };

  const handleEditRequest = (request: ServiceRequest) => {
    router.push(`/admin/service-requests/${request.id}/edit`);
  };

  const handleApproveRequest = async (request: ServiceRequest) => {
    try {
      // First, update the service request status
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        }),
      });

      if (response.ok) {
        // Then create an invoice for this service request
        try {
          const invoiceResponse = await fetch('/api/invoices/from-service-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceRequestId: request.id
            }),
          });

          if (invoiceResponse.ok) {
            const newInvoice = await invoiceResponse.json();
            toast({
              title: "تم قبول الطلب وإنشاء الفاتورة",
              description: `تم قبول طلب ${request.title} وإنشاء الفاتورة رقم ${newInvoice.invoiceNumber}`,
            });
          } else {
            // Service request approved but invoice creation failed
            toast({
              title: "تم قبول الطلب",
              description: `تم قبول طلب ${request.title} ولكن فشل في إنشاء الفاتورة. يمكن إنشاؤها يدوياً.`,
              variant: "destructive",
            });
          }
        } catch (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          toast({
            title: "تم قبول الطلب",
            description: `تم قبول طلب ${request.title} ولكن فشل في إنشاء الفاتورة. يمكن إنشاؤها يدوياً.`,
            variant: "destructive",
          });
        }
        
        fetchServiceRequests(true); // Refresh data
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      toast({
        title: "خطأ في قبول الطلب",
        description: "تعذر قبول الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async (request: ServiceRequest) => {
    try {
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED'
        }),
      });

      if (response.ok) {
        toast({
          title: "تم إلغاء الطلب",
          description: `تم إلغاء طلب ${request.title}`,
        });
        fetchServiceRequests(true); // Refresh data
      } else {
        throw new Error('Failed to cancel request');
      }
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الطلب",
        description: "تعذر إلغاء الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };
  
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">معلق</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-purple-100 text-purple-800">جاري</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-500 text-white">عاجل جداً</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white">عاجل</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500 text-white">متوسط</Badge>;
      case 'LOW':
        return <Badge className="bg-green-500 text-white">عادي</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const statusStats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
    cancelled: requests.filter(r => r.status === 'CANCELLED').length
  };

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold flex items-center">
            <ClipboardList className="h-8 w-8 mr-3 text-orange-600" />
            طلبات الخدمة
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومتابعة جميع طلبات الخدمة الواردة
          </p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث
          </Button>
          <Button asChild>
            <Link href="/admin/service-requests/new">
              <Plus className="h-4 w-4 mr-2" />
              طلب خدمة جديد
            </Link>
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            تصدير تقرير
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات معلقة</p>
                <p className="text-2xl font-bold text-orange-600">{statusStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">جاري التنفيذ</p>
                <p className="text-2xl font-bold text-purple-600">{statusStats.inProgress}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{statusStats.completed}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات ملغاة</p>
                <p className="text-2xl font-bold text-red-600">{statusStats.cancelled}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                جميع الطلبات
              </Button>
              <Button 
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PENDING')}
                size="sm"
              >
                معلقة
              </Button>
              <Button 
                variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('IN_PROGRESS')}
                size="sm"
              >
                جاري التنفيذ
              </Button>
              <Button 
                variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('COMPLETED')}
                size="sm"
              >
                مكتملة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات الخدمة</CardTitle>
          <CardDescription>
            {filteredRequests.length} من أصل {requests.length} طلب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto border rounded-lg force-scrollbar" style={{maxHeight: '75vh', minHeight: '400px'}}>
            <div className="min-w-[1200px]">
              <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">رقم الطلب</TableHead>
                <TableHead className="w-[200px]">معلومات العميل</TableHead>
                <TableHead className="w-[180px]">نوع الخدمة</TableHead>
                <TableHead className="w-[200px]">عنوان الطلب</TableHead>
                <TableHead className="w-[120px] text-center">الأولوية</TableHead>
                <TableHead className="w-[120px] text-center">الحالة</TableHead>
                <TableHead className="w-[130px] text-center">السعر المقدر</TableHead>
                <TableHead className="w-[200px] text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      جارٍ تحميل البيانات...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium w-[150px]">
                      <div>
                        <div className="font-bold text-sm">{request.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {request.user.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {request.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <div>
                        <div className="font-medium">{request.service.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[160px]">{request.service.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <div>
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[180px]">{request.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] text-center">{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell className="w-[120px] text-center">{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="w-[130px] text-center">
                      <div className="font-medium">{formatEGPSimple(request.service.price || 0)}</div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <div className="flex items-center justify-center space-x-1 space-x-reverse">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRequest(request)}
                          title="تعديل"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {request.status === 'PENDING' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApproveRequest(request)}
                              title="قبول الطلب"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelRequest(request)}
                              title="إلغاء الطلب"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {request.status === 'IN_PROGRESS' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={async () => {
                              // Mark as completed
                              try {
                                const response = await fetch(`/api/service-requests/${request.id}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    status: 'COMPLETED'
                                  }),
                                });

                                if (response.ok) {
                                  toast({
                                    title: "تم إنهاء الطلب وإنشاء الفاتورة",
                                    description: `تم إنهاء طلب ${request.title} بنجاح وتم إنشاء فاتورة تلقائياً`,
                                  });
                                  fetchServiceRequests(true); // Refresh data
                                } else {
                                  throw new Error('Failed to complete request');
                                }
                              } catch (error) {
                                toast({
                                  title: "خطأ في إنهاء الطلب",
                                  description: "تعذر إنهاء الطلب. يرجى المحاولة مرة أخرى.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            title="إنهاء الطلب"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'لا توجد طلبات مطابقة لمعايير البحث' 
                        : 'لا توجد طلبات خدمة حتى الآن'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
              </div>
            </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}