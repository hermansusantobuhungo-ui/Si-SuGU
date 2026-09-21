import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSetting } from '../types';

interface LoginPageProps {
  settings?: AppSetting;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings }) => {
  const brandColor = settings?.primaryColor || '#047857';
  const appName = settings?.appName || 'Si-SuGu';
  const appTagline = settings?.tagline || 'Sistem Informasi Supervisi Guru Terpadu untuk pemantauan kurikulum, asesmen perangkat pembelajaran, observasi kelas, dan pembinaan mutu tenaga pendidik secara transparan dan akuntabel.';
  const madrasahName = settings?.madrasahName || 'MAN 2 Kabupaten Gorontalo';
  const logoUrl = settings?.appLogoUrl || settings?.logoUrl;

  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration fields
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [mapel, setMapel] = useState('');
  
  // Forgot password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Status
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (viewMode === 'register') {
        if (!name.trim()) throw new Error('Nama lengkap wajib diisi');
        // Role is strictly locked to 'guru' for self-registration. Admin assigns special roles.
        await signUp(email, password, name, 'guru', nip, mapel);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Email atau kata sandi tidak sesuai. Silakan periksa kembali atau gunakan fitur Lupa Kata Sandi.');
      } else if (msg.includes('email-already-in-use')) {
        setError('Email ini sudah terdaftar. Silakan pilih Masuk.');
      } else if (msg.includes('weak-password')) {
        setError('Kata sandi minimal 6 karakter.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Masukkan alamat email terdaftar.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setResetSuccess(false);

    try {
      await resetPassword(resetEmail.trim());
      setResetSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim email reset kata sandi';
      if (msg.includes('user-not-found')) {
        setError('Alamat email tidak ditemukan di pangkalan data.');
      } else if (msg.includes('invalid-email')) {
        setError('Format alamat email tidak valid.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6faf8] font-sans antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* LEFT SECTION: Emerald Green Gradient Banner with Decorative Shapes matching user mockup */}
      <div 
        className="relative w-full lg:w-[54%] min-h-[320px] lg:min-h-screen bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden shadow-2xl z-10"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, #064e3b, #022c22)`
        }}
      >
        
        {/* Background Decorative Abstract Glowing Circles */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-200/20 blur-3xl pointer-events-none" />
        
        {/* Abstract Diagonal Rounded Shapes (exact match to user mockup layout in green theme) */}
        <div className="absolute -bottom-16 -left-10 w-full h-[62%] pointer-events-none overflow-hidden opacity-90">
          {/* Pill 1 */}
          <div className="absolute -bottom-10 left-[-5%] w-36 h-[320px] rounded-full bg-gradient-to-t from-[#34d399] via-[#10b981] to-[#047857] rotate-45 shadow-lg opacity-85" />
          {/* Pill 2 (thin line) */}
          <div className="absolute bottom-20 left-[22%] w-4 h-52 rounded-full bg-gradient-to-t from-[#6ee7b7] to-[#10b981] rotate-45 opacity-75" />
          {/* Pill 3 (middle thick) */}
          <div className="absolute -bottom-12 left-[30%] w-28 h-[340px] rounded-full bg-gradient-to-t from-[#a7f3d0] via-[#34d399] to-[#059669] rotate-45 shadow-xl opacity-90" />
          {/* Pill 4 (thin line) */}
          <div className="absolute bottom-28 left-[45%] w-3.5 h-44 rounded-full bg-gradient-to-t from-[#6ee7b7] to-[#059669] rotate-45 opacity-80" />
          {/* Pill 5 (right thick) */}
          <div className="absolute -bottom-16 left-[58%] w-32 h-[350px] rounded-full bg-gradient-to-t from-[#34d399] via-[#10b981] to-[#064e3b] rotate-45 shadow-2xl opacity-90" />
          {/* Pill 6 (thin trailing line) */}
          <div className="absolute bottom-16 left-[78%] w-4 h-48 rounded-full bg-gradient-to-t from-[#a7f3d0] to-[#10b981] rotate-45 opacity-75" />
          {/* Glow circle overlay */}
          <div className="absolute top-12 right-[18%] w-52 h-52 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-400/20 blur-2xl" />
        </div>

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-md p-1 overflow-hidden"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="w-full h-full object-contain drop-shadow-xs" />
            ) : (
              <Building2 className="w-6 h-6 text-amber-300" />
            )}
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight block">
              {appName}
            </span>
            <span className="text-white/80 text-xs tracking-wider block uppercase font-medium">
              {madrasahName}
            </span>
          </div>
        </div>

        {/* Center Welcome Hero Typography */}
        <div className="relative z-10 max-w-xl my-auto py-10 lg:py-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Selamat Datang di {appName}
          </h1>
          <p className="mt-4 sm:mt-6 text-white/90 text-sm sm:text-base leading-relaxed font-light">
            {appTagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              ✓ Perencanaan & Modul Ajar
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              ✓ Observasi & Penilaian Pembelajaran
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              ✓ Tindak Lanjut & Rekapitulasi
            </span>
          </div>
        </div>

        {/* Bottom copyright in banner */}
        <div className="relative z-10 text-white/75 text-xs font-light hidden lg:block">
          © {new Date().getFullYear()} {madrasahName} • Kementerian Agama RI
        </div>
      </div>

      {/* RIGHT SECTION: User Login Form matching user uploaded design with Green Theme */}
      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 sm:p-10 lg:p-14 min-h-[500px]">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-[#065f46] uppercase">
              {viewMode === 'login' && 'USER LOGIN'}
              {viewMode === 'register' && 'DAFTAR AKUN BARU'}
              {viewMode === 'forgot' && 'LUPA KATA SANDI'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5">
              {viewMode === 'login' && 'Masukkan kredensial akun Anda untuk mengakses sistem'}
              {viewMode === 'register' && 'Lengkapi data pendaftaran akun guru madrasah'}
              {viewMode === 'forgot' && 'Kirimkan tautan reset kata sandi ke alamat email Anda'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {resetSuccess && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-emerald-900 mb-0.5">Tautan Berhasil Dikirim!</span>
                Instruksi pemulihan kata sandi telah dikirim ke <strong>{resetEmail}</strong>. Silakan periksa kotak masuk atau folder spam email Anda.
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD FORM */}
          {viewMode === 'forgot' ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-3">
                  Alamat Email Terdaftar
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-emerald-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-reset-email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="submit"
                  id="btn-submit-reset"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[200px] py-3 px-8 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-700/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'KIRIM TAUTAN RESET'}
                </button>
              </div>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  id="btn-back-to-login"
                  onClick={() => {
                    setViewMode('login');
                    setError(null);
                    setResetSuccess(false);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          ) : (
            /* VIEW: LOGIN & REGISTER FORMS */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Extra registration fields */}
              {viewMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-3">
                      Nama Lengkap & Gelar
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-emerald-600">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="input-reg-name"
                        type="text"
                        required
                        placeholder="Contoh: Dra. Siti Rahmah, M.Pd"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-3">
                        Peran Akun
                      </label>
                      <div className="w-full px-4 py-2.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center justify-between">
                        <span>Guru</span>
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                          Bawaan
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-3">
                        NIP (Opsional)
                      </label>
                      <input
                        id="input-reg-nip"
                        type="text"
                        placeholder="1980xxxx..."
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-3">
                      Mata Pelajaran yang Diampu
                    </label>
                    <input
                      id="input-reg-mapel"
                      type="text"
                      placeholder="Contoh: Biologi / Al-Qur'an Hadis"
                      value={mapel}
                      onChange={(e) => setMapel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </>
              )}

              {/* Email Input (Pill styled with User icon in green theme) */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-emerald-600">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-email"
                    type="email"
                    required
                    placeholder="Alamat Email Pengguna"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input (Pill styled with Lock icon in green theme) */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-emerald-600">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Kata Sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-full bg-[#f0fdf4] hover:bg-[#e6fcf0] focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              {viewMode === 'login' && (
                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="checkbox-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span>Ingat saya</span>
                  </label>

                  <button
                    type="button"
                    id="btn-forgot-password"
                    onClick={() => {
                      setViewMode('forgot');
                      setError(null);
                      setResetEmail(email);
                    }}
                    className="text-slate-500 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
              )}

              {/* Login Pill Button (Green Theme) */}
              <div className="pt-4 text-center">
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: brandColor }}
                  className="w-full sm:w-auto min-w-[190px] py-3 px-8 rounded-full text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-black/15 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Memproses...'
                    : viewMode === 'register'
                    ? 'DAFTAR SEKARANG'
                    : 'LOGIN'}
                </button>
              </div>

              {/* Switch between Login and Register */}
              <div className="pt-4 text-center border-t border-slate-100 mt-6">
                <button
                  type="button"
                  id="btn-toggle-auth"
                  onClick={() => {
                    setViewMode(viewMode === 'register' ? 'login' : 'register');
                    setError(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  {viewMode === 'register'
                    ? 'Sudah punya akun? Masuk di sini'
                    : 'Belum punya akun? Buat akun baru'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
