'use client';

/**
 * NewProjectModal — create-project form shown in a modal from the Projects page.
 *
 * Collects the core bilingual fields the backend expects and submits via
 * `projectsApi.createProject`. Arabic/English fall back to each other so a
 * single-language entry still produces a valid bilingual record. On success it
 * hands the created project back to the parent (to refresh the list).
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import { extractError } from '@/lib/utils';

// Platform policy: Technology is the only project category.
const CATEGORY_OPTIONS = [
  { value: 'tech', label: 'Technology' },
];

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const EMPTY_FORM = {
  titleEn: '',
  titleAr: '',
  category: 'tech',
  cityEn: '',
  goal: '',
  minInvestment: '',
  image: '',
  descriptionEn: '',
};

export function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const titleEn = form.titleEn.trim();
    const goal = Number(form.goal);

    if (!titleEn) return setError('Project title (English) is required.');
    if (!form.category) return setError('Please choose a category.');
    if (!goal || goal <= 0) return setError('Enter a funding goal greater than 0.');

    setLoading(true);
    setError('');
    try {
      const payload: Partial<Project> = {
        titleEn,
        titleAr: form.titleAr.trim() || titleEn,
        descriptionEn: form.descriptionEn.trim() || undefined,
        descriptionAr: form.descriptionEn.trim() || undefined,
        category: form.category as Project['category'],
        cityEn: form.cityEn.trim() || undefined,
        cityAr: form.cityEn.trim() || undefined,
        goal,
        minInvestment: form.minInvestment ? Number(form.minInvestment) : 0,
        image: form.image.trim() || undefined,
      };
      const created = await projectsApi.createProject(payload);
      reset();
      onCreated(created);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Project"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Project
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Title (English) *"
          value={form.titleEn}
          onChange={set('titleEn')}
          placeholder="Solar Farm Phase II"
        />
        <Input
          label="Title (Arabic)"
          value={form.titleAr}
          onChange={set('titleAr')}
          placeholder="مزرعة الطاقة الشمسية"
          dir="rtl"
        />
        <Select
          label="Category *"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={set('category')}
        />
        <Input
          label="City"
          value={form.cityEn}
          onChange={set('cityEn')}
          placeholder="Tripoli"
        />
        <Input
          label="Funding goal (LYD) *"
          type="number"
          min={0}
          value={form.goal}
          onChange={set('goal')}
          placeholder="100000"
        />
        <Input
          label="Minimum investment (LYD)"
          type="number"
          min={0}
          value={form.minInvestment}
          onChange={set('minInvestment')}
          placeholder="500"
        />
        <div className="sm:col-span-2">
          <Input
            label="Cover image URL"
            value={form.image}
            onChange={set('image')}
            placeholder="https://…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
          <textarea
            value={form.descriptionEn}
            onChange={set('descriptionEn')}
            rows={4}
            placeholder="What is this project about?"
            className="
              w-full rounded-xl border border-border bg-surface text-text-primary text-sm
              placeholder:text-text-muted outline-none transition-all duration-200 resize-none
              focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5
            "
          />
        </div>
      </div>
    </Modal>
  );
}
