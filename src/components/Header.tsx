/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  WashingMachine,
  Wifi,
  WifiOff,
  Cpu,
  MessageSquare,
  Settings as SettingsIcon,
  FileCode2,
  UserCheck,
  RotateCcw,
  Menu,
  X,
} from 'lucide-react';
import { ScaleStatus, Settings } from '../types.js';

interface HeaderProps {
  scaleStatus: ScaleStatus;
  settings: Settings;
  onOpenSimulator: () => void;
  onOpenLogs: () => void;
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  onTare: () => void;
  cashierName: string;
  onSwitchCashier: () => void;
  isUsingSupabase: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  scaleStatus,
  settings,
  onOpenSimulator,
  onOpenLogs,
  onOpenSettings,
  onOpenDocs,
  onTare,
  cashierName,
  onSwitchCashier,
  isUsingSupabase,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <WashingMachine className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-slate-900 truncate">
                  {settings.nama_laundry || 'Smart Laundry'}
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden xs:block">
                Sistem Kasir & Timbangan Digital ESP32
              </p>
            </div>
          </div>

          {/* Scale Status Badge & Quick Tare (Desktop & Tablet) */}
          <div className="hidden lg:flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  scaleStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <div className="flex items-center space-x-1.5 text-xs">
                {scaleStatus.online ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">{scaleStatus.deviceId} Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-800 font-medium">Timbangan Standby</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            <button
              onClick={onTare}
              title="Reset timbangan ke 0.00 kg"
              className="text-xs flex items-center space-x-1 text-slate-600 hover:text-sky-700 transition-colors px-2 py-1 rounded hover:bg-slate-200/60 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tare (Nol)</span>
            </button>
          </div>

          {/* Action Tools & User Profile */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Quick Tare Button for Mobile/Tablet */}
            <button
              onClick={onTare}
              title="Reset timbangan ke 0.00 kg"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Tare timbangan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* IoT Simulator Trigger Button */}
            <button
              onClick={onOpenSimulator}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
            >
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>Simulator IoT</span>
            </button>

            {/* Notification Logs */}
            <button
              onClick={onOpenLogs}
              title="Riwayat Pesan WhatsApp via Fonnte"
              className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              aria-label="Riwayat Notifikasi"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Docs & Firmware */}
            <button
              onClick={onOpenDocs}
              title="Skema Database & Firmware ESP32"
              className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              aria-label="Dokumentasi Teknis"
            >
              <FileCode2 className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Pengaturan Harga & Sistem"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 sm:border-transparent sm:hover:border-slate-200"
              aria-label="Pengaturan Sistem"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Cashier profile switcher */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={onSwitchCashier}
              title="Klik untuk beralih shift kasir"
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 min-h-[44px] rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors border border-slate-200"
            >
              <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white text-[10px] font-bold">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium max-w-[85px] sm:max-w-[110px] truncate">{cashierName}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Menu navigasi cepat"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-bar: Scale Connectivity Status */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                scaleStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-600">
              {scaleStatus.online ? (
                <span className="text-emerald-700 font-medium">Timbangan Terhubung ({scaleStatus.deviceId})</span>
              ) : (
                <span className="text-amber-700 font-medium">Timbangan Standby</span>
              )}
            </span>
          </div>

          <button
            onClick={onTare}
            className="text-sky-700 hover:text-sky-800 font-medium text-xs flex items-center space-x-1 px-2 py-1 rounded bg-sky-50 border border-sky-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tare</span>
          </button>
        </div>

        {/* Mobile Dropdown Menu for Quick Tools */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenSimulator();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 p-3 min-h-[44px] rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
            >
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>Simulator IoT</span>
            </button>

            <button
              onClick={() => {
                onOpenLogs();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 p-3 min-h-[44px] rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
            >
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span>Riwayat WhatsApp</span>
            </button>

            <button
              onClick={() => {
                onOpenDocs();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 p-3 min-h-[44px] rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 col-span-2"
            >
              <FileCode2 className="w-4 h-4 text-slate-600" />
              <span>Dokumentasi & Firmware ESP32</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
