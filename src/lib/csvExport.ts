/**
 * CSV Export utility functions for Si-SuGu
 */

export function downloadCsv(filename: string, csvContent: string): void {
  // Prepend UTF-8 BOM so Excel opens accents, special characters and formatting accurately
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape quotes and enclose in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportTeachersToCsv(teachers: Array<any>): void {
  const headers = [
    'No',
    'Nama Lengkap',
    'Email',
    'Peran / Hak Akses',
    'NIP',
    'Pangkat / Golongan',
    'Mata Pelajaran',
    'No. Telepon / WhatsApp',
    'Status Akun',
    'Tanggal Terdaftar'
  ];

  const rows = teachers.map((t, index) => {
    let roleLabel = t.role;
    if (t.role === 'admin') roleLabel = 'Administrator';
    else if (t.role === 'kamad') roleLabel = 'Kepala Madrasah';
    else if (t.role === 'penilai') roleLabel = 'Guru Penilai / Supervisor';
    else if (t.role === 'guru') roleLabel = 'Guru Mata Pelajaran';

    return [
      index + 1,
      t.displayName || '',
      t.email || '',
      roleLabel,
      t.nip ? `'${t.nip}` : '-', // prepend quote for Excel to keep leading zeros in NIP
      t.pangkatGolongan || '-',
      t.mataPelajaran || '-',
      t.phone ? `'${t.phone}` : '-',
      t.isActive !== false ? 'Aktif' : 'Non-Aktif',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'
    ].map(escapeCsvCell).join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`Data_Guru_MAN2_Gorontalo_${dateStr}.csv`, csvContent);
}

export function exportSchedulesToCsv(schedules: Array<any>): void {
  const headers = [
    'No',
    'Nama Guru',
    'NIP Guru',
    'Mata Pelajaran',
    'Kelas',
    'Jenis Supervisi',
    'Penilai / Supervisor',
    'Tanggal Pelaksanaan',
    'Waktu',
    'Ruang / Tempat',
    'Semester',
    'Tahun Pelajaran',
    'Status Pelaksanaan',
    'Catatan Khusus'
  ];

  const rows = schedules.map((s, index) => {
    return [
      index + 1,
      s.guruName || '',
      s.guruNip ? `'${s.guruNip}` : '-',
      s.mataPelajaran || '',
      s.kelas || '',
      s.type || 'Mengajar',
      s.penilaiName || '',
      s.tanggal || '',
      s.waktu ? `${s.waktu} WITA` : '',
      s.tempat || '',
      s.semester || '',
      s.tahunPelajaran || '',
      s.status || 'Terjadwal',
      s.catatan || '-'
    ].map(escapeCsvCell).join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`Jadwal_Supervisi_MAN2_Gorontalo_${dateStr}.csv`, csvContent);
}

export function exportAuditLogsToCsv(logs: Array<any>): void {
  const headers = [
    'No',
    'Waktu (WITA)',
    'Aksi / Peristiwa',
    'Judul Aktivitas',
    'Rincian Tindakan',
    'Nama Pelaksana',
    'Email Pelaksana',
    'Peran Pelaksana',
    'Nama Target',
    'ID Target'
  ];

  const rows = logs.map((log, index) => {
    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-';
    return [
      index + 1,
      timeStr,
      log.action || '',
      log.title || '',
      log.description || '',
      log.actorName || '',
      log.actorEmail || '',
      log.actorRole || '',
      log.targetName || '-',
      log.targetId || '-'
    ].map(escapeCsvCell).join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`Audit_Logs_SiSuGu_${dateStr}.csv`, csvContent);
}
