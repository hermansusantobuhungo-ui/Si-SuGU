import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileCheck,
  Edit2,
  Trash2,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { SupervisionSchedule, UserProfile } from '../types';
import { exportSchedulesToCsv } from '../lib/csvExport';

interface SchedulesViewProps {
  schedules: SupervisionSchedule[];
  teachers: UserProfile[];
  onAddSchedule: (schedule: Omit<SupervisionSchedule, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateScheduleStatus: (id: string, status: SupervisionSchedule['status']) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onStartSupervision?: (schedule: SupervisionSchedule, type: 'Administrasi' | 'Mengajar') => void;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules,
  teachers,
  onAddSchedule,
  onUpdateScheduleStatus,
  onDeleteSchedule,
  onStartSupervision
}) => {
  const { profile, role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<SupervisionSchedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [guruId, setGuruId] = useState('');
  const [penilaiId, setPenilaiId] = useState('');
  const [type, setType] = useState<'Administrasi' | 'Mengajar' | 'Keduanya'>('Mengajar');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [waktu, setWaktu] = useState('08:00');
  const [tempat, setTempat] = useState('Ruang Kelas X IPA 1');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [kelas, setKelas] = useState('Kelas X');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageSchedule = role === 'admin' || role === 'kamad';

  const accessibleSchedules = role === 'guru'
    ? schedules.filter(s => isItemForUser(s, profile, user?.uid))
    : role === 'penilai'
    ? schedules.filter(s => s.penilaiId === profile?.uid || (profile?.displayName && s.penilaiName?.toLowerCase() === profile.displayName.toLowerCase()) || canManageSchedule)
    : schedules;

  const filteredSchedules = accessibleSchedules.filter((s) => {
    const matchesSearch =
      s.guruName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.penilaiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tempat.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAdd = () => {
    const gurus = teachers.filter(t => t.role === 'guru');
    const penilais = teachers.filter(t => t.role === 'penilai' || t.role === 'kamad' || t.role === 'admin');
    
    if (gurus.length > 0) {
      setGuruId(gurus[0].uid);
      setMataPelajaran(gurus[0].mataPelajaran || '');
    }
    if (penilais.length > 0) {
      setPenilaiId(penilais[0].uid);
    }

    setTanggal(new Date().toISOString().split('T')[0]);
    setWaktu('08:30');
    setTempat('Ruang Kelas X-1');
    setCatatan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const guru = teachers.find(t => t.uid === guruId);
    const penilai = teachers.find(t => t.uid === penilaiId);

    if (!guru || !penilai) {
      setFormError('Harap pilih guru dan penilai yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      await onAddSchedule({
        guruId: guru.uid,
        guruName: guru.displayName,
        guruNip: guru.nip || '',
        mataPelajaran: mataPelajaran || guru.mataPelajaran || 'Umum',
        kelas,
        penilaiId: penilai.uid,
        penilaiName: penilai.displayName,
        type,
        tanggal,
        waktu,
        tempat,
        semester,
        tahunPelajaran,
        status: 'Terjadwal',
        catatan
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal supervisi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            Jadwal Supervisi Akademik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agenda pelaksanaan supervisi administrasi perangkat pembelajaran dan supervisi mengajar di kelas MAN 2 Gorontalo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="btn-export-schedules-csv"
            onClick={() => exportSchedulesToCsv(filteredSchedules)}
            disabled={filteredSchedules.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Ekspor CSV
          </button>

          {canManageSchedule && (
            <button
              type="button"
              id="btn-add-schedule"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              Buat Jadwal Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-schedule-input"
            type="text"
            placeholder="Cari guru, penilai, tempat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Jenis Supervisi</option>
            <option value="Mengajar">Supervisi Mengajar (Kelas)</option>
            <option value="Administrasi">Supervisi Administrasi</option>
            <option value="Keduanya">Keduanya</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Sedang Berjalan">Sedang Berjalan</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Schedules List Cards */}
      <div className="space-y-3">
        {filteredSchedules.map((s) => {
          const isDone = s.status === 'Selesai';
          const isOngoing = s.status === 'Sedang Berjalan';

          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {s.guruName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {s.type}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {s.mataPelajaran} • {s.kelas}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    Penilai: {s.penilaiName}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    {s.tanggal} ({s.waktu} WITA)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {s.tempat}
                  </span>
                </div>

                {s.catatan && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                    Catatan: {s.catatan}
                  </p>
                )}
              </div>

              {/* Status and Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {/* Status Badge */}
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                  </span>
                ) : isOngoing ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/90 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Berlangsung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-100/90 px-3 py-1 rounded-full">
                    Terjadwal
                  </span>
                )}

                {/* Direct Action for Penilai: Lakukan Penilaian */}
                {(role === 'penilai' || role === 'kamad' || role === 'admin') && onStartSupervision && (
                  <div className="flex items-center gap-1.5">
                    {s.type !== 'Mengajar' && (
                      <button
                        type="button"
                        onClick={() => onStartSupervision(s, 'Administrasi')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs"
                      >
                        Nilai Adm
                      </button>
                    )}
                    {s.type !== 'Administrasi' && (
                      <button
                        type="button"
                        onClick={() => onStartSupervision(s, 'Mengajar')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs"
                      >
                        Observasi Kelas
                      </button>
                    )}
                  </div>
                )}

                {/* Status Toggle for Admin / Penilai */}
                {(canManageSchedule || role === 'penilai') && (
                  <select
                    value={s.status}
                    onChange={(e) => onUpdateScheduleStatus(s.id, e.target.value as SupervisionSchedule['status'])}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Terjadwal">Ubah: Terjadwal</option>
                    <option value="Sedang Berjalan">Ubah: Sedang Berjalan</option>
                    <option value="Selesai">Ubah: Selesai</option>
                    <option value="Dibatalkan">Ubah: Dibatalkan</option>
                  </select>
                )}

                {canManageSchedule && (
                  <button
                    type="button"
                    onClick={() => setDeletingSchedule(s)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredSchedules.length === 0 && (
          <div className="bg-white rounded-xl p-10 border border-slate-200 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm text-slate-700">Tidak ada jadwal supervisi</p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol "Buat Jadwal Baru" untuk menjadwalkan supervisi akademik guru.
            </p>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                Tambah Jadwal Supervisi Guru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              
              {/* Guru Sasaran */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Guru yang Dinilai (Objek Supervisi) *
                </label>
                <select
                  value={guruId}
                  onChange={(e) => {
                    setGuruId(e.target.value);
                    const g = teachers.find(t => t.uid === e.target.value);
                    if (g?.mataPelajaran) setMataPelajaran(g.mataPelajaran);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {teachers.map((t) => (
                    <option key={t.uid} value={t.uid}>
                      {t.displayName} ({t.mataPelajaran || t.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guru Penilai / Supervisor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Guru Penilai / Supervisor *
                </label>
                <select
                  value={penilaiId}
                  onChange={(e) => setPenilaiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {teachers.map((t) => (
                    <option key={t.uid} value={t.uid}>
                      {t.displayName} ({t.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Supervisi *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Administrasi' | 'Mengajar' | 'Keduanya')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Mengajar">Supervisi Mengajar (Kelas)</option>
                    <option value="Administrasi">Supervisi Administrasi</option>
                    <option value="Keduanya">Keduanya (Adm & Mengajar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Biologi"
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas / Fase
                  </label>
                  <input
                    type="text"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Waktu (WITA) *
                  </label>
                  <input
                    type="time"
                    required
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempat / Ruang Supervisi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ruang Kelas XII IPA 2 / Ruang Kepala Madrasah"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Khusus
                </label>
                <textarea
                  rows={2}
                  placeholder="Persiapan materi modul ajar, proyektor, dll..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Jadwal (Iframe-Safe) */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus Jadwal Supervisi</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus jadwal dari sistem</p>
              </div>
            </div>

            <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 text-sm">Guru: {deletingSchedule.guruName}</div>
              <div className="text-slate-500">
                {deletingSchedule.mataPelajaran} • {deletingSchedule.kelas}
              </div>
              <div className="text-slate-500">
                Tanggal: {deletingSchedule.tanggal} jam {deletingSchedule.waktu}
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    await onDeleteSchedule(deletingSchedule.id);
                    setDeletingSchedule(null);
                  } catch (err) {
                    console.error('Failed to delete schedule:', err);
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
