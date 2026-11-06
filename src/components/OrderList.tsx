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
  AlertTriangle,
  CreditCard,
  Truck,
  ShoppingBag,
  Edit,
  Trash2,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import { Order, StatusCucian } from '../types.js';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: StatusCucian) => Promise<void>;
  onOpenPaymentModal: (order: Order) => void;
  onResendWhatsApp: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onEditOrder,
  onUpdateStatus,
  onOpenPaymentModal,
  onResendWhatsApp,
  onDeleteOrder,
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Menunggu</span>
          </span>
        );
      case 'Dicuci':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Shirt className="w-3 h-3" />
            <span>Sedang Dicuci</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Selesai (WA Terkirim)</span>
          </span>
        );
      case 'Diambil':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <Check className="w-3 h-3" />
            <span>Diambil / Selesai</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Controls: Search & Tabs */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari invoice atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
            <span>Total:</span>
            <span className="font-bold text-white font-mono">{filteredOrders.length} Pesanan</span>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 items-center justify-between pt-2">
          {/* Status Cucian Filters */}
          <div className="flex flex-wrap gap-1.5">
            {['Semua', 'Menunggu', 'Dicuci', 'Selesai', 'Diambil'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Payment Status Filters */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Bayar:</span>
            {['Semua', 'Belum Bayar', 'Lunas'].map((pay) => (
              <button
                key={pay}
                onClick={() => setPaymentFilter(pay)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  paymentFilter === pay
                    ? 'bg-slate-700 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pay}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <Shirt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Tidak ada order yang cocok dengan filter</p>
          <p className="text-xs text-slate-600 mt-1">Letakkan cucian di timbangan untuk membuat order baru secara otomatis.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    order.is_draft ? 'bg-amber-950/15' : ''
                  }`}
                >
                  {/* Invoice & Time */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-semibold text-white">{order.kode_invoice}</span>
                      <button
                        onClick={() => copyToClipboard(order.kode_invoice)}
                        title="Salin Invoice"
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        {copiedInvoice === order.kode_invoice ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                      <span className="inline-block mt-1 text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                        Draft Menunggu Data
                      </span>
                    )}
                  </td>

                  {/* Customer Info */}
                  <td className="py-4 px-4">
                    <div className="font-medium text-white">{order.nama_pelanggan}</div>
                    {order.nomor_wa ? (
                      <div className="flex items-center space-x-1 text-xs text-cyan-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{order.nomor_wa}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Tanpa WhatsApp</span>
                    )}
                  </td>

                  {/* Weight & Total */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-white text-base">
                      {order.berat.toFixed(2)} kg
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-semibold">
                      Rp {order.total_harga.toLocaleString('id-ID')}
                    </div>
                  </td>

                  {/* Pick-up Option */}
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                      {order.opsi_pengambilan === 'Delivery' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-cyan-300">Delivery</span>
                            {order.alamat && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[160px]" title={order.alamat}>
                                {order.alamat}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-300">Self Pick-up</span>
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
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Lunas {order.metode_pembayaran ? `(${order.metode_pembayaran})` : ''}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenPaymentModal(order)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Belum Bayar &rarr;</span>
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
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30 transition-colors flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Lengkapi Data</span>
                        </button>
                      )}

                      {/* Status Next Button */}
                      {order.status_cucian === 'Menunggu' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Dicuci')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/40 hover:bg-blue-600/30 transition-colors"
                        >
                          Cuci
                        </button>
                      )}

                      {order.status_cucian === 'Dicuci' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Selesai')}
                          title="Tandai Selesai & Kirim Notifikasi WhatsApp"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Selesai</span>
                        </button>
                      )}

                      {order.status_cucian === 'Selesai' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Diambil')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          Diambil
                        </button>
                      )}

                      {/* Kirim Ulang WA */}
                      {order.nomor_wa && (
                        <button
                          onClick={() => handleResend(order.id)}
                          disabled={resendingId === order.id}
                          title="Kirim ulang notifikasi WhatsApp via Fonnte"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        >
                          <Send className={`w-3.5 h-3.5 ${resendingId === order.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      {/* Edit Details */}
                      <button
                        onClick={() => onEditOrder(order)}
                        title="Edit data order"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
      )}
    </div>
  );
};
