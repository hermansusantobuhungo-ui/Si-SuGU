import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  Calendar, 
  BookOpen, 
  FolderGit2, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  X, 
  ShieldCheck, 
  FileText,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { UserProfile, TeachingDocument, SupervisionSchedule, AdminSupervisionAssessment, TeachingSupervisionAssessment } from '../types';
import { isItemForUser } from '../lib/userMatch';

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  documents: TeachingDocument[];
  schedules: SupervisionSchedule[];
  adminAssessments?: AdminSupervisionAssessment[];
  teachingAssessments?: TeachingSupervisionAssessment[];
  onNavigateTab: (tab: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  documents,
  schedules,
  adminAssessments = [],
  teachingAssessments = [],
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'schedules'>('profile');

  if (!isOpen || !user) return null;

  // Filter documents belonging to this teacher
  const userDocs = documents.filter(d => isItemForUser(d, user, user.uid));

  // Filter schedules where this teacher is supervised or acts as evaluator
  const userSchedules = schedules.filter(s => 
    isItemForUser(s, user, user.uid) || 
    s.penilaiId === user.uid ||
    (user.displayName && s.penilaiName?.toLowerCase() === user.displayName.toLowerCase())
  );

  // Filter assessments for this teacher
  const userAdminAssessments = adminAssessments.filter(a => isItemForUser(a, user, user.uid));
  const userTeachingAssessments = teachingAssessments.filter(t => isItemForUser(t, user, user.uid));

  const verifiedDocsCount = userDocs.filter(d => d.status === 'Diverifikasi').length;
  const completedSchedulesCount = userSchedules.filter(s => s.status === 'Selesai').length;

  const avgTeachingScore = userTeachingAssessments.length > 0
    ? (userTeachingAssessments.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / userTeachingAssessments.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header with avatar & role badge */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white relative">
          <button
            type="button"
            id="btn-close-profile-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-inner shrink-0">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold truncate text-white">{user.displayName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-400 text-slate-900 shadow-2xs shrink-0">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1 flex flex-wrap items-center gap-3">
                {user.nip && <span>NIP. {user.nip}</span>}
                {user.mataPelajaran && <span>• Mapel: {user.mataPelajaran}</span>}
                {user.pangkatGolongan && <span>• Gol: {user.pangkatGolongan}</span>}
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/10 text-center">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Perangkat Ajar</span>
              <span className="text-lg font-bold text-white">{userDocs.length}</span>
              <span className="text-[10px] text-emerald-300 block">{verifiedDocsCount} Diverifikasi</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Agenda Supervisi</span>
              <span className="text-lg font-bold text-white">{userSchedules.length}</span>
              <span className="text-[10px] text-amber-300 block">{completedSchedulesCount} Selesai</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Rata Nilai Observasi</span>
              <span className="text-lg font-bold text-white">{avgTeachingScore ? `${avgTeachingScore}` : '-'}</span>
              <span className="text-[10px] text-emerald-300 block">{userTeachingAssessments.length} Observasi</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile' 
                ? 'border-emerald-600 text-emerald-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Biodata Diri
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'documents' 
                ? 'border-emerald-600 text-emerald-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Perangkat Diunggah ({userDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'schedules' 
                ? 'border-emerald-600 text-emerald-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Riwayat Supervisi ({userSchedules.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh] text-xs space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Email Akun</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email || '-'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Nomor WhatsApp / Kontak</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone || 'Belum diatur'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Mata Pelajaran yang Diampu</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.mataPelajaran || '-'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Pangkat / Golongan Ruang</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.pangkatGolongan || 'Penata Muda / III a'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Data pendidik ini terdaftar secara resmi pada sistem supervisi terpadu MAN 2 Kabupaten Gorontalo. Semua catatan supervisi, perangkat ajar, dan tindak lanjut terikat secara aman pada akun ini.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-2">
              {userDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FolderGit2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Belum ada perangkat ajar yang diunggah</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Unggah RPP/Modul ajar, prota, promes melalui menu Perangkat Pembelajaran</p>
                </div>
              ) : (
                userDocs.map(doc => (
                  <div 
                    key={doc.id}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{doc.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.category} • Kelas {doc.kelas} ({doc.semester} {doc.tahunPelajaran})
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Diunggah: {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.status === 'Diverifikasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'Perlu Perbaikan'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('perangkat');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  Buka Menu Kelola Perangkat <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="space-y-2">
              {userSchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Belum ada riwayat jadwal supervisi</p>
                </div>
              ) : (
                userSchedules.map(sched => (
                  <div 
                    key={sched.id}
                    className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sched.type === 'Administrasi' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {sched.type}
                        </span>
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {sched.guruName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supervisor: {sched.penilaiName} • Ruang: {sched.tempat}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sched.waktu} WITA
                        </span>
                        <span>{sched.tanggal}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      sched.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sched.status}
                    </span>
                  </div>
                ))
              )}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('jadwal');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  Buka Menu Jadwal Supervisi <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition active:scale-95"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
