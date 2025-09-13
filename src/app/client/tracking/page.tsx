"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, CheckCircle, AlertCircle, XCircle, Eye } from "lucide-react";

// Mock data for demonstration
const mockRequests = [
  {
    id: "REQ-001",
    title: "حراسة أمنية للمكتب",
    status: "in_progress",
    priority: "high",
    date: "2024-01-15",
    location: "الرياض - حي الملك فهد",
    estimatedCompletion: "2024-01-20"
  },
  {
    id: "REQ-002", 
    title: "تأمين فعالية",
    status: "completed",
    priority: "medium",
    date: "2024-01-10",
    location: "جدة - مركز المعارض",
    estimatedCompletion: "2024-01-12"
  },
  {
    id: "REQ-003",
    title: "استشارة أمنية",
    status: "pending",
    priority: "low",
    date: "2024-01-18",
    location: "الدمام - المنطقة الصناعية",
    estimatedCompletion: "2024-01-25"
  },
  {
    id: "REQ-004",
    title: "تحقيق خاص",
    status: "cancelled",
    priority: "urgent",
    date: "2024-01-08",
    location: "الخبر - مجمع تجاري",
    estimatedCompletion: "2024-01-10"
  }
];

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-800", icon: XCircle }
};

const priorityConfig = {
  urgent: { label: "عاجل", color: "bg-red-100 text-red-800" },
  high: { label: "عالية", color: "bg-orange-100 text-orange-800" },
  medium: { label: "متوسطة", color: "bg-yellow-100 text-yellow-800" },
  low: { label: "منخفضة", color: "bg-gray-100 text-gray-800" }
};

export default function ClientTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests] = useState(mockRequests);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">تتبع الطلبات</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث برقم الطلب أو الوصف..."
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
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">قيد الانتظار</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">مكتمل</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {requests.length}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status as keyof typeof statusConfig].icon;
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.title}</h3>
                        <Badge className={statusConfig[request.status as keyof typeof statusConfig].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[request.status as keyof typeof statusConfig].label}
                        </Badge>
                        <Badge className={priorityConfig[request.priority as keyof typeof priorityConfig].color}>
                          {priorityConfig[request.priority as keyof typeof priorityConfig].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>رقم الطلب: {request.id}</p>
                        <p>الموقع: {request.location}</p>
                        <p>تاريخ الطلب: {request.date}</p>
                        <p>التاريخ المتوقع للإنجاز: {request.estimatedCompletion}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد طلبات مطابقة لمعايير البحث</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية تتبع طلباتك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">حالات الطلبات:</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span><strong>قيد الانتظار:</strong> تم استلام الطلب وجاري المراجعة</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span><strong>قيد التنفيذ:</strong> بدأ العمل على تنفيذ الطلب</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>مكتمل:</strong> تم تنفيذ الطلب بنجاح</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">نصائح مفيدة:</h4>
              <ul className="text-sm space-y-1">
                <li>• يمكنك البحث برقم الطلب أو وصف الخدمة</li>
                <li>• استخدم المرشحات لعرض طلبات بحالة معينة</li>
                <li>• سيتم إشعارك بأي تحديثات على طلباتك</li>
                <li>• للاستفسارات، اتصل بخدمة العملاء</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}