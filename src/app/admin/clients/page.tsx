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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
  lastActivity?: string;
  totalServices?: number;
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const data = await response.json();
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">معلق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handler functions for table actions
  const handleViewClient = (client: Client) => {
    // Navigate to client detail page
    router.push(`/admin/clients/${client.id}`);
  };

  const handleEditClient = (client: Client) => {
    // Navigate to client edit page
    router.push(`/admin/clients/${client.id}/edit`);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${client.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "تم حذف العميل",
          description: `تم حذف العميل "${client.name}" بنجاح`,
        });
        
        // Remove client from local state
        setClients(clients.filter(c => c.id !== client.id));
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "خطأ في الحذف",
        description: "تعذر حذف العميل. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
  {/* Header */}
  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4 flex-wrap">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold flex items-center">
            <Users className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 mr-2 xs:mr-3 text-blue-600" />
            إدارة العملاء
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة قاعدة عملاء الشركة ومعلوماتهم
          </p>
        </div>
  <Button asChild className="w-full xs:w-auto order-first xs:order-none">
          <Link href="/admin/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">إضافة عميل جديد</span>
            <span className="xs:hidden">إضافة</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Loading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 xs:p-4 sm:p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Loading Table */}
          <Card>
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-300 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-3 xs:p-4 sm:p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">العملاء النشطون</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'ACTIVE').length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">العملاء المعلقون</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'INACTIVE').length}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط الخدمات</p>
                <p className="text-2xl font-bold">{clients.length > 0 ? Math.round(clients.reduce((acc, c) => acc + (c.totalServices || 0), 0) / clients.length) : 0}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline">
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
          <CardDescription>
            {filteredClients.length} من أصل {clients.length} عميل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enhanced scrollable table container */}
          <div className="w-full overflow-auto border rounded-lg force-scrollbar max-h-[75vh] min-h-[400px]">
            <div className="min-w-[1200px]">
              <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px]">معلومات العميل</TableHead>
                <TableHead className="min-w-[150px] hidden sm:table-cell">الشركة</TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell">الموقع</TableHead>
                <TableHead className="min-w-[100px]">الحالة</TableHead>
                <TableHead className="min-w-[80px]">الخدمات</TableHead>
                <TableHead className="min-w-[120px] hidden lg:table-cell">تاريخ الانضمام</TableHead>
                <TableHead className="min-w-[120px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="min-w-[250px]">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </div>
                      {/* Show company and location on mobile when columns are hidden */}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">
                        {client.company && (
                          <div className="flex items-center">
                            <span className="font-medium">شركة:</span> {client.company}
                          </div>
                        )}
                        {client.location && (
                          <div className="flex items-center mt-0.5">
                            <MapPin className="h-3 w-3 mr-1" />
                            {client.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px] hidden sm:table-cell">{client.company}</TableCell>
                  <TableCell className="min-w-[120px] hidden md:table-cell">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {client.location}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px]">{getStatusBadge(client.status)}</TableCell>
                  <TableCell className="min-w-[80px]">
                    <Badge variant="outline" className="text-xs">{client.totalServices} خدمة</Badge>
                  </TableCell>
                  <TableCell className="min-w-[120px] hidden lg:table-cell">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(client.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleViewClient(client)}
                        title="عرض تفاصيل العميل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => handleEditClient(client)}
                        title="تعديل بيانات العميل"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDeleteClient(client)}
                        title="حذف العميل"
                      >
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
      </>
      )}
      </div>
    </div>
  );
}