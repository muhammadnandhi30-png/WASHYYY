/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scale, CheckCircle2, RefreshCw, Zap, PlusCircle } from 'lucide-react';
import { ScaleStatus, Settings } from '../types.js';

interface WeightDisplayProps {
  scaleStatus: ScaleStatus;
  settings: Settings;
  onTare: () => void;
  onManualOrder: () => void;
}

export const WeightDisplay: React.FC<WeightDisplayProps> = ({
  scaleStatus,
  settings,
  onTare,
  onManualOrder,
}) => {
  const weight = scaleStatus.currentWeight || 0;
  const isStable = scaleStatus.isStable;
  const hargaPerKg = settings.harga_per_kg || 6000;
  const estimatedPrice = Math.round(weight * hargaPerKg);

  // Status visual
  let statusText = 'Timbangan Kosong';
  let statusBg = 'bg-slate-800 text-slate-400 border-slate-700';
  let badgePulse = false;

  if (weight >= 0.1) {
    if (isStable) {
      statusText = 'BERAT STABIL (Order Terbuat)';
      statusBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
      badgePulse = true;
    } else {
      statusText = 'Menimbang (Menstabilkan...)';
      statusBg = 'bg-amber-950/80 text-amber-300 border-amber-700/80 animate-pulse';
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 shadow-xl relative overflow-hidden">
      {/* Background visual watermarks */}
      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
        <Scale className="w-64 h-64 text-white" />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left: Huge Live Weight Digital Screen */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <Scale className="w-4 h-4" />
            <span>Timbangan Digital Real-Time (HX711)</span>
          </div>

          <div className="flex items-baseline space-x-3">
            <div className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
              {weight.toFixed(2)}
            </div>
            <span className="text-2xl font-semibold text-slate-400 font-mono">kg</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusBg}`}
            >
              {isStable && weight >= 0.1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <RefreshCw className={`w-3.5 h-3.5 ${weight >= 0.1 ? 'animate-spin' : ''}`} />
              )}
              <span>{statusText}</span>
            </span>

            <span className="text-xs text-slate-400">
              Perubahan &lt; 0.02 kg selama 2 detik memicu order otomatis
            </span>
          </div>
        </div>

        {/* Right: Quick Price Calculation & Actions */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 min-w-[240px]">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Tarif Reguler:</span>
              <span className="font-mono text-white">Rp {hargaPerKg.toLocaleString('id-ID')} / kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Estimasi Total:</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                Rp {estimatedPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTare}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Tare (Nol)</span>
            </button>

            <button
              onClick={onManualOrder}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Manual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
