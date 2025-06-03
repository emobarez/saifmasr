
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Search, Download, Eye, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react"; // Added for potential future state management

// Interface for report data (can be expanded)
interface Report {
  id: string;
  name: string;
  creationDate: string;
  type: string;
  createdBy: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]); // State for reports
  const [isLoading, setIsLoading] = useState(true); // State for loading

  // Simulate fetching reports (replace with actual data fetching logic)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReports([]); // Start with no reports
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة التقارير</CardTitle>
            <CardDescription>إنشاء، عرض، وتحميل التقارير المختلفة للنظام.</CardDescription>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/admin/ai-tool">
              <FilePlus2 className="me-2 h-5 w-5" />
              إنشاء تقرير جديد (بمساعدة AI)
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="ابحث عن تقرير..." className="max-w-sm" />
            <Button variant="outline" size="icon"><Search className="h-5 w-5"/></Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل التقارير...</p></div>
          ) : reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف التقرير</TableHead>
                  <TableHead>اسم التقرير</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>أنشئ بواسطة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.creationDate}</TableCell>
                    <TableCell><Badge variant="outline">{report.type}</Badge></TableCell>
                    <TableCell>{report.createdBy}</TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="عرض التقرير">
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="تحميل التقرير">
                        <Download className="h-5 w-5" />
                      </Button>
                       <Button variant="ghost" size="icon" aria-label="عرض الإحصائيات">
                        <BarChart3 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد تقارير لعرضها حالياً. قم بإنشاء تقرير جديد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
