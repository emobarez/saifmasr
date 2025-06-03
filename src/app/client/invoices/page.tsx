
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleInvoices = [
  { id: "INV-2024-001", date: "2024-07-12", amount: "5000 ج.م", status: "مدفوعة", statusVariant: "default" },
  { id: "INV-2024-002", date: "2024-06-25", amount: "3500 ج.م", status: "مستحقة", statusVariant: "destructive" },
  { id: "INV-2024-003", date: "2024-05-30", amount: "7200 ج.م", status: "مدفوعة جزئياً", statusVariant: "secondary" },
];

export default function ClientInvoicesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">الفواتير</CardTitle>
          <CardDescription>عرض وإدارة فواتير الخدمات الخاصة بك.</CardDescription>
        </CardHeader>
        <CardContent>
          {sampleInvoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.statusVariant as any}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1 space-x-reverse">
                    <Button variant="ghost" size="icon" aria-label="تحميل الفاتورة">
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="طباعة الفاتورة">
                      <Printer className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد فواتير لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
