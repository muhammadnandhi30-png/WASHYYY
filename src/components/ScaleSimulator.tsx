/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cpu,
  Activity,
  Play,
  Square,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
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

  const handleSimulateStableHold = async (targetW: number) => {
    setWeight(targetW);
    setIsStableMode(true);
    addLog(`Menempatkan beban ${targetW.toFixed(2)} kg di timbangan...`);

    // Kirim 7 paket berturut-turut dengan interval 300ms untuk memenuhi syarat 2 detik stabil
    for (let i = 0; i < 7; i++) {
      await api.simulateScale(targetW, true, 'scale-01');
      await new Promise((r) => setTimeout(r, 300));
    }
    addLog(`Beban ${targetW.toFixed(2)} kg stabil selama >2 detik! Cek Pop-up.`);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Simulator Hardware ESP32 & HX711</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                  Virtual Node
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Uji coba deteksi berat stabil dan pemicu pop-up order tanpa alat fisik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Weight Control & Presets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Beban Timbangan Virtual
              </span>
              <span className="font-mono text-2xl font-bold text-cyan-400">
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            {/* One-Click Presets */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleClearScale}
                className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-rose-400">0.00 kg</span>
                <span className="text-[10px] text-slate-400">Kosongkan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(1.85)}
                className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-700/60 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-white">1.85 kg</span>
                <span className="text-[10px] text-slate-400">Pakaian Kemeja</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(3.40)}
                className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-700/60 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-white">3.40 kg</span>
                <span className="text-[10px] text-slate-400">Jeans & Selimut</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateStableHold(5.20)}
                className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-700/60 flex flex-col items-center justify-center transition-colors"
              >
                <span className="font-mono font-bold text-white">5.20 kg</span>
                <span className="text-[10px] text-slate-400">Bed Cover King</span>
              </button>
            </div>
          </div>

          {/* Mode Kestabilan & Streaming */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Simulasi Transmisi Real-Time (300 ms UDP)</span>
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  isStreaming
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-cyan-600 text-white shadow-cyan-600/30'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Loop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Mulai Loop 300ms</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs pt-2 border-t border-slate-800">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isStableMode}
                  onChange={(e) => setIsStableMode(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                />
                <span>Kondisi Beban Diam (Stabil)</span>
              </label>

              <span className="text-slate-500 text-[11px]">
                {isStableMode ? '&bull; Menandai berat stabil' : '&bull; Menambahkan noise getaran'}
              </span>
            </div>
          </div>

          {/* JSON Payload Preview */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
              Paket UDP JSON yang Ditransmisikan (WiFiUDP):
            </span>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {JSON.stringify(mockPayload, null, 2)}
            </pre>
          </div>

          {/* Activity Logs */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
              Log Simulator:
            </span>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 h-24 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic">Belum ada paket dikirim...</span>
              ) : (
                logs.map((l, idx) => <div key={idx}>{l}</div>)
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
