'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { MobileMenuButton } from './Sidebar';
import { notificationsApi } from '@/lib/api/notifications';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  title?: string;
}

export function Header({ onMobileMenuOpen, title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch unread notification count on mount
  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border-light px-4 lg:px-6 flex items-center gap-4 sticky top-0 z-20">
      <MobileMenuButton onClick={onMobileMenuOpen} />

      {title && (
        <h1 className="text-base font-semibold text-text-primary hidden sm:block">{title}</h1>
      )}

      {/* Global search bar */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border-light text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell with unread badge */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-background-dark hover:text-text-primary transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          )}
        </Link>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-background-dark transition-colors"
          >
            {user && <Avatar name={user.name} size="sm" />}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</p>
              <p className="text-[10px] text-text-muted leading-tight">Administrator</p>
            </div>
            <ChevronDown size={14} className="text-text-muted hidden sm:block" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl border border-border-light shadow-lg z-20 py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-dark transition-colors"
                >
                  Profile & Settings
                </Link>
                <div className="border-t border-border-light my-1" />
                <button
                  onClick={() => { setShowProfile(false); logout(); }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
