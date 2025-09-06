"use client";

import { useState, useEffect } from "react";
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
  Shield, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  RefreshCw, 
  Users, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Camera,
  UserCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  status: 'active' | 'inactive' | 'draft';
  clients: number;
  createdDate: string;
}

export default function AdminServicesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data for demonstration
  const mockServices: Service[] = [
    {
      id: "1",
      name: "خدمة الحراسة الشخصية",
      description: "حراسة وحماية الشخصيات المهمة على مدار الساعة",
      category: "حماية شخصية",
      price: 15000,
      status: 'active',
      createdDate: "2024-01-15",
      duration: "شهري",
      clients: 25
    },
    {
      id: "2",
      name: "أنظمة المراقبة المتطورة",
      description: "تركيب وصيانة أنظمة المراقبة وكاميرات الأمان",
      category: "مراقبة",
      price: 12000,
      status: 'active',
      createdDate: "2024-01-10",
      duration: "سنوي",
      clients: 35
    },
    {
      id: "3",
      name: "أمن المباني والمنشآت",
      description: "حراسة وتأمين المباني والمجمعات التجارية",
      category: "أمن مباني",
      price: 8000,
      status: 'active',
      createdDate: "2024-01-05",
      duration: "شهري",
      clients: 18
    },
    {
      id: "4",
      name: "التدريب الأمني المتخصص",
      description: "برامج تدريبية شاملة في الأمن والحماية",
      category: "تدريب",
      price: 5000,
      status: 'active',
      createdDate: "2024-01-20",
      duration: "دورة",
      clients: 12
    },
    {
      id: "5",
      name: "الاستشارات الأمنية",
      description: "تقييم المخاطر ووضع الخطط الأمنية",
      category: "استشارات",
      price: 7500,
      status: 'draft',
      createdDate: "2024-01-25",
      duration: "مشروع",
      clients: 0
    }
  ];

  // Fetch services from API
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        // Map API data to match our interface
        const mappedServices = data.map((service: any) => ({
          id: service.id || '',
          name: service.name || '',
          description: service.description || '',
          category: service.category || '',
          price: typeof service.price === 'number' ? service.price : 0,
          status: service.status?.toLowerCase() || 'draft',
          createdDate: service.createdAt || new Date().toISOString(),
          duration: 'شهري', // Default duration
          clients: service._count?.serviceRequests || 0
        }));
        setServices(mappedServices);
      } else {
        setServices(mockServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />غير نشط</Badge>;
      case 'draft':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />مسودة</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'حماية شخصية':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'مراقبة':
        return <Camera className="h-4 w-4 text-purple-600" />;
      case 'أمن مباني':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'تدريب':
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const serviceStats = {
    total: services.length || 0,
    active: services.filter(s => s.status === 'active').length || 0,
    totalClients: services.reduce((acc, s) => acc + (s.clients || 0), 0),
    totalRevenue: services.reduce((acc, s) => acc + ((s.price || 0) * (s.clients || 0)), 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>جاري تحميل الخدمات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الخدمات</h1>
          <p className="text-muted-foreground">إدارة وتحديث خدمات الشركة الأمنية</p>
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
            <Plus className="h-4 w-4" />
            خدمة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الخدمات</p>
                <p className="text-2xl font-bold">{serviceStats.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">الخدمات النشطة</p>
                <p className="text-2xl font-bold">{serviceStats.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{serviceStats.totalClients || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{formatEGPSimple(serviceStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الخدمات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                الكل ({serviceStats.total || 0})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
              >
                نشط ({serviceStats.active || 0})
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                مسودة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخدمات</CardTitle>
          <CardDescription>
            إجمالي {filteredServices.length} خدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الخدمة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>العملاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(service.category)}
                      <div>
                        <div className="font-medium">{service.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {service.description}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatEGPSimple(service.price || 0)}
                  </TableCell>
                  <TableCell>{service.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-500" />
                      {service.clients || 0}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell>
                    {new Date(service.createdDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد خدمات</h3>
              <p className="text-gray-500">لم يتم العثور على خدمات تطابق البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
