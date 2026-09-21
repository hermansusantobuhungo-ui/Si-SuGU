import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Table, AlertCircle, ChevronRight, Download, Search } from 'lucide-react';

interface ExcelViewerProps {
  blob: Blob;
  fileName?: string;
  onDownload?: () => void;
}

interface SheetInfo {
  name: string;
  data: (string | number | boolean | null)[][];
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ blob, fileName, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!blob) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas Excel tidak memiliki lembar kerja (worksheet).');
        }

        const loadedSheets: SheetInfo[] = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Convert to 2D array of raw values with empty cell support
          const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });

          return {
            name: sheetName,
            data: rawRows
          };
        });

        if (isMounted) {
          setSheets(loadedSheets);
          setActiveSheetIndex(0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        if (isMounted) {
          setError(
            'Berkas Excel ini memiliki enkripsi atau format khusus yang belum dapat diproses oleh penampil spreadsheet. Silakan gunakan tombol Unduh untuk membuka dengan Microsoft Excel atau WPS Office.'
          );
          setLoading(false);
        }
      }
    };

    reader.onerror = () => {
      if (isMounted) {
        setError('Gagal membaca data berkas Excel dari penyimpanan.');
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(blob);

    return () => {
      isMounted = false;
    };
  }, [blob]);

  const currentSheet = sheets[activeSheetIndex];
  const allRows = currentSheet ? currentSheet.data : [];

  // Filter rows if user typed a search keyword
  const filteredRows = React.useMemo(() => {
    if (!filterTerm.trim()) return allRows;
    const term = filterTerm.toLowerCase();
    return allRows.filter((row, idx) => {
      if (idx === 0) return true; // keep header row
      return row.some((cell) => String(cell ?? '').toLowerCase().includes(term));
    });
  }, [allRows, filterTerm]);

  // Determine header and body rows
  const headerRow = filteredRows.length > 0 ? filteredRows[0] : [];
  const bodyRows = filteredRows.length > 1 ? filteredRows.slice(1) : [];

  // Compute maximum columns across rows to create a balanced grid
  const maxCols = Math.max(headerRow.length, ...bodyRows.map((r) => r.length), 1);
  const colHeaders = Array.from({ length: maxCols }, (_, i) => {
    // Generate spreadsheet column letters A, B, C... AA, AB...
    let col = '';
    let temp = i;
    while (temp >= 0) {
      col = String.fromCharCode((temp % 26) + 65) + col;
      temp = Math.floor(temp / 26) - 1;
    }
    return col;
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden relative font-sans">
      {/* Top Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 truncate block max-w-xs">
              {fileName || 'Pratinjau Spreadsheet'}
            </span>
            <span className="text-[10px] text-slate-500">
              {sheets.length} Lembar Kerja ({sheets.map((s) => s.name).join(', ')})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter cell values */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari baris/isi sel..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40 sm:w-48"
            />
          </div>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
              title="Unduh Berkas Excel Asli"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Unduh XLS/XLSX</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-800">Membaca & Memproses Data Excel...</p>
          <p className="text-[11px] text-slate-500 mt-1">{fileName || 'Spreadsheet (.xlsx / .xls)'}</p>
        </div>
      )}

      {/* Error Fallback */}
      {!loading && error && (
        <div className="m-auto max-w-md p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2.5" />
          <h4 className="font-bold text-sm text-slate-800 mb-1">Pratinjau Spreadsheet Terbatas</h4>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">{error}</p>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Unduh Berkas Sekarang
            </button>
          )}
        </div>
      )}

      {/* Table Viewer */}
      {!loading && !error && currentSheet && (
        <div className="flex-1 overflow-auto bg-slate-200/50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto max-w-full">
            {allRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Lembar kerja &quot;{currentSheet.name}&quot; kosong atau tidak memiliki data baris.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs select-text">
                {/* Spreadsheet Top Alphabet Headers (A, B, C, ...) */}
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 font-mono">
                    <th className="w-12 px-2 py-1.5 text-center bg-slate-200/80 border-r border-slate-200 font-bold">
                      #
                    </th>
                    {colHeaders.map((colLetter, cIdx) => (
                      <th
                        key={cIdx}
                        className="px-3 py-1.5 text-center border-r border-slate-200 min-w-[100px] max-w-[280px]"
                      >
                        {colLetter}
                      </th>
                    ))}
                  </tr>

                  {/* First row as prominent header if present */}
                  {headerRow.length > 0 && (
                    <tr className="bg-emerald-50/60 border-b-2 border-emerald-200 font-bold text-slate-800 text-[11px]">
                      <td className="w-12 px-2 py-2 text-center bg-slate-100 border-r border-slate-200 text-slate-500 font-mono text-[10px]">
                        1
                      </td>
                      {colHeaders.map((_, cIdx) => {
                        const val = headerRow[cIdx];
                        return (
                          <td
                            key={cIdx}
                            className="px-3 py-2 border-r border-slate-200 align-top break-words"
                          >
                            {val !== undefined && val !== null ? String(val) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-100/60'}
                    >
                      {/* Row number index */}
                      <td className="w-12 px-2 py-1.5 text-center bg-slate-100/80 border-r border-slate-200 font-mono text-[10px] text-slate-500 font-medium select-none">
                        {rIdx + 2}
                      </td>

                      {/* Row cells */}
                      {colHeaders.map((_, cIdx) => {
                        const cellVal = row[cIdx];
                        const displayVal = cellVal !== undefined && cellVal !== null ? String(cellVal) : '';
                        const isNumber = !isNaN(Number(cellVal)) && cellVal !== '' && cellVal !== null;

                        return (
                          <td
                            key={cIdx}
                            className={`px-3 py-1.5 border-r border-slate-100/80 align-top text-slate-700 break-words ${
                              isNumber ? 'text-right font-mono' : 'text-left'
                            }`}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Sheet Tabs Bar (Excel-Style bottom tabs) */}
      {!loading && !error && sheets.length > 0 && (
        <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Lembar:
          </span>
          {sheets.map((sheet, index) => {
            const isActive = index === activeSheetIndex;
            return (
              <button
                key={sheet.name + index}
                type="button"
                onClick={() => setActiveSheetIndex(index)}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>{sheet.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sheet.data.length} baris
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
