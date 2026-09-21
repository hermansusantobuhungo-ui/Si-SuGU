import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { doc as fsDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { 
  AdminSupervisionAssessment, 
  TeachingSupervisionAssessment, 
  FollowUpPlan, 
  AppSetting,
  UserProfile
} from '../types';
import { DEFAULT_MADRASAH_SETTING } from '../data/defaultData';

// Helper to format YYYY-MM-DD into Indonesian date string
const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = months[parseInt(m, 10) - 1];
    if (monthName) {
      return `${parseInt(d, 10)} ${monthName} ${y}`;
    }
  }
  return dateStr;
};

export const exportAdminSupervisionPdf = async (
  rawAssessment: AdminSupervisionAssessment,
  rawSettings?: AppSetting
) => {
  // 1. Fetch live updated assessment record from Firestore if ID is available
  let assessment: AdminSupervisionAssessment = { ...rawAssessment };
  if (assessment.id) {
    try {
      const snap = await getDoc(fsDoc(db, 'adminAssessments', assessment.id));
      if (snap.exists()) {
        const liveData = snap.data() as Partial<AdminSupervisionAssessment>;
        assessment = { ...assessment, ...liveData, id: snap.id };
      }
    } catch (err) {
      console.warn('Menggunakan data penilaian lokal (Firestore offline/terbatas):', err);
    }
  }

  // 2. Fetch live settings from Firestore to ensure updated Madrasah info & Headmaster
  let settings: AppSetting = rawSettings ? { ...rawSettings } : { ...DEFAULT_MADRASAH_SETTING };
  try {
    const settingSnap = await getDoc(fsDoc(db, 'settings', 'madrasahConfig'));
    if (settingSnap.exists()) {
      const liveSettings = settingSnap.data() as Partial<AppSetting>;
      settings = { ...settings, ...liveSettings };
    }
  } catch (err) {
    console.warn('Menggunakan konfigurasi madrasah lokal:', err);
  }

  // 3. Dynamically resolve Guru & Penilai profiles (NIP, Nama, Mapel) from Firestore
  try {
    if (assessment.guruId) {
      const guruSnap = await getDoc(fsDoc(db, 'users', assessment.guruId));
      if (guruSnap.exists()) {
        const gData = guruSnap.data() as UserProfile;
        if (!assessment.guruNip && gData.nip) assessment.guruNip = gData.nip;
        if (!assessment.guruName && gData.displayName) assessment.guruName = gData.displayName;
        if ((!assessment.mataPelajaran || assessment.mataPelajaran === 'Umum') && gData.mataPelajaran) {
          assessment.mataPelajaran = gData.mataPelajaran;
        }
      }
    }
    if (assessment.penilaiId) {
      const penilaiSnap = await getDoc(fsDoc(db, 'users', assessment.penilaiId));
      if (penilaiSnap.exists()) {
        const pData = penilaiSnap.data() as UserProfile;
        if (!assessment.penilaiNip && pData.nip) assessment.penilaiNip = pData.nip;
        if (!assessment.penilaiName && pData.displayName) assessment.penilaiName = pData.displayName;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat profil pengguna terkait:', err);
  }

  // 4. Dynamically recalculate scores from the latest items to eliminate any stale cached metrics
  if (Array.isArray(assessment.items) && assessment.items.length > 0) {
    const calculatedTotalScore = assessment.items.reduce((acc, it) => {
      if (typeof it.score === 'number') return acc + it.score;
      if (it.status === 'Ada & Lengkap') return acc + 2;
      if (it.status === 'Ada Tidak Lengkap') return acc + 1;
      return acc;
    }, 0);
    const calculatedMaxScore = assessment.maxScore > 0 ? assessment.maxScore : Math.max(assessment.items.length * 2, 1);
    const calculatedPercentage = Math.round((calculatedTotalScore / calculatedMaxScore) * 100);

    let calculatedPredikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)' = 'Amat Baik (A)';
    if (calculatedPercentage < 70) calculatedPredikat = 'Kurang (D)';
    else if (calculatedPercentage < 80) calculatedPredikat = 'Cukup (C)';
    else if (calculatedPercentage < 90) calculatedPredikat = 'Baik (B)';

    assessment.totalScore = calculatedTotalScore;
    assessment.maxScore = calculatedMaxScore;
    assessment.percentage = calculatedPercentage;
    assessment.predikat = calculatedPredikat;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header / Kop Surat Madrasah
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN AGAMA REPUBLIK INDONESIA', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`KANTOR KEMENTERIAN AGAMA ${settings.kabupaten.toUpperCase()}`, 105, 24, { align: 'center' });
  doc.setFontSize(13);
  doc.text(settings.madrasahName.toUpperCase(), 105, 30, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.alamat, 105, 35, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.8);
  doc.line(15, 38, 195, 38);
  doc.setLineWidth(0.3);
  doc.line(15, 39, 195, 39);

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUMEN HASIL SUPERVISI ADMINISTRASI PERANGKAT PEMBELAJARAN', 105, 47, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran: ${assessment.tahunPelajaran} • Semester: ${assessment.semester}`, 105, 52, { align: 'center' });

  // Meta Information Table
  autoTable(doc, {
    startY: 56,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Nama Guru yang Dinilai', `: ${assessment.guruName}`, 'Hari / Tanggal', `: ${formatTanggalIndo(assessment.tanggalPenilaian)}`],
      ['NIP', `: ${assessment.guruNip || '-'}`, 'Penilai / Supervisor', `: ${assessment.penilaiName}`],
      ['Mata Pelajaran', `: ${assessment.mataPelajaran}`, 'Nilai Ketercapaian', `: ${assessment.percentage}% (${assessment.predikat})`]
    ]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable.finalY || 70;

  // Indicators Table
  const tableRows = assessment.items.map((item, idx) => [
    idx + 1,
    item.label,
    item.status,
    item.score,
    item.catatan || '-'
  ]);

  autoTable(doc, {
    startY: lastY + 3,
    head: [['No', 'Komponen Administrasi Perangkat Pembelajaran', 'Kondisi / Status', 'Skor', 'Catatan Penilai']],
    body: tableRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 15 },
      4: { cellWidth: 40 }
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTableY = (doc as any).lastAutoTable.finalY + 5;

  // If table is close to the bottom of the page (afterTableY > 195),
  // place the results summary and legal signatures neatly on Page 2
  let resultsY = afterTableY;
  if (resultsY > 195) {
    doc.addPage();
    resultsY = 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('HASIL EVALUASI & LEMBAR PENGESAHAN SUPERVISI ADMINISTRASI', 105, resultsY, { align: 'center' });
    resultsY += 6;
  }

  // Results & Notes Box
  autoTable(doc, {
    startY: resultsY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    body: [
      ['Total Skor Perolehan', `${assessment.totalScore} dari maksimal ${assessment.maxScore} poin (${assessment.percentage}%)`],
      ['Predikat Kualitatif', assessment.predikat],
      ['Catatan Umum Penilai', assessment.catatanUmum || '-'],
      ['Rekomendasi Tindak Lanjut', assessment.rekomendasi || '-']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 253, 244] },
      1: { cellWidth: 130 }
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  // Ensure signatures fit on page, otherwise add a new page
  if (finalY + 60 > 280) {
    doc.addPage();
    finalY = 25;
  }

  // Legalitas Signatures: Guru, Penilai, Kepala Madrasah
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(`${settings.kabupaten}, ${formatTanggalIndo(assessment.tanggalPenilaian)}`, 135, finalY - 5);
  doc.text('Guru yang Dinilai,', 30, finalY);
  doc.text('Penilai / Guru Senior,', 135, finalY);

  doc.setFont('helvetica', 'bold');
  doc.text(assessment.guruName, 30, finalY + 22);
  doc.text(assessment.penilaiName, 135, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${assessment.guruNip || '........................'}`, 30, finalY + 26);
  doc.text(`NIP. ${assessment.penilaiNip || '........................................'}`, 135, finalY + 26);

  doc.text('Mengetahui,', 85, finalY + 34);
  doc.text('Kepala Madrasah,', 85, finalY + 38);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.kepalaMadrasahName, 85, finalY + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${settings.kepalaMadrasahNip}`, 85, finalY + 58);

  doc.save(`Supervisi_Administrasi_${assessment.guruName.replace(/\s+/g, '_')}.pdf`);
};

export const exportTeachingSupervisionPdf = async (
  rawAssessment: TeachingSupervisionAssessment,
  rawSettings?: AppSetting
) => {
  // 1. Fetch live updated assessment record from Firestore if ID is available
  let assessment: TeachingSupervisionAssessment = { ...rawAssessment };
  if (assessment.id) {
    try {
      const snap = await getDoc(fsDoc(db, 'teachingAssessments', assessment.id));
      if (snap.exists()) {
        const liveData = snap.data() as Partial<TeachingSupervisionAssessment>;
        assessment = { ...assessment, ...liveData, id: snap.id };
      }
    } catch (err) {
      console.warn('Menggunakan data penilaian observasi lokal (Firestore offline/terbatas):', err);
    }
  }

  // 2. Fetch live settings from Firestore
  let settings: AppSetting = rawSettings ? { ...rawSettings } : { ...DEFAULT_MADRASAH_SETTING };
  try {
    const settingSnap = await getDoc(fsDoc(db, 'settings', 'madrasahConfig'));
    if (settingSnap.exists()) {
      const liveSettings = settingSnap.data() as Partial<AppSetting>;
      settings = { ...settings, ...liveSettings };
    }
  } catch (err) {
    console.warn('Menggunakan konfigurasi madrasah lokal:', err);
  }

  // 3. Dynamically resolve Guru & Penilai profiles (NIP, Nama, Mapel) from Firestore
  try {
    if (assessment.guruId) {
      const guruSnap = await getDoc(fsDoc(db, 'users', assessment.guruId));
      if (guruSnap.exists()) {
        const gData = guruSnap.data() as UserProfile;
        if (!assessment.guruNip && gData.nip) assessment.guruNip = gData.nip;
        if (!assessment.guruName && gData.displayName) assessment.guruName = gData.displayName;
        if ((!assessment.mataPelajaran || assessment.mataPelajaran === 'Umum') && gData.mataPelajaran) {
          assessment.mataPelajaran = gData.mataPelajaran;
        }
      }
    }
    if (assessment.penilaiId) {
      const penilaiSnap = await getDoc(fsDoc(db, 'users', assessment.penilaiId));
      if (penilaiSnap.exists()) {
        const pData = penilaiSnap.data() as UserProfile;
        if (!assessment.penilaiNip && pData.nip) assessment.penilaiNip = pData.nip;
        if (!assessment.penilaiName && pData.displayName) assessment.penilaiName = pData.displayName;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat profil pengguna terkait:', err);
  }

  // 4. Dynamically recalculate stage scores, totalScore, and nilaiAkhir from items
  if (Array.isArray(assessment.items) && assessment.items.length > 0) {
    let scorePerencanaan = 0;
    let countPerencanaan = 0;
    let scorePelaksanaan = 0;
    let countPelaksanaan = 0;
    let scoreEvaluasi = 0;
    let countEvaluasi = 0;

    assessment.items.forEach(item => {
      const s = typeof item.score === 'number' ? item.score : 4;
      if (item.stage === 'Perencanaan') {
        scorePerencanaan += s;
        countPerencanaan++;
      } else if (item.stage === 'Pelaksanaan') {
        scorePelaksanaan += s;
        countPelaksanaan++;
      } else if (item.stage === 'Evaluasi') {
        scoreEvaluasi += s;
        countEvaluasi++;
      }
    });

    const calculatedTotal = scorePerencanaan + scorePelaksanaan + scoreEvaluasi;
    const calculatedMax = Math.max((countPerencanaan + countPelaksanaan + countEvaluasi) * 4, 1);
    const calculatedNilaiAkhir = Math.round((calculatedTotal / calculatedMax) * 100);

    let calculatedPredikat: 'Amat Baik (A)' | 'Baik (B)' | 'Cukup (C)' | 'Kurang (D)' = 'Amat Baik (A)';
    if (calculatedNilaiAkhir < 70) calculatedPredikat = 'Kurang (D)';
    else if (calculatedNilaiAkhir < 80) calculatedPredikat = 'Cukup (C)';
    else if (calculatedNilaiAkhir < 90) calculatedPredikat = 'Baik (B)';

    assessment.scorePerencanaan = scorePerencanaan;
    assessment.scorePelaksanaan = scorePelaksanaan;
    assessment.scoreEvaluasi = scoreEvaluasi;
    assessment.totalScore = calculatedTotal;
    assessment.maxScore = calculatedMax;
    assessment.nilaiAkhir = calculatedNilaiAkhir;
    assessment.predikat = calculatedPredikat;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header / Kop Surat
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN AGAMA REPUBLIK INDONESIA', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`KANTOR KEMENTERIAN AGAMA ${settings.kabupaten.toUpperCase()}`, 105, 24, { align: 'center' });
  doc.setFontSize(13);
  doc.text(settings.madrasahName.toUpperCase(), 105, 30, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.alamat, 105, 35, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.8);
  doc.line(15, 38, 195, 38);
  doc.setLineWidth(0.3);
  doc.line(15, 39, 195, 39);

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR OBSERVASI SUPERVISI MENGAJAR DI KELAS', 105, 47, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran: ${assessment.tahunPelajaran} • Semester: ${assessment.semester}`, 105, 52, { align: 'center' });

  // Meta Table
  autoTable(doc, {
    startY: 56,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Nama Guru yang Dinilai', `: ${assessment.guruName}`, 'Hari / Tanggal', `: ${formatTanggalIndo(assessment.tanggalPenilaian)}`],
      ['NIP', `: ${assessment.guruNip || '-'}`, 'Kelas / Ruang', `: ${assessment.kelas}`],
      ['Mata Pelajaran', `: ${assessment.mataPelajaran}`, 'Materi Pokok', `: ${assessment.materiPokok}`],
      ['Guru Penilai', `: ${assessment.penilaiName}`, 'Nilai Akhir', `: ${assessment.nilaiAkhir} (${assessment.predikat})`]
    ]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable.finalY || 70;

  // Indicators table
  const tableRows = assessment.items.map((item, idx) => [
    idx + 1,
    `[${item.stage}] ${item.title}`,
    item.score,
    item.catatan || '-'
  ]);

  autoTable(doc, {
    startY: lastY + 3,
    head: [['No', 'Fokus Observasi Indikator Pembelajaran', 'Skor (1-4)', 'Catatan Lapangan']],
    body: tableRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, halign: 'center' }, // amber-600
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 110 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 40 }
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTableY = (doc as any).lastAutoTable.finalY + 5;

  let notesY = afterTableY;
  if (notesY > 200) {
    doc.addPage();
    notesY = 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN OBSERVASI & LEMBAR PENGESAHAN MENGAJAR', 105, notesY, { align: 'center' });
    notesY += 6;
  }

  autoTable(doc, {
    startY: notesY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      ['Kelebihan Guru', assessment.kelebihan || '-'],
      ['Aspek Ditingkatkan', assessment.kekurangan || '-'],
      ['Rekomendasi Tindak Lanjut', assessment.rekomendasi || '-']
    ]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  if (finalY + 60 > 280) {
    doc.addPage();
    finalY = 25;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.kabupaten}, ${formatTanggalIndo(assessment.tanggalPenilaian)}`, 135, finalY - 5);
  doc.text('Guru yang Dinilai,', 30, finalY);
  doc.text('Penilai / Guru Senior,', 135, finalY);

  doc.setFont('helvetica', 'bold');
  doc.text(assessment.guruName, 30, finalY + 22);
  doc.text(assessment.penilaiName, 135, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${assessment.guruNip || '........................'}`, 30, finalY + 26);
  doc.text(`NIP. ${assessment.penilaiNip || '........................................'}`, 135, finalY + 26);

  doc.text('Mengetahui,', 85, finalY + 34);
  doc.text('Kepala Madrasah,', 85, finalY + 38);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.kepalaMadrasahName, 85, finalY + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${settings.kepalaMadrasahNip}`, 85, finalY + 58);

  doc.save(`Supervisi_Mengajar_${assessment.guruName.replace(/\s+/g, '_')}.pdf`);
};

export const exportRekapitulasiPdf = async (
  adminAssessments?: AdminSupervisionAssessment[],
  teachingAssessments?: TeachingSupervisionAssessment[],
  followUps?: FollowUpPlan[],
  rawSettings?: AppSetting
) => {
  let latestAdmin = adminAssessments ? [...adminAssessments] : [];
  let latestTeaching = teachingAssessments ? [...teachingAssessments] : [];
  let latestFollowUps = followUps ? [...followUps] : [];
  let settings: AppSetting = rawSettings ? { ...rawSettings } : { ...DEFAULT_MADRASAH_SETTING };

  // Fetch real-time live data directly from Firestore for guaranteed fresh figures
  try {
    const [adminSnap, teachSnap, followUpSnap, settingSnap] = await Promise.all([
      getDocs(collection(db, 'adminAssessments')),
      getDocs(collection(db, 'teachingAssessments')),
      getDocs(collection(db, 'followUpPlans')),
      getDoc(fsDoc(db, 'settings', 'madrasahConfig'))
    ]);

    if (!adminSnap.empty) {
      latestAdmin = adminSnap.docs.map(d => ({ ...d.data(), id: d.id } as AdminSupervisionAssessment));
    }
    if (!teachSnap.empty) {
      latestTeaching = teachSnap.docs.map(d => ({ ...d.data(), id: d.id } as TeachingSupervisionAssessment));
    }
    if (!followUpSnap.empty) {
      latestFollowUps = followUpSnap.docs.map(d => ({ ...d.data(), id: d.id } as FollowUpPlan));
    }
    if (settingSnap.exists()) {
      const liveSettings = settingSnap.data() as Partial<AppSetting>;
      settings = { ...settings, ...liveSettings };
    }
  } catch (err) {
    console.warn('Menggunakan fallback dataset lokal untuk rekapitulasi:', err);
  }

  // Sort assessments chronologically so latest assessment for each teacher is selected
  latestAdmin.sort((a, b) => (a.tanggalPenilaian || a.createdAt || '').localeCompare(b.tanggalPenilaian || b.createdAt || ''));
  latestTeaching.sort((a, b) => (a.tanggalPenilaian || a.createdAt || '').localeCompare(b.tanggalPenilaian || b.createdAt || ''));

  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for comprehensive table

  // Kop Madrasah
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN AGAMA REPUBLIK INDONESIA', 148, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`KANTOR KEMENTERIAN AGAMA ${settings.kabupaten.toUpperCase()}`, 148, 24, { align: 'center' });
  doc.setFontSize(13);
  doc.text(settings.madrasahName.toUpperCase(), 148, 30, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.alamat, 148, 35, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.8);
  doc.line(15, 38, 282, 38);
  doc.setLineWidth(0.3);
  doc.line(15, 39, 282, 39);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULASI LAPORAN HASIL SUPERVISI GURU DAN TINDAK LANJUT', 148, 47, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran: ${settings.tahunPelajaranAktif} • Semester: ${settings.semesterAktif}`, 148, 52, { align: 'center' });

  // Aggregate teacher data dynamically from latest real-time records
  const teacherMap: Record<string, {
    name: string;
    mapel: string;
    adminScore?: number;
    teachingScore?: number;
    rtlStatus?: string;
  }> = {};

  latestAdmin.forEach(a => {
    if (!teacherMap[a.guruName]) teacherMap[a.guruName] = { name: a.guruName, mapel: a.mataPelajaran };
    if (Array.isArray(a.items) && a.items.length > 0) {
      const tot = a.items.reduce((s, it) => s + (typeof it.score === 'number' ? it.score : (it.status === 'Ada & Lengkap' ? 2 : it.status === 'Ada Tidak Lengkap' ? 1 : 0)), 0);
      const mx = a.maxScore > 0 ? a.maxScore : a.items.length * 2;
      teacherMap[a.guruName].adminScore = mx > 0 ? Math.round((tot / mx) * 100) : a.percentage;
    } else {
      teacherMap[a.guruName].adminScore = a.percentage;
    }
  });

  latestTeaching.forEach(t => {
    if (!teacherMap[t.guruName]) teacherMap[t.guruName] = { name: t.guruName, mapel: t.mataPelajaran };
    if (Array.isArray(t.items) && t.items.length > 0) {
      const tot = t.items.reduce((s, it) => s + (typeof it.score === 'number' ? it.score : 4), 0);
      const mx = t.maxScore > 0 ? t.maxScore : t.items.length * 4;
      teacherMap[t.guruName].teachingScore = mx > 0 ? Math.round((tot / mx) * 100) : t.nilaiAkhir;
    } else {
      teacherMap[t.guruName].teachingScore = t.nilaiAkhir;
    }
  });

  latestFollowUps.forEach(f => {
    if (teacherMap[f.guruName]) {
      teacherMap[f.guruName].rtlStatus = f.status;
    }
  });

  const rows = Object.values(teacherMap).map((item, idx) => {
    const admin = item.adminScore !== undefined ? `${item.adminScore}%` : '-';
    const teach = item.teachingScore !== undefined ? `${item.teachingScore}` : '-';
    const rtl = item.rtlStatus || 'Belum Ada';
    return [
      idx + 1,
      item.name,
      item.mapel,
      admin,
      teach,
      rtl,
      (item.adminScore && item.teachingScore) ? 'Tuntas' : 'Sebagian'
    ];
  });

  autoTable(doc, {
    startY: 58,
    head: [['No', 'Nama Guru Pendidik', 'Mata Pelajaran', 'Skor Adm (%)', 'Skor Mengajar (100)', 'Status RTL', 'Keterangan']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 35 },
      5: { halign: 'center', cellWidth: 30 },
      6: { halign: 'center', cellWidth: 30 }
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  if (finalY + 35 > 195) {
    doc.addPage();
    finalY = 25;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.kabupaten}, ${formatTanggalIndo(new Date().toISOString().slice(0, 10))}`, 215, finalY);
  doc.text('Kepala Madrasah,', 215, finalY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.kepalaMadrasahName, 215, finalY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${settings.kepalaMadrasahNip}`, 215, finalY + 29);

  doc.save(`Rekapitulasi_Supervisi_MAN2_${settings.tahunPelajaranAktif.replace('/', '-')}.pdf`);
};
