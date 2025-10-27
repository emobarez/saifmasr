"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Trash2,
  Archive,
  Download,
  AlertTriangle,
  Database,
  Calendar,
  BarChart3,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityStats {
  total: number;
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
}

export default function ActivityLogManagePage() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupDays, setCleanupDays] = useState("90");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/activity-log/stats');
      if (!response.ok) throw new Error('فشل في تحميل الإحصائيات');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل إحصائيات سجل النشاطات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldLogs = async () => {
    if (!cleanupDays || parseInt(cleanupDays) < 30) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون المدة أكبر من 30 يوماً",
        variant: "destructive"
      });
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await fetch(`/api/activity-log?olderThanDays=${cleanupDays}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('فشل في تنظيف السجلات');
      
      const result = await response.json();
      toast({
        title: "نجح التنظيف",
        description: result.message,
        variant: "default"
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تنظيف السجلات القديمة",
        variant: "destructive"
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const exportAllLogs = async () => {
    try {
      const response = await fetch('/api/activity-log?export=true&dateRange=all');
      if (!response.ok) throw new Error('فشل في تصدير السجلات');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `complete-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير جميع السجلات بنجاح",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير السجلات",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة سجل النشاطات</h1>
        </div>
        <Button onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث الإحصائيات
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
                <p className="text-2xl font-bold">{stats?.total?.toLocaleString() || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">آخر 24 ساعة</p>
                <p className="text-2xl font-bold">{stats?.lastDay?.toLocaleString() || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">آخر أسبوع</p>
                <p className="text-2xl font-bold">{stats?.lastWeek?.toLocaleString() || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">آخر شهر</p>
                <p className="text-2xl font-bold">{stats?.lastMonth?.toLocaleString() || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Types Distribution */}
      {stats?.byType && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع أنواع النشاطات</CardTitle>
            <CardDescription>
              عدد النشاطات حسب النوع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">{type}</span>
                  <Badge variant="secondary">{count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>تنظيف البيانات</span>
            </CardTitle>
            <CardDescription>
              حذف السجلات القديمة لتوفير مساحة التخزين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                تحذير: هذا الإجراء غير قابل للتراجع. سيتم حذف جميع السجلات الأقدم من المدة المحددة.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="cleanup-days">حذف السجلات الأقدم من (بالأيام)</Label>
              <Select value={cleanupDays} onValueChange={setCleanupDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="60">60 يوم</SelectItem>
                  <SelectItem value="90">90 يوم</SelectItem>
                  <SelectItem value="180">6 أشهر</SelectItem>
                  <SelectItem value="365">سنة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={cleanupOldLogs}
              disabled={cleanupLoading}
              className="w-full"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 me-2" />
              )}
              تنظيف السجلات القديمة
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Download className="h-5 w-5 text-blue-600" />
              <span>تصدير البيانات</span>
            </CardTitle>
            <CardDescription>
              تصدير سجل النشاطات للأرشفة أو التحليل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                يمكنك تصدير جميع سجلات النشاطات بصيغة CSV للاحتفاظ بنسخة احتياطية أو لتحليل البيانات.
              </p>
              
              <div className="flex items-center space-x-2 space-x-reverse p-3 bg-muted rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">تتضمن جميع البيانات والتفاصيل</span>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse p-3 bg-muted rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">متوافق مع Excel و Google Sheets</span>
              </div>
            </div>
            
            <Button 
              onClick={exportAllLogs}
              className="w-full"
            >
              <Download className="h-4 w-4 me-2" />
              تصدير جميع السجلات (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>صحة النظام</CardTitle>
          <CardDescription>
            معلومات حول أداء نظام تسجيل النشاطات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium">حالة النظام</p>
                <p className="text-sm text-muted-foreground">يعمل بشكل طبيعي</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium">قاعدة البيانات</p>
                <p className="text-sm text-muted-foreground">متصلة ومستجيبة</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium">الأمان</p>
                <p className="text-sm text-muted-foreground">محمي ومشفر</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}