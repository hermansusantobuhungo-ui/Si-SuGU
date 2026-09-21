import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const OnlineStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      id="navbar-network-status"
      title={isOnline ? 'Terhubung Online ke Server / Cloud' : 'Mode Offline: Menggunakan Cache Lokal'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-300 ${
        isOnline 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs' 
          : 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {isOnline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        )}
      </span>
      {isOnline ? (
        <span className="hidden sm:inline">Online</span>
      ) : (
        <span className="inline font-bold">Offline</span>
      )}
    </div>
  );
};
