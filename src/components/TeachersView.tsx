import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  BookOpen, 
  CheckCircle2, 
  X, 
  KeyRound,
  ShieldCheck,
  Edit2,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types';
import { exportTeachersToCsv } from '../lib/csvExport';

interface TeachersViewProps {
  teachers: UserProfile[];
  onAddTeacher: (teacher: Partial<UserProfile> & { password?: string }) => Promise<void>;
  onUpdateTeacher: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  onOpenUserProfile?: (teacher: UserProfile) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onOpenUserProfile
}) => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('guru');
  const [formNip, setFormNip] = useState('');
  const [formPangkat, setFormPangkat] = useState('');
  const [formMapel, setFormMapel] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = 
      t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.nip && t.nip.includes(searchTerm)) ||
      (t.mataPelajaran && t.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || t.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormEmail('');
    setFormRole('guru');
    setFormNip('');
    setFormPangkat('');
    setFormMapel('');
    setFormPhone('');
    setFormPassword('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: UserProfile) => {
    setEditingTeacher(t);
    setFormName(t.displayName);
    setFormEmail(t.email);
    setFormRole(t.role);
    setFormNip(t.nip || '');
    setFormPangkat(t.pangkatGolongan || '');
    setFormMapel(t.mataPelajaran || '');
    setFormPhone(t.phone || '');
    setFormPassword('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher.uid, {
          displayName: formName,
          role: formRole,
          nip: formNip,
          pangkatGolongan: formPangkat,
          mataPelajaran: formMapel,
          phone: formPhone
        });
      } else {
        if (!formEmail.trim() || !formPassword.trim()) {
          throw new Error('Email dan kata sandi wajib diisi untuk membuat akun pengguna.');
        }
        await onAddTeacher({
          displayName: formName,
          email: formEmail,
          role: formRole,
          nip: formNip,
          pangkatGolongan: formPangkat,
          mataPelajaran: formMapel,
          phone: formPhone,
          password: formPassword
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data pengguna');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Admin</span>;
      case 'kamad':
        return <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">Kepala Madrasah</span>;
      case 'penilai':
        return <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Guru Penilai</span>;
      case 'guru':
      default:
        return <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Guru (Objek)</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Data Guru & Tenaga Pendidik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar profil guru, guru senior penilai, kepala madrasah, dan hak akses aplikasi di MAN 2 Gorontalo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="btn-export-teachers-csv"
            onClick={() => exportTeachersToCsv(filteredTeachers)}
            disabled={filteredTeachers.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Ekspor CSV
          </button>

          {role === 'admin' && (
            <button
              type="button"
              id="btn-add-teacher"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              Tambah Pengguna / Guru
            </button>
          )}
        </div>
      </div>

      {/* Admin Role Management Notice */}
      {role === 'admin' && (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-900">Kewenangan Penentuan Hak Akses: </span>
            Seluruh akun yang mendaftar mandiri otomatis berstatus sebagai <strong>Guru</strong>. Anda sebagai Admin berwenang penuh menentukan atau menaikkan peran akun menjadi <strong>Guru Senior / Penilai</strong>, <strong>Kepala Madrasah</strong>, atau <strong>Admin</strong> melalui tombol <strong>Edit (ikon pensil)</strong> pada tabel di bawah.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-teacher-input"
            type="text"
            placeholder="Cari nama, NIP, mapel, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Peran:</span>
          <select
            id="filter-role-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Peran</option>
            <option value="guru">Guru (Sasaran)</option>
            <option value="penilai">Guru Penilai</option>
            <option value="kamad">Kepala Madrasah</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Teachers Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Nama & Identitas</th>
                <th className="px-4 py-3.5">Hak Akses / Peran</th>
                <th className="px-4 py-3.5">Mata Pelajaran</th>
                <th className="px-4 py-3.5">Pangkat / Golongan</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((t) => (
                <tr key={t.uid} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{t.displayName}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.nip ? `NIP. ${t.nip}` : 'NIP: -'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {getRoleBadge(t.role)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      {t.mataPelajaran || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-slate-600 font-medium">{t.pangkatGolongan || 'Penata / III.c'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5 text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {t.email}
                      </span>
                      {t.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {t.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onOpenUserProfile && (
                        <button
                          type="button"
                          onClick={() => onOpenUserProfile(t)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Profil & Riwayat Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Data Guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ditemukan data guru yang sesuai dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                {editingTeacher ? 'Perbarui Data Guru' : 'Tambah Pengguna / Guru Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. H. Ahmad Podungge, M.Pd"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hak Akses / Peran *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="guru">Guru (Objek Penilaian)</option>
                    <option value="penilai">Guru Senior / Penilai</option>
                    <option value="kamad">Kepala Madrasah</option>
                    <option value="admin">Admin Pengelola</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP (18 Digit)
                  </label>
                  <input
                    type="text"
                    placeholder="197508..."
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran Diampu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Fisika / Matematika"
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembina / IV.a"
                    value={formPangkat}
                    onChange={(e) => setFormPangkat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Email (Digunakan untuk Login) *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingTeacher}
                  placeholder="guru@man2gorontalo.sch.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>

              {!editingTeacher && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi Awal *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
