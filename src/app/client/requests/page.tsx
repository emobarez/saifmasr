
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

export default function ClientServiceRequestsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">طلب خدمة جديدة</CardTitle>
          <CardDescription>املأ النموذج أدناه لتقديم طلب خدمة جديد. سنقوم بمراجعته والتواصل معك في أقرب وقت.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="serviceType">نوع الخدمة</Label>
              <Select dir="rtl">
                <SelectTrigger id="serviceType" className="w-full">
                  <SelectValue placeholder="اختر نوع الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulting">خدمات استشارية</SelectItem>
                  <SelectItem value="security">حلول أمنية</SelectItem>
                  <SelectItem value="reports">إدارة التقارير</SelectItem>
                  <SelectItem value="audit">التدقيق والمراجعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requestTitle">عنوان الطلب</Label>
              <Input id="requestTitle" placeholder="مثال: طلب استشارة مالية" />
            </div>
            <div>
              <Label htmlFor="requestDetails">تفاصيل الطلب</Label>
              <Textarea id="requestDetails" placeholder="يرجى تقديم وصف تفصيلي لطلبك..." rows={5} />
            </div>
            <div>
              <Label htmlFor="attachments">مرفقات (اختياري)</Label>
              <Input id="attachments" type="file" />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="me-2 h-5 w-5" />
              إرسال الطلب
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
