import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Calculator, 
  Award,
  AlertCircle,
  Eye,
  Download,
  Edit2,
  Trash2,
  Settings2,
  RotateCcw,
  BookOpen,
  Check,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  AdminSupervisionAssessment, 
  AdminIndicator, 
  UserProfile, 
  SupervisionSchedule 
} from '../types';
import { DEFAULT_ADMIN_INDICATORS } from '../data/defaultData';

interface AdminSupervisionViewProps {
  assessments: AdminSupervisionAssessment[];
  indicators: AdminIndicator[];
  teachers: UserProfile[];
  schedules: SupervisionSchedule[];
  onSaveAssessment: (assessment: Omit<AdminSupervisionAssessment, 'createdAt'> & { id?: string; createdAt?: string }) => Promise<void>;
  onDeleteAssessment?: (id: string) => Promise<void>;
  onExportPdf?: (assessment: AdminSupervisionAssessment) => void;
  onAddIndicator?: (indicator: Omit<AdminIndicator, 'id'>) => Promise<void>;
  onUpdateIndicator?: (id: string, updates: Partial<AdminIndicator>) => Promise<void>;
  onDeleteIndicator?: (id: string) => Promise<void>;
  onResetIndicators?: () => Promise<void>;
}

export const AdminSupervisionView: React.FC<AdminSupervisionViewProps> = ({
  assessments,
  indicators = DEFAULT_ADMIN_INDICATORS,
  teachers,
  schedules,
  onSaveAssessment,
  onDeleteAssessment,
  onExportPdf,
  onAddIndicator,
  onUpdateIndicator,
  onDeleteIndicator,
  onResetIndicators
}) => {
  const { profile, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assessments' | 'instruments'>('assessments');
  const [searchTerm, setSearchTerm] = useState('');
  const [indicatorSearchTerm, setIndicatorSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<AdminSupervisionAssessment | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Indicator Management Modal State
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [indicatorCode, setIndicatorCode] = useState('');
  const [indicatorCategory, setIndicatorCategory] = useState('Dokumen Perencanaan Pembelajaran');
  const [indicatorLabel, setIndicatorLabel] = useState('');
  const [indicatorBobot, setIndicatorBobot] = useState<number>(2);

  // Assessment Form State
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [mapel, setMapel] = useState('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatanUmum, setCatatanUmum] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Indicator checklist state: { [indicatorId]: { status, score, catatan } }
  const [itemStates, setItemStates] = useState<Record<string, {
    status: 'Ada & Lengkap' | 'Ada Tidak Lengkap' | 'Tidak Ada';
    score: number;
    catatan: string;
  }>>({});

  const canAssess = role === 'penilai' || role === 'kamad' || role === 'admin';
  const isAdmin = role === 'admin';

  // Filtered list: guru can only see own assessments
  const accessibleAssessments = role === 'guru'
    ? assessments.filter(a => isItemForUser(a, profile, user?.uid))
    : assessments;

  const filteredAssessments = accessibleAssessments.filter(a => 
    a.guruName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.penilaiName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIndicators = indicators.filter(i =>
    i.label.toLowerCase().includes(indicatorSearchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(indicatorSearchTerm.toLowerCase()) ||
    (i.code && i.code.toLowerCase().includes(indicatorSearchTerm.toLowerCase()))
  );

  // Categories list derived from current indicators
  const uniqueCategories = Array.from(new Set(indicators.map(i => i.category)));

  // Show Toast
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Open Form for NEW Assessment
  const handleOpenNewForm = () => {
    setEditingAssessmentId(null);
    const defaultGuru = teachers.find(t => t.role === 'guru') || teachers[0];
    if (defaultGuru) {
      setSelectedGuruId(defaultGuru.uid);
      setMapel(defaultGuru.mataPelajaran || '');
    }
    setSelectedScheduleId('');

    // Pre-fill indicators with default 'Ada & Lengkap' (score 2)
    const initialItems: Record<string, { status: 'Ada & Lengkap'; score: number; catatan: string }> = {};
    indicators.forEach((ind) => {
      initialItems[ind.id] = {
        status: 'Ada & Lengkap',
        score: 2,
        catatan: ''
      };
    });
    setItemStates(initialItems);
    setTanggal(new Date().toISOString().split('T')[0]);
    setCatatanUmum('');
    setRekomendasi('Pertahankan kelengkapan administrasi dan tingkatkan integrasi asesmen diagnostik berkala.');
    setIsFormOpen(true);
  };

  // Open Form to EDIT existing Assessment
  const handleEditAssessment = (assessment: AdminSupervisionAssessment) => {
    setEditingAssessmentId(assessment.id);
    setSelectedGuruId(assessment.guruId);
    setSelectedScheduleId(assessment.scheduleId || '');
    setMapel(assessment.mataPelajaran);
    setSemester(assessment.semester);
    setTahunPelajaran(assessment.tahunPelajaran);
    setTanggal(assessment.tanggalPenilaian);
    setCatatanUmum(assessment.catatanUmum || '');
    setRekomendasi(assessment.rekomendasi || '');

    // Map existing saved items
    const loadedItems: Record<string, { status: 'Ada & Lengkap' | 'Ada Tidak Lengkap' | 'Tidak Ada'; score: number; catatan: string }> = {};
    indicators.forEach(ind => {
      const found = assessment.items.find(i => i.indicatorId === ind.id || i.label === ind.label);
      if (found) {
        loadedItems[ind.id] = {
          status: found.status,
          score: found.score,
          catatan: found.catatan || ''
        };
      } else {
        loadedItems[ind.id] = {
          status: 'Ada & Lengkap',
          score: 2,
          catatan: ''
        };
      }
    });

    setItemStates(loadedItems);
    if (viewingAssessment) setViewingAssessment(null);
    setIsFormOpen(true);
  };

  const handleItemChange = (
    indId: string, 
    field: 'status' | 'score' | 'catatan', 
    val: unknown
  ) => {
    setItemStates(prev => {
      const current = prev[indId] || { status: 'Ada & Lengkap', score: 2, catatan: '' };
      if (field === 'status') {
        const newStatus = val as 'Ada & Lengkap' | 'Ada Tidak Lengkap' | 'Tidak Ada';
        let newScore = 2;
        if (newStatus === 'Ada Tidak Lengkap') newScore = 1;
        if (newStatus === 'Tidak Ada') newScore = 0;
        return { ...prev, [indId]: { ...current, status: newStatus, score: newScore } };
      }
      return { ...prev, [indId]: { ...current, [field]: val } };
    });
  };

  // Live Score Calculation
  const totalScore = indicators.reduce((acc, ind) => {
    return acc + (itemStates[ind.id]?.score ?? 2);
  }, 0);
  const maxScore = indicators.length * 2;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
  
  let predikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)' = 'Amat Baik (A)';
  if (percentage < 70) predikat = 'Kurang (D)';
  else if (percentage < 80) predikat = 'Cukup (C)';
  else if (percentage < 90) predikat = 'Baik (B)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guru = teachers.find(t => t.uid === selectedGuruId);
    if (!guru) {
      alert('Pilih guru yang dinilai');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = indicators.map(ind => ({
        indicatorId: ind.id,
        label: ind.label,
        status: itemStates[ind.id]?.status || 'Ada & Lengkap',
        score: itemStates[ind.id]?.score ?? 2,
        catatan: itemStates[ind.id]?.catatan || ''
      }));

      await onSaveAssessment({
        id: editingAssessmentId || undefined,
        scheduleId: selectedScheduleId || '',
        guruId: guru.uid,
        guruName: guru.displayName,
        guruNip: guru.nip || '',
        mataPelajaran: mapel || guru.mataPelajaran || 'Umum',
        penilaiId: profile?.uid || 'anon',
        penilaiName: profile?.displayName || 'Guru Penilai',
        penilaiNip: profile?.nip || '',
        tanggalPenilaian: tanggal,
        tahunPelajaran,
        semester,
        items,
        totalScore,
        maxScore,
        percentage,
        predikat,
        catatanUmum: catatanUmum.trim() || 'Perangkat administrasi pembelajaran telah diperiksa secara komprehensif.',
        rekomendasi: rekomendasi.trim() || 'Pertahankan ketertiban administrasi.'
      });

      setIsFormOpen(false);
      triggerSuccess(editingAssessmentId 
        ? 'Perubahan penilaian berhasil disimpan dan diperbarui!' 
        : 'Penilaian supervisi administrasi berhasil disimpan!'
      );
      setEditingAssessmentId(null);
    } catch (err: unknown) {
      alert('Gagal menyimpan hasil supervisi: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessmentClick = async (a: AdminSupervisionAssessment) => {
    if (confirm(`Hapus data penilaian supervisi untuk "${a.guruName}"?`)) {
      if (onDeleteAssessment) {
        await onDeleteAssessment(a.id);
        triggerSuccess(`Penilaian untuk ${a.guruName} berhasil dihapus.`);
      }
    }
  };

  // Indicator Management Handlers
  const handleOpenAddIndicator = () => {
    setEditingIndicatorId(null);
    setIndicatorCode(`ADM-${indicators.length + 1}`);
    setIndicatorCategory(uniqueCategories[0] || 'Dokumen Perencanaan Pembelajaran');
    setIndicatorLabel('');
    setIndicatorBobot(2);
    setIsIndicatorModalOpen(true);
  };

  const handleOpenEditIndicator = (ind: AdminIndicator) => {
    setEditingIndicatorId(ind.id);
    setIndicatorCode(ind.code || '');
    setIndicatorCategory(ind.category);
    setIndicatorLabel(ind.label);
    setIndicatorBobot(ind.bobot || 2);
    setIsIndicatorModalOpen(true);
  };

  const handleSaveIndicatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicatorLabel.trim()) {
      alert('Nama instrumen / dokumen tidak boleh kosong');
      return;
    }

    try {
      if (editingIndicatorId) {
        if (onUpdateIndicator) {
          await onUpdateIndicator(editingIndicatorId, {
            code: indicatorCode.trim() || `ADM-${indicators.length}`,
            category: indicatorCategory.trim(),
            label: indicatorLabel.trim(),
            bobot: indicatorBobot
          });
          triggerSuccess('Butir instrumen administrasi berhasil diperbarui.');
        }
      } else {
        if (onAddIndicator) {
          await onAddIndicator({
            code: indicatorCode.trim() || `ADM-${indicators.length + 1}`,
            category: indicatorCategory.trim(),
            label: indicatorLabel.trim(),
            bobot: indicatorBobot
          });
          triggerSuccess('Butir instrumen administrasi baru berhasil ditambahkan.');
        }
      }
      setIsIndicatorModalOpen(false);
    } catch (err: unknown) {
      alert('Gagal menyimpan instrumen: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  const handleDeleteIndicatorClick = async (ind: AdminIndicator) => {
    if (confirm(`Yakin ingin menghapus instrumen: "${ind.label}"?`)) {
      if (onDeleteIndicator) {
        await onDeleteIndicator(ind.id);
        triggerSuccess('Butir instrumen berhasil dihapus.');
      }
    }
  };

  const handleResetIndicatorsClick = async () => {
    if (confirm('Kembalikan semua butir instrumen administrasi ke standar baku madrasah (17 Butir Standar)? Data butir kustom akan direset.')) {
      if (onResetIndicators) {
        await onResetIndicators();
        triggerSuccess('Instrumen administrasi berhasil dikembalikan ke standar awal.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-700" />
            Instrumen & Supervisi Administrasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instrumen Observasi Kelengkapan Perangkat Administrasi Pembelajaran Guru MAN 2 Gorontalo
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            id="tab-admin-assessments"
            onClick={() => setActiveTab('assessments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'assessments'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Hasil Penilaian ({assessments.length})
          </button>

          <button
            type="button"
            id="tab-admin-instruments"
            onClick={() => setActiveTab('instruments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'instruments'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Kelola Butir Instrumen ({indicators.length})
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: HASIL PENILAIAN ==================== */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          
          {/* Top Actions: Search & Button */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-admin-assessment-input"
                type="text"
                placeholder="Cari nama guru, mapel, penilai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {canAssess && (
              <button
                type="button"
                id="btn-new-admin-assessment"
                onClick={handleOpenNewForm}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                Penilaian Supervisi Baru
              </button>
            )}
          </div>

          {/* Assessment History Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Guru yang Dinilai</th>
                    <th className="px-4 py-3.5">Mata Pelajaran</th>
                    <th className="px-4 py-3.5">Penilai / Supervisor</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Skor & Persentase</th>
                    <th className="px-4 py-3.5">Predikat</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">{a.guruName}</span>
                        <span className="block text-[11px] text-slate-400">NIP. {a.guruNip || '-'}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {a.mataPelajaran}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {a.penilaiName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {a.tanggalPenilaian}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800">{a.percentage}%</span>
                        <span className="text-[11px] text-slate-400 block">
                          ({a.totalScore}/{a.maxScore})
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          a.percentage >= 90
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.percentage >= 80
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {a.predikat}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingAssessment(a)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Lihat Rincian Penilaian"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {canAssess && (
                            <button
                              type="button"
                              onClick={() => handleEditAssessment(a)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Edit / Ubah Nilai Penilaian"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {onExportPdf && (
                            <button
                              type="button"
                              onClick={() => onExportPdf(a)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Cetak / Unduh Format PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAssessmentClick(a)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Penilaian"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredAssessments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada riwayat supervisi administrasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KELOLA BUTIR INSTRUMEN ==================== */}
      {activeTab === 'instruments' && (
        <div className="space-y-4">
          
          {/* Management Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-700" />
                Daftar Butir Instrumen Observasi Administrasi
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Instrumen ini digunakan sebagai parameter evaluasi seluruh guru saat pemeriksaan administrasi ajar.
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetIndicatorsClick}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Kembalikan ke 17 Butir Standar Madrasah"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Standar
                </button>

                <button
                  type="button"
                  id="btn-add-admin-indicator"
                  onClick={handleOpenAddIndicator}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  Tambah Butir Baru
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar & Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Total Butir Aktif</span>
              <span className="text-lg font-bold text-slate-900">{indicators.length} Butir</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Kategori Dokumen</span>
              <span className="text-lg font-bold text-slate-900">{uniqueCategories.length} Kategori</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Skor Poin Maksimal</span>
              <span className="text-lg font-bold text-emerald-700">{indicators.length * 2} Poin</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Status Fleksibilitas</span>
              <span className="text-xs font-bold text-teal-700 mt-1 inline-block">Kustom & Dinamis</span>
            </div>
          </div>

          {/* Search Indicator */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari butir instrumen atau kategori..."
              value={indicatorSearchTerm}
              onChange={(e) => setIndicatorSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Indicators Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">No</th>
                    <th className="px-4 py-3 w-28">Kode Butir</th>
                    <th className="px-4 py-3 w-48">Kategori Dokumen</th>
                    <th className="px-4 py-3">Nama Dokumen / Indikator Observasi</th>
                    <th className="px-4 py-3 w-28 text-center">Bobot Maks</th>
                    {isAdmin && <th className="px-4 py-3 w-24 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIndicators.map((ind, idx) => (
                    <tr key={ind.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {ind.code || `A${idx + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {ind.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {ind.label}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {ind.bobot || 2} Poin
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditIndicator(ind)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Butir Ini"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIndicatorClick(ind)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Butir Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {filteredIndicators.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada butir instrumen yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: TAMBAH / EDIT BUTIR INSTRUMEN ==================== */}
      {isIndicatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-700" />
                {editingIndicatorId ? 'Edit Butir Instrumen Administrasi' : 'Tambah Butir Instrumen Baru Secara Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setIsIndicatorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIndicatorSubmit} className="space-y-3.5 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Butir
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ADM-18, A1"
                    value={indicatorCode}
                    onChange={(e) => setIndicatorCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Nilai Maksimal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={indicatorBobot}
                    onChange={(e) => setIndicatorBobot(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Dokumen Administrasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dokumen Perencanaan Pembelajaran"
                  list="category-suggestions"
                  value={indicatorCategory}
                  onChange={(e) => setIndicatorCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
                <datalist id="category-suggestions">
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                  <option value="Dokumen Perencanaan Pembelajaran" />
                  <option value="Dokumen Asesmen & Penilaian" />
                  <option value="Dokumen Pelaksanaan Pembelajaran" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Dokumen / Indikator Penilaian *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Kalender Pendidikan dan Analisis Alokasi Waktu Efektif Belajar"
                  value={indicatorLabel}
                  onChange={(e) => setIndicatorLabel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIndicatorModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                >
                  {editingIndicatorId ? 'Simpan Perubahan' : 'Tambahkan Butir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FORM PENILAIAN (NEW / EDIT) ==================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-700" />
                  {editingAssessmentId 
                    ? 'Edit / Perbarui Nilai Supervisi Administrasi' 
                    : 'Penilaian Baru Supervisi Administrasi Perangkat Pembelajaran'
                  }
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluasi ketersediaan {indicators.length} dokumen perangkat ajar guru secara fleksibel
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              
              {/* Form Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guru yang Dinilai *
                  </label>
                  <select
                    required
                    value={selectedGuruId}
                    onChange={(e) => {
                      setSelectedGuruId(e.target.value);
                      const g = teachers.find(t => t.uid === e.target.value);
                      if (g?.mataPelajaran) setMapel(g.mataPelajaran);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map((t) => (
                      <option key={t.uid} value={t.uid}>
                        {t.displayName} ({t.mataPelajaran || 'Umum'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Biologi, Fikih, Matematika"
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tautkan Jadwal (Opsional)
                  </label>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- Tanpa Jadwal Tertaut --</option>
                    {schedules
                      .filter(s => s.type === 'Administrasi')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.guruName} ({s.date}) - {s.status}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    value={tahunPelajaran}
                    onChange={(e) => setTahunPelajaran(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Penilaian
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Realtime Live Score Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                      Nilai Administrasi:
                    </span>
                    <div className="font-extrabold text-base text-slate-900">
                      Skor: {totalScore} / {maxScore} → <span className="text-emerald-700 font-extrabold">{percentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Predikat Capaian:</span>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    percentage >= 90
                      ? 'bg-emerald-700 text-white'
                      : percentage >= 80
                      ? 'bg-teal-700 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {predikat}
                  </span>
                </div>
              </div>

              {/* Dynamic Indicator Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Daftar {indicators.length} Butir Instrumen Observasi
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Nilai: 2 = Lengkap, 1 = Tidak Lengkap, 0 = Tidak Ada
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {indicators.map((ind, index) => {
                    const currentStatus = itemStates[ind.id]?.status || 'Ada & Lengkap';
                    const currentCatatan = itemStates[ind.id]?.catatan || '';

                    return (
                      <div 
                        key={ind.id} 
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {index + 1}. {ind.label}
                            </span>
                            {ind.code && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({ind.code})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Kategori: {ind.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                          {/* Status Options */}
                          <div className="flex rounded-lg p-0.5 bg-slate-200">
                            <button
                              type="button"
                              onClick={() => handleItemChange(ind.id, 'status', 'Ada & Lengkap')}
                              className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                                currentStatus === 'Ada & Lengkap'
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Lengkap (2)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleItemChange(ind.id, 'status', 'Ada Tidak Lengkap')}
                              className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                                currentStatus === 'Ada Tidak Lengkap'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Kurang (1)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleItemChange(ind.id, 'status', 'Tidak Ada')}
                              className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                                currentStatus === 'Tidak Ada'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Kosong (0)
                            </button>
                          </div>

                          {/* Item Note */}
                          <input
                            type="text"
                            placeholder="Catatan pemeriksa..."
                            value={currentCatatan}
                            onChange={(e) => handleItemChange(ind.id, 'catatan', e.target.value)}
                            className="w-36 sm:w-48 px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Feedback & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Umum Penilai / Supervisor
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Berkas administrasi sangat rapi dan tersusun sistematis..."
                    value={catatanUmum}
                    onChange={(e) => setCatatanUmum(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rekomendasi Tindak Lanjut Administrasi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Pertahankan kelengkapan berkas modul ajar..."
                    value={rekomendasi}
                    onChange={(e) => setRekomendasi(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingAssessmentId ? 'Perbarui Hasil Penilaian' : 'Simpan Hasil Penilaian')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DETAIL PENILAIAN ==================== */}
      {viewingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Detail Penilaian Administrasi Perangkat Pembelajaran
              </h3>
              <button
                onClick={() => setViewingAssessment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Guru yang Dinilai</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingAssessment.guruName}</span>
                  <span className="text-slate-500 block">NIP. {viewingAssessment.guruNip || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mata Pelajaran & Semester</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.mataPelajaran}</span>
                  <span className="text-slate-500 block">{viewingAssessment.tahunPelajaran} • {viewingAssessment.semester}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Penilai / Supervisor</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.penilaiName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Supervisi</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.tanggalPenilaian}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Capaian Nilai</span>
                  <div className="text-lg font-extrabold text-emerald-900">
                    {viewingAssessment.percentage}% ({viewingAssessment.totalScore} / {viewingAssessment.maxScore} poin)
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-bold text-xs">
                  {viewingAssessment.predikat}
                </span>
              </div>

              {/* Indicators Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Rincian Dokumen Administrasi:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {viewingAssessment.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-medium text-slate-800">{idx + 1}. {it.label}</span>
                        {it.catatan && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 italic">Catatan: {it.catatan}</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                        it.status === 'Ada & Lengkap'
                          ? 'bg-emerald-100 text-emerald-800'
                          : it.status === 'Ada Tidak Lengkap'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {it.status} ({it.score} pt)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <div>
                  <span className="font-bold text-slate-800 block">Catatan Umum:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    {viewingAssessment.catatanUmum || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Rekomendasi Tindak Lanjut:</span>
                  <p className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900 font-medium">
                    {viewingAssessment.rekomendasi || '-'}
                  </p>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-100">
                <div className="flex gap-2">
                  {canAssess && (
                    <button
                      type="button"
                      onClick={() => handleEditAssessment(viewingAssessment)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1.5 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Penilaian Ini
                    </button>
                  )}
                  {onExportPdf && (
                    <button
                      type="button"
                      onClick={() => onExportPdf(viewingAssessment)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewingAssessment(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
