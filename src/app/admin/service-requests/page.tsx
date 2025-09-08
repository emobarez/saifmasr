"use client";

import { useState } from "react";
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
  MapPin,
  Phone,
  Plus
} from "lucide-react";
import Link from "next/link";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface ServiceRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceType: string;
  description: string;
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  requestDate: string;
  scheduledDate?: string;
  estimatedCost: number;
  assignedTo?: string;
}

export default function AdminServiceRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Mock data - replace with real database queries
  const requests: ServiceRequest[] = [
    {
      id: "REQ-001",
      clientName: "أحمد محمد العلي",
      clientPhone: "+20101234567",
      serviceType: "حراسة شخصية",
      description: "طلب حراسة شخصية لمدير الشركة لمدة 3 أشهر",
      location: "القاهرة - حي المعادي",
      urgency: "high",
      status: "pending",
      requestDate: "2024-12-01",
      estimatedCost: 15000,
    },
    {
      id: "REQ-002",
      clientName: "فاطمة خالد السالم",
      clientPhone: "+20107654321",
      serviceType: "أنظمة مراقبة",
      description: "تركيب نظام مراقبة متطور للمجمع السكني",
      location: "الإسكندرية - حي سيدي جابر",
      urgency: "medium",
      status: "in-progress",
      requestDate: "2024-11-28",
      scheduledDate: "2024-12-05",
      estimatedCost: 25000,
      assignedTo: "محمد الأحمد"
    },
    {
      id: "REQ-003",
      clientName: "محمد عبدالله النمر",
      clientPhone: "+20151234567",
      serviceType: "أمن مباني",
      description: "حماية أمنية شاملة لمركز تجاري جديد",
      location: "الجيزة - حي المهندسين",
      urgency: "critical",
      status: "approved",
      requestDate: "2024-11-30",
      scheduledDate: "2024-12-03",
      estimatedCost: 50000,
      assignedTo: "فريق الأمن الرقم 1"
    },
    {
      id: "REQ-004",
      clientName: "سارة عبدالعزيز القحطاني",
      clientPhone: "+20159876543",
      serviceType: "تدريب أمني",
      description: "دورة تدريبية في إدارة الأزمات لفريق العمل",
      location: "أسوان",
      urgency: "low",
      status: "completed",
      requestDate: "2024-11-20",
      scheduledDate: "2024-11-25",
      estimatedCost: 8000,
      assignedTo: "د. عالي محمد"
    }
  ];

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">معلق</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">موافق عليه</Badge>;
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800">جاري</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">عاجل جداً</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">عاجل</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">متوسط</Badge>;
      case 'low':
        return <Badge className="bg-green-500 text-white">عادي</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const statusStats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  return (
    <div className="space-y-6">
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
          <Button>
            عرض الإحصائيات
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
                <p className="text-sm font-medium text-muted-foreground">طلبات موافق عليها</p>
                <p className="text-2xl font-bold text-blue-600">{statusStats.approved}</p>
              </div>
              <Check className="h-8 w-8 text-blue-500" />
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
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                معلقة
              </Button>
              <Button 
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
                size="sm"
              >
                موافق عليها
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>معلومات العميل</TableHead>
                <TableHead>نوع الخدمة</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التكلفة المقدرة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-bold text-sm">{request.id}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(request.requestDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {request.clientName}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {request.clientPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.serviceType}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">{request.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-sm">{request.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{formatEGPSimple(request.estimatedCost || 0)}</div>
                    {request.assignedTo && (
                      <div className="text-xs text-muted-foreground">معين لـ: {request.assignedTo}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}