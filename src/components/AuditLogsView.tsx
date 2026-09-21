import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Download, 
  RefreshCw,
  Eye,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Sliders,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuditLog, AuditActionType } from '../types';
import { exportAuditLogsToCsv } from '../lib/csvExport';

interface AuditLogsViewProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs,
  loading = false,
  onRefresh
}) => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        (log.title && log.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.actorName && log.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesRole = filterRole === 'all' || log.actorRole === filterRole;

      return matchesSearch && matchesAction && matchesRole;
    });
  }, [logs, searchTerm, filterAction, filterRole]);

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'document_verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Verifikasi Dokumen
          </span>
        );
      case 'document_uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Upload Dokumen
          </span>
        );
      case 'document_deleted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Hapus Dokumen
          </span>
        );
      case 'user_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            Tambah Pengguna
          </span>
        );
      case 'user_updated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <User className="w-3.5 h-3.5 text-amber-600" />
            Perbarui Pengguna
          </span>
        );
      case 'assessment_deleted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Hapus Penilaian
          </span>
        );
      case 'assessment_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            Simpan Penilaian
          </span>
        );
      case 'schedule_created':
      case 'schedule_updated':
      case 'schedule_deleted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
            Jadwal Supervisi
          </span>
        );
      case 'settings_updated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            Pengaturan Sistem
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-700" />
            Audit Logs & Riwayat Aktivitas Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan aktivitas penting (verifikasi dokumen, modifikasi data pengguna, penghapusan penilaian supervisi) untuk akuntabilitas manajerial
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              id="btn-refresh-audit-logs"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              Segarkan
            </button>
          )}

          <button
            type="button"
            id="btn-export-audit-csv"
            onClick={() => exportAuditLogsToCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-audit-input"
            type="text"
            placeholder="Cari aktivitas, pelaksana, target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            id="filter-audit-action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="all">Semua Tipe Aksi</option>
            <option value="document_verified">Verifikasi Dokumen</option>
            <option value="user_updated">Pembaruan Pengguna</option>
            <option value="user_created">Pembuatan Pengguna</option>
            <option value="assessment_deleted">Penghapusan Penilaian</option>
            <option value="assessment_created">Penyimpanan Penilaian</option>
            <option value="document_uploaded">Upload Dokumen</option>
            <option value="document_deleted">Hapus Dokumen</option>
            <option value="schedule_created">Pembuatan Jadwal</option>
            <option value="settings_updated">Pengaturan Sistem</option>
          </select>

          <select
            id="filter-audit-role"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="all">Semua Peran Pelaksana</option>
            <option value="admin">Administrator</option>
            <option value="kamad">Kepala Madrasah</option>
            <option value="penilai">Guru Penilai</option>
            <option value="guru">Guru</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-44">Waktu</th>
                <th className="py-3 px-4 w-44">Kategori Aksi</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 w-48">Pelaksana</th>
                <th className="py-3 px-4 w-40">Target Terkait</th>
                <th className="py-3 px-4 w-20 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <span className="text-[11px] text-slate-400 pl-5">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WITA
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{log.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{log.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">
                        {log.actorRole}
                      </span>
                      {log.actorEmail && <span className="truncate max-w-[110px]">{log.actorEmail}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {log.targetName ? (
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.targetName}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      id={`btn-view-audit-${log.id}`}
                      onClick={() => setSelectedLog(log)}
                      title="Lihat Detail Log"
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600 text-sm">Tidak ada riwayat aktivitas ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Coba sesuaikan kata kunci atau filter pencarian Anda' : 'Aktivitas sistem yang dicatat akan muncul di sini secara otomatis'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan aktivitas audit</span>
          <span className="text-[11px] text-slate-400">Penyimpanan Terpusat Firestore</span>
        </div>
      </div>

      {/* Modal Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Rincian Catatan Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Kategori Aksi:</span>
                {getActionBadge(selectedLog.action)}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Judul Aktivitas:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedLog.title}</p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Deskripsi Lengkap:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block">Waktu Pencatatan:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedLog.timestamp).toLocaleString('id-ID')} WITA
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block">Pelaksana Tindakan:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedLog.actorName} ({selectedLog.actorRole})
                  </p>
                </div>
              </div>

              {selectedLog.targetName && (
                <div>
                  <span className="text-slate-400 block">Target / Entitas:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedLog.targetName} {selectedLog.targetId ? `(ID: ${selectedLog.targetId})` : ''}
                  </p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Metadata Tambahan:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
