/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Order, Settings, NotificationLog } from './types.js';

dotenv.config();

// Konfigurasi Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;
export let isUsingSupabase = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    isUsingSupabase = true;
    console.log('[Database] Terhubung ke Supabase PostgreSQL:', supabaseUrl);
  } catch (err) {
    console.warn('[Database] Gagal menginisialisasi Supabase client. Menggunakan in-memory storage fallback.', err);
    isUsingSupabase = false;
  }
} else {
  console.log('[Database] Kredensial Supabase tidak ditemukan di .env. Menggunakan in-memory repository.');
}

// ----------------------------------------------------------------------------
// IN-MEMORY REPOSITORY (FALLBACK & DATA BUFFER)
// Memastikan aplikasi dapat langsung dijalankan dan diuji tanpa konfigurasi database eksternal
// ----------------------------------------------------------------------------
let currentInvoiceSeq = 3;

function generateInvoiceCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  currentInvoiceSeq++;
  const seqStr = String(currentInvoiceSeq).padStart(3, '0');
  return `LDR-${year}${month}${day}-${seqStr}`;
}

let settingsStore: Settings = {
  harga_per_kg: 6000,
  nama_laundry: 'Smart Laundry Express',
  alamat_laundry: 'Jl. Sukses Makmur No. 42, Jakarta',
  kontak_laundry: '081234567890',
  udp_port: Number(process.env.UDP_PORT) || 4210,
  device_id: 'scale-01',
  device_key: process.env.SCALE_DEVICE_KEY || 'smart-laundry-secret-key-2026',
};

