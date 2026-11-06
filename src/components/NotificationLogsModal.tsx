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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Notifikasi WhatsApp (Fonnte API)</h3>
              <p className="text-xs text-slate-400">Riwayat pengiriman pesan konfirmasi dan cucian selesai</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              title="Refresh log"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
          {loading && logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Memuat riwayat log...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Belum ada riwayat pesan WhatsApp yang dikirim.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        log.status === 'SENT'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {log.status === 'SENT' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                      )}
                      <span>{log.status}</span>
                    </span>

                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      {log.tipe.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-mono">
                  <Phone className="w-3 h-3" />
                  <span>{log.nomor_tujuan}</span>
                  {log.retry_count > 0 && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60">
                      Retry {log.retry_count}x
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                  "{log.pesan}"
                </p>

                {log.response_payload && (
                  <details className="text-[11px] text-slate-500 font-mono">
                    <summary className="cursor-pointer hover:text-slate-300">
                      Lihat Response Payload
                    </summary>
                    <pre className="mt-1 p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-[10px] text-slate-400">
                      {JSON.stringify(log.response_payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
