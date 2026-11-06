/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
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

  const hargaPerKg = order.harga_per_kg || 6000;
  const currentTotal = Math.round(customWeight * hargaPerKg);

  const handleSubmit = async (isFinal: boolean) => {
    setErrorMessage('');

    // Validasi alamat bila Delivery
    if (opsiPengambilan === 'Delivery' && (!alamat || alamat.trim().length < 5)) {
      setErrorMessage('Alamat pengantaran wajib diisi dengan lengkap untuk opsi Delivery!');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{order.is_draft ? 'Order Baru Terdeteksi!' : 'Lengkapi Data Pelanggan'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/60">
                  {order.kode_invoice}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Data berat stabil dari timbangan IoT berhasil ditangkap
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

        {/* Berat & Kalkulasi Box */}
        <div className="bg-slate-950/70 p-4 border-b border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Berat Timbangan</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{customWeight.toFixed(2)} kg</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Tarif / kg</span>
            <span className="text-xl font-bold font-mono text-slate-200">
              Rp {hargaPerKg.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
            <span className="text-[11px] text-cyan-300 uppercase tracking-wide block">Total Biaya</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
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
          className="p-6 space-y-4"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nama Pelanggan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Pelanggan <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Budi Santoso"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp (Untuk Notifikasi Fonnte)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="08123456789 atau 628123456789"
                value={nomorWa}
                onChange={(e) => setNomorWa(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pesan WhatsApp otomatis terkirim saat order disimpan & saat cucian berstatus Selesai.
            </p>
          </div>

          {/* Opsi Pengambilan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Opsi Pengambilan Cucian
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOpsiPengambilan('Self Pick-up')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  opsiPengambilan === 'Self Pick-up'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Self Pick-up (Ambil Sendiri)</span>
              </button>

              <button
                type="button"
                onClick={() => setOpsiPengambilan('Delivery')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  opsiPengambilan === 'Delivery'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Delivery (Antar ke Rumah)</span>
              </button>
            </div>
          </div>

          {/* Kolom Alamat (Muncul Dinamis bila Delivery) */}
          {opsiPengambilan === 'Delivery' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Alamat Pengantaran <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Mawar No. 12, RT 02/05, Kelurahan Bahagia"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
                ></textarea>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Draft Saja</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
