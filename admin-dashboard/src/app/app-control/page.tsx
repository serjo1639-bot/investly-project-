'use client';

/**
 * App Control — remote control panel for the mobile app.
 *
 * Everything here is persisted on the backend (`/api/app-settings`) and read by
 * the mobile app on launch, so changes take effect the next time a user opens
 * (or refreshes) the app — no redeploy needed.
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { appSettingsApi, AppSettings } from '@/lib/api/appSettings';
import { extractError } from '@/lib/utils';
import {
  Smartphone, Wrench, Megaphone, ToggleLeft, Save, Loader2, CheckCircle, AlertTriangle,
} from 'lucide-react';

// ── Reusable toggle switch ──────────────────────────────────────────────────────

function Toggle({ checked, onChange, danger = false }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  const onColor = danger ? 'bg-danger' : 'bg-primary';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${checked ? onColor : 'bg-border'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
      <div className="flex-shrink-0 pt-1">{children}</div>
    </div>
  );
}

export default function AppControlPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    appSettingsApi.get()
      .then(setSettings)
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSavedAt('');
    try {
      const updated = await appSettingsApi.update({
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessageAr: settings.maintenanceMessageAr,
        maintenanceMessageEn: settings.maintenanceMessageEn,
        announcementActive: settings.announcementActive,
        announcementAr: settings.announcementAr,
        announcementEn: settings.announcementEn,
        allowRegistration: settings.allowRegistration,
        allowInvestments: settings.allowInvestments,
        minSupportedVersion: settings.minSupportedVersion,
      });
      setSettings(updated);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(extractError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="App Control">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Mobile App Control</h1>
            <p className="text-sm text-text-muted mt-1">
              Remotely control the mobile app. Changes apply the next time a user opens the app.
            </p>
          </div>
          <Button icon={saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} onClick={handleSave} loading={saving} disabled={loading || !settings}>
            Save Changes
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {savedAt && (
          <div className="mb-4 bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success flex items-center gap-2">
            <CheckCircle size={16} /> Saved at {savedAt}. The mobile app will pick this up on next launch.
          </div>
        )}

        {loading || !settings ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-shimmer rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── Maintenance ────────────────────────────────────────────────── */}
            <Card>
              <CardHeader title="Maintenance Mode" subtitle="Block the app with a full-screen notice" icon={<Wrench size={18} />} />
              <div className="divide-y divide-border-light">
                <Row title="Enable maintenance mode" desc="When on, users see a blocking screen instead of the app.">
                  <Toggle checked={settings.maintenanceMode} onChange={(v) => set('maintenanceMode', v)} danger />
                </Row>
              </div>
              <div className="mt-3 space-y-3">
                <Input label="Message (English)" value={settings.maintenanceMessageEn} onChange={(e) => set('maintenanceMessageEn', e.target.value)} placeholder="We'll be back soon..." />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Message (Arabic)</label>
                  <input dir="rtl" value={settings.maintenanceMessageAr} onChange={(e) => set('maintenanceMessageAr', e.target.value)} placeholder="نعتذر، التطبيق قيد الصيانة..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
            </Card>

            {/* ── Announcement ───────────────────────────────────────────────── */}
            <Card>
              <CardHeader title="Announcement Banner" subtitle="Show a banner on the app home screen" icon={<Megaphone size={18} />} />
              <div className="divide-y divide-border-light">
                <Row title="Show announcement" desc="Displays a dismissible banner at the top of the home screen.">
                  <Toggle checked={settings.announcementActive} onChange={(v) => set('announcementActive', v)} />
                </Row>
              </div>
              <div className="mt-3 space-y-3">
                <Input label="Announcement (English)" value={settings.announcementEn} onChange={(e) => set('announcementEn', e.target.value)} placeholder="e.g. New projects added this week!" />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Announcement (Arabic)</label>
                  <input dir="rtl" value={settings.announcementAr} onChange={(e) => set('announcementAr', e.target.value)} placeholder="مثال: تمت إضافة مشاريع جديدة!" className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
            </Card>

            {/* ── Feature flags ──────────────────────────────────────────────── */}
            <Card>
              <CardHeader title="Feature Switches" subtitle="Turn app capabilities on or off" icon={<ToggleLeft size={18} />} />
              <div className="divide-y divide-border-light">
                <Row title="Allow new registrations" desc="When off, the sign-up screen is disabled in the app.">
                  <Toggle checked={settings.allowRegistration} onChange={(v) => set('allowRegistration', v)} />
                </Row>
                <Row title="Allow investments" desc="When off, users cannot place new investments.">
                  <Toggle checked={settings.allowInvestments} onChange={(v) => set('allowInvestments', v)} />
                </Row>
              </div>
            </Card>

            {/* ── Version ────────────────────────────────────────────────────── */}
            <Card>
              <CardHeader title="Minimum App Version" subtitle="Prompt users on older versions to update" icon={<Smartphone size={18} />} />
              <div className="mt-2">
                <Input label="Minimum supported version" value={settings.minSupportedVersion} onChange={(e) => set('minSupportedVersion', e.target.value)} placeholder="e.g. 1.2.0 (leave blank to disable)" />
                <p className="text-xs text-text-muted mt-2">
                  Apps reporting a lower version can be shown an update prompt. Leave blank to allow all versions.
                </p>
              </div>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
