/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { X, Printer, CheckCircle, Receipt, WashingMachine } from 'lucide-react';
import { Order, Settings } from '../types.js';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen || !order) return null;

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(order.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:max-w-full">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Receipt className="w-4 h-4 text-sky-600" />
            <span>Faktur & Struk Transaksi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          ref={receiptRef}
          className="p-6 sm:p-8 text-slate-800 bg-white space-y-5 font-sans print:p-4 print:w-full"
        >
          {/* Header Toko */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                <WashingMachine className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {settings.nama_laundry || 'Smart Laundry Express'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {settings.alamat_laundry || 'Jl. Sukses Makmur No. 42, Jakarta'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Telp/WA: {settings.kontak_laundry || '081234567890'}
            </p>
          </div>

          {/* Info Invoice & Pelanggan */}
          <div className="text-xs space-y-1.5 pb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">No. Invoice:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {order.kode_invoice}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tanggal:</span>
              <span className="text-slate-700">
                {formattedDate} - {formattedTime}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-bold text-slate-900">{order.nama_pelanggan}</span>
            </div>
            {order.nomor_wa && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-mono text-slate-700">{order.nomor_wa}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pengambilan:</span>
              <span className="font-semibold text-slate-800">{order.opsi_pengambilan}</span>
            </div>
            {order.opsi_pengambilan === 'Delivery' && order.alamat && (
              <div className="text-[11px] text-slate-600 pt-1">
                <span className="text-slate-400 block">Alamat Antar:</span>
                <p className="italic">{order.alamat}</p>
              </div>
            )}
          </div>

          {/* Rincian Cucian */}
          <div className="space-y-2 pb-4 border-b border-dashed border-slate-300">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rincian Layanan
            </div>

            <div className="flex justify-between items-baseline text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  {order.kategori_layanan || 'Pakaian (Kiloan)'}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {order.berat.toFixed(2)} kg &times; Rp {order.harga_per_kg.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                Rp {order.total_harga.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Total & Status Pembayaran */}
          <div className="space-y-2 pb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900">TOTAL BIAYA</span>
              <span className="font-mono text-base font-extrabold text-sky-700">
                Rp {order.total_harga.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Status Pembayaran:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  order.status_pembayaran === 'Lunas'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {order.status_pembayaran.toUpperCase()}{' '}
                {order.metode_pembayaran ? `(${order.metode_pembayaran})` : ''}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Status Pengerjaan:</span>
              <span className="font-semibold text-slate-800">{order.status_cucian}</span>
            </div>
          </div>

          {/* Catatan / Footer Struk */}
          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <p className="font-medium text-slate-500">Terima kasih atas kunjungan Anda!</p>
            <p>Harap simpan struk ini sebagai bukti pengambilan cucian.</p>
            <p className="font-mono text-[10px] text-slate-400 pt-1">
              Smart Laundry IoT Management System
            </p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden during print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};

