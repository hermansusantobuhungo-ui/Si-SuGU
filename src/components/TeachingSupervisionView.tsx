import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  X, 
  CheckCircle2, 
  Eye, 
  Download, 
  Sparkles, 
  Award,
  BookOpen,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Settings2,
  RotateCcw,
  Check,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  TeachingSupervisionAssessment, 
  TeachingIndicator, 
  UserProfile, 
  SupervisionSchedule 
} from '../types';
import { DEFAULT_TEACHING_INDICATORS } from '../data/defaultData';

interface TeachingSupervisionViewProps {
  assessments: TeachingSupervisionAssessment[];
  indicators: TeachingIndicator[];
  teachers: UserProfile[];
  schedules: SupervisionSchedule[];
  onSaveAssessment: (assessment: Omit<TeachingSupervisionAssessment, 'createdAt'> & { id?: string; createdAt?: string }) => Promise<void>;
  onDeleteAssessment?: (id: string) => Promise<void>;
  onExportPdf?: (assessment: TeachingSupervisionAssessment) => void;
  onAddIndicator?: (indicator: Omit<TeachingIndicator, 'id'>) => Promise<void>;
  onUpdateIndicator?: (id: string, updates: Partial<TeachingIndicator>) => Promise<void>;
  onDeleteIndicator?: (id: string) => Promise<void>;
  onResetIndicators?: () => Promise<void>;
}

