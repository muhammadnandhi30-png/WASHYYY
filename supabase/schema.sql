-- ============================================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL)
-- SISTEM MANAJEMEN SMART LAUNDRY BERBASIS IOT
-- Versi: 1.0.0
-- ============================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABEL PENGATURAN SISTEM (settings)
-- Digunakan untuk menyimpan harga per kg dan konfigurasi dinamis lainnya
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- Masukkan default harga per kg (Rp 6.000)
INSERT INTO public.settings (key, value, description)
VALUES 
    ('harga_per_kg', '6000', 'Tarif standar cuci reguler per kilogram (dalam Rupiah)'),
    ('nama_laundry', 'Smart Laundry Express', 'Nama gerai laundry pada struk & pesan WhatsApp'),
    ('alamat_laundry', 'Jl. Sukses Makmur No. 42, Jakarta', 'Alamat fisik laundry'),
    ('kontak_laundry', '081234567890', 'Nomor CS laundry')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- ----------------------------------------------------------------------------
-- 2. SEQUENCE & FUNCTION PEMBUATAN KODE INVOICE OTOMATIS (LDR-YYYYMMDD-XXX)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.invoice_daily_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_code()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    seq_val INT;
    new_code TEXT;
BEGIN
    today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
    seq_val := NEXTVAL('public.invoice_daily_seq');
    new_code := 'LDR-' || today_str || '-' || LPAD(seq_val::TEXT, 3, '0');
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. TABEL PESANAN (orders)
-- Menyimpan seluruh order cucian, hasil timbangan, status pengerjaan & pembayaran
-- ----------------------------------------------------------------------------
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

    -- Constraint: Jika opsi delivery dipilih, alamat wajib diisi setelah tidak berstatus draft
    CONSTRAINT check_alamat_delivery CHECK (
        is_draft = true 
        OR opsi_pengambilan != 'Delivery' 
        OR (alamat IS NOT NULL AND LENGTH(TRIM(alamat)) > 0)
    )
);

-- Index untuk mempercepat pencarian invoice & filter dashboard
CREATE INDEX IF NOT EXISTS idx_orders_kode_invoice ON public.orders(kode_invoice);
CREATE INDEX IF NOT EXISTS idx_orders_status_cucian ON public.orders(status_cucian);
CREATE INDEX IF NOT EXISTS idx_orders_status_pembayaran ON public.orders(status_pembayaran);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. TABEL LOG NOTIFIKASI WHATSAPP (notification_logs)
-- Mencatat pengiriman pesan WhatsApp via API Fonnte beserta status & responnya
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    nomor_tujuan VARCHAR(20) NOT NULL,
    tipe VARCHAR(30) NOT NULL, -- 'KONFIRMASI_ORDER', 'CUCIAN_SELESAI', 'MANUAL_RESEND'
    pesan TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    response_payload JSONB,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notification_order_id ON public.notification_logs(order_id);

-- ----------------------------------------------------------------------------
-- 5. TRIGGER OTOMATIS: UPDATE updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('Asia/Jakarta', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_settings ON public.settings;
CREATE TRIGGER trigger_set_updated_at_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Kasir/Admin login via Supabase Auth; backend menggunakan service_role key
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk backend (service_role memiliki akses penuh tanpa restriksi)
CREATE POLICY "Akses penuh service role pada orders" ON public.orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Akses penuh service role pada settings" ON public.settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Akses penuh service role pada notification_logs" ON public.notification_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy untuk staf/kasir yang terautentikasi (Supabase Auth)
CREATE POLICY "Staf terautentikasi dapat membaca orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staf terautentikasi dapat membuat orders" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staf terautentikasi dapat memperbarui orders" ON public.orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staf terautentikasi dapat membaca settings" ON public.settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staf terautentikasi dapat mengubah settings" ON public.settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staf terautentikasi dapat melihat log notifikasi" ON public.notification_logs
    FOR SELECT TO authenticated USING (true);

-- Policy publik / anon: hanya diperbolehkan membaca pengaturan umum (opsional)
CREATE POLICY "Akses publik baca settings umum" ON public.settings
    FOR SELECT TO anon USING (true);
