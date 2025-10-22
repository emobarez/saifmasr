"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
  AlertTriangle,
  Loader2,
  Edit3,
  Check,
  X,
  MapPin,
  Paperclip
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useToast } from "@/hooks/use-toast";
import AttachmentLink from "@/components/client/AttachmentLink";

// Dynamic import for LeafletMapPicker to avoid SSR issues
const LeafletMapPicker = dynamic(
  () => import("@/components/client/LeafletMapPicker"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  attachmentUrl?: string;
  personnelCount?: number | null;
  durationUnit?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  locationText?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  armamentLevel?: string | null;
  notes?: string | null;
  notifyBeforeHours?: number | null;
  isDraft?: boolean;
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
    category: string;
  };
  attachments?: Array<{
    id: string;
    url: string;
    name: string | null;
    mimeType: string | null;
    createdAt: string;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    currency: string;
    createdAt: string;
    dueDate?: string;
  }>;
}

export default function ServiceRequestViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/service-requests/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRequest(data);
        } else {
          throw new Error('Failed to fetch request');
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "تعذر تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchRequest();
    }
  }, [params.id, toast]);

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!request) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setRequest(updatedRequest);
        toast({
          title: "تم تحديث الحالة",
          description: `تم تغيير حالة الطلب إلى ${getStatusLabel(newStatus)}`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "تعذر تحديث حالة الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'معلق';
      case 'IN_PROGRESS': return 'جاري التنفيذ';
      case 'COMPLETED': return 'مكتمل';
      case 'CANCELLED': return 'ملغي';
      default: return status;
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

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/service-requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة إلى قائمة الطلبات
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">لم يتم العثور على الطلب المحدد</p>
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
            <Link href="/admin/service-requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة إلى قائمة الطلبات
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل طلب الخدمة</h1>
            <p className="text-muted-foreground">رقم الطلب: {request.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/admin/service-requests/${request.id}/edit`}>
              <Edit3 className="h-4 w-4 mr-2" />
              تعديل الطلب
            </Link>
          </Button>
        </div>
      </div>

      {/* Status and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>حالة الطلب والإجراءات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">الحالة الحالية:</div>
              {getStatusBadge(request.status)}
              <div className="text-sm text-muted-foreground">الأولوية:</div>
              {getPriorityBadge(request.priority)}
            </div>
            {request.status === 'PENDING' && (
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  قبول الطلب
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  رفض الطلب
                </Button>
              </div>
            )}
            {request.status === 'IN_PROGRESS' && (
              <Button 
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                إنهاء الطلب
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Details */}
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
              <p className="font-medium">{request.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
              <p className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {request.user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              معلومات الخدمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">نوع الخدمة</label>
              <p className="font-medium">{request.service.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">الفئة</label>
              <p className="font-medium">{request.service.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">السعر</label>
              <p className="font-medium flex items-center text-green-600">
                <DollarSign className="h-4 w-4 mr-2" />
                {formatEGPSimple(request.service.price)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bodyguard-specific fields */}
      {(request.personnelCount || request.armamentLevel || request.startAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              تفاصيل الحراسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {request.personnelCount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">عدد الأفراد</label>
                  <p className="font-medium text-lg">{request.personnelCount} فرد</p>
                </div>
              )}
              {request.armamentLevel && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">مستوى التسليح</label>
                  <Badge variant="outline" className="mt-1">
                    {request.armamentLevel === 'NONE' ? 'بدون سلاح' :
                     request.armamentLevel === 'LIGHT' ? 'سلاح خفيف' :
                     request.armamentLevel === 'MEDIUM' ? 'سلاح متوسط' :
                     request.armamentLevel === 'HEAVY' ? 'سلاح ثقيل' : request.armamentLevel}
                  </Badge>
                </div>
              )}
              {request.durationUnit && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وحدة المدة</label>
                  <p className="font-medium">
                    {request.durationUnit === 'HOURS' ? 'ساعات' :
                     request.durationUnit === 'DAYS' ? 'أيام' :
                     request.durationUnit === 'WEEKS' ? 'أسابيع' : request.durationUnit}
                  </p>
                </div>
              )}
            </div>

            {/* Schedule section */}
            {(request.startAt || request.endAt) && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  الجدولة الزمنية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {request.startAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">وقت البدء</label>
                      <p className="font-medium">{new Date(request.startAt).toLocaleString('ar-EG', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}</p>
                    </div>
                  )}
                  {request.endAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">وقت الانتهاء</label>
                      <p className="font-medium">{new Date(request.endAt).toLocaleString('ar-EG', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location section */}
            {(request.locationText || request.locationLat) && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  الموقع
                </h4>
                {request.locationText && (
                  <div className="mb-3">
                    <label className="text-sm font-medium text-muted-foreground">وصف الموقع</label>
                    <p className="font-medium">{request.locationText}</p>
                  </div>
                )}
                {request.locationLat && request.locationLng && (
                  <>
                    <div className="mb-3">
                      <label className="text-sm font-medium text-muted-foreground">الإحداثيات</label>
                      <p className="text-sm font-mono">
                        {request.locationLat.toFixed(6)}, {request.locationLng.toFixed(6)}
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        الخريطة
                      </label>
                      <LeafletMapPicker
                        value={{ lat: request.locationLat, lng: request.locationLng }}
                        onChange={() => {}} // Read-only, no changes allowed
                        heightClass="h-[300px]"
                        readOnly={true}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            {request.notes && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-muted-foreground">ملاحظات إضافية</label>
                <p className="mt-2 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            تفاصيل الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">عنوان الطلب</label>
            <p className="font-medium text-lg">{request.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">وصف الطلب</label>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
          {request.attachments && request.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">المرفقات ({request.attachments.length})</label>
              <div className="mt-2 space-y-2">
                {request.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 p-2 border rounded">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <AttachmentLink
                      url={att.url}
                      name={att.name || "ملف"}
                      mimeType={att.mimeType || undefined}
                      variant="link"
                      showIcon={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            التوقيت الزمني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تاريخ الإنشاء</p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(request.createdAt).toLocaleString('ar-EG')}
              </p>
            </div>
            <div>
              <p className="font-medium">آخر تحديث</p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(request.updatedAt).toLocaleString('ar-EG')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Invoices */}
      {request.invoices && request.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              الفواتير المرتبطة
            </CardTitle>
            <CardDescription>
              الفواتير التي تم إنشاؤها لهذا الطلب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <Badge 
                          variant={
                            invoice.status === 'PAID' ? 'default' : 
                            invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'
                          }
                        >
                          {invoice.status === 'PAID' ? 'مدفوعة' : 
                           invoice.status === 'OVERDUE' ? 'متأخرة' : 'معلقة'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        تم الإنشاء: {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                      {invoice.dueDate && (
                        <div className="text-sm text-muted-foreground">
                          تاريخ الاستحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-lg">
                        {formatEGPSimple(invoice.totalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        المبلغ: {formatEGPSimple(invoice.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الضريبة: {formatEGPSimple(invoice.taxAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        عرض الفاتورة
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Invoice Button */}
      {request.status === 'IN_PROGRESS' && (!request.invoices || request.invoices.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>إنشاء فاتورة</CardTitle>
            <CardDescription>
              يمكن إنشاء فاتورة لهذا الطلب المقبول
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/invoices/from-service-request', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      serviceRequestId: request.id
                    }),
                  });

                  if (response.ok) {
                    const newInvoice = await response.json();
                    toast({
                      title: "تم إنشاء الفاتورة",
                      description: `تم إنشاء الفاتورة رقم ${newInvoice.invoiceNumber} بنجاح`,
                    });
                    // Refresh the page to show the new invoice
                    window.location.reload();
                  } else {
                    throw new Error('Failed to create invoice');
                  }
                } catch (error) {
                  toast({
                    title: "خطأ في إنشاء الفاتورة",
                    description: "تعذر إنشاء الفاتورة. يرجى المحاولة مرة أخرى.",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              إنشاء فاتورة للطلب
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}