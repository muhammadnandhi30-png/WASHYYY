/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileCode2, Database, Cpu, BookOpen, Copy, Check } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'sql' | 'firmware' | 'guide'>('sql');
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlSchemaText = `-- SKEMA DATABASE SUPABASE (POSTGRESQL) - SMART LAUNDRY IOT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

INSERT INTO public.settings (key, value, description)
VALUES 
    ('harga_per_kg', '6000', 'Tarif cuci reguler per kg'),
    ('nama_laundry', 'Smart Laundry Express', 'Nama gerai')
ON CONFLICT (key) DO NOTHING;

-- 2. GENERATE KODE INVOICE (LDR-YYYYMMDD-XXX)
CREATE SEQUENCE IF NOT EXISTS public.invoice_daily_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'LDR-' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.invoice_daily_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_invoice VARCHAR(32) NOT NULL UNIQUE DEFAULT public.generate_invoice_code(),
    nama_pelanggan VARCHAR(120) DEFAULT 'Pelanggan Baru',
    nomor_wa VARCHAR(20) DEFAULT '',
    berat NUMERIC(6, 2) NOT NULL CHECK (berat > 0),
    harga_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 6000 CHECK (harga_per_kg >= 0),
    total_harga NUMERIC(12, 2) NOT NULL CHECK (total_harga >= 0),
    status_cucian VARCHAR(20) NOT NULL DEFAULT 'Menunggu' 
        CHECK (status_cucian IN ('Menunggu', 'Dicuci', 'Selesai', 'Diambil')),
    opsi_pengambilan VARCHAR(20) NOT NULL DEFAULT 'Self Pick-up' 
        CHECK (opsi_pengambilan IN ('Self Pick-up', 'Delivery')),
    alamat TEXT,
    status_pembayaran VARCHAR(20) NOT NULL DEFAULT 'Belum Bayar' 
        CHECK (status_pembayaran IN ('Belum Bayar', 'Lunas')),
    metode_pembayaran VARCHAR(20) 
        CHECK (metode_pembayaran IS NULL OR metode_pembayaran IN ('Tunai', 'Transfer', 'QRIS')),
    is_draft BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    CONSTRAINT check_alamat_delivery CHECK (
        is_draft = true OR opsi_pengambilan != 'Delivery' OR (alamat IS NOT NULL AND LENGTH(TRIM(alamat)) > 0)
    )
);

-- 4. TABEL NOTIFICATION_LOGS
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    nomor_tujuan VARCHAR(20) NOT NULL,
    tipe VARCHAR(30) NOT NULL,
    pesan TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    response_payload JSONB,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- RLS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses service role" ON public.orders FOR ALL TO service_role USING (true);
CREATE POLICY "Kasir terautentikasi baca orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kasir terautentikasi insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Kasir terautentikasi update orders" ON public.orders FOR UPDATE TO authenticated USING (true);`;

  const firmwareCode = `/**
 * FIRMWARE TIMBANGAN IOT (ESP32 + LOADCELL HX711)
 * Komunikasi: WiFiUDP ke Node.js Backend Port 4210
 */
#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include "HX711.h"

const char* WIFI_SSID     = "NAMA_WIFI_LAUNDRY";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";
IPAddress serverIP(192, 168, 1, 100); 
const uint16_t UDP_PORT   = 4210;
const char* DEVICE_ID     = "scale-01";
const char* DEVICE_KEY    = "smart-laundry-secret-key-2026";

const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN  = 22;
const int BUTTON_TARE_PIN   = 4;
const int LED_STATUS_PIN    = 2;

HX711 scale;
WiFiUDP udp;
float CALIBRATION_FACTOR = -22800.0;
unsigned long lastSendTime = 0;
float prevW = 0.0;
unsigned long stableStart = 0;
bool isStable = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(BUTTON_TARE_PIN, INPUT_PULLUP);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  udp.begin(UDP_PORT);
}

void loop() {
  if (scale.is_ready()) {
    float w = scale.get_units(5);
    if (w < 0.02 && w > -0.05) w = 0.0;

    // Deteksi stabil selisih < 0.02 kg selama 2 detik
    if (abs(w - prevW) < 0.02 && w >= 0.08) {
      if (stableStart == 0) stableStart = millis();
      else if (millis() - stableStart >= 2000) isStable = true;
    } else {
      stableStart = 0;
      isStable = false;
      prevW = w;
    }

    if (millis() - lastSendTime >= 300) {
      lastSendTime = millis();
      StaticJsonDocument<200> doc;
      doc["device_id"] = DEVICE_ID;
      doc["key"]       = DEVICE_KEY;
      doc["weight"]    = round(w * 100.0) / 100.0;
      doc["stable"]    = isStable;
      
      char buf[256];
      serializeJson(doc, buf);
      udp.beginPacket(serverIP, UDP_PORT);
      udp.write((const uint8_t*)buf, strlen(buf));
      udp.endPacket();
    }
  }
  delay(20);
}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dokumentasi Teknis & Firmware</h3>
              <p className="text-xs text-slate-400">Skema SQL Supabase, Firmware ESP32, dan Panduan Integrasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Skema SQL Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('firmware')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'firmware'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Firmware ESP32 (Arduino)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Alur Sistem & Fonnte</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">
                  Salin dan jalankan skrip ini pada menu <strong>SQL Editor</strong> di dashboard Supabase Anda.
                </span>
                <button
                  onClick={() => copyCode(sqlSchemaText, 'sql')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  {copied === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'sql' ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {sqlSchemaText}
              </pre>
            </div>
          )}

          {activeTab === 'firmware' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">
                  File tersimpan di <code className="text-cyan-400">/firmware/esp32_smart_laundry.ino</code>. Buka dengan Arduino IDE.
                </span>
                <button
                  onClick={() => copyCode(firmwareCode, 'firmware')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  {copied === 'firmware' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'firmware' ? 'Tersalin!' : 'Salin C++'}</span>
                </button>
              </div>

              {/* Pinout Table */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 block mb-2">Tabel Pinout ESP32 & Modul HX711:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">DT (Data)</span>
                    <span className="text-cyan-400 font-bold">GPIO 21</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">SCK (Clock)</span>
                    <span className="text-cyan-400 font-bold">GPIO 22</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Tombol Tare</span>
                    <span className="text-cyan-400 font-bold">GPIO 4</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">LED Status</span>
                    <span className="text-cyan-400 font-bold">GPIO 2</span>
                  </div>
                </div>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {firmwareCode}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Alur Kerja Sistem</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li><strong>Penimbangan:</strong> Cucian diletakkan di timbangan loadcell HX711. ESP32 membaca data dan mengirim paket UDP JSON setiap 300 ms ke backend port 4210.</li>
                  <li><strong>Deteksi Stabil:</strong> Backend mendeteksi jika selisih berat &lt; 0.02 kg selama 2 detik berturut-turut (berat minimal 0.10 kg).</li>
                  <li><strong>Auto-Draft & Pop-up:</strong> Backend otomatis membuat order draft di tabel orders dan memancarkan event <code>order:created</code> via Socket.io. Pop-up di dashboard kasir langsung terbuka otomatis.</li>
                  <li><strong>Konfirmasi & WA:</strong> Kasir melengkapi nama, nomor WA, opsi pengambilan (Self Pick-up / Delivery), lalu menekan Simpan. Notifikasi WA konfirmasi otomatis dikirim via Fonnte API.</li>
                  <li><strong>Cucian Selesai:</strong> Kasir mengubah status ke "Selesai", WA pemberitahuan terkirim otomatis ke pelanggan.</li>
                  <li><strong>Pelunasan & Selesai:</strong> Kasir mencatat pembayaran (Tunai / Transfer / QRIS) dan menyerahkan cucian (status "Diambil").</li>
                </ol>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Integrasi Gateway Fonnte WhatsApp</h4>
                <p>
                  Untuk menghubungkan nomor WhatsApp riil:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Daftar akun di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Fonnte.com</a>.</li>
                  <li>Tautkan perangkat WhatsApp Anda di dashboard Fonnte.</li>
                  <li>Salin API Token Anda dan tempelkan ke variabel <code>FONNTE_API_TOKEN</code> di file <code>.env</code>.</li>
                  <li>Sistem otomatis menormalisasi format nomor Indonesia (contoh: <code>0812...</code> diubah menjadi <code>62812...</code>) dan melakukan retry otomatis jika terjadi gangguan jaringan.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup Dokumentasi
          </button>
        </div>
      </div>
    </div>
  );
};
