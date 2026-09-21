import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Award,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  AdminSupervisionAssessment, 
  TeachingSupervisionAssessment, 
  FollowUpPlan, 
  AppSetting 
} from '../types';
import { 
  exportAdminSupervisionPdf, 
  exportTeachingSupervisionPdf, 
  exportRekapitulasiPdf 
} from '../lib/pdfExport';

interface ReportsViewProps {
  adminAssessments: AdminSupervisionAssessment[];
  teachingAssessments: TeachingSupervisionAssessment[];
  followUps: FollowUpPlan[];
  settings: AppSetting;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  adminAssessments,
  teachingAssessments,
  followUps,
  settings
}) => {
  const { profile, role, user } = useAuth();
  const [activeReportTab, setActiveReportTab] = useState<'rekap' | 'administrasi' | 'mengajar' | 'rtl'>('rekap');
  const [searchTerm, setSearchTerm] = useState('');

  // Guru can only view their own reports
  const accessibleAdmin = role === 'guru'
    ? adminAssessments.filter(a => isItemForUser(a, profile, user?.uid))
    : adminAssessments;

  const accessibleTeaching = role === 'guru'
    ? teachingAssessments.filter(t => isItemForUser(t, profile, user?.uid))
    : teachingAssessments;

  const accessibleFollowUps = role === 'guru'
    ? followUps.filter(f => isItemForUser(f, profile, user?.uid))
    : followUps;

  return (
    <div className="space-y-6">
      
      {/* Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Laporan Hasil Supervisi & Ekspor PDF
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi resmi hasil penilaian administrasi, observasi kelas, dan rekapitulasi mutu MAN 2 Gorontalo
          </p>
        </div>

        {(role === 'kamad' || role === 'admin' || role === 'penilai') && (
          <button
            type="button"
            id="btn-export-rekapitulasi"
            onClick={() => exportRekapitulasiPdf(adminAssessments, teachingAssessments, followUps, settings)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Unduh Rekapitulasi Lengkap (PDF)
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveReportTab('rekap')}
          className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeReportTab === 'rekap'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          1. Rekapitulasi Hasil Keseluruhan
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('administrasi')}
          className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeReportTab === 'administrasi'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Laporan Supervisi Administrasi ({accessibleAdmin.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('mengajar')}
          className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeReportTab === 'mengajar'
              ? 'border-b-2 border-amber-600 text-amber-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          3. Laporan Observasi Mengajar ({accessibleTeaching.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('rtl')}
          className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeReportTab === 'rtl'
              ? 'border-b-2 border-teal-700 text-teal-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          4. Progres Rencana Tindak Lanjut ({accessibleFollowUps.length})
        </button>
      </div>

      {/* Tab 1: Rekapitulasi Table */}
      {activeReportTab === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Matriks Ketercapaian Supervisi Akademik Guru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tahun Pelajaran {settings.tahunPelajaranAktif} • Semester {settings.semesterAktif}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Guru</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3 text-center">Skor Administrasi</th>
                    <th className="px-4 py-3 text-center">Skor Mengajar</th>
                    <th className="px-4 py-3 text-center">Tindak Lanjut</th>
                    <th className="px-4 py-3 text-right">Aksi PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessibleAdmin.map((adm, idx) => {
                    const teaching = accessibleTeaching.find(t => t.guruId === adm.guruId);
                    const rtl = accessibleFollowUps.find(f => f.guruId === adm.guruId);

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{adm.guruName}</td>
                        <td className="px-4 py-3">{adm.mataPelajaran}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-emerald-800">{adm.percentage}%</span>
                          <span className="block text-[10px] text-slate-400">{adm.predikat}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teaching ? (
                            <div>
                              <span className="font-bold text-amber-800">{teaching.nilaiAkhir}</span>
                              <span className="block text-[10px] text-slate-400">{teaching.predikat}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum disupervisi</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rtl ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rtl.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rtl.status}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => exportAdminSupervisionPdf(adm, settings)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold"
                              title="Cetak Hasil Administrasi"
                            >
                              PDF Adm
                            </button>
                            {teaching && (
                              <button
                                type="button"
                                onClick={() => exportTeachingSupervisionPdf(teaching, settings)}
                                className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-semibold"
                                title="Cetak Hasil Mengajar"
                              >
                                PDF Kelas
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {accessibleAdmin.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada data supervisi untuk dicetak ke rekapitulasi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Laporan Administrasi */}
      {activeReportTab === 'administrasi' && (
        <div className="space-y-3">
          {accessibleAdmin.map(adm => (
            <div key={adm.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{adm.guruName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {adm.percentage}% • {adm.predikat}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mata Pelajaran: {adm.mataPelajaran} • Penilai: {adm.penilaiName} • Tanggal: {adm.tanggalPenilaian}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  "{adm.catatanUmum}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportAdminSupervisionPdf(adm, settings)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh PDF
              </button>
            </div>
          ))}

          {accessibleAdmin.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              Belum ada berkas supervisi administrasi
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Laporan Mengajar */}
      {activeReportTab === 'mengajar' && (
        <div className="space-y-3">
          {accessibleTeaching.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{t.guruName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    Skor: {t.nilaiAkhir} • {t.predikat}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kelas: {t.kelas} • Mapel: {t.mataPelajaran} • Materi: {t.materiPokok} • Penilai: {t.penilaiName}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  "{t.catatanUmum || t.kelebihan}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportTeachingSupervisionPdf(t, settings)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh PDF
              </button>
            </div>
          ))}

          {accessibleTeaching.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              Belum ada berkas supervisi mengajar
            </div>
          )}
        </div>
      )}

      {/* Tab 4: RTL & Monitoring */}
      {activeReportTab === 'rtl' && (
        <div className="space-y-3">
          {accessibleFollowUps.map(f => (
            <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{f.guruName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    f.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {f.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Rencana: {f.rencanaTindakLanjut}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bimbingan: {f.kegiatanBimbingan} • Target Selesai: {f.targetPenyelesaian}
                </p>
              </div>
            </div>
          ))}

          {accessibleFollowUps.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              Belum ada data rencana tindak lanjut
            </div>
          )}
        </div>
      )}

    </div>
  );
};
