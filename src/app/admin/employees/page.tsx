"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Shield,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
  salary: number;
  experience: string;
  certifications: string[];
}

export default function AdminEmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - replace with real database queries
  const employees: Employee[] = [
    {
      id: "EMP-001",
      name: "محمد أحمد الحارس",
      email: "mohammed@saifmasr.com",
      phone: "+20101234567",
      position: "رئيس فريق الأمن",
      department: "العمليات الأمنية",
      location: "القاهرة",
      status: "active",
      hireDate: "2022-01-15",
      salary: 8000,
      experience: "8 سنوات",
      certifications: ["شهادة الأمن المهني", "إدارة الأزمات"]
    },
    {
      id: "EMP-002",
      name: "فاطمة عبدالله المراقبة",
      email: "fatima@saifmasr.com",
      phone: "+20107654321",
      position: "مختصة أنظمة مراقبة",
      department: "التقنية الأمنية",
      location: "الإسكندرية",
      status: "active",
      hireDate: "2023-03-20",
      salary: 7000,
      experience: "5 سنوات",
      certifications: ["شهادة أنظمة المراقبة", "الأمن السيبراني"]
    },
    {
      id: "EMP-003",
      name: "علي محمد المدرب",
      email: "ali@saifmasr.com",
      phone: "+20151234567",
      position: "مدرب أمني معتمد",
      department: "التدريب والتطوير",
      location: "الجيزة",
      status: "active",
      hireDate: "2021-06-10",
      salary: 9000,
      experience: "12 سنة",
      certifications: ["مدرب معتمد", "إدارة الأزمات", "الإسعافات الأولية"]
    },
    {
      id: "EMP-004",
      name: "سارة خالد المحاسبة",
      email: "sara@saifmasr.com",
      phone: "+20159876543",
      position: "محاسبة",
      department: "الشؤون المالية",
      location: "القاهرة",
      status: "on-leave",
      hireDate: "2023-01-05",
      salary: 6000,
      experience: "3 سنوات",
      certifications: ["محاسب قانوني", "إدارة مالية"]
    },
    {
      id: "EMP-005",
      name: "عبدالرحمن سعد الحارس",
      email: "abdulrahman@saifmasr.com",
      phone: "+20155555555",
      position: "حارس أمن",
      department: "العمليات الأمنية",
      location: "أسوان",
      status: "active",
      hireDate: "2024-02-01",
      salary: 4500,
      experience: "سنتان",
      certifications: ["الأمن الأساسي"]
    }
  ];

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'on-leave':
        return <Badge className="bg-orange-100 text-orange-800">في إجازة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'العمليات الأمنية': 'bg-blue-100 text-blue-800',
      'التقنية الأمنية': 'bg-purple-100 text-purple-800',
      'التدريب والتطوير': 'bg-green-100 text-green-800',
      'الشؤون المالية': 'bg-orange-100 text-orange-800',
      'الموارد البشرية': 'bg-pink-100 text-pink-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  const employeeStats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onLeave: employees.filter(e => e.status === 'on-leave').length,
    avgSalary: Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length)
  };

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            إدارة الموظفين
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة فريق العمل ومعلومات الموظفين
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/employees/new">
            <Plus className="h-4 w-4 mr-2" />
            إضافة موظف جديد
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">{employeeStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الموظفون النشطون</p>
                <p className="text-2xl font-bold text-green-600">{employeeStats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">في إجازة</p>
                <p className="text-2xl font-bold text-orange-600">{employeeStats.onLeave}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط الراتب</p>
                <p className="text-2xl font-bold">{employeeStats.avgSalary.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">جنيه مصري شهرياً</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الموظفين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline">
              تصفية حسب القسم
            </Button>
            <Button variant="outline">
              تصدير قائمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>
            {filteredEmployees.length} من أصل {employees.length} موظف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto border rounded-lg force-scrollbar" style={{maxHeight: '75vh', minHeight: '400px'}}>
            <div className="min-w-[1200px]">
              <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>معلومات الموظف</TableHead>
                <TableHead>المنصب</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>الخبرة</TableHead>
                <TableHead>الراتب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {employee.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {employee.email}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employee.position}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDepartmentColor(employee.department)}>
                      {employee.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {employee.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{employee.experience}</div>
                      <div className="text-xs text-muted-foreground">
                        من {new Date(employee.hireDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatEGPSimple(employee.salary || 0)}</div>
                    <div className="text-xs text-muted-foreground">شهرياً</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Certifications Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الشهادات والمؤهلات</CardTitle>
          <CardDescription>
            توزيع الشهادات المهنية بين الموظفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['شهادة الأمن المهني', 'إدارة الأزمات', 'أنظمة المراقبة', 'الأمن السيبراني'].map((cert, index) => {
              const count = employees.filter(emp => emp.certifications.includes(cert)).length;
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-muted-foreground">{cert}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}