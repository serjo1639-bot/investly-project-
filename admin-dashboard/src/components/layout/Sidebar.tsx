'use client';

/**
 * Sidebar navigation for the admin dashboard.
 *
 * Behaviours:
 *  - Desktop: always visible; can be collapsed to icon-only mode via the toggle button.
 *  - Mobile:  hidden by default; slides in as an overlay when isMobileOpen is true.
 *
 * NAV_ITEMS defines every link in the sidebar grouped into sections.
 * To add a new page, just add an entry to the correct section in NAV_ITEMS.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  TrendingUp,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Menu,
  X,
  Clock,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/activity', icon: Activity, label: 'Activity Logs' },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/users', icon: Users, label: 'Users' },
      { href: '/projects', icon: FolderOpen, label: 'Projects' },
      { href: '/projects/pending', icon: Clock, label: 'Pending Review' },
      { href: '/investments', icon: TrendingUp, label: 'Investments' },
      { href: '/payments', icon: CreditCard, label: 'Payments' },
      { href: '/wallets', icon: Wallet, label: 'Wallets' },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/notifications', icon: Bell, label: 'Notifications' },
      { href: '/admins', icon: Shield, label: 'Admin Users' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center px-5 py-5 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">Investly</span>
              <p className="text-white/50 text-[10px] -mt-0.5">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">I</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-6 h-6 items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 group
                        ${active
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon
                        size={18}
                        className={`flex-shrink-0 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        {user && (
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar name={user.name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-[11px] text-white/40 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className={`
            flex items-center gap-2.5 w-full px-3 py-2 rounded-xl
            text-sm text-white/60 hover:text-white hover:bg-white/10
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen z-30
          bg-sidebar transition-all duration-300
          ${collapsed ? 'w-[70px]' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative w-64 h-full bg-sidebar flex flex-col">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-background-dark transition-colors"
    >
      <Menu size={20} />
    </button>
  );
}
