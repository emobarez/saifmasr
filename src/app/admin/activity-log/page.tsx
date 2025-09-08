"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar,
  Clock,
  User,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Shield,
  FileText,
  Settings,
  Users,
  Database
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityLog {
  id: string;
  userId?: string;
  actionType: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
}

interface ActivityLogFilters {
  search: string;
  actionType: string;
  userId: string;
  dateRange: string;
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  'CREATE': 'bg-green-100 text-green-800',
  'UPDATE': 'bg-blue-100 text-blue-800',
  'DELETE': 'bg-red-100 text-red-800',
  'LOGIN': 'bg-purple-100 text-purple-800',
  'LOGOUT': 'bg-gray-100 text-gray-800',
  'VIEW': 'bg-yellow-100 text-yellow-800',
  'EXPORT': 'bg-indigo-100 text-indigo-800',
  'SYSTEM': 'bg-orange-100 text-orange-800',
  'ERROR': 'bg-red-200 text-red-900',
  'WARNING': 'bg-yellow-200 text-yellow-900',
  'INFO': 'bg-blue-200 text-blue-900',
};

const ACTION_TYPE_ICONS: Record<string, any> = {
  'CREATE': CheckCircle,
  'UPDATE': Settings,
  'DELETE': XCircle,
  'LOGIN': Shield,
  'LOGOUT': Shield,
  'VIEW': Eye,
  'EXPORT': Download,
  'SYSTEM': Database,
  'ERROR': AlertCircle,
  'WARNING': AlertCircle,
  'INFO': Info,
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  'CREATE': 'إنشاء',
  'UPDATE': 'تحديث',
  'DELETE': 'حذف',
  'LOGIN': 'تسجيل دخول',
  'LOGOUT': 'تسجيل خروج',
  'VIEW': 'عرض',
  'EXPORT': 'تصدير',
  'SYSTEM': 'نظام',
  'ERROR': 'خطأ',
  'WARNING': 'تحذير',
  'INFO': 'معلومات',
};

export default function AdminActivityLogPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    search: '',
    actionType: '',
    userId: '',
    dateRange: '7d'
  });

  const fetchActivityLogs = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.actionType) queryParams.append('actionType', filters.actionType);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
      
      const response = await fetch(`/api/activity-log?${queryParams.toString()}`);
      
      if (response.status === 401) {
        setError('يجب تسجيل الدخول كمدير للوصول إلى سجل النشاطات');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في تحميل سجل النشاطات');
      }
      
      const data = await response.json();
      setActivityLogs(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (key: keyof ActivityLogFilters, value: string) => {
    // Handle "all" value for actionType filter
    if (key === 'actionType' && value === 'all') {
      setFilters(prev => ({ ...prev, [key]: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleRefresh = () => {
    fetchActivityLogs(true);
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('export', 'true');
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.actionType) queryParams.append('actionType', filters.actionType);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
      
      const response = await fetch(`/api/activity-log?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('فشل في تصدير السجل');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تصدير السجل');
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [filters]);

  const getActionIcon = (actionType: string) => {
    const IconComponent = ACTION_TYPE_ICONS[actionType] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
  };

  const getFormattedDate = (date: string) => {
    return format(new Date(date), 'PPp', { locale: ar });
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = !filters.search || 
      log.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesActionType = !filters.actionType || log.actionType === filters.actionType;
    const matchesUserId = !filters.userId || log.userId === filters.userId;
    
    return matchesSearch && matchesActionType && matchesUserId;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 space-x-reverse">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 force-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">سجل النشاطات</h1>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportLogs}
          >
            <Download className="h-4 w-4 me-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-5 w-5" />
            <span>الفلاتر والبحث</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الوصف أو المستخدم..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع النشاط</label>
              <Select value={filters.actionType || 'all'} onValueChange={(value) => handleFilterChange('actionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">آخر يوم</SelectItem>
                  <SelectItem value="7d">آخر أسبوع</SelectItem>
                  <SelectItem value="30d">آخر شهر</SelectItem>
                  <SelectItem value="90d">آخر 3 أشهر</SelectItem>
                  <SelectItem value="all">جميع الفترات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الإحصائيات</label>
              <div className="text-sm text-muted-foreground">
                إجمالي: {filteredLogs.length} نشاط
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('تسجيل الدخول') && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/auth/login'}
                  className="text-sm"
                >
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>سجل النشاطات ({filteredLogs.length})</CardTitle>
          <CardDescription>
            تفاصيل جميع الأنشطة والعمليات المنفذة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد أنشطة
              </h3>
              <p className="text-sm text-muted-foreground">
                لم يتم العثور على أنشطة تطابق المعايير المحددة
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 space-x-reverse p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Action Icon */}
                  <div className={`p-2 rounded-full ${ACTION_TYPE_COLORS[log.actionType] || 'bg-gray-100 text-gray-800'}`}>
                    {getActionIcon(log.actionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <Badge 
                        variant="secondary" 
                        className={ACTION_TYPE_COLORS[log.actionType] || 'bg-gray-100 text-gray-800'}
                      >
                        {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
                      </Badge>
                      {log.user && (
                        <span className="text-sm text-muted-foreground flex items-center space-x-1 space-x-reverse">
                          <User className="h-3 w-3" />
                          <span>{log.user.name || log.user.email}</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-foreground mb-1">
                      {log.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 space-x-reverse text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(log.createdAt)}</span>
                      </span>
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <Calendar className="h-3 w-3" />
                        <span>{getFormattedDate(log.createdAt)}</span>
                      </span>
                    </div>

                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          عرض التفاصيل
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
