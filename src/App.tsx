/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { WeightDisplay } from './components/WeightDisplay.js';
import { AutoOrderModal } from './components/AutoOrderModal.js';
import { OrderList } from './components/OrderList.js';
import { PaymentModal } from './components/PaymentModal.js';
import { ScaleSimulator } from './components/ScaleSimulator.js';
import { SettingsModal } from './components/SettingsModal.js';
import { NotificationLogsModal } from './components/NotificationLogsModal.js';
import { DocsModal } from './components/DocsModal.js';
import { api } from './services/api.js';
import { getSocket } from './services/socket.js';
import { Order, ScaleStatus, Settings, StatusCucian, MetodePembayaran } from './types.js';
import { Bell, Sparkles } from 'lucide-react';

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

  // Modal States
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const [cashierName, setCashierName] = useState('Kasir Pagi');
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

    // Otomatis membuka pop-up saat order baru terbentuk dari kestabilan berat!
    socket.on('order:created', (newOrder: Order) => {
      console.log('[Socket Event] order:created diterima:', newOrder);
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
        return [newOrder, ...prev];
      });

      // Tampilkan Pop Up secara instan
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

    return () => {
      socket.off('weight:update');
      socket.off('scale:status');
      socket.off('order:created');
      socket.off('order:updated');
      socket.off('order:deleted');
      socket.off('settings:updated');
    };
  }, [loadInitialData]);

  // Handler: Tare Timbangan
  const handleTare = async () => {
    try {
      await api.tareScale();
      showToast('Timbangan berhasil di-reset ke 0.00 kg');
    } catch (err: any) {
      showToast('Gagal tare timbangan: ' + err.message);
    }
  };

  // Handler: Input Order Manual
  const handleManualOrder = async () => {
    const inputWeight = prompt('Masukkan berat cucian (kg):', '2.5');
    if (!inputWeight) return;
    const w = parseFloat(inputWeight);
    if (isNaN(w) || w <= 0) {
      alert('Berat harus berupa angka lebih dari 0');
      return;
    }

    try {
      const order = await api.createOrder({ berat: w });
      setActiveOrderModal(order);
      setIsOrderModalOpen(true);
    } catch (err: any) {
      showToast('Gagal membuat order: ' + err.message);
    }
  };

  // Handler: Simpan data pelanggan dari pop-up
  const handleSaveOrderDraft = async (orderId: string, data: Partial<Order>) => {
    const updated = await api.updateOrder(orderId, data);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    showToast(
      data.is_draft === false
        ? `Order ${updated.kode_invoice} berhasil disimpan! Pesan WhatsApp terkirim.`
        : `Order ${updated.kode_invoice} disimpan sebagai draft.`
    );
  };

  // Handler: Update status cucian
  const handleUpdateStatus = async (orderId: string, status: StatusCucian) => {
    try {
      const updated = await api.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (status === 'Selesai') {
        showToast(`Cucian ${updated.kode_invoice} SELESAI. Notifikasi WhatsApp terkirim otomatis!`);
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
      showToast(`Pembayaran ${updated.kode_invoice} LUNAS via ${metode}`);
    } catch (err: any) {
      showToast('Gagal update pembayaran: ' + err.message);
    }
  };

  // Handler: Kirim ulang WA
  const handleResendWhatsApp = async (orderId: string) => {
    try {
      const res = await api.resendWhatsApp(orderId);
      if (res.success) {
        showToast('Pesan WhatsApp berhasil dikirim ulang ke pelanggan!');
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

  // Switch kasir profile
  const handleSwitchCashier = () => {
    const next = cashierName === 'Kasir Pagi' ? 'Kasir Sore' : 'Kasir Pagi';
    setCashierName(next);
    showToast(`Beralih profil ke ${next}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 border border-cyan-500/50 shadow-2xl shadow-cyan-950/60 text-white px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-spin" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        scaleStatus={scaleStatus}
        settings={settings}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onTare={handleTare}
        cashierName={cashierName}
        onSwitchCashier={handleSwitchCashier}
        isUsingSupabase={systemInfo.isUsingSupabase}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Live Weight Banner */}
        <WeightDisplay
          scaleStatus={scaleStatus}
          settings={settings}
          onTare={handleTare}
          onManualOrder={handleManualOrder}
        />

        {/* Orders Table & Cashier Actions */}
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
        />
      </main>

      {/* Modals */}
      <AutoOrderModal
        order={activeOrderModal}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrderDraft}
      />

      <PaymentModal
        order={activePaymentOrder}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <ScaleSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currentScaleWeight={scaleStatus.currentWeight}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Smart Laundry IoT Management System &bull; ESP32 + Loadcell HX711 &bull; Fonnte WhatsApp API &bull; Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}
