import React, { useMemo } from 'react';
import { 
  Users, 
  FolderGit2, 
  CalendarDays, 
  ClipboardCheck, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Award,
  ArrowRight,
  BookOpen,
  ListChecks,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  UserProfile, 
  TeachingDocument, 
  SupervisionSchedule, 
  AdminSupervisionAssessment, 
  TeachingSupervisionAssessment, 
  FollowUpPlan,
  AppSetting 
} from '../types';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  gurus: UserProfile[];
  documents: TeachingDocument[];
  schedules: SupervisionSchedule[];
  adminAssessments: AdminSupervisionAssessment[];
  teachingAssessments: TeachingSupervisionAssessment[];
  followUps: FollowUpPlan[];
  settings: AppSetting;
}

const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  'Selesai': '#059669', // Emerald
  'Sedang Berjalan': '#2563eb', // Blue
  'Terjadwal': '#d97706', // Amber
  'Dibatalkan': '#e11d48' // Rose
};

const DOC_STATUS_COLORS = {
  diverifikasi: '#059669',
  menunggu: '#d97706',
  revisi: '#e11d48'
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  gurus,
  documents,
  schedules,
  adminAssessments,
  teachingAssessments,
  followUps,
  settings
}) => {
  const { profile, role, user } = useAuth();

  // Filter items based on user role
  const totalGuru = gurus.filter(g => g.role === 'guru').length || 1;
  const myDocs = role === 'guru' ? documents.filter(d => isItemForUser(d, profile, user?.uid)) : documents;
  const mySchedules = role === 'guru' 
    ? schedules.filter(s => isItemForUser(s, profile, user?.uid))
    : role === 'penilai'
    ? schedules.filter(s => s.penilaiId === profile?.uid || (profile?.displayName && s.penilaiName?.toLowerCase() === profile.displayName.toLowerCase()))
    : schedules;

  const myAdminAssessments = role === 'guru'
    ? adminAssessments.filter(a => isItemForUser(a, profile, user?.uid))
    : adminAssessments;

  const myTeachingAssessments = role === 'guru'
    ? teachingAssessments.filter(t => isItemForUser(t, profile, user?.uid))
    : teachingAssessments;

  const completedSchedules = mySchedules.filter(s => s.status === 'Selesai').length;
  const inProgressSchedules = mySchedules.filter(s => s.status === 'Sedang Berjalan').length;
  const pendingSchedules = mySchedules.filter(s => s.status === 'Terjadwal').length;
  const cancelledSchedules = mySchedules.filter(s => s.status === 'Dibatalkan').length;

  const completedFollowUps = followUps.filter(f => f.status === 'Selesai').length;
  const inProgressFollowUps = followUps.filter(f => f.status !== 'Selesai').length;

  // Average Score of completed teaching supervisions
  const avgTeachingScore = myTeachingAssessments.length > 0
    ? (myTeachingAssessments.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / myTeachingAssessments.length).toFixed(1)
    : 'Belum Ada';

  const avgAdminScore = myAdminAssessments.length > 0
    ? (myAdminAssessments.reduce((acc, curr) => acc + curr.percentage, 0) / myAdminAssessments.length).toFixed(1)
    : 'Belum Ada';

  // 1. Data for Schedule Status Progress Donut Chart
  const scheduleStatusData = useMemo(() => {
    return [
      { name: 'Selesai', value: completedSchedules, color: '#059669' },
      { name: 'Sedang Berjalan', value: inProgressSchedules, color: '#2563eb' },
      { name: 'Terjadwal', value: pendingSchedules, color: '#d97706' },
      { name: 'Dibatalkan', value: cancelledSchedules, color: '#e11d48' }
    ].filter(item => item.value > 0);
  }, [completedSchedules, inProgressSchedules, pendingSchedules, cancelledSchedules]);

  // 2. Data for Teacher Document Completion Rate (for teachers list or current teacher)
  const teacherDocProgressData = useMemo(() => {
    const onlyTeachers = gurus.filter(g => g.role === 'guru' || g.role === 'penilai');
    // If logged in as Guru, show detailed categories for self
    if (role === 'guru') {
      const standardCategories = ['RPP / Modul Ajar', 'Silabus / ATP', 'Prota & Promes', 'Buku Penilaian / Asesmen', 'Jurnal Mengajar'];
      return standardCategories.map(cat => {
        const catDocs = myDocs.filter(d => d.category?.toLowerCase().includes(cat.toLowerCase().split(' ')[0]));
        const verified = catDocs.filter(d => d.status === 'Diverifikasi').length;
        const pending = catDocs.filter(d => d.status !== 'Diverifikasi').length;
        return {
          name: cat,
          diverifikasi: verified,
          menunggu: pending,
          total: catDocs.length
        };
      });
    }

    // If Admin/Penilai/Kamad: Show top teachers document submission & verification rate
    const teacherList = onlyTeachers.slice(0, 7);
    return teacherList.map(t => {
      const tDocs = documents.filter(d => isItemForUser(d, t, t.uid));
      const verified = tDocs.filter(d => d.status === 'Diverifikasi').length;
      const pending = tDocs.filter(d => d.status !== 'Diverifikasi').length;
      const displayName = t.displayName.split(' ')[0] || 'Guru';
      return {
        name: displayName.length > 10 ? displayName.substring(0, 9) + '…' : displayName,
        fullName: t.displayName,
        diverifikasi: verified,
        menunggu: pending,
        total: tDocs.length
      };
    });
  }, [gurus, documents, myDocs, role]);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div 
        className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
        style={{
          background: settings.primaryColor 
            ? `linear-gradient(135deg, ${settings.primaryColor}, #064e3b, #022c22)`
            : undefined
        }}
      >
        {/* Subtle decorative geometric shapes */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 translate-y-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-amber-300 text-xs font-semibold mb-3 border border-white/20 backdrop-blur-sm">
            {(settings.appLogoUrl || settings.logoUrl) && (
              <img 
                src={settings.appLogoUrl || settings.logoUrl} 
                alt="Logo" 
                className="w-4 h-4 object-contain" 
              />
            )}
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings.appName || 'Si-SuGu'} • Tahun Ajaran {settings.tahunPelajaranAktif} • Semester {settings.semesterAktif}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang, {profile?.displayName || 'Bapak/Ibu Pendidik'}
          </h2>
          <p className="mt-2 text-emerald-100 text-sm sm:text-base leading-relaxed">
            {settings.appName || 'Si-SuGu'} ({settings.tagline || 'Sistem Informasi Supervisi Guru Terpadu'}) {settings.madrasahName}. 
            {role === 'guru' && ' Silakan pantau kelengkapan perangkat ajar Anda dan jadwal observasi pembelajaran.'}
            {role === 'penilai' && ' Anda memiliki akses untuk menilai supervisi administrasi dan observasi kelas pada guru binaan.'}
            {role === 'kamad' && ' Pantau ketercapaian mutu akademik, rekapitulasi penilaian guru, serta progres tindak lanjut madrasah.'}
            {role === 'admin' && ' Kelola akun pendidik, matriks instrumen evaluasi, jadwal supervisi, dan pelaporan terpadu.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {role === 'guru' && (
              <button
                type="button"
                id="dash-btn-unggah"
                onClick={() => setActiveTab('perangkat')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition active:scale-95"
              >
                <FolderGit2 className="w-4 h-4" />
                Unggah Perangkat Ajar
              </button>
            )}
            {(role === 'admin' || role === 'penilai' || role === 'kamad') && (
              <button
                type="button"
                id="dash-btn-supervisi-adm"
                onClick={() => setActiveTab('supervisi-administrasi')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition active:scale-95"
              >
                <ClipboardCheck className="w-4 h-4" />
                Mulai Supervisi Administrasi
              </button>
            )}
            <button
              type="button"
              id="dash-btn-jadwal"
              onClick={() => setActiveTab('jadwal')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-xs border border-emerald-500/50 shadow-xs transition active:scale-95"
            >
              <CalendarDays className="w-4 h-4" />
              Lihat Agenda Supervisi
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Distinct Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Box 1: Perangkat Ajar - Emerald Theme */}
        <div 
          id="kpi-card-perangkat"
          className="rounded-2xl p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {role === 'guru' ? 'Perangkat Saya' : 'Dokumen Ajar Terkumpul'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-950">{myDocs.length}</div>
            <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1.5 font-medium">
              <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {myDocs.filter(d => d.status === 'Diverifikasi').length} Diverifikasi
              </span>
              <span>•</span>
              <span className="text-slate-600 text-[11px]">
                {myDocs.filter(d => d.status !== 'Diverifikasi').length} Menunggu
              </span>
            </p>
          </div>
        </div>

        {/* Box 2: Jadwal Supervisi - Amber/Gold Theme */}
        <div 
          id="kpi-card-jadwal"
          className="rounded-2xl p-5 border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Agenda Supervisi
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-950">{mySchedules.length}</div>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1.5 font-medium">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {completedSchedules} Selesai
              </span>
              <span>•</span>
              <span className="bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {pendingSchedules + inProgressSchedules} Berjalan
              </span>
            </p>
          </div>
        </div>

        {/* Box 3: Skor Mengajar - Blue Theme */}
        <div 
          id="kpi-card-skor"
          className="rounded-2xl p-5 border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Skor Mengajar (Kelas)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-blue-950">
              {avgTeachingScore !== 'Belum Ada' ? `${avgTeachingScore}` : avgTeachingScore}
            </div>
            <p className="text-xs text-blue-700 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Skala 100 • {myTeachingAssessments.length} sesi observasi</span>
            </p>
          </div>
        </div>

        {/* Box 4: RTL & Rekomendasi - Purple/Indigo Theme */}
        <div 
          id="kpi-card-rtl"
          className="rounded-2xl p-5 border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/40 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
              Tindak Lanjut (RTL)
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-purple-950">{followUps.length}</div>
            <p className="text-xs text-purple-700 mt-1 flex items-center gap-1.5 font-medium">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {completedFollowUps} Tuntas
              </span>
              <span>•</span>
              <span className="bg-purple-200/70 text-purple-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {inProgressFollowUps} Berjalan
              </span>
            </p>
          </div>
        </div>

      </div>

      {/* Visualizations Section using Recharts: Schedule Progress & Teaching Document Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Visual: Supervision Schedule Progress (Donut/Pie Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Progres Jadwal Supervisi</h3>
                  <p className="text-[11px] text-slate-500">Distribusi status pelaksanaan agenda</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                Total: {mySchedules.length}
              </span>
            </div>

            {/* Recharts Pie Chart */}
            <div className="h-56 w-full mt-2 relative">
              {mySchedules.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scheduleStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {scheduleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val} Agenda`, 'Jumlah']} 
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <CalendarDays className="w-8 h-8 text-slate-300 mb-1" />
                  Belum ada data jadwal supervisi
                </div>
              )}
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-slate-600">Selesai: <strong>{completedSchedules}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                <span className="text-slate-600">Berjalan: <strong>{inProgressSchedules}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600">Terjadwal: <strong>{pendingSchedules}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-600">Dibatalkan: <strong>{cancelledSchedules}</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tingkat Penyelesaian: {mySchedules.length > 0 ? Math.round((completedSchedules / mySchedules.length) * 100) : 0}%</span>
            <button
              type="button"
              onClick={() => setActiveTab('jadwal')}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              Kelola Jadwal <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Visual: Teaching Document Completion Rate per Teacher (Stacked Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {role === 'guru' ? 'Tingkat Kelengkapan Berkas Anda' : 'Tingkat Kelengkapan Dokumen Per Guru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {role === 'guru' ? 'Status verifikasi per kategori berkas ajar' : 'Perbandingan dokumen diverifikasi vs menunggu verifikasi'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                Total Berkas: {myDocs.length}
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-56 w-full mt-2">
              {teacherDocProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={teacherDocProgressData} 
                    margin={{ top: 15, right: 10, left: -20, bottom: 20 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      formatter={(val: any, name: any) => [
                        `${val} Dokumen`, 
                        name === 'diverifikasi' ? 'Diverifikasi' : 'Menunggu / Belum'
                      ]}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      formatter={(val) => val === 'diverifikasi' ? 'Diverifikasi' : 'Menunggu / Revisi'}
                    />
                    <Bar dataKey="diverifikasi" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="menunggu" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FolderGit2 className="w-8 h-8 text-slate-300 mb-1" />
                  Belum ada data dokumen perangkat
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standar Kurikulum: Modul Ajar, Prota, Promes, Asesmen</span>
            <button
              type="button"
              onClick={() => setActiveTab('perangkat')}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              Semua Perangkat <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Upcoming Schedules & Recent Document uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Agenda Supervisi Mendatang */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900">Agenda Supervisi Mendatang</h3>
              </div>
              <button
                type="button"
                id="dash-link-jadwal"
                onClick={() => setActiveTab('jadwal')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {mySchedules.slice(0, 4).map((s) => (
                <div 
                  key={s.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.type === 'Administrasi' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {s.type}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {s.guruName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {s.mataPelajaran} • {s.kelas} • Supervisor: {s.penilaiName}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.waktu} WITA
                      </span>
                      <span>Tanggal: {s.tanggal}</span>
                      <span>Ruang: {s.tempat}</span>
                    </div>
                  </div>

                  <div>
                    {s.status === 'Selesai' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {s.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {mySchedules.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">Belum ada agenda supervisi terdaftar</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Agenda: {mySchedules.length} Sesi</span>
            <button
              type="button"
              onClick={() => setActiveTab('jadwal')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Atur Jadwal
            </button>
          </div>
        </div>

        {/* Right Column: Perangkat Pembelajaran Terbaru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900">Perangkat Ajar Terkini</h3>
              </div>
              <button
                type="button"
                id="dash-link-perangkat"
                onClick={() => setActiveTab('perangkat')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {myDocs.slice(0, 4).map((d) => (
                <div 
                  key={d.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {d.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {d.category} • Oleh {d.guruName} • {d.kelas}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Diupload: {new Date(d.uploadedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div>
                    {d.status === 'Diverifikasi' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Diverifikasi
                      </span>
                    ) : d.status === 'Perlu Perbaikan' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        Revisi
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {d.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {myDocs.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <FolderGit2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">Belum ada perangkat ajar yang diunggah</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rata-Rata Kelengkapan Adm: {avgAdminScore !== 'Belum Ada' ? `${avgAdminScore}%` : 'Belum Ada'}</span>
            <button
              type="button"
              onClick={() => setActiveTab('perangkat')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Kelola Dokumen
            </button>
          </div>
        </div>

      </div>

      {/* Madrasah Profile Footnote Info */}
      <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-800">Penanggung Jawab Supervisi: </span>
          {settings.kepalaMadrasahName} (Kepala Madrasah) • NIP. {settings.kepalaMadrasahNip}
        </div>
        <div className="text-slate-500">
          {settings.alamat}
        </div>
      </div>

    </div>
  );
};
