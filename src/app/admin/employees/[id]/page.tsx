"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Building,
  Award,
  Clock,
  Shield,
  FileText,
  CheckCircle
} from "lucide-react";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { toast } from "@/hooks/use-toast";

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
  // Added to match API shape returned by employeeService.getById(include: { assignments: true })
  assignments?: Array<{
    title: string;
    description?: string | null;
  }>;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('الموظف غير موجود');
          return;
        }
        throw new Error('Failed to fetch employee data');
      }
      
      const data = await response.json();
      setEmployee(data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('فشل في تحميل بيانات الموظف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'on-leave':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 ml-1" />في إجازة</Badge>;
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

  const handleEditEmployee = () => {
    router.push(`/admin/employees/${params.id}/edit`);
  };

  const handleBackToList = () => {
    router.push('/admin/employees');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">خطأ في التحميل</h1>
          <p className="text-muted-foreground mb-4">{error || 'حدث خطأ غير متوقع'}</p>
          <Button onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة إلى قائمة الموظفين
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <div>
              <h1 className="text-3xl font-bold">تفاصيل الموظف</h1>
              <p className="text-muted-foreground">عرض معلومات {employee.name}</p>
            </div>
          </div>
          <Button onClick={handleEditEmployee}>
            <Edit3 className="h-4 w-4 mr-2" />
            تعديل البيانات
          </Button>
        </div>

        {/* Employee Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{employee.name}</h2>
                  <p className="text-lg text-muted-foreground">{employee.position}</p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <Badge className={getDepartmentColor(employee.department)}>
                      <Building className="h-3 w-3 ml-1" />
                      {employee.department}
                    </Badge>
                    {getStatusBadge(employee.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">معرف الموظف</p>
                <p className="font-mono text-lg">{employee.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">البريد الإلكتروني</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center space-x-3 space-x-reverse">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">رقم الهاتف</p>
                  <p className="text-sm text-muted-foreground">{employee.phone}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center space-x-3 space-x-reverse">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">القسم</p>
                  <p className="text-sm text-muted-foreground">{employee.department || 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                تفاصيل التوظيف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">تاريخ التوظيف</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(employee.hireDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center space-x-3 space-x-reverse">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">الراتب الشهري</p>
                  <p className="text-sm text-muted-foreground">{formatEGPSimple(employee.salary || 0)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center space-x-3 space-x-reverse">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">تاريخ التوظيف</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(employee.hireDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certifications */}
        {employee.assignments && employee.assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                المهام والتكليفات
              </CardTitle>
              <CardDescription>
                المهام المسندة للموظف
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {employee.assignments.map((assignment: any, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600 mr-2" />
                    <div>
                      <span className="font-medium">{assignment.title}</span>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              ملخص الأداء
            </CardTitle>
            <CardDescription>
              معلومات إضافية حول أداء الموظف
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30))}
                </div>
                <div className="text-sm text-muted-foreground">شهر في الخدمة</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{employee.assignments?.length || 0}</div>
                <div className="text-sm text-muted-foreground">مهمة مسندة</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {employee.status === 'active' ? 'ممتاز' : 'متوقف'}
                </div>
                <div className="text-sm text-muted-foreground">حالة الأداء</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 space-x-reverse pt-4">
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة إلى القائمة
          </Button>
          <Button onClick={handleEditEmployee}>
            <Edit3 className="h-4 w-4 mr-2" />
            تعديل البيانات
          </Button>
        </div>
      </div>
    </div>
  );
}