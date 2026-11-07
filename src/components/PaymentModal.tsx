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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6">
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-slate-500">{order.kode_invoice} &bull; {order.nama_pelanggan}</p>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-800 font-medium block mb-1">Total Tagihan</span>
            <span className="text-3xl font-extrabold font-mono text-emerald-800">
              Rp {order.total_harga.toLocaleString('id-ID')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetode('Tunai')}
                className={`flex flex-col items-center justify-center p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                  metode === 'Tunai'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-slate-600" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setMetode('QRIS')}
                className={`flex flex-col items-center justify-center p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                  metode === 'QRIS'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-slate-600" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMetode('Transfer')}
                className={`flex flex-col items-center justify-center p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                  metode === 'Transfer'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-slate-600" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {metode === 'Tunai' && (
            <div className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Uang Diterima dari Pelanggan
                </label>
                <input
                  type="number"
                  min={order.total_harga}
                  step="1000"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Kembalian:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  Rp {change.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
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
