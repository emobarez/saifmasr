"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

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
        <p>لا توجد طلبات</p>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">{request.title}</h3>
              <p>{request.description}</p>
              <p>الحالة: {request.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