export const TeachingSupervisionView: React.FC<TeachingSupervisionViewProps> = ({
  assessments,
  indicators = DEFAULT_TEACHING_INDICATORS,
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
  const [stageFilter, setStageFilter] = useState<'Semua' | 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'>('Semua');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [activeStageTab, setActiveStageTab] = useState<'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'>('Pelaksanaan');
  const [viewingAssessment, setViewingAssessment] = useState<TeachingSupervisionAssessment | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Indicator Management Modal State
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [indicatorStage, setIndicatorStage] = useState<'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'>('Pelaksanaan');
  const [indicatorCode, setIndicatorCode] = useState('');
  const [indicatorTitle, setIndicatorTitle] = useState('');
  const [indicatorDesc, setIndicatorDesc] = useState('');

  // Assessment Form State
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('Kelas X IPA 1');
  const [materiPokok, setMateriPokok] = useState('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatanUmum, setCatatanUmum] = useState('');
  const [kelebihan, setKelebihan] = useState('');
  const [kekurangan, setKekurangan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scores map: { [indicatorId]: { score (1-4), catatan } }
  const [scoresMap, setScoresMap] = useState<Record<string, { score: number; catatan: string }>>({});

  const canAssess = role === 'penilai' || role === 'kamad' || role === 'admin';
  const isAdmin = role === 'admin';

  // Filtered list: guru can only see own assessments
  const accessibleAssessments = role === 'guru'
    ? assessments.filter(a => isItemForUser(a, profile, user?.uid))
    : assessments;

  const filteredAssessments = accessibleAssessments.filter(a =>
    a.guruName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.materiPokok.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.penilaiName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIndicators = indicators.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(indicatorSearchTerm.toLowerCase()) ||
      i.description.toLowerCase().includes(indicatorSearchTerm.toLowerCase()) ||
      (i.code && i.code.toLowerCase().includes(indicatorSearchTerm.toLowerCase()));
    const matchStage = stageFilter === 'Semua' || i.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // Stage indicator subsets
  const perencIndicators = indicators.filter(i => i.stage === 'Perencanaan');
  const pelaksIndicators = indicators.filter(i => i.stage === 'Pelaksanaan');
  const evalIndicators = indicators.filter(i => i.stage === 'Evaluasi');

  // Trigger Success Toast
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Open Form for NEW Observation
  const handleOpenNewForm = () => {
    setEditingAssessmentId(null);
    const defaultGuru = teachers.find(t => t.role === 'guru') || teachers[0];
    if (defaultGuru) {
      setSelectedGuruId(defaultGuru.uid);
      setMapel(defaultGuru.mataPelajaran || '');
    }
    setSelectedScheduleId('');
    setKelas('Kelas X IPA 1');
    setMateriPokok('Keanekaragaman Hayati dan Konservasi Alam');
    setTanggal(new Date().toISOString().split('T')[0]);

    // Default all scores to 4 (Sangat Baik)
    const initialMap: Record<string, { score: number; catatan: string }> = {};
    indicators.forEach(ind => {
      initialMap[ind.id] = { score: 4, catatan: '' };
    });
    setScoresMap(initialMap);

    setCatatanUmum('Pelaksanaan kegiatan belajar mengajar berlangsung sangat interaktif dan menyenangkan.');
    setKelebihan('Guru menguasai materi dengan baik, penyampaian kontekstual, dan media ajar berbasis teknologi tersaji rapi.');
    setKekurangan('Waktu refleksi akhir pembelajaran perlu diatur lebih optimal agar semua perwakilan kelompok dapat menyampaikan kesan.');
    setRekomendasi('Tingkatkan pemberian lembar refleksi mandiri bagi siswa.');
    setActiveStageTab('Perencanaan');
    setIsFormOpen(true);
  };

  // Open Form to EDIT existing Observation
  const handleEditAssessment = (assessment: TeachingSupervisionAssessment) => {
    setEditingAssessmentId(assessment.id);
    setSelectedGuruId(assessment.guruId);
    setSelectedScheduleId(assessment.scheduleId || '');
    setMapel(assessment.mataPelajaran);
    setKelas(assessment.kelas);
    setMateriPokok(assessment.materiPokok);
    setSemester(assessment.semester);
    setTahunPelajaran(assessment.tahunPelajaran);
    setTanggal(assessment.tanggalPenilaian);
    setCatatanUmum(assessment.catatanUmum || '');
    setKelebihan(assessment.kelebihan || '');
    setKekurangan(assessment.kekurangan || '');
    setRekomendasi(assessment.rekomendasi || '');

    // Map existing saved scores
    const loadedMap: Record<string, { score: number; catatan: string }> = {};
    indicators.forEach(ind => {
      const found = assessment.items.find(i => i.indicatorId === ind.id || i.title === ind.title);
      if (found) {
        loadedMap[ind.id] = {
          score: found.score,
          catatan: found.catatan || ''
        };
      } else {
        loadedMap[ind.id] = {
          score: 4,
          catatan: ''
        };
      }
    });

    setScoresMap(loadedMap);
    setActiveStageTab('Perencanaan');
    if (viewingAssessment) setViewingAssessment(null);
    setIsFormOpen(true);
  };

  const handleScoreChange = (indId: string, score: number) => {
    setScoresMap(prev => ({
      ...prev,
      [indId]: { ...(prev[indId] || { score: 4, catatan: '' }), score }
    }));
  };

  const handleCatatanChange = (indId: string, catatan: string) => {
    setScoresMap(prev => ({
      ...prev,
      [indId]: { ...(prev[indId] || { score: 4, catatan: '' }), catatan }
    }));
  };

  // Live Score Calculation
  const scorePerencanaan = perencIndicators.reduce((acc, i) => acc + (scoresMap[i.id]?.score ?? 4), 0);
  const maxPerencanaan = perencIndicators.length * 4;

  const scorePelaksanaan = pelaksIndicators.reduce((acc, i) => acc + (scoresMap[i.id]?.score ?? 4), 0);
  const maxPelaksanaan = pelaksIndicators.length * 4;

  const scoreEvaluasi = evalIndicators.reduce((acc, i) => acc + (scoresMap[i.id]?.score ?? 4), 0);
  const maxEvaluasi = evalIndicators.length * 4;

  const totalScore = scorePerencanaan + scorePelaksanaan + scoreEvaluasi;
  const maxScore = maxPerencanaan + maxPelaksanaan + maxEvaluasi;
  const nilaiAkhir = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;

  let predikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)' = 'Amat Baik (A)';
  if (nilaiAkhir < 70) predikat = 'Kurang (D)';
  else if (nilaiAkhir < 80) predikat = 'Cukup (C)';
  else if (nilaiAkhir < 90) predikat = 'Baik (B)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guru = teachers.find(t => t.uid === selectedGuruId);
    if (!guru) {
      alert('Pilih guru yang diobservasi');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = indicators.map(ind => ({
        indicatorId: ind.id,
        stage: ind.stage,
        title: ind.title,
        score: scoresMap[ind.id]?.score ?? 4,
        catatan: scoresMap[ind.id]?.catatan || ''
      }));

      await onSaveAssessment({
        id: editingAssessmentId || undefined,
        scheduleId: selectedScheduleId || '',
        guruId: guru.uid,
        guruName: guru.displayName,
        guruNip: guru.nip || '',
        mataPelajaran: mapel || guru.mataPelajaran || 'Umum',
        kelas,
        materiPokok: materiPokok.trim() || 'Pembelajaran Tematik / Bidang Studi',
        penilaiId: profile?.uid || 'anon',
        penilaiName: profile?.displayName || 'Guru Penilai',
        penilaiNip: profile?.nip || '',
        tanggalPenilaian: tanggal,
        tahunPelajaran,
        semester,
        items,
        scorePerencanaan,
        scorePelaksanaan,
        scoreEvaluasi,
        totalScore,
        maxScore,
        nilaiAkhir,
        predikat,
        catatanUmum: catatanUmum.trim() || 'Observasi kelas terlaksana dengan baik dan tertib.',
        kelebihan: kelebihan.trim() || 'Metode pembelajaran aktif dan interaksi positif terbangun.',
        kekurangan: kekurangan.trim() || 'Waktu refleksi perlu dioptimalkan.',
        rekomendasi: rekomendasi.trim() || 'Pertahankan pola interaksi dan diferensiasi pembelajaran.'
      });

      setIsFormOpen(false);
      triggerSuccess(editingAssessmentId 
        ? 'Hasil observasi kelas berhasil diperbarui!' 
        : 'Hasil observasi kelas berhasil disimpan!'
      );
      setEditingAssessmentId(null);
    } catch (err: unknown) {
      alert('Gagal menyimpan hasil supervisi: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessmentClick = async (a: TeachingSupervisionAssessment) => {
    if (confirm(`Hapus data observasi kelas untuk "${a.guruName}"?`)) {
      if (onDeleteAssessment) {
        await onDeleteAssessment(a.id);
        triggerSuccess(`Data observasi kelas untuk ${a.guruName} berhasil dihapus.`);
      }
    }
  };

  // Indicator Management Handlers
  const handleOpenAddIndicator = () => {
    setEditingIndicatorId(null);
    const defaultStage = stageFilter !== 'Semua' ? stageFilter : 'Pelaksanaan';
    setIndicatorStage(defaultStage);
    const countInStage = indicators.filter(i => i.stage === defaultStage).length + 1;
    setIndicatorCode(defaultStage === 'Perencanaan' ? `PRA-${countInStage}` : defaultStage === 'Pelaksanaan' ? `OBS-${countInStage}` : `PASCA-${countInStage}`);
    setIndicatorTitle('');
    setIndicatorDesc('');
    setIsIndicatorModalOpen(true);
  };

  const handleOpenEditIndicator = (ind: TeachingIndicator) => {
    setEditingIndicatorId(ind.id);
    setIndicatorStage(ind.stage);
    setIndicatorCode(ind.code || '');
    setIndicatorTitle(ind.title);
    setIndicatorDesc(ind.description || '');
    setIsIndicatorModalOpen(true);
  };

  const handleSaveIndicatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicatorTitle.trim()) {
      alert('Judul fokus observasi tidak boleh kosong');
      return;
    }

    try {
      if (editingIndicatorId) {
        if (onUpdateIndicator) {
          await onUpdateIndicator(editingIndicatorId, {
            stage: indicatorStage,
            code: indicatorCode.trim() || `TCH-${indicators.length}`,
            title: indicatorTitle.trim(),
            description: indicatorDesc.trim() || indicatorTitle.trim()
          });
          triggerSuccess('Butir instrumen observasi berhasil diperbarui.');
        }
      } else {
        if (onAddIndicator) {
          await onAddIndicator({
            stage: indicatorStage,
            code: indicatorCode.trim() || `TCH-${indicators.length + 1}`,
            title: indicatorTitle.trim(),
            description: indicatorDesc.trim() || indicatorTitle.trim()
          });
          triggerSuccess('Butir instrumen observasi baru berhasil ditambahkan.');
        }
      }
      setIsIndicatorModalOpen(false);
    } catch (err: unknown) {
      alert('Gagal menyimpan instrumen: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  const handleDeleteIndicatorClick = async (ind: TeachingIndicator) => {
    if (confirm(`Yakin ingin menghapus butir instrumen: "${ind.title}"?`)) {
      if (onDeleteIndicator) {
        await onDeleteIndicator(ind.id);
        triggerSuccess('Butir instrumen observasi berhasil dihapus.');
      }
    }
  };

  const handleResetIndicatorsClick = async () => {
    if (confirm('Kembalikan semua butir instrumen observasi kelas ke format standar madrasah (12 Butir Standar)?')) {
      if (onResetIndicators) {
        await onResetIndicators();
        triggerSuccess('Instrumen observasi kelas berhasil dikembalikan ke standar awal.');
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

      {/* Title & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Instrumen & Supervisi Mengajar di Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Observasi Pembelajaran Terpadu: Perencanaan (Pra-Observasi), Pelaksanaan (Kelas), dan Evaluasi (Pasca-Observasi)
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            id="tab-teaching-assessments"
            onClick={() => setActiveTab('assessments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'assessments'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Hasil Observasi ({assessments.length})
          </button>

          <button
            type="button"
            id="tab-teaching-instruments"
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

      {/* ==================== TAB 1: HASIL OBSERVASI KELAS ==================== */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          
          {/* Top Search & Actions */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-teaching-assessment-input"
                type="text"
                placeholder="Cari nama guru, mapel, materi, penilai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {canAssess && (
              <button
                type="button"
                id="btn-new-teaching-assessment"
                onClick={handleOpenNewForm}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-200" />
                Observasi Kelas Baru (Skala 1-4)
              </button>
            )}
          </div>

          {/* Assessment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {a.kelas} • {a.mataPelajaran}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                      a.nilaiAkhir >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.nilaiAkhir >= 80
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.nilaiAkhir} ({a.predikat.split(' ')[0]})
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {a.guruName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Materi: <span className="font-medium text-slate-700">{a.materiPokok}</span>
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-slate-400 block">Perencanaan</span>
                      <span className="font-bold text-slate-700">{a.scorePerencanaan} pt</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-slate-400 block">Pelaksanaan</span>
                      <span className="font-bold text-slate-700">{a.scorePelaksanaan} pt</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Evaluasi</span>
                      <span className="font-bold text-slate-700">{a.scoreEvaluasi} pt</span>
                    </div>
                  </div>

                  {a.kelebihan && (
                    <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded line-clamp-2">
                      <span className="font-bold">Kelebihan: </span>{a.kelebihan}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {a.tanggalPenilaian} • {a.penilaiName}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingAssessment(a)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Lihat Detail Observasi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {canAssess && (
                      <button
                        type="button"
                        onClick={() => handleEditAssessment(a)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="Edit / Ubah Nilai Observasi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {onExportPdf && (
                      <button
                        type="button"
                        onClick={() => onExportPdf(a)}
                        className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                        title="Unduh Format PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAssessmentClick(a)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Data Observasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredAssessments.length === 0 && (
              <div className="col-span-full bg-white rounded-xl p-10 border border-slate-200 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-slate-700">Belum ada riwayat supervisi mengajar di kelas</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tekan tombol "Observasi Kelas Baru" untuk memulai supervisi proses pembelajaran.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KELOLA BUTIR INSTRUMEN OBSERVASI ==================== */}
      {activeTab === 'instruments' && (
        <div className="space-y-4">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-700" />
                Daftar Butir Instrumen Observasi Pembelajaran di Kelas
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Instrumen observasi mencakup 3 tahapan pembelajaran: Perencanaan (Pra), Pelaksanaan (Kelas), dan Evaluasi (Pasca).
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetIndicatorsClick}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Kembalikan ke 12 Butir Standar Madrasah"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Standar
                </button>

                <button
                  type="button"
                  id="btn-add-teaching-indicator"
                  onClick={handleOpenAddIndicator}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-200" />
                  Tambah Butir Baru
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Perencanaan (Pra)</span>
              <span className="text-lg font-bold text-emerald-800">{perencIndicators.length} Butir</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Pelaksanaan (Kelas)</span>
              <span className="text-lg font-bold text-amber-800">{pelaksIndicators.length} Butir</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Evaluasi (Pasca)</span>
              <span className="text-lg font-bold text-teal-800">{evalIndicators.length} Butir</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">Total Skor Maksimal</span>
              <span className="text-lg font-bold text-slate-900">{indicators.length * 4} Poin</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1 shrink-0 overflow-x-auto">
              {(['Semua', 'Perencanaan', 'Pelaksanaan', 'Evaluasi'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStageFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    stageFilter === st
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st} {st !== 'Semua' && `(${indicators.filter(i => i.stage === st).length})`}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari fokus observasi atau kode butir..."
                value={indicatorSearchTerm}
                onChange={(e) => setIndicatorSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Indicators List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">No</th>
                    <th className="px-4 py-3 w-28">Kode</th>
                    <th className="px-4 py-3 w-40">Tahapan Observasi</th>
                    <th className="px-4 py-3">Fokus & Rubrik Pengamatan</th>
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
                        <span className="font-mono font-bold text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {ind.code || `OBS-${idx + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          ind.stage === 'Perencanaan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ind.stage === 'Pelaksanaan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {ind.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block text-xs">{ind.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {ind.description}
                        </p>
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
                      <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada butir instrumen observasi yang sesuai dengan filter.
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
                <Settings2 className="w-4 h-4 text-amber-600" />
                {editingIndicatorId ? 'Edit Butir Instrumen Observasi Kelas' : 'Tambah Butir Instrumen Baru Secara Manual'}
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
                    Tahapan Supervisi
                  </label>
                  <select
                    value={indicatorStage}
                    onChange={(e) => setIndicatorStage(e.target.value as 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi')}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Perencanaan">1. Perencanaan (Pra-Observasi)</option>
                    <option value="Pelaksanaan">2. Pelaksanaan (Observasi Kelas)</option>
                    <option value="Evaluasi">3. Evaluasi (Pasca-Observasi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Butir
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: OBS-8, PRA-3"
                    value={indicatorCode}
                    onChange={(e) => setIndicatorCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Fokus Observasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengelolaan Kelas dan Integrasi Literasi / Numerasi"
                  value={indicatorTitle}
                  onChange={(e) => setIndicatorTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Rubrik Pengamatan Pengawas (Skala 1 - 4)
                </label>
                <textarea
                  rows={3}
                  placeholder="Panduan penilai dalam menentukan skor 1 (Kurang) hingga 4 (Sangat Baik)..."
                  value={indicatorDesc}
                  onChange={(e) => setIndicatorDesc(e.target.value)}
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
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                >
                  {editingIndicatorId ? 'Simpan Perubahan' : 'Tambahkan Butir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FORM OBSERVASI KELAS (NEW / EDIT) ==================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  {editingAssessmentId 
                    ? 'Edit / Perbarui Nilai Observasi Mengajar di Kelas' 
                    : 'Observasi Baru Proses Pembelajaran di Kelas'
                  }
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penilaian observasi klinis kelas dengan instrumen 3 tahapan (Skala 1 - 4)
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
                    Guru yang Diobservasi *
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
                      .filter(s => s.type === 'Mengajar')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.guruName} ({s.date} - {s.kelas})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas yang Diobservasi
                  </label>
                  <input
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Supervisi
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Semester & Tahun Pelajaran
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                      className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                    <input
                      type="text"
                      value={tahunPelajaran}
                      onChange={(e) => setTahunPelajaran(e.target.value)}
                      className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Materi Pokok / Topik Pembelajaran yang Diobservasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sistem Reproduksi Manusia & Integrasi Nilai Akhlak Mulia"
                  value={materiPokok}
                  onChange={(e) => setMateriPokok(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              {/* Live Score Calculator Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 text-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      Nilai Akhir Observasi Kelas:
                    </span>
                    <div className="font-extrabold text-base text-slate-900">
                      Skor: {totalScore} / {maxScore} → <span className="text-emerald-700 font-extrabold">{nilaiAkhir}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-500">Perencanaan: </span>
                    <span className="text-slate-800">{scorePerencanaan}/{maxPerencanaan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pelaksanaan: </span>
                    <span className="text-slate-800">{scorePelaksanaan}/{maxPelaksanaan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Evaluasi: </span>
                    <span className="text-slate-800">{scoreEvaluasi}/{maxEvaluasi}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-bold">
                    {predikat}
                  </span>
                </div>
              </div>

              {/* 3 Stages Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStageTab('Perencanaan')}
                  className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                    activeStageTab === 'Perencanaan'
                      ? 'border-b-2 border-emerald-700 text-emerald-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  1. Perencanaan ({perencIndicators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('Pelaksanaan')}
                  className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                    activeStageTab === 'Pelaksanaan'
                      ? 'border-b-2 border-amber-600 text-amber-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  2. Pelaksanaan ({pelaksIndicators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('Evaluasi')}
                  className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                    activeStageTab === 'Evaluasi'
                      ? 'border-b-2 border-teal-700 text-teal-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3. Evaluasi ({evalIndicators.length})
                </button>
              </div>

              {/* Current Stage Indicators List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {indicators
                  .filter(i => i.stage === activeStageTab)
                  .map((ind, idx) => {
                    const currentScore = scoresMap[ind.id]?.score ?? 4;
                    const currentCatatan = scoresMap[ind.id]?.catatan || '';

                    return (
                      <div 
                        key={ind.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">
                                {idx + 1}. {ind.title}
                              </span>
                              {ind.code && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({ind.code})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {ind.description}
                            </p>
                          </div>

                          {/* 1 - 4 Scale Selector */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                            {[1, 2, 3, 4].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleScoreChange(ind.id, val)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                                  currentScore === val
                                    ? val === 4
                                      ? 'bg-emerald-700 text-white shadow-xs'
                                      : val === 3
                                      ? 'bg-teal-600 text-white shadow-xs'
                                      : val === 2
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <input
                            type="text"
                            placeholder="Catatan pengamatan penilai untuk butir ini..."
                            value={currentCatatan}
                            onChange={(e) => handleCatatanChange(ind.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Reflection, Strengths, Weaknesses, Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">
                    Kelebihan / Kekuatan Guru Saat Mengajar
                  </label>
                  <textarea
                    rows={2}
                    value={kelebihan}
                    onChange={(e) => setKelebihan(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-emerald-50/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-800 mb-1">
                    Aspek yang Perlu Ditingkatkan / Dibenahi
                  </label>
                  <textarea
                    rows={2}
                    value={kekurangan}
                    onChange={(e) => setKekurangan(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-amber-50/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rekomendasi Tindak Lanjut Pasca Observasi
                </label>
                <textarea
                  rows={2}
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
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
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingAssessmentId ? 'Perbarui Hasil Observasi' : 'Simpan Hasil Observasi')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DETAIL OBSERVASI KELAS ==================== */}
      {viewingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Detail Supervisi Mengajar (Observasi Kelas)
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
                  <span className="text-slate-400 block">Guru yang Diobservasi</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingAssessment.guruName}</span>
                  <span className="text-slate-500 block">NIP. {viewingAssessment.guruNip || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kelas & Mata Pelajaran</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.kelas} • {viewingAssessment.mataPelajaran}</span>
                  <span className="text-slate-500 block">Materi: {viewingAssessment.materiPokok}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Guru Penilai / Supervisor</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.penilaiName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Penilaian</span>
                  <span className="font-bold text-slate-900">{viewingAssessment.tanggalPenilaian}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Nilai Akhir Pembelajaran</span>
                  <div className="text-xl font-extrabold text-amber-900">
                    {viewingAssessment.nilaiAkhir} / 100 ({viewingAssessment.totalScore} dari {viewingAssessment.maxScore} poin)
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-bold text-xs">
                  {viewingAssessment.predikat}
                </span>
              </div>

              {/* 3 Stages Summary */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">1. Perencanaan</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingAssessment.scorePerencanaan} Poin</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">2. Pelaksanaan</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingAssessment.scorePelaksanaan} Poin</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">3. Evaluasi</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingAssessment.scoreEvaluasi} Poin</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Rincian Butir Observasi:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {viewingAssessment.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="pr-2">
                        <span className="font-medium text-slate-800">{idx + 1}. [{it.stage}] {it.title}</span>
                        {it.catatan && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 italic">Catatan: {it.catatan}</span>
                        )}
                      </div>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        it.score === 4 ? 'bg-emerald-100 text-emerald-800' :
                        it.score === 3 ? 'bg-teal-100 text-teal-800' :
                        it.score === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {it.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-2">
                <div>
                  <span className="font-bold text-slate-800 block">Kelebihan Guru:</span>
                  <p className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                    {viewingAssessment.kelebihan || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Aspek yang Perlu Ditingkatkan:</span>
                  <p className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-amber-900">
                    {viewingAssessment.kekurangan || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Rekomendasi Tindak Lanjut:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
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
                      Edit Observasi Ini
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
