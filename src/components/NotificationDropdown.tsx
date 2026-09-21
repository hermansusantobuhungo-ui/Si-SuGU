import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  FileUp, 
  CalendarDays, 
  CheckCheck, 
  Clock, 
  ExternalLink,
  Filter,
  AlertCircle,
  ListChecks,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { TeachingDocument, SupervisionSchedule, UserProfile, FollowUpPlan } from '../types';
import { isItemForUser } from '../lib/userMatch';

export interface PendingItemNotification {
  id: string;
  category: 'pending_schedule' | 'overdue_followup' | 'unverified_doc';
  title: string;
  message: string;
  meta: string;
  timestamp: string;
  dueDate?: string;
  targetTab: 'jadwal' | 'tindak-lanjut' | 'perangkat';
  isUrgent: boolean;
}

interface NotificationDropdownProps {
  currentUser: UserProfile | null;
  documents: TeachingDocument[];
  schedules: SupervisionSchedule[];
  followUps?: FollowUpPlan[];
  onNavigateTab: (tab: string) => void;
}

const formatRelativeTime = (timestampStr: string): string => {
  if (!timestampStr) return '';
  const now = new Date();
  const date = new Date(timestampStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  currentUser,
  documents,
  schedules,
  followUps = [],
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending_schedule' | 'overdue_followup' | 'unverified_doc'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`read_notifications_${currentUser?.uid || 'guest'}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate specific notifications targeted to currently logged-in user:
  // 1. Pending supervision requests/schedules:
  //    - For Guru: Upcoming/pending schedules assigned to them ('Terjadwal' or 'Sedang Berjalan')
  //    - For Penilai: Schedules where they are the evaluator that are still 'Terjadwal' or 'Sedang Berjalan'
  //    - For Admin/Kamad: All pending schedules
  // 2. Overdue or pending follow-up plans (RTL):
  //    - Follow ups with targetPenyelesaian past today or pending status
  // 3. For Penilai/Admin/Kamad: Unverified documents uploaded by teachers
  const notifications: PendingItemNotification[] = useMemo(() => {
    const list: PendingItemNotification[] = [];
    const today = new Date().toISOString().split('T')[0];
    const userRole = currentUser?.role;

    // 1. Pending Supervision Schedules for currently logged-in user
    schedules.forEach(sched => {
      const isPendingStatus = sched.status === 'Terjadwal' || sched.status === 'Sedang Berjalan';
      if (!isPendingStatus) return;

      const isForGuru = userRole === 'guru' && isItemForUser(sched, currentUser, currentUser?.uid);
      const isForPenilai = userRole === 'penilai' && (
        sched.penilaiId === currentUser?.uid || 
        (currentUser?.displayName && sched.penilaiName?.toLowerCase() === currentUser.displayName.toLowerCase())
      );
      const isManager = userRole === 'admin' || userRole === 'kamad';

      if (isForGuru || isForPenilai || isManager) {
        const notifId = `sched-pend-${sched.id}`;
        const isToday = sched.tanggal === today;
        const isPastDate = sched.tanggal < today;

        let roleContext = '';
        if (isForGuru) {
          roleContext = `Anda dijadwalkan supervisi oleh ${sched.penilaiName}`;
        } else if (isForPenilai) {
          roleContext = `Anda bertugas menilai ${sched.guruName}`;
        } else {
          roleContext = `${sched.guruName} disupervisi oleh ${sched.penilaiName}`;
        }

        list.push({
          id: notifId,
          category: 'pending_schedule',
          title: `Agenda Supervisi: ${sched.type} (${sched.guruName})`,
          message: `${roleContext} pada ${sched.tanggal} (${sched.waktu} WITA) di ${sched.tempat}.`,
          meta: isToday ? 'Hari Ini' : isPastDate ? 'Terlewati' : sched.status,
          timestamp: sched.createdAt || sched.tanggal || new Date().toISOString(),
          dueDate: sched.tanggal,
          targetTab: 'jadwal',
          isUrgent: isToday || isPastDate
        });
      }
    });

    // 2. Overdue or Pending Follow-Up Plans (RTL) for currently logged-in user
    followUps.forEach(rtl => {
      const isPending = rtl.status === 'Belum Selesai' || rtl.status === 'Dalam Proses';
      if (!isPending) return;

      const isUserRtl = userRole === 'guru' 
        ? isItemForUser(rtl, currentUser, currentUser?.uid) 
        : true; // Penilai, kamad, admin monitor follow up plans

      if (isUserRtl) {
        const isOverdue = rtl.targetPenyelesaian && rtl.targetPenyelesaian < today;
        const notifId = `rtl-overdue-${rtl.id}`;

        list.push({
          id: notifId,
          category: 'overdue_followup',
          title: isOverdue ? `⚠️ Tindak Lanjut Terlambat: ${rtl.guruName}` : `Tindak Lanjut Berjalan: ${rtl.guruName}`,
          message: `${rtl.rencanaTindakLanjut || rtl.rekomendasiPenilai}. Target: ${rtl.targetPenyelesaian || 'Segera'} (${rtl.kegiatanBimbingan}).`,
          meta: isOverdue ? 'Jatuh Tempo!' : rtl.status,
          timestamp: rtl.updatedAt || new Date().toISOString(),
          dueDate: rtl.targetPenyelesaian,
          targetTab: 'tindak-lanjut',
          isUrgent: isOverdue
        });
      }
    });

    // 3. Unverified Teaching Documents (For Evaluators, Kamad, Admin)
    if (userRole === 'admin' || userRole === 'penilai' || userRole === 'kamad') {
      documents.forEach(doc => {
        if (doc.status === 'Draft' || doc.status === 'Diajukan') {
          const notifId = `doc-pend-${doc.id}`;
          list.push({
            id: notifId,
            category: 'unverified_doc',
            title: `Dokumen Menunggu Verifikasi: ${doc.title}`,
            message: `${doc.guruName} mengunggah ${doc.category} (${doc.mataPelajaran} ${doc.kelas}).`,
            meta: doc.status,
            timestamp: doc.uploadedAt || new Date().toISOString(),
            targetTab: 'perangkat',
            isUrgent: false
          });
        }
      });
    }

    // Sort: Urgent items first, then newest timestamp
    list.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return list;
  }, [currentUser, schedules, followUps, documents]);

  const unreadPendingCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const urgentCount = useMemo(() => {
    return notifications.filter(n => n.isUrgent).length;
  }, [notifications]);

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(`read_notifications_${currentUser?.uid || 'guest'}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(`read_notifications_${currentUser?.uid || 'guest'}`, JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const handleItemClick = (item: PendingItemNotification) => {
    markAsRead(item.id);
    onNavigateTab(item.targetTab);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-navbar-notifications"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi Permintaan Supervisi dan Tindak Lanjut"
        title="Agenda Tertunda & Tindak Lanjut"
        className={`relative p-2 rounded-xl border transition flex items-center justify-center ${
          isOpen 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-white border-slate-200/80 text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadPendingCount > 0 && (
          <span 
            id="badge-navbar-notifications-count"
            className={`absolute -top-1 -right-1 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
              urgentCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
            }`}
          >
            {unreadPendingCount > 9 ? '9+' : unreadPendingCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col transform transition-all duration-150 animate-in fade-in slide-in-from-top-2 max-h-[85vh]"
          role="menu"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700/80 text-white flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Agenda & Permintaan Supervisi
                  {unreadPendingCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadPendingCount} tertunda
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">Jadwal aktif, tindak lanjut & verifikasi</p>
              </div>
            </div>

            {unreadPendingCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1 text-[11px] overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded-lg font-medium transition whitespace-nowrap ${
                activeFilter === 'all' 
                  ? 'bg-slate-800 text-white font-bold' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pending_schedule')}
              className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'pending_schedule' 
                  ? 'bg-amber-600 text-white font-bold' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              Jadwal
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('overdue_followup')}
              className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'overdue_followup' 
                  ? 'bg-rose-600 text-white font-bold' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ListChecks className="w-3 h-3" />
              Tindak Lanjut
            </button>
            {(currentUser?.role === 'admin' || currentUser?.role === 'penilai' || currentUser?.role === 'kamad') && (
              <button
                type="button"
                onClick={() => setActiveFilter('unverified_doc')}
                className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
                  activeFilter === 'unverified_doc' 
                    ? 'bg-emerald-700 text-white font-bold' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileUp className="w-3 h-3" />
                Verifikasi
              </button>
            )}
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-100 max-h-72">
            {filteredList.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-400">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">Semua tugas tuntas!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tidak ada jadwal supervisi tertunda atau tindak lanjut yang melewati batas waktu.
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition group ${
                      !isRead ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.category === 'overdue_followup'
                        ? 'bg-rose-100 text-rose-700'
                        : item.category === 'pending_schedule'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.category === 'overdue_followup' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      ) : item.category === 'pending_schedule' ? (
                        <CalendarDays className="w-4 h-4 text-amber-600" />
                      ) : (
                        <FileUp className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          item.isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.category === 'pending_schedule'
                            ? 'bg-amber-100 text-amber-800'
                            : item.category === 'overdue_followup'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.meta}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <p className={`text-xs font-bold leading-tight group-hover:text-emerald-800 transition ${
                        item.isUrgent ? 'text-rose-900' : 'text-slate-800'
                      }`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/70">
                        <span className="text-[10px] text-slate-400">
                          {item.dueDate ? `Target: ${item.dueDate}` : 'Siap Ditindaklanjuti'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                          Tinjau <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onNavigateTab('jadwal');
                setIsOpen(false);
              }}
              className="font-bold text-slate-600 hover:text-emerald-700 transition"
            >
              Agenda Supervisi &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigateTab('tindak-lanjut');
                setIsOpen(false);
              }}
              className="font-bold text-slate-600 hover:text-emerald-700 transition"
            >
              RTL Guru &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
