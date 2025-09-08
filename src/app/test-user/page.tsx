"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestUserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user');
      const data = await response.json();
      setUsers(data.users || []);
      setMessage(`Found ${data.count || 0} users`);
    } catch (error) {
      setMessage('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user', { method: 'POST' });
      const data = await response.json();
      setMessage(data.message || 'Admin user created');
      fetchUsers(); // Refresh users list
    } catch (error) {
      setMessage('Error creating admin user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 lg:px-8 py-8 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Users'}
            </Button>
            <Button onClick={createAdminUser} disabled={loading} variant="outline">
              {loading ? 'Creating...' : 'Create Admin User'}
            </Button>
          </div>
          
          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              {message}
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Users in Database:</h3>
              {users.map((user, index) => (
                <div key={index} className="p-3 bg-gray-50 border rounded">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Name:</strong> {user.name}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                  <div><strong>Status:</strong> {user.status}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold">Test Login Credentials:</h3>
            <p><strong>Email:</strong> admin@saifmasr.com</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}