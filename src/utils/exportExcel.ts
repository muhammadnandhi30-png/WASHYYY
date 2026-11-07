/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types.js';

export function exportOrdersToExcel(orders: Order[], filenamePrefix = 'Laporan_Penjualan_Laundry') {
  const headers = [
    'No. Invoice',
    'Tanggal',
    'Waktu',
    'Nama Pelanggan',
    'Nomor WhatsApp',
    'Kategori Layanan',
    'Berat (kg)',
    'Tarif / kg (Rp)',
    'Total Biaya (Rp)',
    'Pengambilan',
    'Alamat Pengantaran',
    'Status Cucian',
    'Status Pembayaran',
    'Metode Pembayaran',
  ];

  const rows = orders.map((o) => {
    const dateObj = new Date(o.created_at);
    const tanggal = dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const waktu = dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `"${o.kode_invoice}"`,
      `"${tanggal}"`,
      `"${waktu}"`,
      `"${(o.nama_pelanggan || '').replace(/"/g, '""')}"`,
      `"${(o.nomor_wa || '').replace(/"/g, '""')}"`,
      `"${o.kategori_layanan || 'Pakaian'}"`,
      o.berat.toFixed(2),
      o.harga_per_kg,
      o.total_harga,
      `"${o.opsi_pengambilan}"`,
      `"${(o.alamat || '').replace(/"/g, '""')}"`,
      `"${o.status_cucian}"`,
      `"${o.status_pembayaran}"`,
      `"${o.metode_pembayaran || '-'}"`,
    ].join(';');
  });

  // Gabungkan BOM UTF-8 (\uFEFF) agar Microsoft Excel langsung membaca aksen dan karakter dengan benar
  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

