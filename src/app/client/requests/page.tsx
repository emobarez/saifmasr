"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

export default function ClientRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    serviceId: "",
    title: "",
    description: "",
    priority: "MEDIUM"
  });

  // Load services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/services');
        if (response.ok) {
          const servicesData = await response.json();
          setServices(servicesData);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "خطأ في تحميل الخدمات",
          description: "تعذر تحميل قائمة الخدمات. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "خطأ في المصادقة",
        description: "يجب تسجيل الدخول لإرسال طلب الخدمة.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.serviceId || !formData.title || !formData.description) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "تم إرسال الطلب بنجاح!",
          description: `تم إرسال طلبكم برقم ${result.id}. سيتم التواصل معكم قريباً.`,
        });
        
        // Reset form
        setFormData({
          serviceId: "",
          title: "",
          description: "",
          priority: "MEDIUM"
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: "تعذر إرسال طلب الخدمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">طلب خدمة جديدة</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            تفاصيل الطلب
          </CardTitle>
          <CardDescription>
            يرجى ملء جميع البيانات المطلوبة لتقديم طلب الخدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceId">نوع الخدمة المطلوبة</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    جارٍ تحميل الخدمات...
                  </div>
                ) : (
                  <Select value={formData.serviceId} onValueChange={(value) => handleInputChange("serviceId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {new Intl.NumberFormat('ar-EG', {
                            style: 'currency',
                            currency: 'EGP'
                          }).format(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">أولوية الطلب</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">منخفضة</SelectItem>
                    <SelectItem value="MEDIUM">متوسطة</SelectItem>
                    <SelectItem value="HIGH">عالية</SelectItem>
                    <SelectItem value="URGENT">عاجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">عنوان الطلب</Label>
                <Input
                  id="title"
                  placeholder="أدخل عنواناً مختصراً للطلب"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف تفصيلي للطلب</Label>
              <Textarea
                id="description"
                placeholder="اكتب وصفاً تفصيلياً للخدمة المطلوبة..."
                className="min-h-[120px]"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">⏰ أوقات الاستجابة</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• الطلبات العاجلة: خلال ساعة واحدة</li>
                <li>• الأولوية العالية: خلال 4 ساعات</li>
                <li>• الأولوية المتوسطة: خلال 24 ساعة</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📞 التواصل المباشر</h3>
              <p className="text-sm text-green-700">
                للطوارئ: 122<br />
                خدمة العملاء: 01119224091<br />
                البريد الإلكتروني: support@saifmasr.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}