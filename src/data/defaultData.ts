import { AdminIndicator, TeachingIndicator, DocumentCategory, PopupBannerConfig } from '../types';

export const DEFAULT_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Kalender Pendidikan',
  'Kalender Madrasah',
  'Pekan Efektif',
  'Jadwal Mengajar',
  'Capaian Pembelajaran',
  'Analisis Capaian Pembelajaran',
  'Tujuan Pembelajaran',
  'Alur Tujuan Pembelajaran',
  'KKTP (Kriteria Ketercapaian TP)',
  'RPP / Modul Ajar (KBC)',
  'LKM / LKPD',
  'Rubrik Penilaian',
  'Materi Ajar',
  'Media Ajar',
  'Absensi Murid',
  'Jurnal Mengajar',
  'Soal & Instrumen Asesmen',
  'Dokumen Lainnya'
];

export const DEFAULT_ADMIN_INDICATORS: AdminIndicator[] = [
  { id: 'adm-1', code: 'A1', category: 'Dokumen Perencanaan Tahunan', label: 'Kalender Pendidikan dan Kalender Madrasah Tahun Berjalan', bobot: 5 },
  { id: 'adm-2', code: 'A2', category: 'Dokumen Perencanaan Tahunan', label: 'Analisis Pekan Efektif & Alokasi Waktu', bobot: 5 },
  { id: 'adm-3', code: 'A3', category: 'Dokumen Perencanaan Tahunan', label: 'Jadwal Mengajar Guru & Beban Kerja Tatap Muka', bobot: 5 },
  { id: 'adm-4', code: 'B1', category: 'Capaian & Tujuan Pembelajaran', label: 'Dokumen Capaian Pembelajaran (CP) Resmi Kemenag/Kemdikbudristek', bobot: 6 },
  { id: 'adm-5', code: 'B2', category: 'Capaian & Tujuan Pembelajaran', label: 'Analisis Capaian Pembelajaran per Elemen/Fase', bobot: 6 },
  { id: 'adm-6', code: 'B3', category: 'Capaian & Tujuan Pembelajaran', label: 'Perumusan Tujuan Pembelajaran (TP)', bobot: 6 },
  { id: 'adm-7', code: 'B4', category: 'Capaian & Tujuan Pembelajaran', label: 'Penyusunan Alur Tujuan Pembelajaran (ATP)', bobot: 6 },
  { id: 'adm-8', code: 'B5', category: 'Capaian & Tujuan Pembelajaran', label: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)', bobot: 6 },
  { id: 'adm-9', code: 'C1', category: 'Modul Ajar / RPP KBC', label: 'Modul Ajar / RPP Berdiferensiasi & Berkarakter Madrasah (KBC)', bobot: 10 },
  { id: 'adm-10', code: 'C2', category: 'Modul Ajar / RPP KBC', label: 'Lembar Kerja Murid (LKM / LKPD)', bobot: 5 },
  { id: 'adm-11', code: 'C3', category: 'Modul Ajar / RPP KBC', label: 'Rubrik dan Kriteria Penilaian Terukur', bobot: 5 },
  { id: 'adm-12', code: 'D1', category: 'Bahan & Media Pembelajaran', label: 'Bahan Ajar / Diktat / E-Book / Handout', bobot: 5 },
  { id: 'adm-13', code: 'D2', category: 'Bahan & Media Pembelajaran', label: 'Media Pembelajaran Digital / Interaktif', bobot: 5 },
  { id: 'adm-14', code: 'E1', category: 'Pelaksanaan & Pelaporan', label: 'Daftar Hadir Murid / Absensi Kelas', bobot: 5 },
  { id: 'adm-15', code: 'E2', category: 'Pelaksanaan & Pelaporan', label: 'Jurnal Agenda Harian Mengajar Guru', bobot: 5 },
  { id: 'adm-16', code: 'E3', category: 'Pelaksanaan & Pelaporan', label: 'Kisi-kisi, Soal Asesmen (Formatif & Sumatif), Kunci Jawaban', bobot: 10 },
  { id: 'adm-17', code: 'E4', category: 'Pelaksanaan & Pelaporan', label: 'Buku Nilai & Analisis Hasil Asesmen', bobot: 5 }
];

