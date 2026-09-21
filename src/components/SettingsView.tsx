import React, { useState, useRef } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  Image as ImageIcon,
  UploadCloud,
  Palette,
  Trash2,
  Sparkles,
  Check,
  Globe,
  Sliders,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Eye,
  Database,
  DownloadCloud,
  HardDrive,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSetting } from '../types';
import { optimizeImageForLogo, formatFileSize } from '../lib/imageCompression';

interface SettingsViewProps {
  settings: AppSetting;
  onUpdateSettings: (newSettings: Partial<AppSetting>) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
  backupData?: Record<string, unknown>;
}

// Preset branding colors curated for educational and modern institutional aesthetics
const BRAND_COLOR_PRESETS = [
  { name: 'Hijau Kemenag (Default)', hex: '#047857', light: '#ecfdf5' },
  { name: 'Hijau Zamrud (Emerald)', hex: '#059669', light: '#ecfdf5' },
  { name: 'Hijau Hutan (Forest)', hex: '#15803d', light: '#f0fdf4' },
  { name: 'Teal Modern', hex: '#0f766e', light: '#f0fdfa' },
  { name: 'Biru Samudra (Ocean)', hex: '#0284c7', light: '#f0f9ff' },
  { name: 'Biru Kerajaan (Royal)', hex: '#2563eb', light: '#eff6ff' },
  { name: 'Indigo Akademik', hex: '#4338ca', light: '#eef2ff' },
  { name: 'Ungu Elegan', hex: '#7c3aed', light: '#f5f3ff' },
  { name: 'Emas Madrasah (Amber)', hex: '#b45309', light: '#fffbeb' },
  { name: 'Merah Marun (Crimson)', hex: '#9f1239', light: '#fff1f2' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigateTab,
  backupData
}) => {
  const { profile, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Function to download JSON backup
  const handleDownloadBackup = () => {
    try {
      const dataToExport = backupData || {
        settings,
        exportDate: new Date().toISOString(),
        madrasah: settings.madrasahName,
        note: 'Cadangan data darurat sistem Si-SuGu'
      };

      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup_sisugu_${settings.madrasahName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal mengunduh cadangan JSON:', err);
      alert('Terjadi kesalahan saat mengunduh data cadangan.');
    }
  };

  // Branding states
  const [appName, setAppName] = useState(settings.appName || 'Si-SuGu');
  const [tagline, setTagline] = useState(settings.tagline || 'Sistem Informasi Supervisi Guru Terpadu');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#047857');
  const [appLogoUrl, setAppLogoUrl] = useState(settings.appLogoUrl || settings.logoUrl || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [syncKopLogo, setSyncKopLogo] = useState(true);

  // Logo upload state
  const [logoSizeInfo, setLogoSizeInfo] = useState<string | null>(null);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // School official settings states
  const [madrasahName, setMadrasahName] = useState(settings.madrasahName || 'MAN 2 Kabupaten Gorontalo');
  const [kabupaten, setKabupaten] = useState(settings.kabupaten || 'Kabupaten Gorontalo');
  const [provinsi, setProvinsi] = useState(settings.provinsi || 'Provinsi Gorontalo');
  const [kamadName, setKamadName] = useState(settings.kepalaMadrasahName || '');
  const [kamadNip, setKamadNip] = useState(settings.kepalaMadrasahNip || '');
  const [tahunPelajaran, setTahunPelajaran] = useState(settings.tahunPelajaranAktif || '2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(settings.semesterAktif || 'Ganjil');
  const [alamat, setAlamat] = useState(settings.alamat || '');

  // Submission state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Process and optimize uploaded image file
  const handleProcessLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Format file tidak didukung. Harap pilih gambar (PNG, JPG, SVG, WebP).' });
      return;
    }

    setIsCompressingLogo(true);
    setMessage(null);
    try {
      const result = await optimizeImageForLogo(file, 512);
      setAppLogoUrl(result.dataUrl);
      if (syncKopLogo) {
        setLogoUrl(result.dataUrl);
      }
      setLogoSizeInfo(`${result.width}x${result.height} px (${result.sizeFormatted})`);
      setMessage({ type: 'success', text: `Logo aplikasi berhasil dimuat dan dioptimalkan (${result.sizeFormatted}). Jangan lupa klik Simpan Pengaturan.` });
    } catch (err) {
      console.error('Logo compression failed:', err);
      setMessage({ type: 'error', text: 'Gagal memproses gambar logo. Silakan coba file lain.' });
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveLogo = () => {
    setAppLogoUrl('');
    if (syncKopLogo) {
      setLogoUrl('');
    }
    setLogoSizeInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefaultColor = () => {
    setPrimaryColor('#047857');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updatedConfig: Partial<AppSetting> = {
        appName: appName.trim() || 'Si-SuGu',
        tagline: tagline.trim() || 'Sistem Informasi Supervisi Guru Terpadu',
        primaryColor: primaryColor || '#047857',
        appLogoUrl: appLogoUrl.trim(),
        logoUrl: (syncKopLogo ? appLogoUrl.trim() : logoUrl.trim()) || appLogoUrl.trim(),
        madrasahName: madrasahName.trim(),
        kabupaten: kabupaten.trim(),
        provinsi: provinsi.trim(),
        kepalaMadrasahName: kamadName.trim(),
        kepalaMadrasahNip: kamadNip.trim(),
        tahunPelajaranAktif: tahunPelajaran.trim(),
        semesterAktif: semester,
        alamat: alamat.trim()
      };

      await onUpdateSettings(updatedConfig);
      setMessage({ 
        type: 'success', 
        text: 'Pengaturan aplikasi dan identitas branding berhasil disimpan ke Firestore (settings/madrasahConfig) dan langsung diterapkan.' 
      });
    } catch (err: unknown) {
      setMessage({ 
        type: 'error', 
        text: 'Gagal menyimpan pengaturan: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan sistem') 
      });
    } finally {
      setSaving(false);
    }
  };

  const canEditSchoolSettings = role === 'admin' || role === 'kamad';

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" style={{ color: primaryColor }} />
            Pengaturan Aplikasi & Branding Madrasah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan logo aplikasi, nama sistem, slogan, warna branding utama, dan data resmi madrasah
          </p>
        </div>
        {canEditSchoolSettings && (
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-2 text-xs shadow-md shadow-emerald-900/10 hover:opacity-95 active:scale-95 transition"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        )}
      </div>

      {/* Alert / Notification Feedback */}
      {message && (
        <div 
          className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-3 transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {message.type === 'success' ? (
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">
            {message.text}
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700" style={{ color: primaryColor }} />
          Profil Saya ({profile?.displayName || 'Pengguna Terdaftar'})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Nama Lengkap & Gelar</span>
            <span className="font-semibold text-slate-800 text-sm">{profile?.displayName || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Hak Akses / Peran Akun</span>
            <span 
              className="inline-block font-bold uppercase text-[11px] px-2.5 py-0.5 rounded-full border mt-0.5"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: `${primaryColor}40`
              }}
            >
              {profile?.role || 'GURU'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">NIP (Nomor Induk Pegawai)</span>
            <span className="font-medium text-slate-700">{profile?.nip || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Mata Pelajaran yang Diampu</span>
            <span className="font-medium text-slate-700">{profile?.mataPelajaran || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Alamat Email Terdaftar</span>
            <span className="font-medium text-slate-700">{profile?.email || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Pangkat / Golongan</span>
            <span className="font-medium text-slate-700">{profile?.pangkatGolongan || 'Penata Muda / III.a'}</span>
          </div>
        </div>
      </div>

      {/* BRANDING & IDENTITY CONFIGURATION */}
      {canEditSchoolSettings ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Card: App Branding & Visuals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Identitas Visual & Branding Aplikasi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi logo, nama sistem, slogan, dan warna tema utama yang diterapkan secara dinamis
                  </p>
                </div>
              </div>
            </div>

            {/* 1. App Logo File Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Logo Aplikasi (App Logo)
              </label>
              <p className="text-[11px] text-slate-500">
                Unggah berkas gambar logo resmi madrasah / instansi (disarankan format PNG berlatar transparan atau SVG/WebP/JPG). Logo akan ditampilkan pada bilah navigasi (Navbar), halaman login, dan kop surat.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
                
                {/* Upload Dropzone */}
                <div className="md:col-span-7">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="input-logo-file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition"
                      style={{ 
                        backgroundColor: `${primaryColor}15`, 
                        color: primaryColor 
                      }}
                    >
                      {isCompressingLogo ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {isCompressingLogo ? 'Mengoptimalkan Gambar...' : 'Klik untuk Memilih File atau Seret ke Sini'}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Mendukung format PNG transparan, JPG, SVG, WebP (Maks. 5 MB)
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mt-1 px-3 py-1.5 rounded-lg text-white font-medium text-[11px] shadow-xs hover:opacity-90 transition"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Pilih Berkas Logo
                    </button>
                  </div>

                  {/* Optional Direct URL Toggle */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{showUrlInput ? 'Sembunyikan Input URL' : 'Atau gunakan URL tautan gambar langsung'}</span>
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={appLogoUrl}
                        onChange={(e) => {
                          setAppLogoUrl(e.target.value);
                          if (syncKopLogo) setLogoUrl(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Sync with Kop Surat Checkbox */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sync-kop-logo"
                      checked={syncKopLogo}
                      onChange={(e) => {
                        setSyncKopLogo(e.target.checked);
                        if (e.target.checked && appLogoUrl) {
                          setLogoUrl(appLogoUrl);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <label htmlFor="sync-kop-logo" className="text-xs text-slate-600 cursor-pointer select-none">
                      Terapkan logo ini juga untuk Kop Surat & ekspor dokumen resmi PDF
                    </label>
                  </div>
                </div>

                {/* Logo Preview Card */}
                <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center min-h-[190px]">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    Pratinjau Logo
                  </span>

                  {appLogoUrl ? (
                    <div className="space-y-3 w-full flex flex-col items-center">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center max-w-[150px] max-h-[150px] min-h-[90px] min-w-[90px]">
                        <img
                          src={appLogoUrl}
                          alt="Logo Aplikasi"
                          className="max-h-24 max-w-full object-contain drop-shadow-xs"
                          onError={() => setMessage({ type: 'error', text: 'Tautan logo tidak valid atau gambar gagal dimuat.' })}
                        />
                      </div>

                      {logoSizeInfo && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {logoSizeInfo}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-medium transition"
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 text-slate-400 flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-200/70 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium">Belum Ada Logo Khusus</span>
                      <span className="text-[10px] text-slate-400 max-w-[200px]">
                        Sistem menggunakan ikon gedung madrasah bawaan secara otomatis.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Application Name & Tagline Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Aplikasi (Application Name) *
                </label>
                <input
                  type="text"
                  required
                  id="input-app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Si-SuGu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ditampilkan di logo bilah navigasi atas, judul browser, dan halaman login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Slogan Aplikasi *
                </label>
                <input
                  type="text"
                  required
                  id="input-app-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Sistem Informasi Supervisi Guru Terpadu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Slogan penjelasan singkat yang muncul di bawah nama aplikasi dan footer.
                </p>
              </div>
            </div>

            {/* 3. Primary Color Branding Input & Presets */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-700" style={{ color: primaryColor }} />
                    Warna Branding Utama (Primary Color Branding)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih warna tema resmi untuk tombol utama, bilah navigasi, ikon, dan aksen aktif di seluruh aplikasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaultColor}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Default Kemenag</span>
                </button>
              </div>

              {/* Color input + Hex code input */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <input
                    type="color"
                    id="input-primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor.toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      setPrimaryColor(val);
                    }}
                    maxLength={7}
                    placeholder="#047857"
                    className="w-24 px-2 py-1 rounded-md border border-slate-200 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div 
                  className="px-3 py-1.5 rounded-xl text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aksen Aktif: {primaryColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Preset Palette Swatches */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-2 font-medium">
                  Palet Warna Pilihan Instansi:
                </span>
                <div className="flex flex-wrap gap-2">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isSelected = primaryColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setPrimaryColor(preset.hex)}
                        title={preset.name}
                        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-1 border-transparent shadow-xs scale-105'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                        style={{
                          ...(isSelected ? { ringColor: preset.hex, borderColor: preset.hex } : {})
                        }}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" 
                          style={{ backgroundColor: preset.hex }} 
                        />
                        <span className="text-[11px]">{preset.name}</span>
                        {isSelected && (
                          <Check className="w-3 h-3 text-slate-800" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Interactive Navbar & Button Mockup Preview */}
              <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Pratinjau Langsung Komponen Bertema:
                </span>

                {/* Navbar mockup snippet */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs p-1 overflow-hidden"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {appLogoUrl ? (
                        <img src={appLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-4 h-4 text-amber-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight">{appName || 'Si-SuGu'}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30">
                          PREVIEW
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-[220px] truncate">{tagline || madrasahName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Tab Aktif
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-white font-semibold text-[11px] shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Tombol Utama
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card: Official Madrasah Configuration (Kop Surat & PDF Export) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Resmi Madrasah (Kop Surat & Laporan PDF)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data ini dicantumkan pada kop surat resmi, lembar instrumen supervisi, dan laporan cetak PDF
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Satuan Pendidikan / Madrasah *
                </label>
                <input
                  type="text"
                  required
                  id="input-madrasah-name"
                  value={madrasahName}
                  onChange={(e) => setMadrasahName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kabupaten / Kota *
                </label>
                <input
                  type="text"
                  required
                  id="input-kabupaten"
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Provinsi *
                </label>
                <input
                  type="text"
                  required
                  id="input-provinsi"
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tahun Pelajaran Aktif *
                </label>
                <input
                  type="text"
                  required
                  id="input-tahun-pelajaran"
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kepala Madrasah (Lengkap dengan Gelar) *
                </label>
                <input
                  type="text"
                  required
                  id="input-kamad-name"
                  value={kamadName}
                  onChange={(e) => setKamadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Kepala Madrasah *
                </label>
                <input
                  type="text"
                  required
                  id="input-kamad-nip"
                  value={kamadNip}
                  onChange={(e) => setKamadNip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Semester Berjalan *
                </label>
                <select
                  id="select-semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Madrasah
                </label>
                <input
                  type="text"
                  id="input-alamat"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Ahmad A. Wahab No. 23, Limboto"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Save Action Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                id="btn-save-settings"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 text-xs shadow-md hover:opacity-95 active:scale-95 transition"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{saving ? 'Menyimpan ke Firestore...' : 'Simpan Semua Pengaturan & Branding'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Read-only view for regular teachers */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" style={{ color: primaryColor }} />
            Data Resmi Madrasah
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Hanya Administrator atau Kepala Madrasah yang memiliki izin untuk mengubah konfigurasi resmi lembaga.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Nama Satuan Pendidikan</span>
              <span className="font-semibold text-slate-800">{madrasahName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kepala Madrasah</span>
              <span className="font-semibold text-slate-800">{kamadName} (NIP. {kamadNip})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tahun Pelajaran & Semester</span>
              <span className="font-semibold text-slate-800">{tahunPelajaran} • Semester {semester}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kabupaten & Provinsi</span>
              <span className="font-semibold text-slate-800">{kabupaten}, {provinsi}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Banner Quick Access for Admin */}
      {role === 'admin' && onNavigateTab && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div 
              className="p-2.5 rounded-xl text-white shrink-0 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Pengaturan Pop-up Banner Layar Utama
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Atur pop-up gambar pengumuman (JPG, JPEG, PNG) yang muncul di layar utama pengguna setelah login atau pada waktu-waktu tertentu sesuai jadwal.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-nav-popup-banner"
            onClick={() => onNavigateTab('popup-banner')}
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-xs hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Buka Pengaturan Pop-up</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Emergency JSON Data Backup Section (Admin & Kamad) */}
      {(role === 'admin' || role === 'kamad') && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Cadangan Data JSON Sistem (Emergency Recovery Backup)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Semua Koleksi
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Unduh salinan berkas cadangan JSON lengkap dari semua data aplikasi (data pendidik, dokumen perangkat, jadwal supervisi, penilaian, tindak lanjut, dan konfigurasi madrasah) untuk pemulihan darurat dan arsip keamanan.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-download-json-backup"
            onClick={handleDownloadBackup}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shrink-0 shadow-xs transition active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Cadangan Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4 text-blue-300" />
                <span>Unduh Cadangan JSON</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
