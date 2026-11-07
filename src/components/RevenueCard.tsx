/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wallet } from 'lucide-react';
import { Order } from '../types.js';

interface RevenueCardProps {
  orders: Order[];
}

export const RevenueCard: React.FC<RevenueCardProps> = ({ orders }) => {
  // Hitung pemasukan lunas dan belum bayar
  const totalLunas = orders
    .filter((o) => o.status_pembayaran === 'Lunas')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0);

  const totalBelumBayar = orders
    .filter((o) => o.status_pembayaran === 'Belum Bayar')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0);

  const totalPemasukan = totalLunas + totalBelumBayar;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Pemasukan</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Rp {totalPemasukan.toLocaleString('id-ID')}
        </div>

        <p className="text-[11px] text-slate-500 mt-1">
          Minggu ini &bull; {todayStr}
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

