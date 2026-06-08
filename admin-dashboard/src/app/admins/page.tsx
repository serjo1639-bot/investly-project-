'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { Shield, UserPlus, MoreVertical } from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
}

const MOCK_ADMINS: Admin[] = [
  {
    id: 'a1', name: 'Super Admin', email: 'super@investly.ly', role: 'super_admin', status: 'active',
    lastLogin: new Date(Date.now() - 30 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    permissions: ['all'],
  },
  {
    id: 'a2', name: 'Ahmad Al-Admin', email: 'ahmad.admin@investly.ly', role: 'admin', status: 'active',
    lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    permissions: ['users', 'projects', 'investments'],
  },
  {
    id: 'a3', name: 'Sara Moderator', email: 'sara.mod@investly.ly', role: 'moderator', status: 'active',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    permissions: ['projects'],
  },
  {
    id: 'a4', name: 'Khaled Manager', email: 'khaled@investly.ly', role: 'admin', status: 'inactive',
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    permissions: ['users', 'payments'],
  },
];

const ROLE_COLORS: Record<Admin['role'], { bg: string; text: string }> = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  admin: { bg: 'bg-blue-100', text: 'text-blue-700' },
  moderator: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

const ALL_PERMISSIONS = [
  { id: 'users', label: 'User Management' },
  { id: 'projects', label: 'Project Management' },
  { id: 'investments', label: 'Investment Management' },
  { id: 'payments', label: 'Payment Management' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'System Settings' },
  { id: 'admins', label: 'Admin Management' },
];

export default function AdminsPage() {
  const [admins] = useState<Admin[]>(MOCK_ADMINS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'moderator', permissions: ['projects'] });

  return (
    <ProtectedRoute>
      <DashboardLayout title="Admin Users">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Admin Management</h1>
              <p className="text-sm text-text-muted mt-1">{admins.length} admin users</p>
            </div>
            <Button icon={<UserPlus size={16} />} onClick={() => setShowInviteModal(true)}>
              Invite Admin
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Super Admins', count: admins.filter(a => a.role === 'super_admin').length, color: 'text-purple-600' },
            { label: 'Admins', count: admins.filter(a => a.role === 'admin').length, color: 'text-primary' },
            { label: 'Moderators', count: admins.filter(a => a.role === 'moderator').length, color: 'text-teal' },
          ].map((s) => (
            <Card key={s.label} padding="sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader title="All Admin Users" icon={<Shield size={18} />} />
          <div className="space-y-3">
            {admins.map((admin) => {
              const roleColor = ROLE_COLORS[admin.role];
              return (
                <div key={admin.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-background-dark/30 transition-colors border border-border-light">
                  <Avatar name={admin.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary text-sm">{admin.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor.bg} ${roleColor.text}`}>
                        {admin.role.replace('_', ' ')}
                      </span>
                      <StatusBadge status={admin.status} size="sm" />
                    </div>
                    <p className="text-xs text-text-muted">{admin.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-text-light">
                        Joined: {formatDate(admin.createdAt)}
                      </p>
                      {admin.lastLogin && (
                        <p className="text-xs text-text-light">
                          Last login: {formatDate(admin.lastLogin)}
                        </p>
                      )}
                    </div>
                    {admin.permissions[0] !== 'all' && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {admin.permissions.map((perm) => (
                          <span key={perm} className="text-[10px] px-1.5 py-0.5 bg-primary-light text-primary rounded font-medium capitalize">
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background-dark transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Admin User"
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button icon={<UserPlus size={14} />}>Send Invitation</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admin's full name" />
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@investly.ly" />
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: 'moderator', label: 'Moderator' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={form.permissions.includes(perm.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-text-primary">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
