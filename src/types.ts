export type UserRole = 'admin' | 'guru' | 'penilai' | 'kamad';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  nip?: string;
  pangkatGolongan?: string;
  mataPelajaran?: string;
  phone?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
}

export type DocumentCategory = 
  | 'Kalender Pendidikan'
  | 'Kalender Madrasah'
  | 'Pekan Efektif'
  | 'Jadwal Mengajar'
  | 'Capaian Pembelajaran'
  | 'Analisis Capaian Pembelajaran'
  | 'Tujuan Pembelajaran'
  | 'Alur Tujuan Pembelajaran'
  | 'KKTP (Kriteria Ketercapaian TP)'
  | 'RPP / Modul Ajar (KBC)'
  | 'LKM / LKPD'
  | 'Rubrik Penilaian'
  | 'Materi Ajar'
  | 'Media Ajar'
  | 'Absensi Murid'
  | 'Jurnal Mengajar'
  | 'Soal & Instrumen Asesmen'
  | 'Dokumen Lainnya';

export interface TeachingDocument {
  id: string;
  guruId: string;
  guruName: string;
  guruNip?: string;
  category: DocumentCategory;
  title: string;
  semester: 'Ganjil' | 'Genap';
  tahunPelajaran: string; // e.g. 2026/2027
  kelas: string;
  mataPelajaran: string;
  fileUrl: string; // Firebase Storage URL or Google Drive link / DataURL
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
  notes?: string;
  status: 'Draft' | 'Diajukan' | 'Diverifikasi' | 'Perlu Perbaikan';
  verifiedBy?: string;
  feedback?: string;
}

export interface SupervisionSchedule {
  id: string;
  guruId: string;
  guruName: string;
  guruNip?: string;
  mataPelajaran: string;
  kelas: string;
  penilaiId: string;
  penilaiName: string;
  type: 'Administrasi' | 'Mengajar' | 'Keduanya';
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm
  tempat: string; // e.g. "Ruang Kelas XII IPA 1" atau "Ruang Guru"
  semester: 'Ganjil' | 'Genap';
  tahunPelajaran: string;
  status: 'Terjadwal' | 'Sedang Berjalan' | 'Selesai' | 'Dibatalkan';
  catatan?: string;
  createdAt: string;
}

export interface AdminIndicator {
  id: string;
  category: string;
  code: string;
  label: string;
  bobot?: number;
}

export interface TeachingIndicator {
  id: string;
  stage: 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi'; // Pra-observasi, Observasi Pembelajaran, Pasca-observasi
  code: string;
  title: string;
  description: string;
}

export interface AdminSupervisionItem {
  indicatorId: string;
  label: string;
  status: 'Ada & Lengkap' | 'Ada Tidak Lengkap' | 'Tidak Ada';
  score: number; // 0, 1, 2 (atau persentase)
  catatan: string;
}

export interface AdminSupervisionAssessment {
  id: string;
  scheduleId?: string;
  guruId: string;
  guruName: string;
  guruNip?: string;
  mataPelajaran: string;
  penilaiId: string;
  penilaiName: string;
  penilaiNip?: string;
  tanggalPenilaian: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  items: AdminSupervisionItem[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  predikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)';
  catatanUmum: string;
  rekomendasi: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeachingSupervisionItem {
  indicatorId: string;
  stage: 'Perencanaan' | 'Pelaksanaan' | 'Evaluasi';
  title: string;
  score: number; // 1 to 4
  catatan: string;
}

export interface TeachingSupervisionAssessment {
  id: string;
  scheduleId?: string;
  guruId: string;
  guruName: string;
  guruNip?: string;
  mataPelajaran: string;
  kelas: string;
  materiPokok: string;
  penilaiId: string;
  penilaiName: string;
  penilaiNip?: string;
  tanggalPenilaian: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  items: TeachingSupervisionItem[];
  scorePerencanaan: number;
  scorePelaksanaan: number;
  scoreEvaluasi: number;
  totalScore: number;
  maxScore: number;
  nilaiAkhir: number; // 0 - 100
  predikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)';
  catatanUmum: string;
  kelebihan: string;
  kekurangan: string;
  rekomendasi: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FollowUpPlan {
  id: string;
  guruId: string;
  guruName: string;
  supervisionType: 'Administrasi' | 'Mengajar';
  assessmentId: string;
  tanggalSupervisi: string;
  rekomendasiPenilai: string;
  rencanaTindakLanjut: string;
  kegiatanBimbingan: string; // e.g. "Pendampingan Sejawat / KKG / Pelatihan Mandiri"
  targetPenyelesaian: string; // YYYY-MM-DD
  status: 'Belum Selesai' | 'Dalam Proses' | 'Selesai';
  hasilTindakLanjut?: string;
  catatanKamad?: string;
  verifiedByKamad?: boolean;
  updatedAt: string;
}

export interface AppSetting {
  madrasahName: string;
  kabupaten: string;
  provinsi: string;
  kepalaMadrasahName: string;
  kepalaMadrasahNip: string;
  tahunPelajaranAktif: string;
  semesterAktif: 'Ganjil' | 'Genap';
  alamat: string;
  logoUrl?: string;          // Logo untuk kop surat / dokumen
  appLogoUrl?: string;       // Logo utama aplikasi (file upload Base64 atau URL)
  appName?: string;          // Nama aplikasi (contoh: 'Si-SuGu')
  tagline?: string;          // Tagline / slogan aplikasi
  primaryColor?: string;     // Warna branding utama (contoh: '#047857')
}

export interface PopupBannerConfig {
  id?: string;
  title: string;
  imageUrl: string; // jpeg, jpg, png base64 or URL
  caption?: string;
  actionUrl?: string;
  actionLabel?: string;
  isActive: boolean;
  targetAudience: 'all' | 'guru' | 'penilai' | 'kamad' | 'specific';
  targetUserIds?: string[];
  showOnLogin: boolean;
  timedTriggerEnabled: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  frequency: 'every_session' | 'once_a_day' | 'always';
  updatedAt?: string;
  updatedBy?: string;
}

export interface AppNotification {
  id: string;
  type: 'document_uploaded' | 'schedule_created';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  targetUserId?: string;
  actorName: string;
  metaId?: string;
  linkTab: 'perangkat' | 'jadwal';
}

export type AuditActionType =
  | 'document_verified'
  | 'document_uploaded'
  | 'document_deleted'
  | 'user_created'
  | 'user_updated'
  | 'assessment_deleted'
  | 'assessment_created'
  | 'schedule_created'
  | 'schedule_updated'
  | 'schedule_deleted'
  | 'settings_updated';

export interface AuditLog {
  id: string;
  action: AuditActionType;
  title: string;
  description: string;
  actorUid: string;
  actorName: string;
  actorEmail?: string;
  actorRole: UserRole;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  timestamp: string;
}
