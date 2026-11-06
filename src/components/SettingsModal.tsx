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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pengaturan Sistem</h3>
              <p className="text-xs text-slate-400">Tarif laundry, profil gerai, dan integrasi backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}

          {/* Harga Per Kilogram */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tarif Cuci Reguler (per Kilogram) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={hargaPerKg}
                onChange={(e) => setHargaPerKg(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Harga ini otomatis dikalikan dengan berat yang terdeteksi dari timbangan ESP32.
            </p>
          </div>

          {/* Nama Laundry */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Gerai Laundry
            </label>
            <input
              type="text"
              required
              value={namaLaundry}
              onChange={(e) => setNamaLaundry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Alamat & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Alamat Fisik Gerai
              </label>
              <input
                type="text"
                value={alamatLaundry}
                onChange={(e) => setAlamatLaundry(e.target.value)}
                placeholder="Jl. Sukses Makmur No. 42"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nomor Kontak / CS
              </label>
              <input
                type="text"
                value={kontakLaundry}
                onChange={(e) => setKontakLaundry(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Status Integrasi & Keamanan */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
              Status Sistem & Konektivitas:
            </span>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Database Supabase PostgreSQL</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  isUsingSupabase
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {isUsingSupabase ? 'Terkoneksi' : 'In-Memory Fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gateway WhatsApp Fonnte</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  hasFonnteToken
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {hasFonnteToken ? 'API Token Aktif' : 'Simulated Logger'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Port UDP ESP32</span>
              </div>
              <span className="font-mono text-slate-300 text-xs">Port 4210</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all flex items-center space-x-1.5"
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
