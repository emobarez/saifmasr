
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Edit, Trash2 } from "lucide-react";

const sampleClients = [
  { id: "CLT-001", name: "أحمد محمد", email: "ahmed.m@example.com", joinDate: "2024-01-15", status: "نشط", statusVariant: "default" },
  { id: "CLT-002", name: "فاطمة علي", email: "fatima.a@example.com", joinDate: "2024-03-20", status: "غير نشط", statusVariant: "secondary" },
  { id: "CLT-003", name: "يوسف حسن", email: "youssef.h@example.com", joinDate: "2024-05-10", status: "محظور", statusVariant: "destructive" },
];

export default function AdminClientsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة العملاء</CardTitle>
            <CardDescription>عرض، تعديل، وإضافة عملاء جدد للنظام.</CardDescription>
          </div>
          <Button className="mt-4 md:mt-0">
            <UserPlus className="me-2 h-5 w-5" />
            إضافة عميل جديد
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="ابحث عن عميل (بالاسم أو البريد الإلكتروني)..." className="max-w-sm" />
            <Button variant="outline" size="icon"><Search className="h-5 w-5"/></Button>
          </div>
          {sampleClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرف</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.joinDate}</TableCell>
                    <TableCell>
                      <Badge variant={client.statusVariant as any}>{client.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="تعديل العميل">
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="حذف العميل" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className="text-muted-foreground text-center py-8">لا يوجد عملاء لعرضهم حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
