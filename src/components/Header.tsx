/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <WashingMachine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                  {settings.nama_laundry || 'Smart Laundry'}
                </h1>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  IoT POS
                </span>
              </div>
              <p className="text-xs text-slate-400">Sistem Kasir & Timbangan Digital ESP32</p>
            </div>
          </div>

          {/* Scale Status Badge & Quick Tare */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2">
              {scaleStatus.online ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="flex items-center space-x-1 text-xs">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">{scaleStatus.deviceId} Online</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <div className="flex items-center space-x-1 text-xs">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 font-medium">Timbangan Standby</span>
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-slate-700"></div>

            <button
              onClick={onTare}
              title="Reset timbangan ke 0.00 kg"
              className="text-xs flex items-center space-x-1 text-slate-300 hover:text-cyan-400 transition-colors px-2 py-0.5 rounded hover:bg-slate-700/50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tare (Nol)</span>
            </button>
          </div>

          {/* Action Tools & User Profile */}
          <div className="flex items-center space-x-2">
            {/* IoT Simulator Trigger Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition-colors"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Simulator IoT</span>
            </button>

            {/* Notification Logs */}
            <button
              onClick={onOpenLogs}
              title="Riwayat Pesan WhatsApp via Fonnte"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Docs & Firmware */}
            <button
              onClick={onOpenDocs}
              title="Skema Database & Firmware ESP32"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileCode2 className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Pengaturan Harga & Sistem"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Cashier profile */}
            <div className="h-6 w-px bg-slate-800 mx-1"></div>
            <button
              onClick={onSwitchCashier}
              className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition-colors border border-slate-700/50"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium max-w-[100px] truncate">{cashierName}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
