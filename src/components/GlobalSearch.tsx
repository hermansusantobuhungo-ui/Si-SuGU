import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Users, 
  FolderGit2, 
  CalendarDays, 
  X, 
  ExternalLink, 
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { UserProfile, TeachingDocument, SupervisionSchedule } from '../types';

interface GlobalSearchProps {
  teachers: UserProfile[];
  documents: TeachingDocument[];
  schedules: SupervisionSchedule[];
  onNavigateTab: (tab: string) => void;
  onSelectTeacher?: (teacher: UserProfile) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  teachers,
  documents,
  schedules,
  onNavigateTab,
  onSelectTeacher
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Search Teachers
  const matchedTeachers = trimmed.length >= 2 ? teachers.filter(t => 
    t.displayName.toLowerCase().includes(trimmed) ||
    (t.nip && t.nip.toLowerCase().includes(trimmed)) ||
    (t.mataPelajaran && t.mataPelajaran.toLowerCase().includes(trimmed)) ||
    (t.email && t.email.toLowerCase().includes(trimmed))
  ).slice(0, 4) : [];

  // Search Documents
  const matchedDocuments = trimmed.length >= 2 ? documents.filter(d =>
    d.title.toLowerCase().includes(trimmed) ||
    d.category.toLowerCase().includes(trimmed) ||
    d.guruName.toLowerCase().includes(trimmed) ||
    (d.mataPelajaran && d.mataPelajaran.toLowerCase().includes(trimmed)) ||
    (d.kelas && d.kelas.toLowerCase().includes(trimmed))
  ).slice(0, 4) : [];

  // Search Schedules
  const matchedSchedules = trimmed.length >= 2 ? schedules.filter(s =>
    s.guruName.toLowerCase().includes(trimmed) ||
    s.penilaiName.toLowerCase().includes(trimmed) ||
    s.type.toLowerCase().includes(trimmed) ||
    (s.mataPelajaran && s.mataPelajaran.toLowerCase().includes(trimmed)) ||
    (s.tempat && s.tempat.toLowerCase().includes(trimmed)) ||
    (s.tanggal && s.tanggal.includes(trimmed))
  ).slice(0, 4) : [];

  const totalResults = matchedTeachers.length + matchedDocuments.length + matchedSchedules.length;

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          id="global-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari guru, berkas ajar, jadwal..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition duration-150"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Results Popup */}
      {isOpen && trimmed.length >= 2 && (
        <div 
          id="global-search-results-dropdown"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 max-h-[80vh] flex flex-col"
        >
          <div className="p-2.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Hasil Pencarian ({totalResults})</span>
            <span className="text-[10px] text-slate-400">Kata kunci: &ldquo;{query}&rdquo;</span>
          </div>

          <div className="overflow-y-auto p-2 space-y-3">
            {totalResults === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Search className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
              </div>
            ) : (
              <>
                {/* Teachers Section */}
                {matchedTeachers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Users className="w-3 h-3 text-emerald-600" />
                      <span>Guru & Tenaga Pendidik ({matchedTeachers.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchedTeachers.map(t => (
                        <div
                          key={t.uid}
                          onClick={() => {
                            if (onSelectTeacher) {
                              onSelectTeacher(t);
                            } else {
                              onNavigateTab('data-guru');
                            }
                            setIsOpen(false);
                          }}
                          className="p-2 rounded-xl hover:bg-emerald-50/70 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                              {t.displayName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {t.mataPelajaran ? `${t.mataPelajaran} • ` : ''}{t.nip ? `NIP. ${t.nip}` : t.email}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase group-hover:bg-emerald-200 group-hover:text-emerald-900 shrink-0">
                            {t.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {matchedDocuments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <FolderGit2 className="w-3 h-3 text-blue-600" />
                      <span>Perangkat Pembelajaran ({matchedDocuments.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchedDocuments.map(d => (
                        <div
                          key={d.id}
                          onClick={() => {
                            onNavigateTab('perangkat');
                            setIsOpen(false);
                          }}
                          className="p-2 rounded-xl hover:bg-blue-50/70 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-800 truncate">
                              {d.title}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {d.guruName} • {d.category} ({d.kelas})
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            d.status === 'Diverifikasi'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'Perlu Perbaikan'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedules Section */}
                {matchedSchedules.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <CalendarDays className="w-3 h-3 text-amber-600" />
                      <span>Jadwal Supervisi ({matchedSchedules.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchedSchedules.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            onNavigateTab('jadwal');
                            setIsOpen(false);
                          }}
                          className="p-2 rounded-xl hover:bg-amber-50/70 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800 truncate">
                              {s.guruName} ({s.type})
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {s.tanggal} ({s.waktu} WITA) • Penilai: {s.penilaiName}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            s.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer view shortcuts */}
          <div className="p-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
            <button
              type="button"
              onClick={() => {
                onNavigateTab('perangkat');
                setIsOpen(false);
              }}
              className="hover:text-emerald-700 font-semibold"
            >
              Semua Berkas &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigateTab('jadwal');
                setIsOpen(false);
              }}
              className="hover:text-emerald-700 font-semibold"
            >
              Semua Jadwal &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