// Data awal untuk demonstrasi kasir
let ordersStore: Order[] = [
  {
    id: 'f87a1c32-b9e4-4fa9-a72c-1b77823e4101',
    kode_invoice: 'LDR-20261106-001',
    nama_pelanggan: 'Budi Santoso',
    nomor_wa: '081234567890',
    berat: 3.5,
    harga_per_kg: 6000,
    total_harga: 21000,
    status_cucian: 'Dicuci',
    opsi_pengambilan: 'Self Pick-up',
    alamat: '',
    status_pembayaran: 'Lunas',
    metode_pembayaran: 'QRIS',
    is_draft: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'e49b821a-7b3f-4e08-9df5-a320c192bf02',
    kode_invoice: 'LDR-20261106-002',
    nama_pelanggan: 'Siti Rahmawati',
    nomor_wa: '085712345678',
    berat: 5.2,
    harga_per_kg: 6000,
    total_harga: 31200,
    status_cucian: 'Selesai',
    opsi_pengambilan: 'Delivery',
    alamat: 'Perumahan Griya Asri Blok B2 No. 14, Tebet',
    status_pembayaran: 'Belum Bayar',
    metode_pembayaran: null,
    is_draft: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'c2098442-9fa3-43bb-a1a7-6e9389201f03',
    kode_invoice: 'LDR-20261106-003',
    nama_pelanggan: 'Andi Pratama',
    nomor_wa: '087899001122',
    berat: 2.1,
    harga_per_kg: 6000,
    total_harga: 12600,
    status_cucian: 'Diambil',
    opsi_pengambilan: 'Self Pick-up',
    alamat: '',
    status_pembayaran: 'Lunas',
    metode_pembayaran: 'Tunai',
    is_draft: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

let notificationLogsStore: NotificationLog[] = [
  {
    id: 'log-001',
    order_id: 'e49b821a-7b3f-4e08-9df5-a320c192bf02',
    nomor_tujuan: '6285712345678',
    tipe: 'CUCIAN_SELESAI',
    pesan: 'Halo Siti Rahmawati, laundry Anda sudah Selesai dan akan segera diantar ke Perumahan Griya Asri Blok B2 No. 14, Tebet. Total Rp 31.200.',
    status: 'SENT',
    response_payload: { status: true, message: 'Message sent successfully' },
    retry_count: 0,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

// ----------------------------------------------------------------------------
// DB SERVICE METHODS
// ----------------------------------------------------------------------------
export const db = {
  // SETTINGS
  async getSettings(): Promise<Settings> {
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data) {
          const mapped: any = { ...settingsStore };
          for (const item of data) {
            if (item.key === 'harga_per_kg') mapped.harga_per_kg = Number(item.value);
            else if (item.key === 'nama_laundry') mapped.nama_laundry = item.value;
            else if (item.key === 'alamat_laundry') mapped.alamat_laundry = item.value;
            else if (item.key === 'kontak_laundry') mapped.kontak_laundry = item.value;
          }
          return mapped;
        }
      } catch (err) {
        console.error('[DB] Gagal mengambil settings dari Supabase:', err);
      }
    }
    return settingsStore;
  },

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    settingsStore = { ...settingsStore, ...updates };

    if (isUsingSupabase && supabase) {
      try {
        if (updates.harga_per_kg !== undefined) {
          await supabase.from('settings').upsert({
            key: 'harga_per_kg',
            value: String(updates.harga_per_kg),
          });
        }
        if (updates.nama_laundry) {
          await supabase.from('settings').upsert({
            key: 'nama_laundry',
            value: updates.nama_laundry,
          });
        }
      } catch (err) {
        console.error('[DB] Gagal menyimpan settings ke Supabase:', err);
      }
    }

    return settingsStore;
  },

  // ORDERS
  async getAllOrders(): Promise<Order[]> {
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data as Order[];
        }
      } catch (err) {
        console.error('[DB] Gagal query orders dari Supabase:', err);
      }
    }
    // Sort descending by created_at
    return [...ordersStore].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
        if (!error && data) return data as Order;
      } catch (err) {
        console.error('[DB] Gagal query order by id dari Supabase:', err);
      }
    }
    return ordersStore.find((o) => o.id === id) || null;
  },

  async createDraftOrder(berat: number): Promise<Order> {
    const settings = await this.getSettings();
    const hargaPerKg = settings.harga_per_kg || 6000;
    const roundedBerat = Math.round(berat * 100) / 100;
    const totalHarga = Math.round(roundedBerat * hargaPerKg);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      kode_invoice: generateInvoiceCode(),
      nama_pelanggan: 'Pelanggan Baru',
      nomor_wa: '',
      berat: roundedBerat,
      harga_per_kg: hargaPerKg,
      total_harga: totalHarga,
      status_cucian: 'Menunggu',
      opsi_pengambilan: 'Self Pick-up',
      alamat: '',
      status_pembayaran: 'Belum Bayar',
      metode_pembayaran: null,
      is_draft: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ordersStore.unshift(newOrder);

    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            id: newOrder.id,
            kode_invoice: newOrder.kode_invoice,
            nama_pelanggan: newOrder.nama_pelanggan,
            nomor_wa: newOrder.nomor_wa,
            berat: newOrder.berat,
            harga_per_kg: newOrder.harga_per_kg,
            total_harga: newOrder.total_harga,
            status_cucian: newOrder.status_cucian,
            opsi_pengambilan: newOrder.opsi_pengambilan,
            alamat: newOrder.alamat,
            status_pembayaran: newOrder.status_pembayaran,
            is_draft: newOrder.is_draft,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Order;
        }
      } catch (err) {
        console.error('[DB] Gagal insert order draft ke Supabase:', err);
      }
    }

    return newOrder;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const index = ordersStore.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const current = ordersStore[index];
    const updated: Order = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Kalkulasi ulang total harga jika berat atau harga_per_kg diubah
    if (updates.berat !== undefined || updates.harga_per_kg !== undefined) {
      const b = updates.berat ?? current.berat;
      const h = updates.harga_per_kg ?? current.harga_per_kg;
      updated.total_harga = Math.round(b * h);
    }

    ordersStore[index] = updated;

    if (isUsingSupabase && supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            ...updates,
            updated_at: updated.updated_at,
          })
          .eq('id', id);
      } catch (err) {
        console.error('[DB] Gagal update order di Supabase:', err);
      }
    }

    return updated;
  },

  async deleteOrder(id: string): Promise<boolean> {
    const idx = ordersStore.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    ordersStore.splice(idx, 1);

    if (isUsingSupabase && supabase) {
      try {
        await supabase.from('orders').delete().eq('id', id);
      } catch (err) {
        console.error('[DB] Gagal delete order di Supabase:', err);
      }
    }
    return true;
  },

  // NOTIFICATION LOGS
  async addNotificationLog(log: Omit<NotificationLog, 'id' | 'created_at'>): Promise<NotificationLog> {
    const newLog: NotificationLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    notificationLogsStore.unshift(newLog);

    if (isUsingSupabase && supabase) {
      try {
        await supabase.from('notification_logs').insert(newLog);
      } catch (err) {
        console.error('[DB] Gagal mencatat notification_logs di Supabase:', err);
      }
    }

    return newLog;
  },

  async getNotificationLogs(): Promise<NotificationLog[]> {
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('notification_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as NotificationLog[];
      } catch (err) {
        console.error('[DB] Gagal query notification logs:', err);
      }
    }
    return notificationLogsStore;
  },
};
