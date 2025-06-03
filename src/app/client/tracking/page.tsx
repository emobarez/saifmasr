
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleRequests = [
  { id: "SRV-001", service: "استشارة مالية", date: "2024-07-15", status: "قيد المراجعة", statusVariant: "secondary" },
  { id: "SRV-002", service: "تأمين بيانات الشركة", date: "2024-07-10", status: "مكتمل", statusVariant: "default" },
  { id: "SRV-003", service: "تقرير أداء الربع الثاني", date: "2024-07-05", status: "ملغى", statusVariant: "destructive" },
];

export default function ClientTrackingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">تتبع حالة الطلبات</CardTitle>
          <CardDescription>هنا يمكنك متابعة حالة جميع طلباتك المقدمة.</CardDescription>
        </CardHeader>
        <CardContent>
          {sampleRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.service}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>
                      <Badge variant={request.statusVariant as any}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="عرض التفاصيل">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد طلبات لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
