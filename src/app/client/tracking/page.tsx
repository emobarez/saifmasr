"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface ServiceRequest {
  id: number;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  updatedAt: string;
}

export default function ClientTrackingPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/service-requests');
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">قيد الانتظار</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">جاري التنفيذ</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">مكتمل</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">تتبع الطلبات</h1>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">تتبع الطلبات</h1>
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">لا توجد طلبات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{request.title}</CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{request.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    استلام: {new Date(request.submittedAt).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    استعداد أمني: {request.type || 'غير محدد'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
