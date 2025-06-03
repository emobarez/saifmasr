
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";

const sampleServices = [
  { id: "SVC-001", name: "خدمات استشارية", category: "استشارات", price: "حسب الطلب", status: "متاحة", statusVariant: "default" },
  { id: "SVC-002", name: "حلول أمنية متقدمة", category: "أمن سيبراني", price: "تبدأ من 10,000 ج.م", status: "متاحة", statusVariant: "default" },
  { id: "SVC-003", name: "إدارة تقارير مخصصة", category: "تقارير", price: "5,000 ج.م/شهرياً", status: "قيد التطوير", statusVariant: "secondary" },
];

export default function AdminServicesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة الخدمات</CardTitle>
            <CardDescription>إضافة، تعديل، وحذف الخدمات المقدمة عبر البوابة.</CardDescription>
          </div>
          <Button className="mt-4 md:mt-0">
            <PlusCircle className="me-2 h-5 w-5" />
            إضافة خدمة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="ابحث عن خدمة..." className="max-w-sm" />
            <Button variant="outline" size="icon"><Search className="h-5 w-5"/></Button>
          </div>
          {sampleServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرف</TableHead>
                  <TableHead>اسم الخدمة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.id}</TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{service.price}</TableCell>
                    <TableCell>
                      <Badge variant={service.statusVariant as any}>{service.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="تعديل الخدمة">
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="حذف الخدمة" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد خدمات لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