export const DEFAULT_TEACHING_INDICATORS: TeachingIndicator[] = [
  // PRA-OBSERVASI (PERENCANAAN)
  {
    id: 'tch-1',
    stage: 'Perencanaan',
    code: 'PRA-1',
    title: 'Kesiapan Dokumen & Modul Ajar',
    description: 'Guru menyusun dan menguasai RPP/Modul Ajar yang selaras dengan tujuan pembelajaran dan karakteristik peserta didik.'
  },
  {
    id: 'tch-2',
    stage: 'Perencanaan',
    code: 'PRA-2',
    title: 'Perumusan Tujuan Pembelajaran & Asesmen Awal',
    description: 'Tujuan pembelajaran dirumuskan secara jelas, spesifik, dan memuat asesmen diagnostik atau apersepsi kontekstual.'
  },
  {
    id: 'tch-3',
    stage: 'Perencanaan',
    code: 'PRA-3',
    title: 'Kesiapan Media, Sumber Belajar, dan Skenario',
    description: 'Media pembelajaran, lembar kerja, dan alokasi waktu dipersiapkan secara matang dan relevan dengan materi pokok.'
  },

  // PELAKSANAAN PEMBELAJARAN (OBSERVASI DI KELAS)
  {
    id: 'tch-4',
    stage: 'Pelaksanaan',
    code: 'OBS-1',
    title: 'Kegiatan Pendahuluan (Apersepsi & Motivasi)',
    description: 'Membuka pelajaran dengan salam, berdoa, memeriksa kehadiran, membangkitkan motivasi siswa, dan menyampaikan tujuan.'
  },
  {
    id: 'tch-5',
    stage: 'Pelaksanaan',
    code: 'OBS-2',
    title: 'Penguasaan Materi & Keilmuan',
    description: 'Menyajikan materi ajar secara akurat, runtut, kontekstual dengan kehidupan nyata serta nilai-nilai keislaman moderat.'
  },
  {
    id: 'tch-6',
    stage: 'Pelaksanaan',
    code: 'OBS-3',
    title: 'Penerapan Pendekatan Berdiferensiasi & Student-Centered',
    description: 'Memfasilitasi keaktifan siswa, memfasilitasi kerja kelompok/kolaborasi, dan merespon perbedaan kesiapan belajar murid.'
  },
  {
    id: 'tch-7',
    stage: 'Pelaksanaan',
    code: 'OBS-4',
    title: 'Pemanfaatan Media Pembelajaran dan Teknologi Digital',
    description: 'Menggunakan media, alat peraga, atau platform digital secara efektif untuk memperjelas konsep pembelajaran.'
  },
  {
    id: 'tch-8',
    stage: 'Pelaksanaan',
    code: 'OBS-5',
    title: 'Interaksi Positif dan Pengelolaan Kelas',
    description: 'Menciptakan iklim kelas yang aman, kondusif, inklusif, menghargai pendapat, dan disiplin positif tanpa intimidasi.'
  },
  {
    id: 'tch-9',
    stage: 'Pelaksanaan',
    code: 'OBS-6',
    title: 'Pelaksanaan Asesmen Formatif Selama Proses',
    description: 'Memantau pemahaman siswa melalui pertanyaan reflektif, umpan balik langsung (feedback), dan cek kemajuan belajar.'
  },
  {
    id: 'tch-10',
    stage: 'Pelaksanaan',
    code: 'OBS-7',
    title: 'Kegiatan Penutup, Refleksi, dan Kesimpulan',
    description: 'Membimbing siswa merangkum pembelajaran, melakukan refleksi bersama, memberikan tugas tindak lanjut dan menutup dengan doa.'
  },

  // PASCA-OBSERVASI (EVALUASI & TINDAK LANJUT)
  {
    id: 'tch-11',
    stage: 'Evaluasi',
    code: 'PASCA-1',
    title: 'Refleksi Diri Guru Pasca Mengajar',
    description: 'Guru mampu menyampaikan secara objektif hal-hal yang sudah berjalan baik dan kendala yang dihadapi saat proses pembelajaran.'
  },
  {
    id: 'tch-12',
    stage: 'Evaluasi',
    code: 'PASCA-2',
    title: 'Pemberian Umpan Balik Konstruktif oleh Penilai',
    description: 'Penilai mendiskusikan temuan observasi secara dialogis, apresiatif, dan berfokus pada solusi peningkatan mutu mengajar.'
  },
  {
    id: 'tch-13',
    stage: 'Evaluasi',
    code: 'PASCA-3',
    title: 'Penyusunan Kesepakatan Rencana Tindak Lanjut (RTL)',
    description: 'Merumuskan langkah nyata perbaikan, misalnya workshop materi, pendampingan teman sejawat, atau pemanfaatan media baru.'
  }
];

export const DEFAULT_MADRASAH_SETTING = {
  madrasahName: 'MAN 2 Kabupaten Gorontalo',
  kabupaten: 'Kabupaten Gorontalo',
  provinsi: 'Provinsi Gorontalo',
  kepalaMadrasahName: 'Dr. Hj. Yasintha Polapa, M.Pd.',
  kepalaMadrasahNip: '197305141999032001',
  tahunPelajaranAktif: '2026/2027',
  semesterAktif: 'Ganjil' as const,
  alamat: 'Jl. Ahmad A. Wahab No. 23, Limboto, Kab. Gorontalo',
  logoUrl: '',
  appLogoUrl: '',
  appName: 'Si-SuGu',
  tagline: 'Sistem Informasi Supervisi Guru Terpadu',
  primaryColor: '#047857'
};

export const DEFAULT_POPUP_BANNER: PopupBannerConfig = {
  id: 'banner-supervisi-utama',
  title: 'Pemberitahuan Pelaksanaan Supervisi Akademik Guru Semester Ganjil 2026/2027',
  imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
  caption: 'Dihimbau kepada seluruh Bapak/Ibu Guru MAN 2 Kabupaten Gorontalo untuk segera mengunggah berkas Perangkat Pembelajaran dan memeriksa agenda supervisi masing-masing.',
  actionUrl: '',
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
  updatedAt: new Date().toISOString(),
  updatedBy: 'Administrator Madrasah'
};
