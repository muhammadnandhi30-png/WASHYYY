/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Order } from '../types.js';

interface WeeklyReportCardProps {
  orders: Order[];
}

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ orders }) => {
  const [periode, setPeriode] = useState<'minggu' | 'bulan'>('minggu');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const limit =
      periode === 'minggu'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
        : new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => new Date(o.created_at).getTime() >= limit);
  }, [orders, periode]);

  const countMenunggu = filteredOrders.filter((o) => o.status_cucian === 'Menunggu').length;
  const countDicuci = filteredOrders.filter((o) => o.status_cucian === 'Dicuci').length;
  const countSelesai = filteredOrders.filter((o) => o.status_cucian === 'Selesai').length;
  const countDiambil = filteredOrders.filter((o) => o.status_cucian === 'Diambil').length;

  const items = [
    { label: 'Received (Menunggu)', count: countMenunggu, dot: 'bg-amber-500' },
    { label: 'On Progress (Dicuci)', count: countDicuci, dot: 'bg-indigo-500' },
    { label: 'Completed (Selesai)', count: countSelesai, dot: 'bg-emerald-500' },
    { label: 'Diambil (Selesai)', count: countDiambil, dot: 'bg-slate-400' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {periode === 'minggu' ? 'Laporan Mingguan' : 'Laporan Bulanan'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Switcher Mingguan / Bulanan */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg mb-3 text-[11px] font-medium">
          <button
            onClick={() => setPeriode('minggu')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'minggu' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPeriode('bulan')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'bulan' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Bulan Ini
          </button>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
          <span className="font-semibold text-slate-700">Total Order</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{filteredOrders.length}</span>
        </div>
      </div>

      <div className="space-y-2 mt-2 pt-1 text-xs">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between text-slate-600">
            <div className="flex items-center space-x-2">
              <span className={`h-2 w-2 rounded-full ${it.dot}`} />
              <span className="text-slate-700 font-medium">{it.label}</span>
            </div>
            <span className="font-mono font-semibold text-slate-900">{it.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

