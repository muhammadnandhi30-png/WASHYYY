# PRD - Sistem Manajemen Smart Laundry Berbasis IoT

Versi 1.0 | 6 November 2026 | Status: Draft

## 1. Ringkasan

Smart Laundry adalah sistem manajemen laundry berbasis web yang terhubung langsung dengan timbangan digital (ESP32 + Loadcell HX711). Berat cucian terbaca otomatis, order langsung dibuat, dan pelanggan menerima notifikasi WhatsApp otomatis melalui Fonnte. Tujuannya mengurangi input manual, kesalahan hitung, dan pekerjaan mengabari pelanggan satu per satu.

## 2. Latar Belakang dan Masalah

- Penimbangan dan pencatatan masih terpisah sehingga rawan salah catat berat dan harga.
- Kasir harus mengetik ulang data dan menghitung total secara manual.
- Pelanggan tidak mendapat kabar otomatis saat cucian selesai.
- Tidak ada riwayat order dan status yang terpusat.

## 3. Tujuan dan Metrik Keberhasilan

| Tujuan | Metrik |
| --- | --- |
| Mempercepat pembuatan order | Order draft muncul maksimal 3 detik setelah berat stabil |
| Akurasi berat | Selisih terhadap timbangan referensi maksimal 0,05 kg |
| Notifikasi andal | Minimal 95% pesan WA terkirim sukses |
| Mengurangi kesalahan hitung | Total harga 100% dihitung otomatis oleh sistem |

## 4. Pengguna

- **Kasir/Operator**: menimbang, melengkapi data pelanggan, mengubah status, mencatat pembayaran.
- **Admin/Pemilik**: mengatur harga per kg, melihat riwayat dan laporan sederhana.
- **Pelanggan**: menerima notifikasi WhatsApp (tidak login ke sistem).

## 5. Ruang Lingkup

**Termasuk (In Scope)**

- Pembacaan berat real-time dari ESP32 melalui UDP.
- Pembuatan order otomatis setelah penimbangan dan pop up pelengkapan data.
- Manajemen status cucian dan status pembayaran (manual).
- Notifikasi WhatsApp otomatis via Fonnte.
- Login kasir/admin dengan Supabase Auth.
- Pengaturan harga per kg.

**Tidak Termasuk (Out of Scope)**

- Payment gateway online (Midtrans dan sejenisnya).
- Aplikasi mobile native dan portal pelanggan.
- Manajemen stok deterjen, multi-cabang, dan laporan keuangan lanjutan.

## 6. Alur Utama

1. Kasir menaruh cucian di timbangan.
2. ESP32 membaca berat dan mengirim paket UDP ke server.
3. Backend meneruskan berat ke dashboard lewat Socket.io; angka tampil live.
4. Saat berat stabil, backend membuat order draft (status cucian "Menunggu", pembayaran "Belum Bayar") dan menghitung total harga.
5. Website langsung menampilkan pop up untuk melengkapi data pelanggan.
6. Kasir menyimpan; WA konfirmasi order dikirim.
7. Cucian diproses; saat status menjadi "Selesai", WA pemberitahuan terkirim.
8. Pelanggan mengambil atau menerima antaran; kasir menandai "Lunas" dan "Diambil".

## 7. Kebutuhan Fungsional

### 7.1 Penimbangan dan IoT

- FR-01: ESP32 mengirim paket UDP JSON setiap 300 ms berisi device\_id, key, weight, stable.
- FR-02: Backend memvalidasi device key dan mengabaikan paket tidak valid.
- FR-03: Sistem menganggap berat stabil jika selisih kurang dari 0,02 kg selama 2 detik dan berat minimal 0,1 kg.
- FR-04: Dashboard menampilkan status koneksi timbangan (online/offline) berdasarkan paket terakhir.
- FR-05: Mendukung tare dan kalibrasi pada firmware.

### 7.2 Order

- FR-06: Order draft dibuat otomatis saat berat stabil; satu penimbangan menghasilkan satu order (mencegah duplikat sampai timbangan dikosongkan).
- FR-07: Total harga = berat x harga per kg (diambil dari tabel settings).
- FR-08: Pop up muncul otomatis saat event order:created, berisi berat, harga, total, dan form pelanggan.
- FR-09: Form pelanggan: nama, nomor WA, opsi pengambilan (Self Pick-up / Delivery), alamat (wajib bila Delivery).
- FR-10: Order draft yang belum dilengkapi tetap tersimpan dan dapat dilanjutkan dari daftar order.
- FR-11: Setiap order memiliki kode invoice unik, contoh LDR-20261106-001.

### 7.3 Status dan Pembayaran

- FR-12: Status cucian: Menunggu, Dicuci, Selesai, Diambil.
- FR-13: Status pembayaran: Belum Bayar, Lunas; kasir mencatat metode (Tunai, Transfer, QRIS).
- FR-14: Perubahan status tercatat dengan waktu (updated\_at).

### 7.4 Notifikasi WhatsApp (Fonnte)

- FR-15: WA konfirmasi dikirim setelah data pelanggan disimpan.
- FR-16: WA otomatis dikirim saat status cucian menjadi "Selesai", dengan isi berbeda untuk Self Pick-up dan Delivery.
- FR-17: Nomor dinormalisasi (08xx menjadi 628xx).
- FR-18: Setiap pengiriman dicatat di notification\_logs beserta respons Fonnte; kegagalan di-retry maksimal 2 kali dan ditandai di UI.
- FR-19: Kasir dapat mengirim ulang notifikasi secara manual.

