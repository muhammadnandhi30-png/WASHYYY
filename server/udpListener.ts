/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from 'dgram';
import dotenv from 'dotenv';
import { scaleDetector } from './scaleDetector.js';
import { ScalePacket } from './types.js';

dotenv.config();

const UDP_PORT = Number(process.env.UDP_PORT) || 4210;
const EXPECTED_DEVICE_KEY = process.env.SCALE_DEVICE_KEY || 'smart-laundry-secret-key-2026';

let serverSocket: dgram.Socket | null = null;
let lastSenderInfo: { address: string; port: number } | null = null;

export function initUDPListener() {
  try {
    serverSocket = dgram.createSocket('udp4');

    serverSocket.on('error', (err) => {
      console.error(`[UDP Socket] Error pada socket UDP: ${err.message}`);
      try {
        serverSocket?.close();
      } catch (e) {
        // Abaikan
      }
    });

    serverSocket.on('listening', () => {
      const address = serverSocket?.address();
      console.log(`[UDP Socket] Listener UDP aktif di port ${address?.port} (Menunggu paket ESP32)`);
    });

    serverSocket.on('message', async (msg, rinfo) => {
      lastSenderInfo = { address: rinfo.address, port: rinfo.port };

      try {
        const rawString = msg.toString().trim();
        const packet: ScalePacket = JSON.parse(rawString);

        // 1. Validasi Device Key untuk keamanan
        if (packet.key !== EXPECTED_DEVICE_KEY) {
          console.warn(`[UDP Socket] Paket ditolak dari ${rinfo.address}:${rinfo.port}. Device key tidak cocok!`);
          return;
        }

        // 2. Teruskan data berat ke scaleDetector
        await scaleDetector.processPacket(packet);

      } catch (parseError) {
        console.warn(`[UDP Socket] Gagal mem-parse paket JSON dari ${rinfo.address}:${rinfo.port}:`, msg.toString());
      }
    });

    serverSocket.bind(UDP_PORT, '0.0.0.0');
  } catch (err: any) {
    console.error(`[UDP Socket] Gagal menginisialisasi UDP listener: ${err?.message}`);
  }
}

/**
 * Kirim perintah Tare ke ESP32 melalui UDP jika pernah menerima paket dari ESP32
 */
export function sendTareCommandToESP32(): boolean {
  scaleDetector.tare();

  if (serverSocket && lastSenderInfo) {
    const payload = Buffer.from('TARE');
    serverSocket.send(payload, lastSenderInfo.port, lastSenderInfo.address, (err) => {
      if (err) {
        console.error('[UDP Socket] Gagal mengirim perintah TARE ke ESP32:', err);
      } else {
        console.log(`[UDP Socket] Perintah TARE dikirim ke ${lastSenderInfo?.address}:${lastSenderInfo?.port}`);
      }
    });
    return true;
  }
  return false;
}
