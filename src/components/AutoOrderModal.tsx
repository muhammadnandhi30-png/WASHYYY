/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  User,
  MapPin,
  Truck,
  ShoppingBag,
  Send,
  Scale,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Order, OpsiPengambilan } from '../types.js';

interface AutoOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, data: Partial<Order>) => Promise<void>;
}

export const AutoOrderModal: React.FC<AutoOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !order) return null;

  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [opsiPengambilan, setOpsiPengambilan] = useState<OpsiPengambilan>('Self Pick-up');
  const [alamat, setAlamat] = useState('');
  const [customWeight, setCustomWeight] = useState<number>(order.berat);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state saat modal terbuka atau order berganti
  useEffect(() => {
    if (order) {
      setNamaPelanggan(order.nama_pelanggan !== 'Pelanggan Baru' ? order.nama_pelanggan : '');
      setNomorWa(order.nomor_wa || '');
      setOpsiPengambilan(order.opsi_pengambilan || 'Self Pick-up');
      setAlamat(order.alamat || '');
      setCustomWeight(order.berat);
      setErrorMessage('');
    }
  }, [order]);

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

  const hargaPerKg = order.harga_per_kg || 6000;
  const currentTotal = Math.round(customWeight * hargaPerKg);

  const handleSubmit = async (isFinal: boolean) => {
    setErrorMessage('');

    // Validasi alamat bila Delivery
    if (opsiPengambilan === 'Delivery' && (!alamat || alamat.trim().length < 5)) {
      setErrorMessage('Alamat pengantaran wajib diisi dengan lengkap untuk opsi Delivery.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(order.id, {
        nama_pelanggan: namaPelanggan.trim() || 'Pelanggan Reguler',
        nomor_wa: nomorWa.trim(),
        opsi_pengambilan: opsiPengambilan,
        alamat: opsiPengambilan === 'Delivery' ? alamat.trim() : '',
        berat: customWeight,
        is_draft: !isFinal,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data pesanan');
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
        {/* Header Modal */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {order.is_draft ? 'Order Baru Terdeteksi' : 'Lengkapi Data Pelanggan'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono font-semibold border border-slate-200">
                  {order.kode_invoice}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Data berat stabil dari timbangan IoT berhasil ditangkap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Berat & Kalkulasi Box */}
        <div className="bg-slate-50/70 p-4 border-b border-slate-200 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Berat</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900">{customWeight.toFixed(2)} kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Tarif / kg</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-700">
              Rp {hargaPerKg.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-700 uppercase tracking-wide block">Total Biaya</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-800">
              Rp {currentTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Form Pelanggan */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(true);
          }}
          className="p-5 sm:p-6 space-y-4"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nama Pelanggan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Pelanggan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Budi Santoso"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp (Untuk Notifikasi Fonnte)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="08123456789 atau 628123456789"
                value={nomorWa}
                onChange={(e) => setNomorWa(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder-slate-400 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pesan WhatsApp otomatis terkirim saat order disimpan dan saat cucian selesai.
            </p>
          </div>

          {/* Opsi Pengambilan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Opsi Pengambilan Cucian
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOpsiPengambilan('Self Pick-up')}
                className={`flex items-center justify-center space-x-2 p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                  opsiPengambilan === 'Self Pick-up'
                    ? 'bg-sky-50 border-sky-600 text-sky-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>Self Pick-up (Ambil Sendiri)</span>
              </button>

              <button
                type="button"
                onClick={() => setOpsiPengambilan('Delivery')}
                className={`flex items-center justify-center space-x-2 p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                  opsiPengambilan === 'Delivery'
                    ? 'bg-sky-50 border-sky-600 text-sky-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Truck className="w-4 h-4 text-slate-500" />
                <span>Delivery (Antar ke Rumah)</span>
              </button>
            </div>
          </div>

          {/* Kolom Alamat (Muncul Dinamis bila Delivery) */}
          {opsiPengambilan === 'Delivery' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Pengantaran <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Mawar No. 12, RT 02/05, Kelurahan Bahagia"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder-slate-400 transition-colors"
                ></textarea>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Simpan Draft</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim WA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
