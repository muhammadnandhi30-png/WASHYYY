/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { db, isUsingSupabase } from './db.js';
import { fonnteService } from './fonnteService.js';
import { scaleDetector } from './scaleDetector.js';
import { sendTareCommandToESP32 } from './udpListener.js';
import { Server as SocketIOServer } from 'socket.io';

export function createApiRouter(io: SocketIOServer) {
  const router = Router();

  // --------------------------------------------------------------------------
  // 1. ORDERS ENDPOINTS
  // --------------------------------------------------------------------------

  // GET /api/orders - Ambil semua order
  router.get('/orders', async (req, res) => {
    try {
      const orders = await db.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/orders/:id - Ambil detail 1 order
  router.get('/orders/:id', async (req, res) => {
    try {
      const order = await db.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders - Buat order manual
  router.post('/orders', async (req, res) => {
    try {
      const { berat, nama_pelanggan, nomor_wa, opsi_pengambilan, alamat, kategori_layanan, harga_per_kg, is_draft } = req.body;
      const parsedWeight = parseFloat(berat);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        return res.status(400).json({ success: false, error: 'Berat harus berupa angka positif' });
      }

      const order = await db.createOrder({
        berat: parsedWeight,
        nama_pelanggan,
        nomor_wa,
        opsi_pengambilan,
        alamat,
        kategori_layanan,
        harga_per_kg: harga_per_kg !== undefined && !isNaN(parseFloat(harga_per_kg)) ? parseFloat(harga_per_kg) : undefined,
        is_draft: is_draft ?? false,
      });

      // Emit event socket
      io.emit('order:created', order);

      // Kirim WA konfirmasi jika bukan draft dan ada nomor WA (background non-blocking)
      if (order.is_draft === false && order.nomor_wa && order.nomor_wa.trim().length >= 8) {
        fonnteService.sendOrderConfirmation(order).catch(console.error);
      }

      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/orders/:id - Lengkapi data pelanggan dari pop-up
  router.patch('/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_pelanggan, nomor_wa, opsi_pengambilan, alamat, berat, is_draft, kategori_layanan, harga_per_kg } = req.body;

      // Validasi alamat bila opsi Delivery
      if (opsi_pengambilan === 'Delivery' && (!alamat || alamat.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Alamat pengantaran wajib diisi jika memilih opsi Delivery',
        });
      }

      const updates: any = {};
      if (nama_pelanggan !== undefined) updates.nama_pelanggan = nama_pelanggan;
      if (nomor_wa !== undefined) updates.nomor_wa = nomor_wa;
      if (opsi_pengambilan !== undefined) updates.opsi_pengambilan = opsi_pengambilan;
      if (alamat !== undefined) updates.alamat = alamat;
      if (berat !== undefined) updates.berat = parseFloat(berat);
      if (is_draft !== undefined) updates.is_draft = is_draft;
      if (kategori_layanan !== undefined) updates.kategori_layanan = kategori_layanan;
      if (harga_per_kg !== undefined && !isNaN(parseFloat(harga_per_kg))) {
        updates.harga_per_kg = parseFloat(harga_per_kg);
      }

      const order = await db.updateOrder(id, updates);
      if (!order) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });

      // Emit socket order:updated
      io.emit('order:updated', order);

      // Jika data telah dilengkapi (bukan draft lagi) dan ada nomor WA, kirim WA konfirmasi order
      if (updates.is_draft === false && order.nomor_wa && order.nomor_wa.trim().length >= 8) {
        fonnteService.sendOrderConfirmation(order).catch(console.error);
      }

      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/orders/:id/status - Ubah status cucian (Menunggu | Dicuci | Selesai | Diambil)
  router.patch('/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status_cucian } = req.body;

      const allowedStatuses = ['Menunggu', 'Dicuci', 'Selesai', 'Diambil'];
      if (!allowedStatuses.includes(status_cucian)) {
        return res.status(400).json({ success: false, error: 'Status cucian tidak valid' });
      }

      const prevOrder = await db.getOrderById(id);
      if (!prevOrder) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });

      const updated = await db.updateOrder(id, { status_cucian });
      if (!updated) return res.status(404).json({ success: false, error: 'Gagal memperbarui status' });

      // Broadcast update ke client
      io.emit('order:updated', updated);

      // Jika status berubah menjadi "Selesai", kirim notifikasi WA otomatis via Fonnte!
      if (status_cucian === 'Selesai' && prevOrder.status_cucian !== 'Selesai') {
        if (updated.nomor_wa && updated.nomor_wa.trim().length >= 8) {
          console.log(`[Status] Order ${updated.kode_invoice} Selesai. Memicu notifikasi WA...`);
          fonnteService.sendOrderCompleted(updated).catch(console.error);
        } else {
          console.log(`[Status] Order ${updated.kode_invoice} Selesai tanpa nomor WA.`);
        }
      }

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/orders/:id/payment - Tandai pembayaran (Belum Bayar | Lunas) & metode
  router.patch('/orders/:id/payment', async (req, res) => {
    try {
      const { id } = req.params;
      const { status_pembayaran, metode_pembayaran } = req.body;

      const allowedPaymentStatuses = ['Belum Bayar', 'Lunas'];
      if (!allowedPaymentStatuses.includes(status_pembayaran)) {
        return res.status(400).json({ success: false, error: 'Status pembayaran tidak valid' });
      }

      if (status_pembayaran === 'Lunas' && !metode_pembayaran) {
        return res.status(400).json({
          success: false,
          error: 'Pilih metode pembayaran (Tunai / Transfer / QRIS) saat menandai lunas',
        });
      }

      const updated = await db.updateOrder(id, {
        status_pembayaran,
        metode_pembayaran: status_pembayaran === 'Lunas' ? metode_pembayaran : null,
      });

      if (!updated) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });

      io.emit('order:updated', updated);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders/:id/resend-wa - Kirim ulang notifikasi WhatsApp secara manual
  router.post('/orders/:id/resend-wa', async (req, res) => {
    try {
      const { id } = req.params;
      const order = await db.getOrderById(id);
      if (!order) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });

      if (!order.nomor_wa) {
        return res.status(400).json({ success: false, error: 'Nomor WhatsApp pelanggan belum diisi' });
      }

      let result;
      if (order.status_cucian === 'Selesai' || order.status_cucian === 'Diambil') {
        result = await fonnteService.sendOrderCompleted(order);
      } else {
        result = await fonnteService.sendOrderConfirmation(order);
      }

      res.json({ success: result.success, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/orders/:id - Hapus order
  router.delete('/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await db.deleteOrder(id);
      if (!success) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });
      io.emit('order:deleted', { id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 2. SETTINGS ENDPOINTS
  // --------------------------------------------------------------------------
  router.get('/settings', async (req, res) => {
    try {
      const settings = await db.getSettings();
      res.json({
        success: true,
        data: settings,
        system: {
          isUsingSupabase,
          hasFonnteToken: Boolean(process.env.FONNTE_API_TOKEN && process.env.FONNTE_API_TOKEN !== 'your_fonnte_token_here'),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/settings', async (req, res) => {
    try {
      const {
        harga_per_kg,
        harga_pakaian,
        harga_sprei,
        harga_karpet,
        nama_laundry,
        alamat_laundry,
        kontak_laundry,
        template_wa_konfirmasi,
        template_wa_selesai_pickup,
        template_wa_selesai_delivery,
      } = req.body;

      const updates: any = {};
      if (harga_per_kg !== undefined) {
        const p = parseFloat(harga_per_kg);
        if (isNaN(p) || p < 0) return res.status(400).json({ success: false, error: 'Harga harus berupa angka valid' });
        updates.harga_per_kg = p;
      }
      if (harga_pakaian !== undefined) {
        const p = parseFloat(harga_pakaian);
        if (!isNaN(p) && p >= 0) updates.harga_pakaian = p;
      }
      if (harga_sprei !== undefined) {
        const p = parseFloat(harga_sprei);
        if (!isNaN(p) && p >= 0) updates.harga_sprei = p;
      }
      if (harga_karpet !== undefined) {
        const p = parseFloat(harga_karpet);
        if (!isNaN(p) && p >= 0) updates.harga_karpet = p;
      }
      if (nama_laundry !== undefined) updates.nama_laundry = nama_laundry;
      if (alamat_laundry !== undefined) updates.alamat_laundry = alamat_laundry;
      if (kontak_laundry !== undefined) updates.kontak_laundry = kontak_laundry;
      if (template_wa_konfirmasi !== undefined) updates.template_wa_konfirmasi = template_wa_konfirmasi;
      if (template_wa_selesai_pickup !== undefined) updates.template_wa_selesai_pickup = template_wa_selesai_pickup;
      if (template_wa_selesai_delivery !== undefined) updates.template_wa_selesai_delivery = template_wa_selesai_delivery;

      const updated = await db.updateSettings(updates);
      io.emit('settings:updated', updated);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 3. SCALE & IOT SIMULATION ENDPOINTS
  // --------------------------------------------------------------------------
  router.get('/scale/status', (req, res) => {
    res.json({ success: true, data: scaleDetector.getStatus() });
  });

  router.post('/scale/tare', (req, res) => {
    sendTareCommandToESP32();
    res.json({ success: true, message: 'Timbangan di-tare ke 0 kg' });
  });

  // Endpoint simulator untuk menguji ESP32 langsung dari UI web tanpa hardware fisik
  router.post('/scale/simulate', async (req, res) => {
    try {
      const { weight, stable, device_id } = req.body;
      const parsedWeight = parseFloat(weight);

      await scaleDetector.processPacket({
        device_id: device_id || 'scale-01',
        key: process.env.SCALE_DEVICE_KEY || 'smart-laundry-secret-key-2026',
        weight: isNaN(parsedWeight) ? 0 : parsedWeight,
        stable: Boolean(stable),
        rssi: -58,
      });

      res.json({
        success: true,
        message: 'Data simulasi timbangan diterima',
        status: scaleDetector.getStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 4. NOTIFICATION LOGS ENDPOINT
  // --------------------------------------------------------------------------
  router.get('/notification-logs', async (req, res) => {
    try {
      const logs = await db.getNotificationLogs();
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
