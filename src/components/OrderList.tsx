/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  Shirt,
  Send,
  CreditCard,
  Truck,
  ShoppingBag,
  Edit,
  Trash2,
  Phone,
  Copy,
  Check,
  Calendar,
  Download,
  Printer,
} from 'lucide-react';
import { Order, StatusCucian } from '../types.js';
import { exportOrdersToExcel } from '../utils/exportExcel.js';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: StatusCucian) => Promise<void>;
  onOpenPaymentModal: (order: Order) => void;
  onResendWhatsApp: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onPrintInvoice: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onEditOrder,
  onUpdateStatus,
  onOpenPaymentModal,
  onResendWhatsApp,
  onDeleteOrder,
  onPrintInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [paymentFilter, setPaymentFilter] = useState<string>('Semua');
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(text);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const handleResend = async (orderId: string) => {
    setResendingId(orderId);
    try {
      await onResendWhatsApp(orderId);
    } finally {
      setResendingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.kode_invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.nama_pelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.nomor_wa.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'Semua' || order.status_cucian === statusFilter;

    const matchesPayment =
      paymentFilter === 'Semua' || order.status_pembayaran === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: StatusCucian) => {
    switch (status) {
      case 'Menunggu':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu</span>
          </span>
        );
      case 'Dicuci':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Shirt className="w-3 h-3 text-indigo-600" />
            <span>Sedang Dicuci</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      case 'Diambil':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Check className="w-3 h-3 text-slate-500" />
            <span>Diambil</span>
          </span>
        );
    }
  };

  return (
    <div id="order-list-section" className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden scroll-mt-20">
      {/* Top Controls: Title, Subtitle, Search & Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">Orderan terbaru</h3>
          <p className="text-xs text-slate-500 mt-0.5">Total {orders.length} transaksi tercatat</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari pelanggan / invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 min-h-[38px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder-slate-400 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1 items-center bg-slate-100 p-1 rounded-xl">
            {['Semua', 'Menunggu', 'Dicuci', 'Selesai'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`min-h-[30px] px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-sky-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportOrdersToExcel(filteredOrders)}
            title="Ekspor catatan penjualan ke format Excel (CSV)"
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Orders Content */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-500 px-4">
          <Shirt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Tidak ada order yang cocok dengan filter</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Letakkan cucian di atas timbangan atau gunakan tombol Input Manual untuk membuat pesanan baru.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< md): Responsive Touch Cards */}
          <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white border rounded-xl p-4 shadow-xs space-y-3 transition-colors ${
                  order.is_draft ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Header: Invoice + Time + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-slate-900 text-sm">{order.kode_invoice}</span>
                      <button
                        onClick={() => copyToClipboard(order.kode_invoice)}
                        title="Salin Invoice"
                        className="min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-sky-700 transition-colors"
                        aria-label="Salin kode invoice"
                      >
                        {copiedInvoice === order.kode_invoice ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(order.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        &bull; {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status_cucian)}
                    {order.is_draft && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer & Delivery */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-slate-900 text-sm">{order.nama_pelanggan}</span>
                    <div className="flex items-center space-x-1 text-slate-600">
                      {order.opsi_pengambilan === 'Delivery' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="text-sky-800 font-medium">Antar</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-600">Ambil Sendiri</span>
                        </>
                      )}
                    </div>
                  </div>

                  {order.nomor_wa ? (
                    <div className="flex items-center space-x-1.5 text-sky-700">
                      <Phone className="w-3 h-3 text-sky-600" />
                      <span className="font-mono">{order.nomor_wa}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block">Tanpa nomor WhatsApp</span>
                  )}

                  {order.opsi_pengambilan === 'Delivery' && order.alamat && (
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-snug">
                      Alamat: {order.alamat}
                    </p>
                  )}
                </div>

                {/* Weight & Payment Summary */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Berat & Total:</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-mono font-bold text-slate-900 text-base">{order.berat.toFixed(2)} kg</span>
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        Rp {order.total_harga.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div>
                    {order.status_pembayaran === 'Lunas' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lunas {order.metode_pembayaran ? `(${order.metode_pembayaran})` : ''}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenPaymentModal(order)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-rose-600" />
                        <span>Bayar Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Status Progression Button */}
                  <div className="flex-1">
                    {order.is_draft ? (
                      <button
                        onClick={() => onEditOrder(order)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Lengkapi Data</span>
                      </button>
                    ) : order.status_cucian === 'Menunggu' ? (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'Dicuci')}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        <span>Mulai Cuci</span>
                      </button>
                    ) : order.status_cucian === 'Dicuci' ? (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'Selesai')}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    ) : order.status_cucian === 'Selesai' ? (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'Diambil')}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tandai Diambil</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic block py-2 text-center">Selesai / Diambil</span>
                    )}
                  </div>

                  {/* Secondary Quick Action Tools with 44px min touch target */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onPrintInvoice(order)}
                      title="Cetak Invoice"
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                      aria-label="Cetak invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {order.nomor_wa && (
                      <button
                        onClick={() => handleResend(order.id)}
                        disabled={resendingId === order.id}
                        title="Kirim ulang WhatsApp"
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                        aria-label="Kirim ulang pesan WhatsApp"
                      >
                        <Send className={`w-4 h-4 ${resendingId === order.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => onEditOrder(order)}
                      title="Edit order"
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                      aria-label="Edit rincian order"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus order ${order.kode_invoice}?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      title="Hapus order"
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center transition-colors"
                      aria-label="Hapus order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (md and up): Clean, Spacious Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice & Waktu</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Berat & Tarif</th>
                  <th className="py-3.5 px-4">Pengambilan</th>
                  <th className="py-3.5 px-4">Status Cucian</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4 text-right">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      order.is_draft ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Invoice & Time */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-semibold text-slate-900">{order.kode_invoice}</span>
                        <button
                          onClick={() => copyToClipboard(order.kode_invoice)}
                          title="Salin Invoice"
                          className="text-slate-400 hover:text-sky-700 transition-colors p-0.5"
                          aria-label="Salin invoice"
                        >
                          {copiedInvoice === order.kode_invoice ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        &bull; {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </div>
                      {order.is_draft && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Draft Menunggu Data
                        </span>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{order.nama_pelanggan}</div>
                      {order.nomor_wa ? (
                        <div className="flex items-center space-x-1 text-xs text-sky-700 mt-0.5">
                          <Phone className="w-3 h-3 text-sky-600" />
                          <span>{order.nomor_wa}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa WhatsApp</span>
                      )}
                    </td>

                    {/* Weight & Total */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {order.berat.toFixed(2)} kg
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
                          {order.kategori_layanan || 'Pakaian'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                        Rp {order.total_harga.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Pick-up Option */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                        {order.opsi_pengambilan === 'Delivery' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <div>
                              <span className="font-medium text-sky-800">Delivery</span>
                              {order.alamat && (
                                <p className="text-[11px] text-slate-500 truncate max-w-[160px]" title={order.alamat}>
                                  {order.alamat}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600">Self Pick-up</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Wash Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(order.status_cucian)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {order.status_pembayaran === 'Lunas' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Lunas {order.metode_pembayaran ? `(${order.metode_pembayaran})` : ''}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenPaymentModal(order)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          <CreditCard className="w-3 h-3 text-rose-600" />
                          <span>Belum Bayar</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Lengkapi data jika masih draft */}
                        {order.is_draft && (
                          <button
                            onClick={() => onEditOrder(order)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center space-x-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Lengkapi Data</span>
                          </button>
                        )}

                        {/* Status Next Button */}
                        {order.status_cucian === 'Menunggu' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'Dicuci')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                          >
                            Mulai Cuci
                          </button>
                        )}

                        {order.status_cucian === 'Dicuci' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'Selesai')}
                            title="Tandai Selesai & Kirim Notifikasi WhatsApp"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Selesai</span>
                          </button>
                        )}

                        {order.status_cucian === 'Selesai' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'Diambil')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                          >
                            Diambil
                          </button>
                        )}

                        {/* Cetak Invoice */}
                        <button
                          onClick={() => onPrintInvoice(order)}
                          title="Cetak invoice transaksi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                          aria-label="Cetak invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Kirim Ulang WA */}
                        {order.nomor_wa && (
                          <button
                            onClick={() => handleResend(order.id)}
                            disabled={resendingId === order.id}
                            title="Kirim ulang notifikasi WhatsApp via Fonnte"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                            aria-label="Kirim ulang WhatsApp"
                          >
                            <Send className={`w-3.5 h-3.5 ${resendingId === order.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        {/* Edit Details */}
                        <button
                          onClick={() => onEditOrder(order)}
                          title="Edit data order"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          aria-label="Edit order"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus order ${order.kode_invoice}?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="Hapus order"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Hapus order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
