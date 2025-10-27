"use client";

import { useEffect, useMemo, useState } from "react";
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
  UserCheck,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building,
  Car,
  HeadphonesIcon,
  Sparkles,
  Star,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useRouter } from "next/navigation";

const ICON_COMPONENTS = {
  Shield,
  Camera,
  Users,
  Building,
  Car,
  HeadphonesIcon,
  Sparkles
};

// Admin manages service metadata only. Request forms live in the client app.

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: string;
  status: 'active' | 'inactive' | 'draft';
  clients: number;
  createdDate: string;
  icon: string;
  displayOrder: number;
  isFeatured: boolean;
  features: string[];
  ctaLabel: string;
  ctaUrl: string;
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Handler functions for table actions
  const handleViewService = (service: Service) => {
    // Navigate to service detail page
    router.push(`/admin/services/${service.id}`);
  };

  const handleEditService = (service: Service) => {
    // Navigate to service edit page
    router.push(`/admin/services/${service.id}/edit`);
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${service.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "تم حذف الخدمة",
          description: `تم حذف الخدمة "${service.name}" بنجاح`,
        });
        
        // Remove service from local state
        setServices(services.filter(s => s.id !== service.id));
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "خطأ في الحذف",
        description: "تعذر حذف الخدمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const resolveServiceIcon = (icon?: string) => {
    if (!icon) return null;
    const key = icon as keyof typeof ICON_COMPONENTS;
    return ICON_COMPONENTS[key] ?? null;
  };

  // Admin does not open client request forms; provide client link instead in the table actions.

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        toast({
          title: "تم تحديث حالة الخدمة",
          description: `تم تغيير حالة الخدمة إلى ${newStatus === 'active' ? 'نشط' : 'غير نشط'}`,
        });
        
        // Update service status in local state
        setServices(services.map(s => 
          s.id === service.id 
            ? { ...s, status: newStatus as 'active' | 'inactive' | 'draft' }
            : s
        ));
      } else {
        throw new Error('Failed to update service status');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "خطأ في التحديث",
        description: "تعذر تحديث حالة الخدمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Removed mock data - using real database only
  const [error, setError] = useState<string | null>(null);

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
          slug: service.slug || '',
          description: service.description || '',
          shortDescription: service.shortDescription || '',
          category: service.category || '',
          price: typeof service.price === 'number' ? service.price : 0,
          status: service.status?.toLowerCase() || 'draft',
          createdDate: service.createdAt || new Date().toISOString(),
          duration: service.duration || '',
          clients: service._count?.serviceRequests || 0,
          icon: service.icon || '',
          displayOrder: typeof service.displayOrder === 'number' ? service.displayOrder : 0,
          isFeatured: Boolean(service.isFeatured),
          features: Array.isArray(service.features) ? service.features : [],
          ctaLabel: service.ctaLabel || '',
          ctaUrl: service.ctaUrl || ''
        }));
        setServices(mappedServices);
      } else {
        setError('No services data available');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // No sheet state to maintain anymore

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const loweredSearch = searchTerm.toLowerCase();
  const filteredServices = services.filter(service => {
    const searchableFields = [
      service.name,
      service.description,
      service.category,
      service.slug,
      service.shortDescription
    ];
    const matchesSearch = loweredSearch.length === 0 || searchableFields.some(field => field?.toLowerCase().includes(loweredSearch));
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
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-4 sm:p-6 lg:p-8">

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

      {/* Service Request Forms Preview removed (admin adds/edits services; clients submit requests) */}

      {/* Services Cards Grid */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخدمات</CardTitle>
          <CardDescription>إجمالي {filteredServices.length} خدمة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const IconComponent = resolveServiceIcon(service.icon);
              return (
                <Card key={service.id} className="border shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          {IconComponent ? <IconComponent className="h-5 w-5" /> : getCategoryIcon(service.category)}
                        </span>
                        <div className="text-right">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{service.name}</span>
                            <Badge variant="outline" className="text-[11px] font-normal">/{service.slug}</Badge>
                            {service.isFeatured ? (
                              <Badge variant="secondary" className="flex items-center gap-1 text-[11px]"><Star className="h-3 w-3" /> مميزة</Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {service.shortDescription || service.description}
                          </div>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>السعر</span>
                      <span className="font-bold">{formatEGPSimple(service.price || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {service.clients || 0} عميل</span>
                      <span>المدة: {service.duration || '-'}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleViewService(service)}
                        title="عرض تفاصيل الخدمة"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => handleEditService(service)}
                        title="تعديل الخدمة"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {service.status !== 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${service.status === 'active' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                          onClick={() => handleToggleServiceStatus(service)}
                          title={service.status === 'active' ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                        >
                          {service.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDeleteService(service)}
                        title="حذف الخدمة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-700 hover:bg-gray-50" title="فتح صفحة العميل">
                        <Link href={`/client/services/${service.slug}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
    </div>
  );
}
