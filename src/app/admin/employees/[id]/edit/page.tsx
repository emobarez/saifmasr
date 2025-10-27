"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Building,
  Loader2
} from "lucide-react";
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
}

export default function EmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    status: "active" as 'active' | 'inactive' | 'on-leave',
    hireDate: "",
    salary: ""
  });

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
      
      // Pre-populate form with employee data
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        position: data.position || "",
        department: data.department || "",
        status: data.status || "active",
        hireDate: data.hireDate ? new Date(data.hireDate).toISOString().split('T')[0] : "",
        salary: data.salary?.toString() || ""
      });
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCertification = () => {
    // This function is kept for future use but currently does nothing
    // since certifications are not stored in the database schema
  };

  const handleRemoveCertification = (index: number) => {
    // This function is kept for future use but currently does nothing
    // since certifications are not stored in the database schema
  };

  const handleSaveEmployee = async () => {
    setSaving(true);
    
    try {
      // Validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.position.trim() || !formData.hireDate) {
        toast({
          title: "بيانات غير مكتملة",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          status: formData.status,
          hireDate: formData.hireDate,
          salary: formData.salary ? parseFloat(formData.salary) : undefined
        }),
      });

      if (response.ok) {
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الموظف "${formData.name}" بنجاح`,
        });
        
        router.push(`/admin/employees/${params.id}`);
      } else {
        throw new Error('Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "خطأ في التحديث",
        description: "تعذر تحديث بيانات الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDetail = () => {
    router.push(`/admin/employees/${params.id}`);
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
          <Button onClick={() => router.push('/admin/employees')}>
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
            <Button variant="outline" onClick={handleBackToDetail}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
            <div>
              <h1 className="text-3xl font-bold">تعديل بيانات الموظف</h1>
              <p className="text-muted-foreground">تعديل معلومات {employee.name}</p>
            </div>
          </div>
          <Button onClick={handleSaveEmployee} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+20 10 1234 5678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                معلومات العمل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="position">المنصب *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="مدير أمني، ضابط أمن..."
                />
              </div>
              
              <div>
                <Label htmlFor="department">القسم</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="العمليات الأمنية">العمليات الأمنية</SelectItem>
                    <SelectItem value="التقنية الأمنية">التقنية الأمنية</SelectItem>
                    <SelectItem value="التدريب والتطوير">التدريب والتطوير</SelectItem>
                    <SelectItem value="الشؤون المالية">الشؤون المالية</SelectItem>
                    <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'on-leave') => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="on-leave">في إجازة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="hireDate">تاريخ التوظيف *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange("hireDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                المعلومات المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="salary">الراتب الشهري (جنيه مصري)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange("salary", e.target.value)}
                  placeholder="10000"
                  step="100"
                  min="0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 space-x-reverse pt-4">
          <Button onClick={handleBackToDetail} variant="outline" disabled={saving}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            إلغاء التعديل
          </Button>
          <Button onClick={handleSaveEmployee} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </div>
    </div>
  );
}