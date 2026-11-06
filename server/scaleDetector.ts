/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server as SocketIOServer } from 'socket.io';
import { db } from './db.js';
import { ScaleStatus, ScalePacket } from './types.js';

interface WeightSample {
  weight: number;
  timestamp: number;
}

export class ScaleDetector {
  private io: SocketIOServer | null = null;
  private sampleHistory: WeightSample[] = [];
  private readonly STABILITY_DURATION_MS = 2000; // 2 detik stabil
  private readonly STABILITY_MAX_DELTA = 0.02;    // Selisih < 0.02 kg
  private readonly MIN_VALID_WEIGHT = 0.10;       // Minimal 0.1 kg untuk membuat order
  private readonly EMPTY_SCALE_THRESHOLD = 0.05;  // Reset penanda jika timbangan kosong (< 0.05 kg)

  private hasCreatedOrderForCurrentLoad = false;
  private isCurrentlyStable = false;
  private currentWeight = 0.0;
  private lastPacketTime: number = 0;
  private deviceId = 'scale-01';
  private lastRssi: number | undefined;

  // Watchdog offline check
  private offlineTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startWatchdog();
  }

  public setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Status timbangan saat ini
   */
  public getStatus(): ScaleStatus {
    const isOnline = Date.now() - this.lastPacketTime < 3000;
    return {
      online: isOnline,
      lastSeen: this.lastPacketTime > 0 ? new Date(this.lastPacketTime).toISOString() : null,
      currentWeight: this.currentWeight,
      isStable: this.isCurrentlyStable,
      deviceId: this.deviceId,
      rssi: this.lastRssi,
    };
  }

  /**
   * Memproses paket berat yang masuk (dari socket UDP atau simulator)
   */
  public async processPacket(packet: ScalePacket) {
    const now = Date.now();
    this.lastPacketTime = now;
    this.deviceId = packet.device_id || this.deviceId;
    this.currentWeight = Math.max(0, Math.round(packet.weight * 100) / 100);
    this.lastRssi = packet.rssi;

    // Masukkan sampel baru ke history
    this.sampleHistory.push({ weight: this.currentWeight, timestamp: now });

    // Hapus sampel yang lebih tua dari STABILITY_DURATION_MS (2 detik)
    this.sampleHistory = this.sampleHistory.filter(
      (s) => now - s.timestamp <= this.STABILITY_DURATION_MS + 200
    );

    // Cek apakah timbangan sudah dikosongkan (< 0.05 kg) untuk mereset penanda
    if (this.currentWeight < this.EMPTY_SCALE_THRESHOLD) {
      if (this.hasCreatedOrderForCurrentLoad) {
        console.log('[ScaleDetector] Timbangan telah dikosongkan. Siap untuk penimbangan berikutnya.');
      }
      this.hasCreatedOrderForCurrentLoad = false;
      this.isCurrentlyStable = false;
    }

    // Evaluasi kestabilan:
    // Timbangan harus memiliki riwayat data minimal selama 2 detik penuh
    const oldestSample = this.sampleHistory[0];
    const hasEnoughDuration = oldestSample && now - oldestSample.timestamp >= this.STABILITY_DURATION_MS;

    if (hasEnoughDuration && this.currentWeight >= this.MIN_VALID_WEIGHT) {
      const weights = this.sampleHistory.map((s) => s.weight);
      const minW = Math.min(...weights);
      const maxW = Math.max(...weights);
      const delta = maxW - minW;

      // Jika selisih max - min dalam 2 detik < 0.02 kg (atau jika firmware ESP32 sudah menandai stable)
      if (delta < this.STABILITY_MAX_DELTA || packet.stable === true) {
        this.isCurrentlyStable = true;

        // Otomatis buat order draft jika belum dibuat untuk beban ini
        if (!this.hasCreatedOrderForCurrentLoad) {
          this.hasCreatedOrderForCurrentLoad = true;
          await this.triggerAutoDraftOrder(this.currentWeight);
        }
      } else {
        this.isCurrentlyStable = false;
      }
    } else {
      this.isCurrentlyStable = false;
    }

    // Broadcast ke seluruh client frontend via Socket.io
    if (this.io) {
      this.io.emit('weight:update', {
        weight: this.currentWeight,
        stable: this.isCurrentlyStable,
        online: true,
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Otomatis membuat order draft dan broadcast event 'order:created'
   */
  private async triggerAutoDraftOrder(weight: number) {
    try {
      console.log(`[ScaleDetector] Berat stabil terdeteksi (${weight} kg). Membuat order draft otomatis...`);
      const newOrder = await db.createDraftOrder(weight);

      console.log(`[ScaleDetector] Order draft berhasil dibuat: ${newOrder.kode_invoice} (Total: Rp ${newOrder.total_harga})`);

      if (this.io) {
        // Broadcast ke semua kasir yang terhubung untuk memunculkan modal pop-up
        this.io.emit('order:created', newOrder);
      }
    } catch (err) {
      console.error('[ScaleDetector] Gagal membuat order draft otomatis:', err);
    }
  }

  /**
   * Reset timbangan secara manual (Tare)
   */
  public tare() {
    this.currentWeight = 0.0;
    this.sampleHistory = [];
    this.hasCreatedOrderForCurrentLoad = false;
    this.isCurrentlyStable = false;
    if (this.io) {
      this.io.emit('weight:update', {
        weight: 0.0,
        stable: true,
        online: true,
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Watchdog timer untuk memantau status online/offline timbangan
   */
  private startWatchdog() {
    this.offlineTimer = setInterval(() => {
      const isOnline = Date.now() - this.lastPacketTime < 3000;
      if (this.io) {
        this.io.emit('scale:status', {
          online: isOnline,
          lastSeen: this.lastPacketTime > 0 ? new Date(this.lastPacketTime).toISOString() : null,
          deviceId: this.deviceId,
        });
      }
    }, 2000);
  }

  public cleanup() {
    if (this.offlineTimer) {
      clearInterval(this.offlineTimer);
    }
  }
}

export const scaleDetector = new ScaleDetector();
