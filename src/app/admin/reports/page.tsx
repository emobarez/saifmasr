"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Shield, 
  Activity, 
  Download, 
  RefreshCw,
  Calendar,
  FileText,
  Eye
} from "lucide-react";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface ReportData {
  overview: {
    totalRevenue: number;
    totalClients: number;
    activeServices: number;
    completedTasks: number;
    revenueGrowth: number;
    clientGrowth: number;
    serviceGrowth: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    clients: number;
  }>;
  serviceDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  regionPerformance: Array<{
    region: string;
    revenue: number;
    clients: number;
    growth: number;
  }>;
}

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [reportData, setReportData] = useState<ReportData>({
    overview: {
      totalRevenue: 0,
      totalClients: 0,
      activeServices: 0,
      completedTasks: 0,
      revenueGrowth: 0,
      clientGrowth: 0,
      serviceGrowth: 0
    },
    monthlyRevenue: [],
    serviceDistribution: [],
    regionPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Removed mock data - using real database only

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      const response = await fetch(`/api/reports/analytics?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports data');
      // Keep reportData as null to show error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportsData();
    setRefreshing(false);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>جاري تحميل التقارير...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={handleRefresh}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تقارير الأداء</h1>
          <p className="text-muted-foreground">إحصائيات شاملة عن أداء الشركة</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('week')}
              size="sm"
            >
              أسبوعي
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('month')}
              size="sm"
            >
              شهري
            </Button>
            <Button
              variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('quarter')}
              size="sm"
            >
              ربع سنوي
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('year')}
              size="sm"
            >
              سنوي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{formatEGPSimple(reportData?.overview?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  +{reportData?.overview?.revenueGrowth || 0}% هذا الشهر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{reportData?.overview?.totalClients || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{reportData?.overview?.clientGrowth || 0}% هذا الشهر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">الخدمات النشطة</p>
                <p className="text-2xl font-bold">{reportData?.overview?.activeServices || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{reportData?.overview?.serviceGrowth || 0}% هذا الشهر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">المهام المكتملة</p>
                <p className="text-2xl font-bold">{reportData?.overview?.completedTasks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
            <CardDescription>تطور الإيرادات خلال الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="الإيرادات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الخدمات</CardTitle>
            <CardDescription>النسبة المئوية لكل نوع خدمة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.serviceDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(reportData?.serviceDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <Card>
        <CardHeader>
          <CardTitle>الأداء الإقليمي</CardTitle>
          <CardDescription>إحصائيات العملاء والإيرادات حسب المنطقة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(reportData?.regionPerformance || []).map((region, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-muted-foreground">{region.clients} عميل</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatEGPSimple(region.revenue || 0)}</p>
                  <div className="flex items-center">
                    {region.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                    )}
                    <span className={`text-sm ${region.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {region.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}