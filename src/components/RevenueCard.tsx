/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Wallet, Calendar } from 'lucide-react';
import { Order } from '../types.js';

interface RevenueCardProps {
  orders: Order[];
}

export type PeriodeRekap = 'hari' | 'minggu' | 'bulan' | 'semua';

export const RevenueCard: React.FC<RevenueCardProps> = ({ orders }) => {
  const [periode, setPeriode] = useState<PeriodeRekap>('minggu');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // Minggu ini (dimulai dari hari Senin atau 7 hari terakhir)
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      const time = new Date(o.created_at).getTime();
      if (periode === 'hari') return time >= startOfDay;
      if (periode === 'minggu') return time >= startOfWeek;
      if (periode === 'bulan') return time >= startOfMonth;
      return true;
    });
  }, [orders, periode]);

  // Hitung pemasukan lunas dan belum bayar
  const totalLunas = filteredOrders
    .filter((o) => o.status_pembayaran === 'Lunas')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0);

  const totalBelumBayar = filteredOrders
    .filter((o) => o.status_pembayaran === 'Belum Bayar')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0);

  const totalPemasukan = totalLunas + totalBelumBayar;

  const getPeriodeLabel = () => {
    if (periode === 'hari') return 'Hari Ini';
    if (periode === 'minggu') return 'Minggu Ini (7 Hari)';
    if (periode === 'bulan') return 'Bulan Ini';
    return 'Semua Waktu';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Rekap Pemasukan</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* Periode Switcher Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg mb-3 text-[11px] font-medium">
          <button
            onClick={() => setPeriode('hari')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'hari' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriode('minggu')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'minggu' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Minggu
          </button>
          <button
            onClick={() => setPeriode('bulan')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'bulan' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Bulan
          </button>
          <button
            onClick={() => setPeriode('semua')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              periode === 'semua' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Rp {totalPemasukan.toLocaleString('id-ID')}
        </div>

        <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{getPeriodeLabel()} &bull; {filteredOrders.length} order</span>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 block">
            Telah Lunas
          </span>
          <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
            Rp {totalLunas.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100">
          <span className="text-[10px] font-bold uppercase tracking-wide text-rose-800 block">
            Belum Bayar
          </span>
          <span className="font-mono font-bold text-rose-700 text-xs sm:text-sm">
            Rp {totalBelumBayar.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
};

