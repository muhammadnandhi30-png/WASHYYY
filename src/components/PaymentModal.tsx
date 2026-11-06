/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Order, MetodePembayaran } from '../types.js';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (orderId: string, metode: MetodePembayaran) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen || !order) return null;

  const [metode, setMetode] = useState<MetodePembayaran>('Tunai');
  const [cashGiven, setCashGiven] = useState<number>(order.total_harga);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const change = Math.max(0, cashGiven - order.total_harga);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmPayment(order.id, metode);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-slate-400">{order.kode_invoice} &bull; {order.nama_pelanggan}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Total Tagihan</span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              Rp {order.total_harga.toLocaleString('id-ID')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetode('Tunai')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metode === 'Tunai'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setMetode('QRIS')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metode === 'QRIS'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMetode('Transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metode === 'Transfer'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {metode === 'Tunai' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Uang Diterima dari Pelanggan
                </label>
                <input
                  type="number"
                  min={order.total_harga}
                  step="1000"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Kembalian:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  Rp {change.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Tandai Lunas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