### 7.5 Auth dan Pengaturan

- FR-20: Login kasir/admin via Supabase Auth; halaman dashboard hanya untuk pengguna login.
- FR-21: Admin dapat mengubah harga per kg.

## 8. Kebutuhan Non-Fungsional

- Latensi berat dari ESP32 ke layar kurang dari 1 detik pada jaringan lokal.
- Backend dan ESP32 berada dalam jaringan yang dapat saling menjangkau (UDP port tetap, mis. 4210).
- Keamanan: device key pada paket UDP, service key Supabase hanya di backend, RLS aktif, token Fonnte di .env.
- Ketahanan: ESP32 reconnect WiFi otomatis; UDP tidak menjamin pengiriman sehingga data dikirim berkala dan backend mengambil nilai terbaru.
- Antarmuka responsif untuk tablet dan desktop.

## 9. Arsitektur

```
ESP32 + HX711 --UDP--> Node.js (dgram + Express + Socket.io) --Socket.io--> React Dashboard
                                   |-- Supabase (PostgreSQL + Auth)
                                   |-- Fonnte API (WhatsApp)
```

Catatan: browser tidak dapat menerima UDP, sehingga backend menerima UDP dari ESP32 lalu meneruskan ke frontend lewat Socket.io.

## 10. Model Data

**orders**: id (UUID), kode\_invoice, nama\_pelanggan, nomor\_wa, berat, harga\_per\_kg, total\_harga, status\_cucian, opsi\_pengambilan, alamat, status\_pembayaran, metode\_pembayaran, created\_at, updated\_at.

**settings**: key, value (mis. harga\_per\_kg = 6000).

**notification\_logs**: id, order\_id, tipe, pesan, status, response, created\_at.

## 11. Kontrak Komunikasi

**Paket UDP (ESP32 ke backend)**

```json
{"device_id":"scale-01","key":"SECRET","weight":1.25,"stable":true}
```

**Event Socket.io (backend ke frontend)**

- weight:update: berat live dan status stabil.
- order:created: order draft baru, memicu pop up.
- order:updated: perubahan status order.
- scale:status: online/offline.

**Endpoint REST (ringkas)**

- GET /api/orders, GET /api/orders/:id
- PATCH /api/orders/:id (lengkapi data pelanggan)
- PATCH /api/orders/:id/status
- PATCH /api/orders/:id/payment
- POST /api/orders/:id/resend-wa
- GET/PUT /api/settings

## 12. Template Pesan WhatsApp

- **Konfirmasi**: "Halo {nama}, cucian Anda ({berat} kg) sudah kami terima. Invoice {kode}. Total Rp {total}. Kami kabari saat selesai."
- **Selesai - Self Pick-up**: "Halo {nama}, laundry Anda sudah Selesai dan siap diambil. Total Rp {total}. Terima kasih."
- **Selesai - Delivery**: "Halo {nama}, laundry Anda sudah Selesai dan akan segera diantar ke {alamat}. Total Rp {total}."

## 13. Desain Antarmuka

- **Dashboard Kasir**: angka berat besar, indikator stabil dan koneksi, daftar order terbaru.
- **Pop up Order**: muncul otomatis, total terhitung otomatis, kolom alamat muncul bila Delivery.
- **Daftar Order**: filter status, aksi ubah status, tandai lunas, kirim ulang WA.
- **Pengaturan**: harga per kg.

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Pembacaan HX711 berisik | Rata-rata sampel, deteksi stabil, kalibrasi |
| Paket UDP hilang | Pengiriman berkala, ambil nilai terbaru |
| Order duplikat dari satu penimbangan | Reset penanda saat timbangan kosong |
| Kegagalan Fonnte atau nomor tidak valid | Retry, log, tombol kirim ulang |
| Akses tidak sah ke port UDP | Device key dan pembatasan jaringan/firewall |
| Pop up tertutup sebelum data lengkap | Order draft tetap tersimpan |

## 15. Rencana Rilis

1. **Fase 1**: skema Supabase, backend (UDP, Socket.io, Fonnte).
2. **Fase 2**: firmware ESP32 dan kalibrasi.
3. **Fase 3**: dashboard React, pop up order, daftar order.
4. **Fase 4**: pengujian end-to-end, kalibrasi lapangan, perbaikan.

## 16. Kriteria Penerimaan

- Berat tampil live di dashboard dengan latensi kurang dari 1 detik.
- Setelah berat stabil, order draft terbentuk dan pop up muncul otomatis.
- Total harga sesuai berat x harga per kg.
- Mengubah status ke "Selesai" mengirim WA yang sesuai opsi pengambilan.
- Kasir dapat menandai Lunas dan menutup order.
- Hanya paket UDP dengan device key valid yang diproses.

## 17. Pertanyaan Terbuka

- Apakah ada lebih dari satu timbangan atau satu kasir yang aktif bersamaan?
- Apakah harga berbeda per layanan (cuci, setrika, kilat), atau satu harga per kg?
- Apakah biaya antar (Delivery) dikenakan terpisah?
- Apakah kasir perlu mencetak struk atau invoice?
