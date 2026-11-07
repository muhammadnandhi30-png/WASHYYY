/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { DashboardHeader } from './components/DashboardHeader.js';
import { ServiceCards, ServiceItem } from './components/ServiceCards.js';
import { RevenueCard } from './components/RevenueCard.js';
import { WeeklyReportCard } from './components/WeeklyReportCard.js';
import { WeightDisplay } from './components/WeightDisplay.js';
import { OrderList } from './components/OrderList.js';
import { AutoOrderModal } from './components/AutoOrderModal.js';
import { PaymentModal } from './components/PaymentModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { NotificationLogsModal } from './components/NotificationLogsModal.js';
import { DocsModal } from './components/DocsModal.js';
import { InvoiceModal } from './components/InvoiceModal.js';
import { api } from './services/api.js';
import { getSocket } from './services/socket.js';
import { Order, ScaleStatus, Settings, StatusCucian, MetodePembayaran } from './types.js';
import { CheckCircle2, Shirt, Layers, Grid } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [scaleStatus, setScaleStatus] = useState<ScaleStatus>({
    online: false,
    lastSeen: null,
    currentWeight: 0.0,
    isStable: false,
    deviceId: 'scale-01',
  });
  const [settings, setSettings] = useState<Settings>({
    harga_per_kg: 6000,
    nama_laundry: 'Smart Laundry Express',
    alamat_laundry: 'Jl. Sukses Makmur No. 42, Jakarta',
    kontak_laundry: '081234567890',
    udp_port: 4210,
    device_id: 'scale-01',
    device_key: 'smart-laundry-secret-key-2026',
  });
  const [systemInfo, setSystemInfo] = useState({
    isUsingSupabase: false,
    hasFonnteToken: false,
  });

  // Navigation & UI state
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('karpet');

  // Modal States
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const cashierName = 'Kasir';
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [ordersData, settingsData, scaleData] = await Promise.all([
        api.getOrders(),
        api.getSettings(),
        api.getScaleStatus(),
      ]);

      setOrders(ordersData);
      setSettings(settingsData.settings);
      setSystemInfo(settingsData.system);
      setScaleStatus(scaleData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // 2. Setup Socket.io real-time listeners
    const socket = getSocket();

    socket.on('weight:update', (data: any) => {
      setScaleStatus((prev) => ({
        ...prev,
        currentWeight: data.weight,
        isStable: data.stable,
        online: data.online ?? prev.online,
        deviceId: data.deviceId || prev.deviceId,
      }));
    });

    socket.on('scale:status', (data: any) => {
      setScaleStatus((prev) => ({
        ...prev,
        online: data.online,
        lastSeen: data.lastSeen,
        deviceId: data.deviceId || prev.deviceId,
      }));
    });

    // Otomatis membuka pop-up saat order baru terbentuk dari kestabilan berat
    socket.on('order:created', (newOrder: Order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
        return [newOrder, ...prev];
      });

      // Tampilkan Pop Up
      setActiveOrderModal(newOrder);
      setIsOrderModalOpen(true);
      showToast(`Order baru terdeteksi: ${newOrder.kode_invoice} (${newOrder.berat} kg)`);
    });

    socket.on('order:updated', (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    socket.on('order:deleted', ({ id }: { id: string }) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    });

    socket.on('settings:updated', (newSettings: Settings) => {
      setSettings(newSettings);
    });

    // Sinkronisasi berkala (polling fallback) untuk serverless Vercel / multi-device
    const pollInterval = setInterval(() => {
      api.getOrders().then((latest) => {
        setOrders((prev) => {
          if (
            latest.length !== prev.length ||
            latest[0]?.id !== prev[0]?.id ||
            latest[0]?.updated_at !== prev[0]?.updated_at
          ) {
            return latest;
          }
          return prev;
        });
      }).catch(() => {});
    }, 5000);

    const onFocus = () => {
      api.getOrders().then(setOrders).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
      socket.off('weight:update');
      socket.off('scale:status');
      socket.off('order:created');
      socket.off('order:updated');
      socket.off('order:deleted');
      socket.off('settings:updated');
    };
  }, [loadInitialData]);

  // Layanan Laundry
  const services: ServiceItem[] = useMemo(() => [
    {
      id: 'pakaian',
      name: 'Pakaian',
      rate: settings.harga_pakaian || settings.harga_per_kg || 6000,
      icon: Shirt,
    },
    {
      id: 'sprey',
      name: 'Sprey',
      rate: settings.harga_sprei || 12000,
      icon: Layers,
    },
    {
      id: 'karpet',
      name: 'Karpet',
      rate: settings.harga_karpet || 15000,
      icon: Grid,
    },
  ], [settings.harga_per_kg, settings.harga_pakaian, settings.harga_sprei, settings.harga_karpet]);

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  // Handler: Tare Timbangan
  const handleTare = async () => {
    try {
      await api.tareScale();
      showToast('Timbangan berhasil di-reset ke 0.00 kg');
    } catch (err: any) {
      showToast('Gagal tare timbangan: ' + err.message);
    }
  };

  // Handler: Input Order Manual - Membuka modal SECARA INSTAN (0ms delay)
  const handleManualOrder = () => {
    const defaultWeight = scaleStatus.currentWeight > 0.05 ? scaleStatus.currentWeight : 2.5;
    const tempOrder: Order = {
      id: 'new-' + Date.now(),
      kode_invoice: 'Draft Baru',
      nama_pelanggan: '',
      nomor_wa: '',
      berat: defaultWeight,
      harga_per_kg: selectedService.rate,
      total_harga: Math.round(defaultWeight * selectedService.rate),
      status_cucian: 'Menunggu',
      opsi_pengambilan: 'Self Pick-up',
      alamat: '',
      status_pembayaran: 'Belum Bayar',
      metode_pembayaran: null,
      kategori_layanan: (selectedService.name as any) || 'Pakaian',
      is_draft: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveOrderModal(tempOrder);
    setIsOrderModalOpen(true);
  };

  // Handler: Simpan data pelanggan dari pop-up (Optimistic Update: langsung tampil di tabel tanpa refresh)
  const handleSaveOrderDraft = async (orderId: string, data: Partial<Order>) => {
    const isNew = orderId.startsWith('new-');

    // 1. Optimistic Update instan ke state lokal
    const optimisticOrder: Order = {
      id: orderId,
      kode_invoice: isNew ? 'Menyimpan...' : (activeOrderModal?.kode_invoice || 'LDR-REF'),
      nama_pelanggan: data.nama_pelanggan || 'Pelanggan',
      nomor_wa: data.nomor_wa || '',
      berat: data.berat || 1.0,
      harga_per_kg: data.harga_per_kg || 6000,
      total_harga: Math.round((data.berat || 1.0) * (data.harga_per_kg || 6000)),
      status_cucian: 'Menunggu',
      opsi_pengambilan: data.opsi_pengambilan || 'Self Pick-up',
      alamat: data.alamat || '',
      status_pembayaran: 'Belum Bayar',
      metode_pembayaran: null,
      kategori_layanan: data.kategori_layanan || 'Pakaian',
      is_draft: data.is_draft ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === orderId);
      if (exists) {
        return prev.map((o) => (o.id === orderId ? { ...o, ...data } : o));
      }
      return [optimisticOrder, ...prev];
    });

    try {
      let savedOrder: Order;
      if (isNew) {
        // Panggil endpoint createOrder (1x round trip langsung jadi)
        savedOrder = await api.createOrder({
          berat: data.berat || 1.0,
          nama_pelanggan: data.nama_pelanggan,
          nomor_wa: data.nomor_wa,
          opsi_pengambilan: data.opsi_pengambilan,
          alamat: data.alamat,
          kategori_layanan: data.kategori_layanan,
          harga_per_kg: data.harga_per_kg,
          is_draft: data.is_draft,
        });
      } else {
        savedOrder = await api.updateOrder(orderId, data);
      }

      // 2. Perbarui dengan data resmi dari database
      setOrders((prev) => {
        const withoutTemp = prev.filter((o) => o.id !== orderId && o.id !== savedOrder.id);
        return [savedOrder, ...withoutTemp];
      });

      showToast(
        data.is_draft === false
          ? `Order ${savedOrder.kode_invoice} berhasil disimpan.`
          : `Order ${savedOrder.kode_invoice} disimpan sebagai draft.`
      );
    } catch (err: any) {
      showToast('Gagal menyimpan order: ' + err.message);
      // Reload daftar asli jika terjadi error
      api.getOrders().then(setOrders).catch(console.error);
    }
  };

  // Handler: Update status cucian
  const handleUpdateStatus = async (orderId: string, status: StatusCucian) => {
    try {
      const updated = await api.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (status === 'Selesai') {
        showToast(`Cucian ${updated.kode_invoice} selesai. Notifikasi WhatsApp terkirim.`);
      } else {
        showToast(`Status ${updated.kode_invoice} diubah ke ${status}`);
      }
    } catch (err: any) {
      showToast('Gagal mengubah status: ' + err.message);
    }
  };

  // Handler: Pembayaran Lunas
  const handleConfirmPayment = async (orderId: string, metode: MetodePembayaran) => {
    try {
      const updated = await api.updatePayment(orderId, 'Lunas', metode);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Pembayaran ${updated.kode_invoice} lunas via ${metode}`);
    } catch (err: any) {
      showToast('Gagal update pembayaran: ' + err.message);
    }
  };

  // Handler: Kirim ulang WA
  const handleResendWhatsApp = async (orderId: string) => {
    try {
      const res = await api.resendWhatsApp(orderId);
      if (res.success) {
        showToast('Pesan WhatsApp berhasil dikirim ulang ke pelanggan.');
      } else {
        showToast('Gagal mengirim WhatsApp: ' + (res.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      showToast('Gagal kirim ulang WA: ' + err.message);
    }
  };

  // Handler: Hapus order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order berhasil dihapus');
    } catch (err: any) {
      showToast('Gagal menghapus order: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-sky-100 selection:text-sky-900 antialiased overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 transition-all duration-200">
          <div className="bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-xl shadow-lg shadow-slate-200/80 flex items-center space-x-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-slate-700">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        settings={settings}
        scaleStatus={scaleStatus}
        ordersCount={orders.length}
        onTare={handleTare}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        cashierName={cashierName}
        isUsingSupabase={systemInfo.isUsingSupabase}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <DashboardHeader
          scaleStatus={scaleStatus}
          onTare={handleTare}
          onNewOrder={handleManualOrder}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dashboard Grid Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 xl:p-8 space-y-5 w-full">
          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
            {/* Left Column: Service Cards, Digital Scale & Order Table */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-5">
              {/* Row 1: 3 Service Selector Cards */}
              <ServiceCards
                services={services}
                selectedServiceId={selectedServiceId}
                onSelectService={(s) => setSelectedServiceId(s.id)}
              />

              {/* Row 2: Digital Scale Real-Time Display Card */}
              <WeightDisplay
                scaleStatus={scaleStatus}
                settings={settings}
                selectedService={selectedService}
                onTare={handleTare}
                onManualOrder={handleManualOrder}
              />

              {/* Row 3: Orderan terbaru Table */}
              <OrderList
                orders={orders}
                onEditOrder={(order) => {
                  setActiveOrderModal(order);
                  setIsOrderModalOpen(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onOpenPaymentModal={(order) => {
                  setActivePaymentOrder(order);
                  setIsPaymentModalOpen(true);
                }}
                onResendWhatsApp={handleResendWhatsApp}
                onDeleteOrder={handleDeleteOrder}
                onPrintInvoice={(order) => {
                  setActiveInvoiceOrder(order);
                  setIsInvoiceOpen(true);
                }}
              />
            </div>

            {/* Right Column: Pemasukan & Laporan Mingguan */}
            <div className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {/* Pemasukan Stat Card */}
              <RevenueCard orders={orders} />

              {/* Laporan Mingguan Stat Card */}
              <WeeklyReportCard orders={orders} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 w-full">
          <p className="w-full px-4">
            Smart Laundry IoT Management System &bull; Integrasi ESP32 & Loadcell HX711 &bull; Fonnte WhatsApp Gateway &bull; Supabase Database
          </p>
        </footer>
      </div>

      {/* Modals */}
      <AutoOrderModal
        order={activeOrderModal}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrderDraft}
        settings={settings}
      />

      <PaymentModal
        order={activePaymentOrder}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <InvoiceModal
        order={activeInvoiceOrder}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (updates) => {
          const updated = await api.updateSettings(updates);
          setSettings(updated);
        }}
        isUsingSupabase={systemInfo.isUsingSupabase}
        hasFonnteToken={systemInfo.hasFonnteToken}
      />

      <NotificationLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
