/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Save, Database, MessageSquare, Key, Check } from 'lucide-react';
import { Settings } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (updates: Partial<Settings>) => Promise<void>;
  isUsingSupabase: boolean;
  hasFonnteToken: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  isUsingSupabase,
  hasFonnteToken,
}) => {
  if (!isOpen) return null;

  const [hargaPerKg, setHargaPerKg] = useState<number>(settings.harga_per_kg || 6000);
  const [namaLaundry, setNamaLaundry] = useState(settings.nama_laundry || 'Smart Laundry Express');
  const [alamatLaundry, setAlamatLaundry] = useState(settings.alamat_laundry || '');
  const [kontakLaundry, setKontakLaundry] = useState(settings.kontak_laundry || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keyboard shortcut: Escape to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings({
        harga_per_kg: Number(hargaPerKg),
        nama_laundry: namaLaundry.trim(),
        alamat_laundry: alamatLaundry.trim(),
        kontak_laundry: kontakLaundry.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6">
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Sistem</h3>
              <p className="text-xs text-slate-500">Tarif laundry, profil gerai, dan integrasi backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan.</span>
            </div>
          )}

          {/* Harga Per Kilogram */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tarif Cuci Reguler (per Kilogram) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-semibold text-slate-500">
                Rp
              </span>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={hargaPerKg}
                onChange={(e) => setHargaPerKg(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Harga ini otomatis dikalikan dengan berat yang terdeteksi dari timbangan ESP32.
            </p>
          </div>

          {/* Nama Laundry */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Gerai Laundry
            </label>
            <input
              type="text"
              required
              value={namaLaundry}
              onChange={(e) => setNamaLaundry(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Alamat & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Fisik Gerai
              </label>
              <input
                type="text"
                value={alamatLaundry}
                onChange={(e) => setAlamatLaundry(e.target.value)}
                placeholder="Jl. Sukses Makmur No. 42"
                className="w-full px-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Kontak / CS
              </label>
              <input
                type="text"
                value={kontakLaundry}
                onChange={(e) => setKontakLaundry(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Status Integrasi & Keamanan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
              Status Sistem & Konektivitas:
            </span>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>Database Supabase PostgreSQL</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  isUsingSupabase
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isUsingSupabase ? 'Terkoneksi' : 'In-Memory Fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>Gateway WhatsApp Fonnte</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  hasFonnteToken
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
              >
                {hasFonnteToken ? 'API Token Aktif' : 'Simulated Logger'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Port UDP ESP32</span>
              </div>
              <span className="font-mono text-slate-700 text-xs font-semibold">Port 4210</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
