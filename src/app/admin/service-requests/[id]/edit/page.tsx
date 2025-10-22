"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  User,
  FileText,
  Tag,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editRequestSchema = z.object({
  title: z.string().min(3, "عنوان الطلب يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().min(10, "وصف الطلب يجب أن يكون 10 أحرف على الأقل"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  personnelCount: z.number().optional().nullable(),
  armamentLevel: z.enum(["NONE", "LIGHT", "MEDIUM", "HEAVY"]).optional().nullable(),
  durationUnit: z.enum(["HOURS", "DAYS", "WEEKS"]).optional().nullable(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  locationText: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

type EditRequestForm = z.infer<typeof editRequestSchema>;

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
}

export default function ServiceRequestEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EditRequestForm>({
    resolver: zodResolver(editRequestSchema),
  });

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/service-requests/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRequest(data);
          
          // Set form values
          setValue('title', data.title);
          setValue('description', data.description);
          setValue('status', data.status);
          setValue('priority', data.priority);
          if (data.personnelCount) setValue('personnelCount', data.personnelCount);
          if (data.armamentLevel) setValue('armamentLevel', data.armamentLevel);
          if (data.durationUnit) setValue('durationUnit', data.durationUnit);
          if (data.startAt) setValue('startAt', data.startAt);
          if (data.endAt) setValue('endAt', data.endAt);
          if (data.locationText) setValue('locationText', data.locationText);
          if (data.notes) setValue('notes', data.notes);
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
  }, [params.id, toast, setValue]);

  const onSubmit = async (data: EditRequestForm) => {
    if (!request) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم حفظ تعديلات الطلب بنجاح.",
        });
        router.push(`/admin/service-requests/${request.id}`);
      } else {
        throw new Error('Failed to update request');
      }
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "تعذر حفظ التعديلات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'عادي';
      case 'MEDIUM': return 'متوسط';
      case 'HIGH': return 'عاجل';
      case 'URGENT': return 'عاجل جداً';
      default: return priority;
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
      <div className="flex items-center space-x-4">
        <Button variant="outline" asChild>
          <Link href={`/admin/service-requests/${request.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة إلى التفاصيل
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل طلب الخدمة</h1>
          <p className="text-muted-foreground">رقم الطلب: {request.id.slice(0, 8)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client and Service Info (Read-only) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="font-medium">{request.user.email}</p>
              </div>
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
        </div>

        {/* Editable Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              تفاصيل الطلب القابلة للتعديل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                عنوان الطلب *
              </label>
              <Input
                id="title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="أدخل عنوان الطلب"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                وصف الطلب *
              </label>
              <Textarea
                id="description"
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
                placeholder="أدخل وصف تفصيلي للطلب"
                rows={6}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  حالة الطلب *
                </label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر حالة الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">معلق</SelectItem>
                    <SelectItem value="IN_PROGRESS">جاري التنفيذ</SelectItem>
                    <SelectItem value="COMPLETED">مكتمل</SelectItem>
                    <SelectItem value="CANCELLED">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-2">
                  أولوية الطلب *
                </label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value as any)}
                >
                  <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر أولوية الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">عادي</SelectItem>
                    <SelectItem value="MEDIUM">متوسط</SelectItem>
                    <SelectItem value="HIGH">عاجل</SelectItem>
                    <SelectItem value="URGENT">عاجل جداً</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.priority.message}
                  </p>
                )}
              </div>
            </div>

            {/* Bodyguard-specific fields */}
            {request.service.name.match(/حارس|حراسة|بودي|Body/i) && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">تفاصيل الحراسة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personnel Count */}
                    <div>
                      <label htmlFor="personnelCount" className="block text-sm font-medium mb-2">
                        عدد الأفراد
                      </label>
                      <Input
                        id="personnelCount"
                        type="number"
                        min="1"
                        value={watch('personnelCount') || ''}
                        onChange={(e) => setValue('personnelCount', e.target.value ? Number(e.target.value) : null)}
                        placeholder="عدد الأفراد المطلوبين"
                      />
                    </div>

                    {/* Armament Level */}
                    <div>
                      <label htmlFor="armamentLevel" className="block text-sm font-medium mb-2">
                        مستوى التسليح
                      </label>
                      <Select
                        value={watch('armamentLevel') || ''}
                        onValueChange={(value) => setValue('armamentLevel', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مستوى التسليح" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">بدون سلاح</SelectItem>
                          <SelectItem value="LIGHT">سلاح خفيف</SelectItem>
                          <SelectItem value="MEDIUM">سلاح متوسط</SelectItem>
                          <SelectItem value="HEAVY">سلاح ثقيل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration Unit */}
                    <div>
                      <label htmlFor="durationUnit" className="block text-sm font-medium mb-2">
                        وحدة المدة
                      </label>
                      <Select
                        value={watch('durationUnit') || ''}
                        onValueChange={(value) => setValue('durationUnit', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وحدة المدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOURS">ساعات</SelectItem>
                          <SelectItem value="DAYS">أيام</SelectItem>
                          <SelectItem value="WEEKS">أسابيع</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">الجدولة الزمنية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="startAt" className="block text-sm font-medium mb-2">
                        وقت البدء
                      </label>
                      <Input
                        id="startAt"
                        type="datetime-local"
                        value={watch('startAt') && watch('startAt') !== null ? new Date(watch('startAt')!).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setValue('startAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                    <div>
                      <label htmlFor="endAt" className="block text-sm font-medium mb-2">
                        وقت الانتهاء
                      </label>
                      <Input
                        id="endAt"
                        type="datetime-local"
                        value={watch('endAt') && watch('endAt') !== null ? new Date(watch('endAt')!).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setValue('endAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">الموقع</h3>
                  <div>
                    <label htmlFor="locationText" className="block text-sm font-medium mb-2">
                      وصف الموقع
                    </label>
                    <Textarea
                      id="locationText"
                      value={watch('locationText') || ''}
                      onChange={(e) => setValue('locationText', e.target.value || null)}
                      placeholder="أدخل وصف الموقع..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">ملاحظات إضافية</h3>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-2">
                      ملاحظات
                    </label>
                    <Textarea
                      id="notes"
                      value={watch('notes') || ''}
                      onChange={(e) => setValue('notes', e.target.value || null)}
                      placeholder="أدخل أي ملاحظات إضافية..."
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Current Status Preview */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">الحالة الحالية:</span>
                <Badge variant={watch('status') === 'COMPLETED' ? 'default' : 'secondary'}>
                  {getStatusLabel(watch('status'))}
                </Badge>
                <span className="text-sm text-muted-foreground">الأولوية:</span>
                <Badge variant={watch('priority') === 'URGENT' ? 'destructive' : 'outline'}>
                  {getPriorityLabel(watch('priority'))}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/service-requests/${request.id}`}>
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التعديلات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}