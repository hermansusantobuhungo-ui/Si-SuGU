import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Clock, Calendar } from 'lucide-react';
import { PopupBannerConfig, UserProfile } from '../types';

interface PopupBannerModalProps {
  config: PopupBannerConfig | null;
  currentUser: UserProfile | null;
  onNavigateTab?: (tab: string) => void;
  forcePreview?: boolean;
  onClosePreview?: () => void;
}

export const PopupBannerModal: React.FC<PopupBannerModalProps> = ({
  config,
  currentUser,
  onNavigateTab,
  forcePreview = false,
  onClosePreview
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (forcePreview) {
      setIsOpen(true);
      return;
    }

    if (!config || !config.isActive || !config.imageUrl) {
      setIsOpen(false);
      return;
    }

    // 1. Audience Check
    if (currentUser) {
      if (config.targetAudience === 'specific') {
        const allowed = Array.isArray(config.targetUserIds) && config.targetUserIds.includes(currentUser.uid);
        if (!allowed) {
          setIsOpen(false);
          return;
        }
      } else if (config.targetAudience !== 'all' && config.targetAudience !== currentUser.role) {
        setIsOpen(false);
        return;
      }
    }

    // 2. Frequency Check (Once a day)
    const todayStr = new Date().toISOString().split('T')[0];
    const bannerKey = `popup_dismissed_${config.id || 'main'}_${currentUser?.uid || 'guest'}`;
    const dismissedDate = localStorage.getItem(bannerKey);

    if (config.frequency === 'once_a_day' && dismissedDate === todayStr) {
      setIsOpen(false);
      return;
    }

    // 3. Timed Trigger Check
    let shouldShowByTime = false;
    if (config.timedTriggerEnabled) {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      let dateInRange = true;
      if (config.startDate && currentDateStr < config.startDate) dateInRange = false;
      if (config.endDate && currentDateStr > config.endDate) dateInRange = false;

      let timeInRange = true;
      if (config.startTime && currentTimeStr < config.startTime) timeInRange = false;
      if (config.endTime && currentTimeStr > config.endTime) timeInRange = false;

      shouldShowByTime = dateInRange && timeInRange;
    }

    // 4. Show on Login check
    let shouldShowOnLogin = false;
    if (config.showOnLogin) {
      const sessionKey = `popup_session_shown_${config.id || 'main'}_${currentUser?.uid || 'guest'}`;
      const shownInSession = sessionStorage.getItem(sessionKey);
      if (!shownInSession) {
        shouldShowOnLogin = true;
      }
    }

    // Determine final visibility
    if (shouldShowOnLogin || shouldShowByTime) {
      // Small timeout for smooth natural transition after login/render
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [config, currentUser, forcePreview]);

  const handleClose = () => {
    setIsOpen(false);
    if (forcePreview && onClosePreview) {
      onClosePreview();
      return;
    }

    if (config) {
      const todayStr = new Date().toISOString().split('T')[0];
      const bannerKey = `popup_dismissed_${config.id || 'main'}_${currentUser?.uid || 'guest'}`;
      const sessionKey = `popup_session_shown_${config.id || 'main'}_${currentUser?.uid || 'guest'}`;

      sessionStorage.setItem(sessionKey, 'true');

      if (dontShowToday || config.frequency === 'once_a_day') {
        localStorage.setItem(bannerKey, todayStr);
      }
    }
  };

  const handleActionClick = () => {
    if (!config) return;
    handleClose();

    if (config.actionUrl) {
      if (config.actionUrl.startsWith('tab:')) {
        const tabTarget = config.actionUrl.replace('tab:', '').trim();
        if (onNavigateTab) onNavigateTab(tabTarget);
      } else if (config.actionUrl.startsWith('http://') || config.actionUrl.startsWith('https://')) {
        window.open(config.actionUrl, '_blank', 'noopener,noreferrer');
      } else if (onNavigateTab && ['perangkat', 'jadwal', 'supervisi-administrasi', 'supervisi-mengajar', 'tindak-lanjut', 'laporan'].includes(config.actionUrl)) {
        onNavigateTab(config.actionUrl);
      }
    } else if (config.actionLabel && onNavigateTab) {
      // Default to jadwal if mentioned
      if (config.actionLabel.toLowerCase().includes('jadwal')) {
        onNavigateTab('jadwal');
      } else if (config.actionLabel.toLowerCase().includes('perangkat') || config.actionLabel.toLowerCase().includes('dokumen')) {
        onNavigateTab('perangkat');
      }
    }
  };

  if (!isOpen || !config) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200/80 flex flex-col transform transition-all duration-200 scale-100 max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon / Close button */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pengumuman Madrasah
            </span>
            {forcePreview && (
              <span className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                Mode Pratinjau
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup Pop-up"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-0">
          {/* Main Image Container */}
          <div className="relative bg-slate-100 max-h-[380px] overflow-hidden flex items-center justify-center border-b border-slate-100">
            <img 
              src={config.imageUrl} 
              alt={config.title || 'Pengumuman Madrasah'} 
              className="w-full h-auto object-contain max-h-[380px] mx-auto block"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>

          {/* Details & Caption */}
          <div className="p-5 space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {config.title}
              </h3>
              {config.caption && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {config.caption}
                </p>
              )}
            </div>

            {/* Timed Info Badge if scheduled */}
            {config.timedTriggerEnabled && (config.startDate || config.startTime) && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                {config.startDate && (
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Periode: {config.startDate} {config.endDate ? `s.d. ${config.endDate}` : ''}
                  </span>
                )}
                {config.startTime && (
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Jam Tayang: {config.startTime} {config.endTime ? `- ${config.endTime}` : ''} WITA
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
            <input 
              type="checkbox" 
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Jangan tampilkan lagi hari ini</span>
          </label>

          <div className="flex items-center gap-2 justify-end">
            {config.actionLabel && (
              <button
                type="button"
                onClick={handleActionClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <span>{config.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
