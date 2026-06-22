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
import { User, Shield, Save } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateProfile({ firstName, lastName });
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
          <p className="text-sm text-text-muted mt-1">Manage your admin account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <Card padding="sm">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background-dark hover:text-text-primary'}`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {success && <div className="mb-4 bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success">{success}</div>}
            {error && <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>}

            {activeTab === 'profile' && (
              <Card>
                <CardHeader title="Profile Information" subtitle="Update fields supported by the backend" icon={<User size={18} />} />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-light">
                  {user && <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" />}
                  <div>
                    <h3 className="font-semibold text-text-primary">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-sm text-text-muted capitalize">{user?.role}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" />
                    <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} loading={saving} icon={<Save size={14} />}>Save Changes</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader title="Security Settings" subtitle="Manage password and authentication" icon={<Shield size={18} />} />
                <div className="space-y-4">
                  <Input label="Current Password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Current password" />
                  <Input label="New Password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min. 8 characters" />
                  <Input label="Confirm New Password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" />
                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword} loading={saving} icon={<Save size={14} />}>Update Password</Button>
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
