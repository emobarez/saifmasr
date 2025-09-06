"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminAIToolPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">أدوات الذكاء الاصطناعي</h1>
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
        </CardContent>
      </Card>
    </div>
  );
}
