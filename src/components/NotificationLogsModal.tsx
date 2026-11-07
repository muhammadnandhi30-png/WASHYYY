/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, CheckCircle, AlertTriangle, RefreshCw, Phone, Clock } from 'lucide-react';
import { NotificationLog } from '../types.js';
import { api } from '../services/api.js';

interface NotificationLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationLogsModal: React.FC<NotificationLogsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotificationLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6">
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Notifikasi WhatsApp (Fonnte API)</h3>
              <p className="text-xs text-slate-500">Riwayat pengiriman pesan konfirmasi dan cucian selesai</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={fetchLogs}
              title="Refresh riwayat log"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              aria-label="Segarkan log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup modal log"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto space-y-3">
          {loading && logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">Memuat riwayat log...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Belum ada riwayat pesan WhatsApp yang dikirim</p>
              <p className="text-xs text-slate-400 mt-1">Pesan otomatis tercatat saat pesanan disimpan atau berstatus Selesai.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        log.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {log.status === 'SENT' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                      )}
                      <span>{log.status}</span>
                    </span>

                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {log.tipe.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-sky-800 font-mono font-semibold">
                  <Phone className="w-3 h-3 text-sky-600" />
                  <span>{log.nomor_tujuan}</span>
                  {log.retry_count > 0 && (
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Percobaan ke-{log.retry_count + 1}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                  "{log.pesan}"
                </p>

                {log.response_payload && (
                  <details className="text-[11px] text-slate-500 font-mono">
                    <summary className="cursor-pointer hover:text-slate-700 py-1">
                      Lihat Response Payload
                    </summary>
                    <pre className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto text-[10px] text-slate-300">
                      {JSON.stringify(log.response_payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
