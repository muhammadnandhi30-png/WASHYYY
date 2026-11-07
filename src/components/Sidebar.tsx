/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  WashingMachine,
  LayoutDashboard,
  ClipboardList,
  Cpu,
  MessageSquare,
  Settings as SettingsIcon,
  FileCode2,
  UserCheck,
  RefreshCw,
  Database,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { ScaleStatus, Settings } from '../types.js';

interface SidebarProps {
  settings: Settings;
  scaleStatus: ScaleStatus;
  ordersCount: number;
  onTare: () => void;
  onOpenSimulator: () => void;
  onOpenLogs: () => void;
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  cashierName: string;
  onSwitchCashier: () => void;
  isUsingSupabase: boolean;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  scaleStatus,
  ordersCount,
  onTare,
  onOpenSimulator,
  onOpenLogs,
  onOpenSettings,
  onOpenDocs,
  cashierName,
  onSwitchCashier,
  isUsingSupabase,
  activeNav,
  setActiveNav,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard POS',
      icon: LayoutDashboard,
      badge: `${scaleStatus.currentWeight.toFixed(2)} kg`,
      badgeStyle: 'bg-sky-100 text-sky-800 border-sky-200',
      action: () => {
        setActiveNav('dashboard');
        onCloseMobile();
      },
    },
    {
      id: 'orders',
      label: 'Orderan',
      icon: ClipboardList,
      badge: ordersCount.toString(),
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      action: () => {
        setActiveNav('orders');
        onCloseMobile();
      },
    },
    {
      id: 'simulator',
      label: 'Simulator IoT',
      icon: Cpu,
      action: () => {
        onOpenSimulator();
        onCloseMobile();
      },
    },
    {
      id: 'logs',
      label: 'Notifikasi WA',
      icon: MessageSquare,
      action: () => {
        onOpenLogs();
        onCloseMobile();
      },
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: SettingsIcon,
      action: () => {
        onOpenSettings();
        onCloseMobile();
      },
    },
    {
      id: 'docs',
      label: 'Dokumentasi',
      icon: FileCode2,
      action: () => {
        onOpenDocs();
        onCloseMobile();
      },
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen lg:shrink-0`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <WashingMachine className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-slate-900 truncate">
                  {settings.nama_laundry || 'Smart Laundry'}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">Admin Laundry</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scale Real-time Mini Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    scaleStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-[11px] font-medium text-slate-600">
                  {scaleStatus.online ? 'ESP32 Online' : 'ESP32 Offline'}
                </span>
              </div>

              <button
                onClick={onTare}
                title="Reset timbangan ke 0.00 kg"
                className="text-[11px] font-medium text-slate-600 hover:text-sky-700 flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>Tare</span>
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Beban Real-time</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {scaleStatus.currentWeight.toFixed(2)}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">kg</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeStyle
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Cashier Profile & Database */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{cashierName}</p>
                <p className="text-[10px] text-slate-500">Shift Aktif</p>
              </div>
            </div>

            <button
              onClick={onSwitchCashier}
              title="Ganti shift kasir"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Ganti shift kasir"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Database className="w-3 h-3 text-slate-400" />
              <span>Database:</span>
            </span>
            <span
              className={`font-semibold px-1.5 py-0.2 rounded border ${
                isUsingSupabase
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isUsingSupabase ? 'Supabase' : 'In-Memory'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

