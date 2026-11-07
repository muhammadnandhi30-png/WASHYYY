# Design Direction: Smart Laundry IoT Management

## Identitas & Karakter Desain
- **Produk:** Smart Laundry IoT Management System (Sistem Kasir POS & Timbangan Digital ESP32)
- **Karakter:** Kalem (calm), bersih (clean), higienis, soft modern, profesional, dan ergonomis untuk kasir harian.
- **Anti-Slop:** Menghilangkan tampilan klise buatan AI (latar gelap cyberpunk, gradien neon cyan-purple, glow berlebihan, badge pill bertumpuk, animasi ping/spin tanpa henti, dan tabel desktop yang dipaksa scroll horizontal di layar HP).

## Palet Warna
- **Background Utama:** `#f8fafc` (Slate 50 - terang, lembut, bersih)
- **Permukaan Kartu/Panel:** `#ffffff` (Putih solid dengan border halus `#e2e8f0` / slate-200)
- **Warna Aksen Utama:** Laundry Sky Slate (`#0284c7` / Sky 600, dengan varian lembut `bg-sky-50`, `text-sky-800`, `border-sky-200`)
- **Warna Status:**
  - *Sukses / Lunas / Selesai:* Soft Emerald (`bg-emerald-50`, `text-emerald-800`, `border-emerald-200`)
  - *Sedang Proses / Dicuci:* Soft Blue/Indigo (`bg-indigo-50`, `text-indigo-800`, `border-indigo-200`)
  - *Menunggu / Belum Bayar:* Soft Amber (`bg-amber-50`, `text-amber-800`, `border-amber-200`)
  - *Teks & Kontras:* `text-slate-900` (Judul & angka penting), `text-slate-700` (Body), `text-slate-500` (Label sekunder). Memenuhi rasio kontras WCAG AA (> 4.5:1).

## Tipografi & Hirarki
- **Font Utama:** System Sans-Serif (`font-sans` - bersih, mudah dibaca cepat oleh kasir di berbagai pencahayaan)
- **Font Angka/Kode:** Clean Monospace (`font-mono` - hanya untuk nominal Rupiah, berat timbangan, dan kode invoice)

## Dials
- **ENERGY:** 2 (Kalem, profesional, dapat dipercaya)
- **RHYTHM:** 2 (Tata letak terstruktur dengan kontras visual fungsional antara display timbangan dan daftar pesanan)
- **MOTION:** 1 (Transisi hover dan modal yang halus, tanpa loop/animasi berulang yang mengganggu fokus)

## Mobile & Responsivitas
- **Tata Letak Adaptif:**
  - Desktop: Tabel 7 kolom yang lapang dengan aksi cepat.
  - Mobile (< 768px): Kartu pesanan (Order Cards) yang rapi, detail pelanggan terlihat jelas tanpa harus scroll horizontal ke kanan.
- **Tap Targets:** Semua tombol dan kontrol interaktif memiliki touch target minimal 44px x 44px dengan jarak sentuh yang aman untuk ibu jari.
- **Header Mobile:** Status timbangan (online/offline dan tare) tetap terlihat di perangkat mobile, dan menu alat IoT / riwayat / pengaturan mudah diakses tanpa desak-desakan.

