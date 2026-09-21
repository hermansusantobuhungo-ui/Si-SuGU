import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { FileText, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DocxViewerProps {
  blob: Blob;
  fileName?: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ blob, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current || !blob) return;

    setLoading(true);
    setError(null);
    containerRef.current.innerHTML = '';

    renderAsync(blob, containerRef.current, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      breakPages: true
    })
      .then(() => {
        if (isMounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Docx rendering error:', err);
        if (isMounted) {
          setError(
            'Dokumen Word ini menggunakan format khusus yang tidak dapat dirender secara langsung. Anda dapat mengunduhnya untuk dibuka melalui Microsoft Word atau Google Docs.'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [blob]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden relative">
      {/* Zoom / Control Bar for Docx */}
      {!loading && !error && (
        <div className="py-1.5 px-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700 truncate max-w-xs">
              Pratinjau Word: {fileName || 'Dokumen.docx'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 10, 60))}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
              title="Perkecil (-10%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold w-10 text-center select-none text-slate-700">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 10, 160))}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
              title="Perbesar (+10%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 100 && (
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition ml-1"
                title="Reset Ukuran (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-20">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-800">
            Sedang Membaca & Membuka Dokumen Word...
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {fileName || 'Dokumen Word (.docx)'}
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="m-auto max-w-md p-6 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2.5" />
          <h4 className="font-bold text-sm text-slate-800 mb-1">Pratinjau Word Terbatas</h4>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Rendered Container */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 docx-container-viewer flex justify-center items-start">
        <div 
          ref={containerRef} 
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-full flex justify-center transition-transform duration-150"
        />
      </div>
    </div>
  );
};
