"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ClientDashboardPage() {
  console.log('Client dashboard page rendering');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>قيد التطوير</CardTitle>
          <CardDescription>
            يتم ترحيل هذه الصفحة إلى نظام قاعدة البيانات الجديد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم إعادة تطوير هذه الصفحة قريباً لتعمل مع قاعدة بيانات Neon الجديدة.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 font-semibold">✅ تم تسجيل الدخول بنجاح!</p>
            <p className="text-blue-600 text-sm">مرحباً بك في لوحة التحكم</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
