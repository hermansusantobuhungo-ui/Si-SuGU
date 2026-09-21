import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  FolderGit2, 
  CalendarDays, 
  ClipboardCheck, 
  GraduationCap, 
  ListChecks, 
  FileText, 
  Sliders, 
  LogOut, 
  Menu, 
  X,
  UserCheck,
  Image as ImageIcon,
  ShieldAlert,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserProfile, TeachingDocument, SupervisionSchedule, AppSetting, FollowUpPlan } from '../types';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearch } from './GlobalSearch';
import { OnlineStatusBadge } from './OnlineStatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  madrasahName: string;
  teachers?: UserProfile[];
  documents?: TeachingDocument[];
  schedules?: SupervisionSchedule[];
  followUps?: FollowUpPlan[];
  settings?: AppSetting;
  onOpenUserProfile?: (teacher?: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  madrasahName,
  teachers = [],
  documents = [],
  schedules = [],
  followUps = [],
  settings,
  onOpenUserProfile
}) => {
  const { profile, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const brandColor = settings?.primaryColor || '#047857';
  const effectiveAppName = settings?.appName || 'Si-SuGu';
  const effectiveLogo = settings?.appLogoUrl || settings?.logoUrl;
  const effectiveTagline = settings?.tagline || madrasahName;

  const getRoleBadge = (r: UserRole | null) => {
    switch (r) {
      case 'admin':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">ADMIN</span>;
      case 'kamad':
        return <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">KEPALA MADRASAH</span>;
      case 'penilai':
        return <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-orange-300">GURU PENILAI</span>;
      case 'guru':
      default:
        return <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-300">GURU</span>;
    }
  };

  // Define navigation items based on role requirements
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'guru', 'penilai', 'kamad']
    },
    {
      id: 'data-guru',
      label: 'Data Guru',
      icon: Users,
      roles: ['admin', 'penilai', 'kamad']
    },
    {
      id: 'perangkat',
      label: 'Perangkat Pembelajaran',
      icon: FolderGit2,
      roles: ['admin', 'guru', 'penilai', 'kamad']
    },
    {
      id: 'jadwal',
      label: 'Jadwal Supervisi',
      icon: CalendarDays,
      roles: ['admin', 'guru', 'penilai', 'kamad']
    },
    {
      id: 'supervisi-administrasi',
      label: 'Supervisi Administrasi',
      icon: ClipboardCheck,
      roles: ['admin', 'penilai', 'kamad', 'guru']
    },
    {
      id: 'supervisi-mengajar',
      label: 'Supervisi Mengajar',
      icon: GraduationCap,
      roles: ['admin', 'penilai', 'kamad', 'guru']
    },
    {
      id: 'tindak-lanjut',
      label: 'Tindak Lanjut & RTL',
      icon: ListChecks,
      roles: ['admin', 'guru', 'penilai', 'kamad']
    },
    {
      id: 'laporan',
      label: 'Laporan & PDF',
      icon: FileText,
      roles: ['admin', 'penilai', 'kamad', 'guru']
    },
    {
      id: 'popup-banner',
      label: 'Pop-up Banner',
      icon: ImageIcon,
      roles: ['admin'] // Admin manages pop-up announcement banners
    },
    {
      id: 'format-penilaian',
      label: 'Format Penilaian',
      icon: Sliders,
      roles: ['admin'] // Admin manages indicators
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: ShieldAlert,
      roles: ['admin', 'kamad'] // Admin & Kamad audit trail for accountability
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Profil',
      icon: Sliders,
      roles: ['admin', 'kamad', 'penilai', 'guru']
    }
  ];

  const filteredNav = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner with branding & user info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div 
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md group-hover:scale-105 transition overflow-hidden p-1 border border-white/20"
                style={{ backgroundColor: brandColor }}
              >
                {effectiveLogo ? (
                  <img 
                    src={effectiveLogo} 
                    alt={effectiveAppName} 
                    className="w-full h-full object-contain drop-shadow-xs" 
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                    {effectiveAppName}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30 max-w-[160px] truncate">
                    {madrasahName.replace(/^(Madrasah Aliyah Negeri|MAN)\s*/i, 'MAN ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block max-w-[280px] truncate">
                  {effectiveTagline}
                </p>
              </div>
            </button>
          </div>

          {/* Global Search Bar (Center / Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2 lg:mx-4">
            <GlobalSearch
              teachers={teachers}
              documents={documents}
              schedules={schedules}
              onNavigateTab={setActiveTab}
              onSelectTeacher={(t) => {
                if (onOpenUserProfile) {
                  onOpenUserProfile(t);
                } else {
                  setActiveTab('data-guru');
                }
              }}
            />
          </div>

          {/* Right Action: Online Status, Notification Bell, Role Badge, Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Online / Offline Status Indicator */}
            <OnlineStatusBadge />

            {/* System Notifications Bell Dropdown */}
            <NotificationDropdown 
              currentUser={profile}
              documents={documents}
              schedules={schedules}
              followUps={followUps}
              onNavigateTab={setActiveTab}
            />

            {/* Role Badge: Display official assigned badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 text-xs text-slate-700 font-medium">
              <span className="hidden md:inline text-slate-500 text-[11px]">Peran:</span>
              {getRoleBadge(role)}
            </div>

            {/* Profile snippet button to open UserProfileModal */}
            <button
              type="button"
              id="btn-navbar-profile"
              onClick={() => onOpenUserProfile && onOpenUserProfile(profile || undefined)}
              title="Lihat Profil & Berkas Pribadi"
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition text-left group"
            >
              <div 
                className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition"
                style={{ backgroundColor: brandColor }}
              >
                {profile?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] group-hover:text-emerald-800">
                  {profile?.displayName || 'Pengguna'}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {profile?.nip ? `NIP. ${profile.nip}` : profile?.email}
                </span>
              </div>
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              id="btn-logout"
              onClick={signOut}
              title="Keluar dari Aplikasi"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="md:hidden px-4 pb-2">
          <GlobalSearch
            teachers={teachers}
            documents={documents}
            schedules={schedules}
            onNavigateTab={setActiveTab}
            onSelectTeacher={(t) => {
              if (onOpenUserProfile) {
                onOpenUserProfile(t);
              } else {
                setActiveTab('data-guru');
              }
            }}
          />
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={isActive ? { backgroundColor: brandColor } : {}}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-bold text-slate-800">{profile?.displayName}</p>
            <p className="text-[11px] text-slate-500">{profile?.email}</p>
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={isActive ? { backgroundColor: brandColor } : {}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
