import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Save, 
  Eye, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Check,
  Loader2
} from 'lucide-react';
import { PopupBannerConfig, UserProfile } from '../types';
import { optimizeImageForBanner, formatFileSize } from '../lib/imageCompression';

interface PopupBannerSettingsViewProps {
  config: PopupBannerConfig | null;
  teachers: UserProfile[];
  onSaveConfig: (updated: PopupBannerConfig) => Promise<void>;
  onTriggerPreview: (config: PopupBannerConfig) => void;
}

const PRESET_BANNERS = [
  {
    title: 'Supervisi Akademik Guru Semester Ganjil',
    caption: 'Dihimbau kepada seluruh Guru untuk melengkapi perangkat pembelajaran & mengecek jadwal observasi.',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
    actionLabel: 'Lihat Jadwal Supervisi',
    actionUrl: 'tab:jadwal'
  },
  {
    title: 'Batas Akhir Pengunggahan Perangkat Ajar',
    caption: 'Pengunggahan Modul Ajar/RPP, ATP, dan Rubrik Asesmen ditutup akhir pekan ini untuk verifikasi penilai.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    actionLabel: 'Unggah Perangkat',
    actionUrl: 'tab:perangkat'
  },
  {
    title: 'Rembuk Mutu & Rencana Tindak Lanjut (RTL)',
    caption: 'Bapak/Ibu Guru yang telah selesai disupervisi diharapkan segera melengkapi kesepakatan RTL.',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop',
    actionLabel: 'Buka Tindak Lanjut',
    actionUrl: 'tab:tindak-lanjut'
  }
];

