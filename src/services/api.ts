/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, Settings, ScaleStatus, NotificationLog, KategoriLayanan } from '../types.js';

const API_BASE = '/api';

export const api = {
  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal memuat orders');
    return json.data;
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Order tidak ditemukan');
    return json.data;
  },

  async createOrder(data: {
    berat: number;
    nama_pelanggan?: string;
    nomor_wa?: string;
    opsi_pengambilan?: string;
    alamat?: string;
    kategori_layanan?: KategoriLayanan;
    harga_per_kg?: number;
    is_draft?: boolean;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal membuat order');
    return json.data;
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal update order');
    return json.data;
  },

  async updateStatus(id: string, status_cucian: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_cucian }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal mengubah status');
    return json.data;
  },

  async updatePayment(
    id: string,
    status_pembayaran: string,
    metode_pembayaran?: string
  ): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_pembayaran, metode_pembayaran }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal memperbarui pembayaran');
    return json.data;
  },

  async resendWhatsApp(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/orders/${id}/resend-wa`, {
      method: 'POST',
    });
    const json = await res.json();
    return json;
  },

  async deleteOrder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal menghapus order');
  },

  // Settings
  async getSettings(): Promise<{ settings: Settings; system: { isUsingSupabase: boolean; hasFonnteToken: boolean } }> {
    const res = await fetch(`${API_BASE}/settings`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal memuat pengaturan');
    return { settings: json.data, system: json.system };
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal memperbarui pengaturan');
    return json.data;
  },

  // Scale
  async getScaleStatus(): Promise<ScaleStatus> {
    const res = await fetch(`${API_BASE}/scale/status`);
    const json = await res.json();
    return json.data;
  },

  async tareScale(): Promise<void> {
    await fetch(`${API_BASE}/scale/tare`, { method: 'POST' });
  },

  async simulateScale(weight: number, stable: boolean = false, device_id: string = 'scale-01'): Promise<any> {
    const res = await fetch(`${API_BASE}/scale/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, stable, device_id }),
    });
    return res.json();
  },

  // Notification Logs
  async getNotificationLogs(): Promise<NotificationLog[]> {
    const res = await fetch(`${API_BASE}/notification-logs`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal memuat log notifikasi');
    return json.data;
  },
};
