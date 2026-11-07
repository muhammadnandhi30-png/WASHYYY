/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scale, CheckCircle2, RefreshCw, PlusCircle, RotateCcw } from 'lucide-react';
import { ScaleStatus, Settings } from '../types.js';

interface WeightDisplayProps {
  scaleStatus: ScaleStatus;
  settings: Settings;
  selectedService: {
    name: string;
    rate: number;
  };
  onTare: () => void;
  onManualOrder: () => void;
}

export const WeightDisplay: React.FC<WeightDisplayProps> = ({
  scaleStatus,
  settings,
  selectedService,
  onTare,
  onManualOrder,
}) => {
  const weight = scaleStatus.currentWeight || 0;
  const isStable = scaleStatus.isStable;
  const rate = selectedService?.rate || settings.harga_per_kg || 6000;
  const estimatedPrice = Math.round(weight * rate);

  // Status visual
  let statusText = 'Timbangan Kosong';
  let statusStyle = 'bg-slate-100 text-slate-600 border-slate-200';

  if (weight >= 0.1) {
    if (isStable) {
      statusText = 'Berat Stabil (Order Terbuat)';
      statusStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else {
      statusText = 'Menimbang... (Menunggu Stabil 2 dtk)';
      statusStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
      <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 tracking-wide uppercase mb-3">
        <Scale className="w-4 h-4 text-sky-600" />
        <span>Timbangan Digital Real-Time (ESP32 + HX711)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Sub-Column: Giant Digital Weight & Status */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div className="flex items-baseline space-x-2">
            <div className="font-mono text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              {weight.toFixed(2)}
            </div>
            <span className="text-xl sm:text-2xl font-semibold text-slate-500 font-mono">kg</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle}`}
              >
                {isStable && weight >= 0.1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      weight >= 0.1 && !isStable ? 'animate-spin text-amber-600' : 'text-slate-400'
                    }`}
                  />
                )}
                <span>{statusText}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Auto-order aktif saat beban stabil &ge; 0.1 kg
            </p>
          </div>
        </div>

        {/* Right Sub-Column: Layanan Aktif, Estimasi Total & Action Buttons */}
        <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Layanan Aktif:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
              {selectedService?.name || 'Pakaian'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-col justify-between">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">Estimasi Total:</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                Rp {estimatedPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 text-right mt-0.5">
              {weight.toFixed(2)} kg &times; Rp {rate.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
            <button
              onClick={onTare}
              title="Reset timbangan ke 0.00 kg"
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 flex items-center justify-center space-x-1.5 active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Nol-kan (Tare)</span>
            </button>

            <button
              onClick={onManualOrder}
              title="Input order manual"
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center space-x-1.5 active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Manual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
