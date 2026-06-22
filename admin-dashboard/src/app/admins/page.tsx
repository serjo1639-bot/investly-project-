'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { usersApi } from '@/lib/api/users';
import { extractError, formatDate } from '@/lib/utils';
import { Shield, MoreVertical } from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  permissions: string[];
}

const ROLE_COLORS: Record<Admin['role'], { bg: string; text: string }> = {
  admin: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    usersApi.getAllUsers({ role: 'Admin', pageSize: 100 })
      .then((res) => {
        const mappedAdmins = res.data
          .filter((user) => user.role === 'admin')
          .map((user): Admin => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            role: 'admin',
            status: user.isActive === false || user.isBlocked ? 'inactive' : 'active',
            createdAt: user.createdAt ?? new Date(0).toISOString(),
            permissions: ['users', 'projects', 'investments', 'payments'],
          }));
        setAdmins(mappedAdmins);
      })
      .catch((err) => {
        setAdmins([]);
        setError(extractError(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Admin Users">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Admin Management</h1>
          <p className="text-sm text-text-muted mt-1">{admins.length} admin users</p>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            Unable to load live admin users: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <Card padding="sm">
            <p className="text-2xl font-bold text-primary">{admins.length}</p>
            <p className="text-xs text-text-muted">Admins</p>
          </Card>
          <Card padding="sm">
            <p className="text-2xl font-bold text-teal">{admins.filter(a => a.status === 'active').length}</p>
            <p className="text-xs text-text-muted">Active</p>
          </Card>
          <Card padding="sm">
            <p className="text-2xl font-bold text-danger">{admins.filter(a => a.status === 'inactive').length}</p>
            <p className="text-xs text-text-muted">Inactive</p>
          </Card>
        </div>

        <Card>
          <CardHeader title="All Admin Users" icon={<Shield size={18} />} />
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-text-muted p-3">Loading live admin users...</div>
            ) : admins.map((admin) => {
              const roleColor = ROLE_COLORS[admin.role];
              return (
                <div key={admin.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-background-dark/30 transition-colors border border-border-light">
                  <Avatar name={admin.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary text-sm">{admin.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor.bg} ${roleColor.text}`}>
                        {admin.role}
                      </span>
                      <StatusBadge status={admin.status} size="sm" />
                    </div>
                    <p className="text-xs text-text-muted">{admin.email}</p>
                    <p className="text-xs text-text-light mt-1">Joined: {formatDate(admin.createdAt)}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {admin.permissions.map((perm) => (
                        <span key={perm} className="text-[10px] px-1.5 py-0.5 bg-primary-light text-primary rounded font-medium capitalize">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background-dark transition-colors" aria-label="Admin actions">
                    <MoreVertical size={16} />
                  </button>
                </div>
              );
            })}
            {!loading && admins.length === 0 && (
              <div className="text-sm text-text-muted p-3">No admin users found in the database.</div>
            )}
          </div>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
