import React, { useState } from 'react';
import { 
  ListChecks, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  X,
  FileCheck,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  FollowUpPlan, 
  UserProfile, 
  AdminSupervisionAssessment, 
  TeachingSupervisionAssessment 
} from '../types';

interface FollowUpViewProps {
  followUps: FollowUpPlan[];
  teachers: UserProfile[];
  adminAssessments: AdminSupervisionAssessment[];
  teachingAssessments: TeachingSupervisionAssessment[];
  onAddFollowUp: (plan: Omit<FollowUpPlan, 'id' | 'updatedAt'>) => Promise<void>;
  onUpdateFollowUp: (id: string, updates: Partial<FollowUpPlan>) => Promise<void>;
}

export const FollowUpView: React.FC<FollowUpViewProps> = ({
  followUps,
  teachers,
  adminAssessments,
  teachingAssessments,
  onAddFollowUp,
  onUpdateFollowUp
}) => {
  const { profile, role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FollowUpPlan | null>(null);

  // Form states
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [supervisionType, setSupervisionType] = useState<'Administrasi' | 'Mengajar'>('Mengajar');
  const [tanggalSupervisi, setTanggalSupervisi] = useState(new Date().toISOString().split('T')[0]);
  const [rekomendasiPenilai, setRekomendasiPenilai] = useState('');
  const [rencanaTindakLanjut, setRencanaTindakLanjut] = useState('');
  const [kegiatanBimbingan, setKegiatanBimbingan] = useState('Pendampingan Teman Sejawat');
  const [targetPenyelesaian, setTargetPenyelesaian] = useState('');
  const [status, setStatus] = useState<FollowUpPlan['status']>('Dalam Proses');
  const [hasilTindakLanjut, setHasilTindakLanjut] = useState('');
  const [catatanKamad, setCatatanKamad] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtering based on role
  const accessiblePlans = role === 'guru'
    ? followUps.filter(f => isItemForUser(f, profile, user?.uid))
    : followUps;

  const filteredPlans = accessiblePlans.filter((p) => {
    const matchesSearch =
      p.guruName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rencanaTindakLanjut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kegiatanBimbingan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    const defaultGuru = teachers.find(t => t.role === 'guru') || teachers[0];
    if (defaultGuru) setSelectedGuruId(defaultGuru.uid);
    setSupervisionType('Mengajar');
    setTanggalSupervisi(new Date().toISOString().split('T')[0]);
    setRekomendasiPenilai('Peningkatan variasi asesmen formatif dan rubrik penilaian unjuk kerja siswa.');
    setRencanaTindakLanjut('Menyusun 3 instrumen asesmen formatif interaktif dan menerapkannya di kelas.');
    setKegiatanBimbingan('Pendampingan Teman Sejawat / KKG Madrasah');
    
    // Default 14 days later
    const future = new Date();
    future.setDate(future.getDate() + 14);
    setTargetPenyelesaian(future.toISOString().split('T')[0]);
    setStatus('Dalam Proses');
    setHasilTindakLanjut('');
    setCatatanKamad('');
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: FollowUpPlan) => {
    setEditingPlan(plan);
    setSelectedGuruId(plan.guruId);
    setSupervisionType(plan.supervisionType);
    setTanggalSupervisi(plan.tanggalSupervisi);
    setRekomendasiPenilai(plan.rekomendasiPenilai);
    setRencanaTindakLanjut(plan.rencanaTindakLanjut);
    setKegiatanBimbingan(plan.kegiatanBimbingan);
    setTargetPenyelesaian(plan.targetPenyelesaian);
    setStatus(plan.status);
    setHasilTindakLanjut(plan.hasilTindakLanjut || '');
    setCatatanKamad(plan.catatanKamad || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guru = teachers.find(t => t.uid === selectedGuruId);
    if (!guru) return;

    setSubmitting(true);
    try {
      if (editingPlan) {
        await onUpdateFollowUp(editingPlan.id, {
          rekomendasiPenilai,
          rencanaTindakLanjut,
          kegiatanBimbingan,
          targetPenyelesaian,
          status,
          hasilTindakLanjut,
          catatanKamad: role === 'kamad' || role === 'admin' ? catatanKamad : editingPlan.catatanKamad,
          verifiedByKamad: role === 'kamad' ? true : editingPlan.verifiedByKamad
        });
      } else {
        await onAddFollowUp({
          guruId: guru.uid,
          guruName: guru.displayName,
          supervisionType,
          assessmentId: 'gen-' + Date.now(),
          tanggalSupervisi,
          rekomendasiPenilai,
          rencanaTindakLanjut,
          kegiatanBimbingan,
          targetPenyelesaian,
          status,
          hasilTindakLanjut,
          catatanKamad,
          verifiedByKamad: role === 'kamad'
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      alert('Gagal menyimpan rencana tindak lanjut: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-emerald-700" />
            Rencana Tindak Lanjut (RTL) & Rekomendasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring tindak lanjut pasca supervisi administrasi dan proses pembelajaran guru MAN 2 Gorontalo
          </p>
        </div>

        {(role === 'penilai' || role === 'kamad' || role === 'admin') && (
          <button
            type="button"
            id="btn-add-rtl"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Buat Rencana Tindak Lanjut
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-rtl-input"
            type="text"
            placeholder="Cari guru, tindak lanjut, bimbingan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="Belum Selesai">Belum Selesai</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* RTL Cards List */}
      <div className="space-y-3">
        {filteredPlans.map((plan) => {
          const isDone = plan.status === 'Selesai';
          const isProcessing = plan.status === 'Dalam Proses';

          return (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {plan.guruName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Supervisi {plan.supervisionType}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Target: {plan.targetPenyelesaian}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg space-y-1">
                  <p><span className="font-semibold text-slate-900">Rekomendasi: </span>{plan.rekomendasiPenilai}</p>
                  <p><span className="font-semibold text-slate-900">Rencana Kegiatan: </span>{plan.rencanaTindakLanjut}</p>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Metode Bimbingan: {plan.kegiatanBimbingan}
                  </p>
                </div>

                {plan.hasilTindakLanjut && (
                  <p className="text-[11px] text-slate-600 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                    <span className="font-bold text-emerald-900">Hasil Kemajuan: </span>{plan.hasilTindakLanjut}
                  </p>
                )}

                {plan.catatanKamad && (
                  <p className="text-[11px] text-amber-900 bg-amber-50/50 p-2 rounded border border-amber-200">
                    <span className="font-bold text-amber-950">Catatan Kepala Madrasah: </span>{plan.catatanKamad}
                  </p>
                )}
              </div>

              {/* Status and Action */}
              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                  </span>
                ) : isProcessing ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Berjalan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Belum Mulai
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEdit(plan)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  Perbarui Status / Hasil
                </button>
              </div>
            </div>
          );
        })}

        {filteredPlans.length === 0 && (
          <div className="bg-white rounded-xl p-10 border border-slate-200 text-center text-slate-400">
            <ListChecks className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm text-slate-700">Belum ada catatan rencana tindak lanjut</p>
            <p className="text-xs text-slate-500 mt-1">
              RTL disusun pasca pelaksanaan supervisi administrasi atau supervisi mengajar.
            </p>
          </div>
        )}
      </div>

      {/* Modal RTL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-700" />
                {editingPlan ? 'Perbarui Rencana Tindak Lanjut' : 'Buat Rencana Tindak Lanjut Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Guru yang Menjalani RTL *
                </label>
                <select
                  disabled={!!editingPlan}
                  value={selectedGuruId}
                  onChange={(e) => setSelectedGuruId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white disabled:bg-slate-100"
                >
                  {teachers.map(t => (
                    <option key={t.uid} value={t.uid}>{t.displayName} ({t.mataPelajaran || t.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Supervisi
                  </label>
                  <select
                    value={supervisionType}
                    onChange={(e) => setSupervisionType(e.target.value as 'Administrasi' | 'Mengajar')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Mengajar">Supervisi Mengajar</option>
                    <option value="Administrasi">Supervisi Administrasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Waktu Penyelesaian *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetPenyelesaian}
                    onChange={(e) => setTargetPenyelesaian(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rekomendasi Penilai / Temuan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={rekomendasiPenilai}
                  onChange={(e) => setRekomendasiPenilai(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Tindak Lanjut Guru *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Langkah konkret yang akan dilakukan oleh guru..."
                  value={rencanaTindakLanjut}
                  onChange={(e) => setRencanaTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bentuk Bimbingan
                  </label>
                  <select
                    value={kegiatanBimbingan}
                    onChange={(e) => setKegiatanBimbingan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Pendampingan Teman Sejawat">Pendampingan Teman Sejawat</option>
                    <option value="Kegiatan MGMP / KKG Madrasah">Kegiatan MGMP / KKG Madrasah</option>
                    <option value="Pelatihan Mandiri (MOOC Pintar Kemenag)">Pelatihan Mandiri (Pintar Kemenag)</option>
                    <option value="Konsultasi Langsung dengan Kamad/Pengawas">Konsultasi Langsung</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Progres
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FollowUpPlan['status'])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                  >
                    <option value="Belum Selesai">Belum Selesai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai (Tuntas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Laporan Hasil Tindak Lanjut (Oleh Guru/Penilai)
                </label>
                <textarea
                  rows={2}
                  placeholder="Bukti pelaksanaan perbaikan atau modul ajar revisi yang telah dibuat..."
                  value={hasilTindakLanjut}
                  onChange={(e) => setHasilTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              {(role === 'kamad' || role === 'admin') && (
                <div>
                  <label className="block font-semibold text-amber-900 mb-1">
                    Catatan Verifikasi Kepala Madrasah
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Disetujui untuk peningkatan mutu pembelajaran madrasah..."
                    value={catatanKamad}
                    onChange={(e) => setCatatanKamad(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/40"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan RTL'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