export const PopupBannerSettingsView: React.FC<PopupBannerSettingsViewProps> = ({
  config,
  teachers,
  onSaveConfig,
  onTriggerPreview
}) => {
  const [formData, setFormData] = useState<PopupBannerConfig>(() => {
    if (config) return { ...config };
    return {
      title: 'Pemberitahuan Pelaksanaan Supervisi Akademik Guru',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
      caption: 'Dihimbau kepada seluruh Bapak/Ibu Guru untuk memeriksa jadwal supervisi dan mempersiapkan kelengkapan perangkat ajar.',
      actionUrl: 'tab:jadwal',
      actionLabel: 'Lihat Jadwal Supervisi',
      isActive: true,
      targetAudience: 'all',
      targetUserIds: [],
      showOnLogin: true,
      timedTriggerEnabled: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      startTime: '07:00',
      endTime: '17:00',
      frequency: 'once_a_day',
      updatedAt: new Date().toISOString()
    };
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [urlInput, setUrlInput] = useState(() => {
    if (formData.imageUrl && !formData.imageUrl.startsWith('data:image/')) {
      return formData.imageUrl;
    }
    return '';
  });
  const [imageError, setImageError] = useState(false);
  const [imageMeta, setImageMeta] = useState<{
    size: string;
    originalSize?: string;
    name?: string;
    dimensions?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track if user has modified form locally so external config snapshot doesn't overwrite work in progress
  const isDirtyRef = useRef(false);
  const initialLoadedRef = useRef(false);

  // Synchronize ONLY when config is first loaded or when explicitly updated and user is not actively editing
  useEffect(() => {
    if (config) {
      if (!initialLoadedRef.current) {
        setFormData(config);
        if (config.imageUrl && !config.imageUrl.startsWith('data:image/')) {
          setUrlInput(config.imageUrl);
        }
        initialLoadedRef.current = true;
      } else if (!isDirtyRef.current) {
        // Only sync if form is clean and not currently modified by user
        setFormData(config);
        if (config.imageUrl && !config.imageUrl.startsWith('data:image/')) {
          setUrlInput(config.imageUrl);
        }
      }
    }
  }, [config]);

  const processAndCompressFile = async (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Format gambar harus berupa JPG, JPEG, atau PNG!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran berkas gambar maksimal 8 MB.');
      return;
    }

    setOptimizing(true);
    setImageError(false);
    setSaveError(null);

    try {
      // Automatically compress and resize to optimal dimensions for desktop & mobile
      const result = await optimizeImageForBanner(file, 1200, 900, 0.82);
      
      setFormData(prev => ({ ...prev, imageUrl: result.dataUrl }));
      setUrlInput(''); // Keep text input clean of massive base64 strings
      setImageMeta({
        name: file.name,
        size: result.sizeFormatted,
        originalSize: formatFileSize(file.size),
        dimensions: `${result.width} × ${result.height} px`
      });
      isDirtyRef.current = true;
    } catch (err) {
      console.error('Error optimizing banner image:', err);
      alert('Gagal memproses dan mengompres gambar. Silakan coba gambar lain.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndCompressFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processAndCompressFile(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setFormData(prev => ({ ...prev, imageUrl: urlInput.trim() }));
    setImageMeta(null);
    setImageError(false);
    isDirtyRef.current = true;
  };

  const handleSelectPreset = (preset: typeof PRESET_BANNERS[0]) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      caption: preset.caption,
      imageUrl: preset.imageUrl,
      actionLabel: preset.actionLabel,
      actionUrl: preset.actionUrl
    }));
    setUrlInput(preset.imageUrl);
    setImageMeta(null);
    setImageError(false);
    isDirtyRef.current = true;
  };

  const handleToggleTeacher = (uid: string) => {
    isDirtyRef.current = true;
    const current = formData.targetUserIds || [];
    if (current.includes(uid)) {
      setFormData(prev => ({ ...prev, targetUserIds: current.filter(id => id !== uid) }));
    } else {
      setFormData(prev => ({ ...prev, targetUserIds: [...current, uid] }));
    }
  };

  const handleSave = async () => {
    if (!formData.imageUrl) {
      alert('Silakan unggah atau tentukan gambar pop-up terlebih dahulu!');
      return;
    }
    if (!formData.title.trim()) {
      alert('Silakan masukkan judul pop-up pengumuman!');
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);

    try {
      let finalImageUrl = formData.imageUrl;
      // Double check if base64 is still uncompressed (e.g. pasted directly)
      if (finalImageUrl.startsWith('data:image/') && finalImageUrl.length > 500000) {
        try {
          const reOptimized = await optimizeImageForBanner(finalImageUrl, 1200, 900, 0.78);
          finalImageUrl = reOptimized.dataUrl;
        } catch (e) {
          console.warn('Re-optimization warning:', e);
        }
      }

      const payload: PopupBannerConfig = {
        ...formData,
        imageUrl: finalImageUrl,
        updatedAt: new Date().toISOString()
      };

      await onSaveConfig(payload);
      
      // Update form state with the exact payload saved
      setFormData(payload);
      isDirtyRef.current = false;
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to save popup config:', err);
      const msg = err?.message || 'Terjadi kesalahan saat menyimpan pengaturan pop-up ke database.';
      setSaveError(msg);
      alert('Gagal menyimpan pop-up ke database: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ImageIcon className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Pengaturan Admin Madrasah
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Pengaturan Pop-up Banner & Pengumuman Layar Utama
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola pop-up visual gambar (JPG, JPEG, PNG) yang otomatis tampil pada layar utama pengguna setelah login atau pada waktu tertentu sesuai jadwal yang ditentukan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTriggerPreview(formData)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Uji Coba Pop-up (Preview)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan pop-up banner berhasil disimpan ke database! Pengguna akan melihat banner ini sesuai kriteria yang telah Anda atur.</span>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image Upload & Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              1. Berkas Gambar Pop-up (JPG, JPEG, PNG)
            </h2>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${
                optimizing
                  ? 'border-emerald-500 bg-emerald-50/50 pointer-events-none'
                  : 'border-slate-300 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/30'
              }`}
              onClick={() => !optimizing && fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/jpg,image/png" 
                onChange={handleFileUpload}
                className="hidden" 
              />
              
              {optimizing ? (
                <div className="py-2 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-2" />
                  <p className="text-xs font-bold text-emerald-800">
                    Mengompres & Mengoptimasi Gambar...
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Menyesuaikan resolusi agar pas dan cepat dimuat di database
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk unggah atau seret berkas ke sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format: <span className="font-semibold text-emerald-700">JPEG, JPG, PNG</span> (Otomatis Dioptimasi)
                  </p>
                </>
              )}
            </div>

            {/* Image URL Input as alternative */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Atau Gunakan Tautan URL Gambar:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://domain.com/banner-supervisi.png"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Live Preview Display Box */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Pratinjau Gambar Terpilih:</span>
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setUrlInput('');
                      setImageMeta(null);
                      isDirtyRef.current = true;
                    }}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                )}
              </div>

              <div className="relative bg-slate-100 border border-slate-200 rounded-xl overflow-hidden min-h-[160px] max-h-[260px] flex items-center justify-center">
                {optimizing ? (
                  <div className="text-center p-6 text-slate-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 animate-spin" />
                    <p className="text-xs font-medium">Sedang memproses gambar...</p>
                  </div>
                ) : formData.imageUrl && !imageError ? (
                  <img
                    src={formData.imageUrl}
                    alt="Pratinjau Pop-up"
                    onError={() => setImageError(true)}
                    className="w-full h-auto max-h-[260px] object-contain block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Belum ada gambar yang dipilih atau tautan tidak valid.</p>
                  </div>
                )}
              </div>

              {/* Optimization Metadata Badge */}
              {imageMeta && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate text-emerald-950">
                        {imageMeta.name || 'Berkas Gambar'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px] shrink-0">
                        Siap Disimpan
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Ukuran: <strong className="text-emerald-900">{imageMeta.size}</strong> 
                      {imageMeta.originalSize && (
                        <span> (dari {imageMeta.originalSize})</span>
                      )}
                      {imageMeta.dimensions && (
                        <span> &bull; Resolusi {imageMeta.dimensions}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Template Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Template Gambar Cepat (Bawaan):
              </p>
              <div className="space-y-2">
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center gap-3 transition group"
                  >
                    <img 
                      src={preset.imageUrl} 
                      alt="" 
                      className="w-12 h-10 rounded-lg object-cover bg-slate-200 shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">
                        {preset.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {preset.caption}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings, Rules, & Triggers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card: Status & Konten */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                2. Status & Konten Pop-up
              </h2>

              {/* Master Toggle Active */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-800">
                  {formData.isActive ? 'Banner AKTIF' : 'Banner NONAKTIF'}
                </span>
              </label>
            </div>

            {/* Title & Caption */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pop-up Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Jadwal Pelaksanaan Supervisi Guru Semester Ganjil"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Pesan Pendukung (Opsional)
                </label>
                <textarea 
                  rows={2}
                  value={formData.caption || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Instruksi atau catatan pengingat bagi guru..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Action Button Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Tombol Aksi (Opsional)
                  </label>
                  <input 
                    type="text"
                    value={formData.actionLabel || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionLabel: e.target.value }))}
                    placeholder="Contoh: Buka Jadwal Supervisi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan Tujuan (Tab atau URL Luar)
                  </label>
                  <input 
                    type="text"
                    value={formData.actionUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                    placeholder="tab:jadwal, tab:perangkat, atau https://..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Target Audiens (Penerima) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              3. Sasaran Pengguna (Target Audience)
            </h2>
            <p className="text-xs text-slate-500">
              Tentukan siapa saja yang dapat melihat pop-up banner ini di layar utama mereka:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'all', label: 'Semua Pengguna' },
                { id: 'guru', label: 'Hanya Guru' },
                { id: 'penilai', label: 'Hanya Guru Penilai' },
                { id: 'kamad', label: 'Hanya Kepala Madrasah' },
                { id: 'specific', label: 'Pilih Guru Tertentu' }
              ].map((opt) => (
                <label 
                  key={opt.id}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                    formData.targetAudience === opt.id 
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="targetAudience"
                    value={opt.id}
                    checked={formData.targetAudience === opt.id}
                    onChange={() => setFormData(prev => ({ ...prev, targetAudience: opt.id as any }))}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Multi-select for specific teachers */}
            {formData.targetAudience === 'specific' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-3">
                <p className="text-xs font-bold text-slate-800">
                  Pilih Guru yang Ditargetkan ({formData.targetUserIds?.length || 0} dipilih):
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {teachers.map(t => {
                    const isChecked = formData.targetUserIds?.includes(t.uid);
                    return (
                      <label 
                        key={t.uid}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTeacher(t.uid)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-slate-800 truncate">{t.displayName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0 ml-2">{t.mataPelajaran || t.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card: Pemicu Kemunculan & Waktu Tayang */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              4. Pemicu Kemunculan & Jadwal Waktu (Triggers)
            </h2>
            <p className="text-xs text-slate-500">
              Atur kapan dan seberapa sering pop-up ini akan ditampilkan kepada pengguna:
            </p>

            {/* Triggers Checkboxes */}
            <div className="space-y-3">
              
              {/* Trigger 1: Show on login */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input 
                  type="checkbox"
                  checked={formData.showOnLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, showOnLogin: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Muncul Otomatis Setelah Berhasil Login
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pop-up langsung terbuka di layar utama begitu pengguna masuk ke sistem.
                  </p>
                </div>
              </label>

              {/* Trigger 2: Timed Trigger */}
              <div className="p-3 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.timedTriggerEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, timedTriggerEnabled: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Muncul Pada Waktu-Waktu Tertentu (Terjadwal)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Pop-up hanya akan aktif dan tayang pada rentang tanggal atau jam tertentu.
                    </p>
                  </div>
                </label>

                {formData.timedTriggerEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pl-7 border-t border-slate-100 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Tanggal Mulai Tayang:
                      </label>
                      <input 
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Tanggal Selesai Tayang:
                      </label>
                      <input 
                        type="date"
                        value={formData.endDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Jam Mulai Tayang Harian:
                      </label>
                      <input 
                        type="time"
                        value={formData.startTime || '07:00'}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Jam Berakhir Tayang Harian:
                      </label>
                      <input 
                        type="time"
                        value={formData.endTime || '17:00'}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Frequency selection */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Frekuensi Kemunculan Bagi Pengguna:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'once_a_day', label: 'Sekali Sehari', desc: 'Maksimal 1x per hari per pengguna' },
                  { id: 'every_session', label: 'Setiap Sesi Login', desc: 'Muncul setiap kali user baru login' },
                  { id: 'always', label: 'Selalu Muncul', desc: 'Selalu aktif hingga user menutupnya' }
                ].map(freq => (
                  <label 
                    key={freq.id}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                      formData.frequency === freq.id
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="frequency"
                      value={freq.id}
                      checked={formData.frequency === freq.id}
                      onChange={() => setFormData(prev => ({ ...prev, frequency: freq.id as any }))}
                      className="sr-only"
                    />
                    <p>{freq.label}</p>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">{freq.desc}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action bottom button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onTriggerPreview(formData)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              <Eye className="w-4 h-4" />
              <span>Pratinjau Langsung</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
