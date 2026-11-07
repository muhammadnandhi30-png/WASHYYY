/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, RotateCcw, Menu } from 'lucide-react';
import { ScaleStatus } from '../types.js';

interface DashboardHeaderProps {
  scaleStatus: ScaleStatus;
  onTare: () => void;
  onNewOrder: () => void;
  onOpenMobileSidebar: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  scaleStatus,
  onTare,
  onNewOrder,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            Sistem Kasir & Otomasi Penimbangan Laundry
          </p>
        </div>
      </div>

      {/* Right Top Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Live Weight Indicator Pill */}
        <div className="hidden xs:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span
            className={`h-2 w-2 rounded-full ${
              scaleStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="font-mono text-xs font-bold text-slate-800">
            {scaleStatus.currentWeight.toFixed(2)} kg
          </span>
        </div>

        {/* Tare Button */}
        <button
          onClick={onTare}
          title="Reset timbangan ke 0.00 kg"
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Tare</span>
        </button>

        {/* + Order Baru CTA */}
        <button
          onClick={onNewOrder}
          title="Buat pesanan baru"
          className="min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Order Baru</span>
        </button>
      </div>
    </header>
  );
};

