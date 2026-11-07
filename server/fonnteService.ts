/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db.js';
import { Order } from './types.js';

/**
 * Normalisasi nomor WhatsApp ke standar internasional Indonesia (awalan 62)
 * Contoh: 08123456789 -> 628123456789
 *         +628123456789 -> 628123456789
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Hapus karakter non-digit
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('62')) {
    // Sudah berawalan 62
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format angka ke format mata uang Rupiah
 */
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

function formatTemplate(template: string, vars: Record<string, string | number>): string {
  let res = template;
  for (const [key, val] of Object.entries(vars)) {
    res = res.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }
  return res;
}

/**
 * Service integrasi Fonnte WhatsApp API
 */
export const fonnteService = {
  /**
   * Kirim pesan teks WhatsApp melalui endpoint https://api.fonnte.com/send
   * Mendukung retry hingga 2 kali bila terjadi kegagalan jaringan
   */
  async sendMessage(
    orderId: string,
    targetPhone: string,
    message: string,
    tipe: 'KONFIRMASI_ORDER' | 'CUCIAN_SELESAI' | 'MANUAL_RESEND'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = process.env.FONNTE_API_TOKEN || '';
    const formattedPhone = normalizePhoneNumber(targetPhone);

    if (!formattedPhone || formattedPhone.length < 9) {
      const err = `Nomor WhatsApp tidak valid: "${targetPhone}"`;
      console.warn(`[Fonnte] ${err}`);
      await db.addNotificationLog({
        order_id: orderId,
        nomor_tujuan: targetPhone,
        tipe,
        pesan: message,
        status: 'FAILED',
        response_payload: { error: err },
        retry_count: 0,
      });
      return { success: false, error: err };
    }

    // Jika token tidak disetel di .env, jalankan dalam mode simulasi (mock) yang informatif
    if (!token || token === 'your_fonnte_token_here') {
      console.log(`[Fonnte SIMULATOR] Mengirim pesan ke ${formattedPhone}:`);
      console.log(`--------------------------------------------------`);
      console.log(message);
      console.log(`--------------------------------------------------`);

      const simulatedResponse = {
        status: true,
        target: [formattedPhone],
        message: 'Pesan berhasil disimulasikan (FONNTE_API_TOKEN belum diatur)',
        simulated: true,
      };

      await db.addNotificationLog({
        order_id: orderId,
        nomor_tujuan: formattedPhone,
        tipe,
        pesan: message,
        status: 'SENT',
        response_payload: simulatedResponse,
        retry_count: 0,
      });

      return { success: true, data: simulatedResponse };
    }

    // Pengiriman nyata ke API Fonnte dengan retry loop
    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        console.log(`[Fonnte] Mengirim pesan (Percobaan ${attempt + 1}/${maxRetries + 1}) ke ${formattedPhone}...`);

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: formattedPhone,
            message: message,
            countryCode: '62', // Default Indonesia
          }),
        });

        const result = await response.json();

        if (response.ok && result.status) {
          console.log(`[Fonnte] Pesan berhasil dikirim ke ${formattedPhone}`);
          await db.addNotificationLog({
            order_id: orderId,
            nomor_tujuan: formattedPhone,
            tipe,
            pesan: message,
            status: 'SENT',
            response_payload: result,
            retry_count: attempt,
          });
          return { success: true, data: result };
        } else {
          lastError = result;
          console.warn(`[Fonnte] Respons API Fonnte gagal:`, result);
        }
      } catch (err: any) {
        lastError = err?.message || err;
        console.error(`[Fonnte] Terjadi error koneksi:`, err);
      }

      attempt++;
      if (attempt <= maxRetries) {
        // Delay 1.5 detik sebelum mencoba lagi
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    // Jika seluruh retry gagal, catat log sebagai FAILED
    await db.addNotificationLog({
      order_id: orderId,
      nomor_tujuan: formattedPhone,
      tipe,
      pesan: message,
      status: 'FAILED',
      response_payload: { error: lastError },
      retry_count: maxRetries,
    });

    return { success: false, error: 'Gagal mengirim pesan setelah retry' };
  },

  /**
   * Kirim WhatsApp konfirmasi saat order baru dilengkapi datanya
   */
  async sendOrderConfirmation(order: Order) {
    const settings = await db.getSettings();
    const formattedTotal = formatRupiah(order.total_harga);
    const defaultTpl = 'Halo {nama}, cucian {layanan} Anda ({berat} kg) sudah kami terima di {toko}. Invoice {invoice}. Total Rp {total}. Kami kabari saat selesai.';
    const tpl = settings.template_wa_konfirmasi || defaultTpl;
    const pesan = formatTemplate(tpl, {
      nama: order.nama_pelanggan,
      layanan: order.kategori_layanan || 'Pakaian',
      berat: order.berat,
      toko: settings.nama_laundry,
      invoice: order.kode_invoice,
      total: formattedTotal,
      alamat: order.alamat || '',
    });
    return this.sendMessage(order.id, order.nomor_wa, pesan, 'KONFIRMASI_ORDER');
  },

  /**
   * Kirim WhatsApp saat cucian selesai diproses
   * Pesan berbeda untuk Self Pick-up dan Delivery
   */
  async sendOrderCompleted(order: Order) {
    const settings = await db.getSettings();
    const formattedTotal = formatRupiah(order.total_harga);
    let pesan = '';

    if (order.opsi_pengambilan === 'Delivery') {
      const defaultTpl = 'Halo {nama}, laundry {layanan} Anda sudah Selesai dan akan segera diantar ke {alamat}. Total Rp {total}.';
      const tpl = settings.template_wa_selesai_delivery || defaultTpl;
      pesan = formatTemplate(tpl, {
        nama: order.nama_pelanggan,
        layanan: order.kategori_layanan || 'Pakaian',
        berat: order.berat,
        toko: settings.nama_laundry,
        invoice: order.kode_invoice,
        total: formattedTotal,
        alamat: order.alamat || 'alamat tujuan Anda',
      });
    } else {
      const defaultTpl = 'Halo {nama}, laundry {layanan} Anda sudah Selesai dan siap diambil di {toko}. Total Rp {total}. Terima kasih.';
      const tpl = settings.template_wa_selesai_pickup || defaultTpl;
      pesan = formatTemplate(tpl, {
        nama: order.nama_pelanggan,
        layanan: order.kategori_layanan || 'Pakaian',
        berat: order.berat,
        toko: settings.nama_laundry,
        invoice: order.kode_invoice,
        total: formattedTotal,
        alamat: order.alamat || '',
      });
    }

    return this.sendMessage(order.id, order.nomor_wa, pesan, 'CUCIAN_SELESAI');
  },
};
