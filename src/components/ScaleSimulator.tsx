/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cpu,
  Play,
  Square,
} from 'lucide-react';
import { api } from '../services/api.js';

interface ScaleSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentScaleWeight: number;
}

export const ScaleSimulator: React.FC<ScaleSimulatorProps> = ({
  isOpen,
  onClose,
  currentScaleWeight,
}) => {
  if (!isOpen) return null;

  const [weight, setWeight] = useState<number>(currentScaleWeight || 0);
  const [isStableMode, setIsStableMode] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const streamTimerRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`,
      ...prev.slice(0, 15),
    ]);
  };

  const sendPacket = async (targetWeight: number, isStable: boolean) => {
    try {
      let finalW = targetWeight;
      // Jika mode bergerak / noise, tambahkan sedikit jitter +/- 0.05
      if (!isStable && finalW > 0) {
        const jitter = (Math.random() - 0.5) * 0.1;
        finalW = Math.max(0, Math.round((finalW + jitter) * 100) / 100);
      }

      await api.simulateScale(finalW, isStable, 'scale-01');
      addLog(`UDP TX -> Berat: ${finalW.toFixed(2)} kg | Stabil: ${isStable ? 'YA' : 'TIDAK'}`);
    } catch (err: any) {
      addLog(`ERR: ${err.message}`);
    }
  };

  // Streaming loop (meniru pengiriman berkala ESP32 setiap 300 ms)
  useEffect(() => {
    if (isStreaming) {
      streamTimerRef.current = setInterval(() => {
        sendPacket(weight, isStableMode);
      }, 300);
    } else {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isStreaming, weight, isStableMode]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSimulateStableHold = async (targetW: number) => {
    setWeight(targetW);
    setIsStableMode(true);
    addLog(`Menempatkan beban ${targetW.toFixed(2)} kg di timbangan...`);

    // Kirim 7 paket berturut-turut dengan interval 300ms untuk memenuhi syarat 2 detik stabil
    for (let i = 0; i < 7; i++) {
      await api.simulateScale(targetW, true, 'scale-01');
      await new Promise((r) => setTimeout(r, 300));
    }
    addLog(`Beban ${targetW.toFixed(2)} kg stabil selama >2 detik. Cek Pop-up order.`);
  };

  const handleClearScale = async () => {
    setWeight(0);
    setIsStableMode(true);
    await api.simulateScale(0, true, 'scale-01');
    addLog('Timbangan dikosongkan (0.00 kg). Siklus baru siap.');
  };

  const mockPayload = {
    device_id: 'scale-01',
    key: 'smart-laundry-secret-key-2026',
    weight: weight,
    stable: isStableMode,
    rssi: -58,
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Simulator Hardware ESP32 & HX711</h3>
                <span className="text-[11px] font-mono font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Virtual Node
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Uji coba deteksi berat stabil dan pemicu pop-up order tanpa perangkat fisik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup simulator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Weight Control & Presets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Beban Timbangan Virtual
              </span>
              <span className="font-mono text-2xl font-bold text-slate-900">
                {weight.toFixed(2)} kg
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="15"
              step="0.05"
              value={weight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setWeight(val);
                if (!isStreaming) sendPacket(val, isStableMode);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />

            {/* One-Click Presets */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleClearScale}
                className="min-h-[44px] py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-medium border border-slate-200 hover:border-rose-200 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-rose-600">0.00 kg</span>
                <span className="text-[10px] text-slate-500">Kosongkan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(1.85)}
                className="min-h-[44px] py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-xs font-medium border border-slate-200 hover:border-sky-200 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-slate-900">1.85 kg</span>
                <span className="text-[10px] text-slate-500">Kemeja</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(3.40)}
                className="min-h-[44px] py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-xs font-medium border border-slate-200 hover:border-sky-200 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-slate-900">3.40 kg</span>
                <span className="text-[10px] text-slate-500">Jeans & Selimut</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(5.20)}
                className="min-h-[44px] py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-xs font-medium border border-slate-200 hover:border-sky-200 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-slate-900">5.20 kg</span>
                <span className="text-[10px] text-slate-500">Bed Cover King</span>
              </button>
            </div>
          </div>

          {/* Mode Kestabilan & Streaming */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-700 font-semibold">Simulasi Transmisi Real-Time (300 ms UDP)</span>
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`min-h-[38px] flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isStreaming
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Hentikan Loop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Mulai Loop 300ms</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={isStableMode}
                  onChange={(e) => setIsStableMode(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/20"
                />
                <span className="font-medium">Kondisi Beban Diam (Stabil)</span>
              </label>

              <span className="text-slate-500 text-[11px]">
                {isStableMode ? 'Menandai berat stabil' : 'Menambahkan noise getaran'}
              </span>
            </div>
          </div>

          {/* JSON Payload Preview */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
              Paket UDP JSON yang Ditransmisikan (WiFiUDP):
            </span>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
              {JSON.stringify(mockPayload, null, 2)}
            </pre>
          </div>

          {/* Activity Logs */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
              Log Simulator:
            </span>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 h-24 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <span className="text-slate-400 italic">Belum ada paket dikirim...</span>
              ) : (
                logs.map((l, idx) => <div key={idx}>{l}</div>)
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
