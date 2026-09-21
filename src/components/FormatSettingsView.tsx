import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  FileCheck2,
  ListOrdered,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminIndicator, TeachingIndicator, DocumentCategory } from '../types';

interface FormatSettingsViewProps {
  adminIndicators: AdminIndicator[];
  teachingIndicators: TeachingIndicator[];
  documentCategories: DocumentCategory[];
  onAddAdminIndicator: (indicator: Omit<AdminIndicator, 'id'>) => Promise<void>;
  onUpdateAdminIndicator?: (id: string, updates: Partial<AdminIndicator>) => Promise<void>;
  onDeleteAdminIndicator: (id: string) => Promise<void>;
  onResetAdminIndicators?: () => Promise<void>;
  onAddTeachingIndicator: (indicator: Omit<TeachingIndicator, 'id'>) => Promise<void>;
  onUpdateTeachingIndicator?: (id: string, updates: Partial<TeachingIndicator>) => Promise<void>;
  onDeleteTeachingIndicator: (id: string) => Promise<void>;
  onResetTeachingIndicators?: () => Promise<void>;
  onAddCategory: (cat: string) => Promise<void>;
  onDeleteCategory: (cat: string) => Promise<void>;
}

export const FormatSettingsView: React.FC<FormatSettingsViewProps> = ({
  adminIndicators,
  teachingIndicators,
  documentCategories,
  onAddAdminIndicator,
  onUpdateAdminIndicator,
  onDeleteAdminIndicator,
  onResetAdminIndicators,
  onAddTeachingIndicator,
  onUpdateTeachingIndicator,
  onDeleteTeachingIndicator,
  onResetTeachingIndicators,
  onAddCategory,
  onDeleteCategory
}) => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'teaching' | 'categories'>('admin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New admin indicator form
  const [admCode, setAdmCode] = useState('');
  const [admCat, setAdmCat] = useState('Dokumen Perencanaan Pembelajaran');
  const [admLabel, setAdmLabel] = useState('');
  const [admBobot, setAdmBobot] = useState<number>(2);

  // Edit modal for admin indicator
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editAdmCode, setEditAdmCode] = useState('');
  const [editAdmCat, setEditAdmCat] = useState('');
  const [editAdmLabel, setEditAdmLabel] = useState('');
  const [editAdmBobot, setEditAdmBobot] = useState<number>(2);

  // New teaching indicator form
  const [tchStage, setTchStage] = useState<'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'>('Pelaksanaan');
  const [tchCode, setTchCode] = useState('');
  const [tchTitle, setTchTitle] = useState('');
  const [tchDesc, setTchDesc] = useState('');

  // Edit modal for teaching indicator
  const [editingTeachingId, setEditingTeachingId] = useState<string | null>(null);
  const [editTchStage, setEditTchStage] = useState<'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'>('Pelaksanaan');
  const [editTchCode, setEditTchCode] = useState('');
  const [editTchTitle, setEditTchTitle] = useState('');
  const [editTchDesc, setEditTchDesc] = useState('');

  // New category form
  const [newCat, setNewCat] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (role !== 'admin') {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500">
        <Sliders className="w-12 h-12 mx-auto text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-800 text-base">Akses Khusus Administrator</h3>
        <p className="text-xs text-slate-500 mt-1">
          Modul Format Penilaian hanya dapat dikelola oleh Admin Si-SuGu MAN 2 Gorontalo.
        </p>
      </div>
    );
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admLabel.trim()) return;
    await onAddAdminIndicator({
      code: admCode.trim() || `ADM-${adminIndicators.length + 1}`,
      category: admCat.trim(),
      label: admLabel.trim(),
      bobot: admBobot
    });
    setAdmCode('');
    setAdmLabel('');
    triggerToast('Indikator administrasi baru berhasil ditambahkan.');
  };

  const handleStartEditAdmin = (ind: AdminIndicator) => {
    setEditingAdminId(ind.id);
    setEditAdmCode(ind.code || '');
    setEditAdmCat(ind.category);
    setEditAdmLabel(ind.label);
    setEditAdmBobot(ind.bobot || 2);
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId || !editAdmLabel.trim()) return;
    if (onUpdateAdminIndicator) {
      await onUpdateAdminIndicator(editingAdminId, {
        code: editAdmCode.trim(),
        category: editAdmCat.trim(),
        label: editAdmLabel.trim(),
        bobot: editAdmBobot
      });
      triggerToast('Indikator administrasi berhasil diperbarui.');
    }
    setEditingAdminId(null);
  };

  const handleAddTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tchTitle.trim()) return;
    await onAddTeachingIndicator({
      stage: tchStage,
      code: tchCode.trim() || `TCH-${teachingIndicators.length + 1}`,
      title: tchTitle.trim(),
      description: tchDesc.trim() || tchTitle.trim()
    });
    setTchCode('');
    setTchTitle('');
    setTchDesc('');
    triggerToast('Butir observasi mengajar berhasil ditambahkan.');
  };

  const handleStartEditTeaching = (ind: TeachingIndicator) => {
    setEditingTeachingId(ind.id);
    setEditTchStage(ind.stage);
    setEditTchCode(ind.code || '');
    setEditTchTitle(ind.title);
    setEditTchDesc(ind.description || '');
  };

  const handleSaveEditTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeachingId || !editTchTitle.trim()) return;
    if (onUpdateTeachingIndicator) {
      await onUpdateTeachingIndicator(editingTeachingId, {
        stage: editTchStage,
        code: editTchCode.trim(),
        title: editTchTitle.trim(),
        description: editTchDesc.trim()
      });
      triggerToast('Butir observasi mengajar berhasil diperbarui.');
    }
    setEditingTeachingId(null);
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    await onAddCategory(newCat.trim());
    setNewCat('');
    triggerToast('Kategori berkas baru berhasil ditambahkan.');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-fade-in text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-700" />
            Format & Standar Instrumen Supervisi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi butir indikator administrasi, skala observasi kelas (1-4), dan kategori dokumen ajar
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Indikator Administrasi ({adminIndicators.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teaching')}
          className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'teaching'
              ? 'border-b-2 border-amber-600 text-amber-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          Indikator Supervisi Mengajar ({teachingIndicators.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-2 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-b-2 border-teal-700 text-teal-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Kategori Berkas Ajar ({documentCategories.length})
        </button>
      </div>

      {/* Tab 1: Administrasi */}
      {activeTab === 'admin' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                Tambah Indikator Administrasi Baru
              </h4>
              {onResetAdminIndicators && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kembalikan ke 17 Butir Standar Madrasah?')) {
                      onResetAdminIndicators();
                      triggerToast('Indikator administrasi direset ke standar.');
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset ke Standar Awal
                </button>
              )}
            </div>

            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kode Butir</label>
                <input
                  type="text"
                  placeholder="Contoh: A4, ADM-18"
                  value={admCode}
                  onChange={(e) => setAdmCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kategori Bagian</label>
                <input
                  type="text"
                  placeholder="Perencanaan Tahunan"
                  value={admCat}
                  onChange={(e) => setAdmCat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Nama Dokumen Indikator</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lembar Analisis Ketercapaian Target Kurikulum"
                    value={admLabel}
                    onChange={(e) => setAdmLabel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shrink-0"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-16">Kode</th>
                  <th className="px-4 py-2.5 w-48">Kategori</th>
                  <th className="px-4 py-2.5">Nama Indikator Administrasi</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-700">{ind.code}</td>
                    <td className="px-4 py-2.5 text-slate-500">{ind.category}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{ind.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditAdmin(ind)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAdminIndicator(ind.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Teaching Indicators */}
      {activeTab === 'teaching' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-600" />
                Tambah Butir Observasi Mengajar (Skala 1-4)
              </h4>
              {onResetTeachingIndicators && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kembalikan ke 12 Butir Standar Madrasah?')) {
                      onResetTeachingIndicators();
                      triggerToast('Indikator observasi kelas direset ke standar.');
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-amber-700 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset ke Standar Awal
                </button>
              )}
            </div>

            <form onSubmit={handleAddTeaching} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tahap Supervisi</label>
                  <select
                    value={tchStage}
                    onChange={(e) => setTchStage(e.target.value as 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi')}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Perencanaan">1. Perencanaan (Pra-Observasi)</option>
                    <option value="Pelaksanaan">2. Pelaksanaan (Di Kelas)</option>
                    <option value="Evaluasi">3. Evaluasi (Pasca-Observasi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kode Indikator</label>
                  <input
                    type="text"
                    placeholder="OBS-8"
                    value={tchCode}
                    onChange={(e) => setTchCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Judul Fokus Indikator</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Integrasi Moderasi Beragama"
                    value={tchTitle}
                    onChange={(e) => setTchTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deskripsi Deskriptif Pengamatan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Guru mengaitkan materi pembelajaran dengan sikap toleransi dan keberagaman..."
                    value={tchDesc}
                    onChange={(e) => setTchDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0"
                  >
                    Simpan Butir
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-16">Kode</th>
                  <th className="px-4 py-2.5 w-32">Tahapan</th>
                  <th className="px-4 py-2.5">Judul & Deskripsi Indikator</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachingIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-700">{ind.code}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ind.stage === 'Perencanaan' ? 'bg-emerald-100 text-emerald-800' :
                        ind.stage === 'Pelaksanaan' ? 'bg-amber-100 text-amber-800' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {ind.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-slate-900 block">{ind.title}</span>
                      <span className="text-[11px] text-slate-500">{ind.description}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditTeaching(ind)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTeachingIndicator(ind.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Document Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-700" />
              Tambah Kategori Dokumen Perangkat Ajar
            </h4>
            <form onSubmit={handleAddCat} className="flex gap-2 max-w-md text-xs">
              <input
                type="text"
                required
                placeholder="Contoh: Rencana Pelaksanaan Asesmen Diagnostik"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shrink-0"
              >
                Tambah
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {documentCategories.map((cat, idx) => (
              <div 
                key={cat}
                className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-800 truncate pr-2">
                  {idx + 1}. {cat}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdminId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Edit Indikator Administrasi</h3>
            <form onSubmit={handleSaveEditAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Butir</label>
                <input
                  type="text"
                  value={editAdmCode}
                  onChange={(e) => setEditAdmCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={editAdmCat}
                  onChange={(e) => setEditAdmCat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Label Indikator</label>
                <textarea
                  rows={2}
                  required
                  value={editAdmLabel}
                  onChange={(e) => setEditAdmLabel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdminId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teaching Modal */}
      {editingTeachingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Edit Butir Observasi Mengajar</h3>
            <form onSubmit={handleSaveEditTeaching} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahap Supervisi</label>
                <select
                  value={editTchStage}
                  onChange={(e) => setEditTchStage(e.target.value as 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi')}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Perencanaan">1. Perencanaan</option>
                  <option value="Pelaksanaan">2. Pelaksanaan</option>
                  <option value="Evaluasi">3. Evaluasi</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Butir</label>
                <input
                  type="text"
                  value={editTchCode}
                  onChange={(e) => setEditTchCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Fokus</label>
                <input
                  type="text"
                  required
                  value={editTchTitle}
                  onChange={(e) => setEditTchTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Rubrik Pengamatan</label>
                <textarea
                  rows={3}
                  value={editTchDesc}
                  onChange={(e) => setEditTchDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeachingId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
