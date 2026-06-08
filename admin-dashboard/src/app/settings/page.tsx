'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { extractError } from '@/lib/utils';
import { User, Settings, Shield, Bell, Save } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'system', label: 'System', icon: Settings },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  // Security form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateProfile({ name, email, bio });
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.changePassword(currentPwd, newPwd);
      setSuccess('Password changed successfully.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account and system preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar tabs */}
          <div className="lg:col-span-1">
            <Card padding="sm">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-background-dark hover:text-text-primary'
                      }
                    `}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {success && (
              <div className="mb-4 bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {activeTab === 'profile' && (
              <Card>
                <CardHeader title="Profile Information" subtitle="Update your personal details" icon={<User size={18} />} />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-light">
                  {user && <Avatar name={user.name} size="xl" />}
                  <div>
                    <h3 className="font-semibold text-text-primary">{user?.name}</h3>
                    <p className="text-sm text-text-muted capitalize">{user?.role}</p>
                    <button className="mt-2 text-xs text-primary hover:underline">Change photo</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="A brief description about yourself..."
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} loading={saving} icon={<Save size={14} />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader title="Security Settings" subtitle="Manage password and authentication" icon={<Shield size={18} />} />
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword} loading={saving} icon={<Save size={14} />}>
                      Update Password
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader title="Notification Preferences" subtitle="Control what you get notified about" icon={<Bell size={18} />} />
                <div className="space-y-4">
                  {[
                    { id: 'new-investments', label: 'New Investments', desc: 'When a new investment is made' },
                    { id: 'new-projects', label: 'New Project Submissions', desc: 'When a project is submitted for review' },
                    { id: 'new-users', label: 'New User Registrations', desc: 'When a new user registers' },
                    { id: 'payment-failures', label: 'Payment Failures', desc: 'When a payment fails' },
                    { id: 'system-alerts', label: 'System Alerts', desc: 'Critical system notifications' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between py-3 border-b border-border-light last:border-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors" />
                        <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button icon={<Save size={14} />}>Save Preferences</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card>
                <CardHeader title="System Configuration" subtitle="Platform-wide settings" icon={<Settings size={18} />} />
                <div className="space-y-4">
                  <Input
                    label="API Base URL"
                    defaultValue={process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api'}
                    hint="The backend API endpoint"
                  />
                  <Input label="Platform Name" defaultValue="Investly" />
                  <Input label="Support Email" defaultValue="support@investly.ly" type="email" />
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Default Currency</label>
                    <p className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary">
                      LYD — Libyan Dinar
                    </p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button icon={<Save size={14} />}>Save System Settings</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
