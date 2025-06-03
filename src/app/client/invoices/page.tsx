
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react"; // Added for state management

// Interface for invoice data
interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  statusVariant: "default" | "secondary" | "destructive" | "outline" | null | undefined;
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInvoices([]); // Start with no invoices
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">الفواتير</CardTitle>
          <CardDescription>عرض وإدارة فواتير الخدمات الخاصة بك.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الفواتير...</p></div>
          ) : invoices.length > 0 ? (
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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.statusVariant}>{invoice.status}</Badge>
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
