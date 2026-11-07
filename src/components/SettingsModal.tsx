/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Save, Database, MessageSquare, Key, Check, Shirt, Layers, Grid, Send } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'tarif' | 'wa' | 'gerai'>('tarif');
  const [hargaPakaian, setHargaPakaian] = useState<number>(settings.harga_pakaian || settings.harga_per_kg || 6000);
  const [hargaSprei, setHargaSprei] = useState<number>(settings.harga_sprei || 12000);
  const [hargaKarpet, setHargaKarpet] = useState<number>(settings.harga_karpet || 15000);

  const [namaLaundry, setNamaLaundry] = useState(settings.nama_laundry || 'Smart Laundry Express');
  const [alamatLaundry, setAlamatLaundry] = useState(settings.alamat_laundry || '');
  const [kontakLaundry, setKontakLaundry] = useState(settings.kontak_laundry || '');

  const [tplKonfirmasi, setTplKonfirmasi] = useState(
    settings.template_wa_konfirmasi ||
      'Halo {nama}, cucian {layanan} Anda ({berat} kg) sudah kami terima di {toko}. Invoice {invoice}. Total Rp {total}. Kami kabari saat selesai.'
  );
  const [tplSelesaiPickup, setTplSelesaiPickup] = useState(
    settings.template_wa_selesai_pickup ||
      'Halo {nama}, laundry {layanan} Anda sudah Selesai dan siap diambil di {toko}. Total Rp {total}. Terima kasih.'
  );
  const [tplSelesaiDelivery, setTplSelesaiDelivery] = useState(
    settings.template_wa_selesai_delivery ||
      'Halo {nama}, laundry {layanan} Anda sudah Selesai dan akan segera diantar ke {alamat}. Total Rp {total}.'
  );

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
        harga_per_kg: Number(hargaPakaian),
        harga_pakaian: Number(hargaPakaian),
        harga_sprei: Number(hargaSprei),
        harga_karpet: Number(hargaKarpet),
        nama_laundry: namaLaundry.trim(),
        alamat_laundry: alamatLaundry.trim(),
        kontak_laundry: kontakLaundry.trim(),
        template_wa_konfirmasi: tplKonfirmasi.trim(),
        template_wa_selesai_pickup: tplSelesaiPickup.trim(),
        template_wa_selesai_delivery: tplSelesaiDelivery.trim(),
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-slate-50/50 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tarif')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'tarif'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Tarif Layanan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wa')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'wa'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pesan WA Otomatis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gerai')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'gerai'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Gerai & Status</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan.</span>
            </div>
          )}

          {/* TAB 1: TARIF LAYANAN (Pakaian, Sprey, Karpet) */}
          {activeTab === 'tarif' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Atur tarif per kilogram untuk setiap kategori cucian yang ditawarkan.
              </p>

              {/* Tarif Pakaian */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Shirt className="w-3.5 h-3.5 text-sky-600" />
                  <span>Tarif Pakaian (per Kg)</span>
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
                    value={hargaPakaian}
                    onChange={(e) => setHargaPakaian(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Tarif Sprey */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tarif Sprey / Bedcover (per Kg)</span>
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
                    value={hargaSprei}
                    onChange={(e) => setHargaSprei(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Tarif Karpet */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Grid className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tarif Karpet (per Kg)</span>
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
                    value={hargaKarpet}
                    onChange={(e) => setHargaKarpet(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PESAN WA OTOMATIS */}
          {activeTab === 'wa' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] leading-relaxed">
                <span className="font-semibold block mb-0.5">Variabel Otomatis yang Tersedia:</span>
                <code className="text-sky-800 font-mono">
                  {'{nama}'}, {'{berat}'}, {'{invoice}'}, {'{total}'}, {'{layanan}'}, {'{alamat}'}, {'{toko}'}
                </code>
              </div>

              {/* Template Konfirmasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template: Konfirmasi Order Baru
                </label>
                <textarea
                  rows={3}
                  required
                  value={tplKonfirmasi}
                  onChange={(e) => setTplKonfirmasi(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
                />
              </div>

              {/* Template Selesai Self Pick-up */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template: Cucian Selesai (Self Pick-up)
                </label>
                <textarea
                  rows={3}
                  required
                  value={tplSelesaiPickup}
                  onChange={(e) => setTplSelesaiPickup(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
                />
              </div>

              {/* Template Selesai Delivery */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template: Cucian Selesai (Delivery)
                </label>
                <textarea
                  rows={3}
                  required
                  value={tplSelesaiDelivery}
                  onChange={(e) => setTplSelesaiDelivery(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: GERAI & STATUS */}
          {activeTab === 'gerai' && (
            <div className="space-y-4">
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
            </div>
          )}

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
