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
        
        // Fallback to mock data
        setClients([
          {
            id: "1",
            name: "أحمد محمد العلي",
            email: "ahmed@company.com",
            phone: "+20101234567",
            company: "شركة الأمان التجارية",
            location: "الرياض",
            status: 'ACTIVE',
            createdAt: "2024-01-15",
            lastActivity: "2024-12-01",
            totalServices: 3
          }
        ]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            إدارة العملاء
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة قاعدة عملاء الشركة ومعلوماتهم
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            إضافة عميل جديد
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Loading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Loading Table */}
          <Card>
            <CardContent className="p-6">
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
          <CardContent className="p-6 text-center">
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
          {/* Mobile horizontal scroll container */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px] md:min-w-0">
              <Table>
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
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
  );
}