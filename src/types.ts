/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatusCucian = 'Menunggu' | 'Dicuci' | 'Selesai' | 'Diambil';
export type OpsiPengambilan = 'Self Pick-up' | 'Delivery';
export type StatusPembayaran = 'Belum Bayar' | 'Lunas';
export type MetodePembayaran = 'Tunai' | 'Transfer' | 'QRIS';

export interface Order {
  id: string;
  kode_invoice: string;
  nama_pelanggan: string;
  nomor_wa: string;
  berat: number;
  harga_per_kg: number;
  total_harga: number;
  status_cucian: StatusCucian;
  opsi_pengambilan: OpsiPengambilan;
  alamat?: string;
  status_pembayaran: StatusPembayaran;
  metode_pembayaran?: MetodePembayaran | null;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  harga_per_kg: number;
  nama_laundry: string;
  alamat_laundry: string;
  kontak_laundry: string;
  udp_port: number;
  device_id: string;
  device_key: string;
}

export interface ScaleStatus {
  online: boolean;
  lastSeen: string | null;
  currentWeight: number;
  isStable: boolean;
  deviceId: string;
  rssi?: number;
}

export interface NotificationLog {
  id: string;
  order_id: string;
  nomor_tujuan: string;
  tipe: 'KONFIRMASI_ORDER' | 'CUCIAN_SELESAI' | 'MANUAL_RESEND';
  pesan: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  response_payload?: any;
  retry_count: number;
  created_at: string;
}
