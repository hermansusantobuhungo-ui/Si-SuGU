import React, { useState, useRef, useMemo } from 'react';
import { 
  FolderGit2, 
  Upload, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download, 
  Eye,
  ExternalLink, 
  X, 
  Plus, 
  Filter, 
  Check, 
  MessageSquare,
  Trash2,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isItemForUser } from '../lib/userMatch';
import { 
  TeachingDocument, 
  DocumentCategory, 
  UserProfile 
} from '../types';
import { DEFAULT_DOCUMENT_CATEGORIES } from '../data/defaultData';
import { getFileLocally } from '../lib/fileStorage';
import { DocxViewer } from './DocxViewer';
import { ExcelViewer } from './ExcelViewer';

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch (err) {
    console.warn('Failed to parse data URL to blob:', err);
    return new Blob([], { type: 'application/octet-stream' });
  }
}

function getEmbeddableUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  if (url.includes('docs.google.com') && url.includes('/edit')) {
    return url.replace(/\/edit.*$/, '/preview');
  }
  return url;
}

interface DocumentsViewProps {
  documents: TeachingDocument[];
  categories: DocumentCategory[];
  teachers: UserProfile[];
  onUploadDocument: (doc: Omit<TeachingDocument, 'id' | 'uploadedAt'> & { fileBlob?: File; replaceDocId?: string }) => Promise<void>;
  onVerifyDocument: (docId: string, status: TeachingDocument['status'], feedback?: string) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onBatchDeleteDocuments?: (docIds: string[]) => Promise<void>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  categories = DEFAULT_DOCUMENT_CATEGORIES,
  teachers,
  onUploadDocument,
  onVerifyDocument,
  onDeleteDocument,
  onBatchDeleteDocuments
}) => {
  const { profile, role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState<TeachingDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<TeachingDocument | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Batch deletion states (for Admin)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [batchDeleteError, setBatchDeleteError] = useState<string | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<DocumentCategory>(categories[0] || 'RPP / Modul Ajar (KBC)');
  const [formTitle, setFormTitle] = useState('');
  const [formSemester, setFormSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [formTahun, setFormTahun] = useState('2026/2027');
  const [formKelas, setFormKelas] = useState('X (Fase E)');
  const [formMapel, setFormMapel] = useState(profile?.mataPelajaran || '');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formDriveLink, setFormDriveLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formGuruId, setFormGuruId] = useState(profile?.uid || '');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [replaceExistingDoc, setReplaceExistingDoc] = useState(false);
  const isSubmittingRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Verification modal state
  const [verifyStatus, setVerifyStatus] = useState<TeachingDocument['status']>('Diverifikasi');
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<TeachingDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFileType, setPreviewFileType] = useState<'docx' | 'excel' | 'pdf' | 'image' | 'web' | 'other' | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Deduplicate documents strictly by ID so multiple valid uploads in the same category are preserved
  const uniqueDocuments = useMemo(() => {
    const seenIds = new Set<string>();
    const result: TeachingDocument[] = [];

    for (const d of documents) {
      if (!d.id || seenIds.has(d.id)) continue;
      seenIds.add(d.id);
      result.push(d);
    }
    return result;
  }, [documents]);

  // Detect if an existing document matches the exact same title, category, class, and semester
  const existingSameDoc = useMemo(() => {
    if (!formTitle.trim()) return undefined;
    const targetGuruId = formGuruId || profile?.uid;

    return documents.find(d => {
      const sameGuru = d.guruId === targetGuruId || (targetGuruId === profile?.uid && isItemForUser(d, profile, user?.uid));
      if (!sameGuru) return false;
      const samePeriod = d.semester === formSemester && d.tahunPelajaran === formTahun;
      if (!samePeriod) return false;
      const sameKelas = d.kelas === formKelas;
      if (!sameKelas) return false;
      const sameCategory = d.category === formCategory;
      if (!sameCategory) return false;
      return d.title.trim().toLowerCase() === formTitle.trim().toLowerCase();
    });
  }, [documents, formGuruId, profile, user, formCategory, formTitle, formSemester, formTahun, formKelas]);

  // Filter documents: Guru only sees own documents unless admin/penilai/kamad
  const accessibleDocuments = role === 'guru'
    ? uniqueDocuments.filter(d => isItemForUser(d, profile, user?.uid))
    : uniqueDocuments;

  const filteredDocs = accessibleDocuments.filter(d => {
    const matchesSearch = 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.guruName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenUpload = () => {
    setFormTitle('');
    setFormCategory(categories[0] || 'RPP / Modul Ajar (KBC)');
    setFormFile(null);
    setFormDriveLink('');
    setFormNotes('');
    setFormGuruId(profile?.uid || '');
    setFormMapel(profile?.mataPelajaran || '');
    setFormError(null);
    setReplaceExistingDoc(false);
    setIsUploadModalOpen(true);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || uploadLoading) return;

    setFormError(null);

    if (!formFile && !formDriveLink.trim()) {
      setFormError('Harap pilih berkas dokumen (PDF/DOCX) atau cantumkan Tautan Google Drive/Cloud.');
      return;
    }

    isSubmittingRef.current = true;
    setUploadLoading(true);
    try {
      const selectedGuru = teachers.find(t => t.uid === formGuruId) || profile;
      
      const finalFileUrl = formDriveLink.trim();
      const finalFileName = formFile ? formFile.name : (formTitle + ' - Dokumen Drive');

      await onUploadDocument({
        guruId: selectedGuru?.uid || 'anon',
        guruName: selectedGuru?.displayName || 'Guru Pendidik',
        guruNip: selectedGuru?.nip || '',
        category: formCategory,
        title: formTitle.trim() || `${formCategory} - ${selectedGuru?.displayName}`,
        semester: formSemester,
        tahunPelajaran: formTahun,
        kelas: formKelas,
        mataPelajaran: formMapel || selectedGuru?.mataPelajaran || 'Umum',
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: formFile?.size,
        notes: formNotes,
        status: 'Diajukan',
        fileBlob: formFile || undefined,
        replaceDocId: replaceExistingDoc ? existingSameDoc?.id : undefined
      });

      setIsUploadModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah dokumen');
    } finally {
      isSubmittingRef.current = false;
      setUploadLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewFileType(null);
    setPreviewError(null);
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
  };

  const handleViewDocument = async (docItem: TeachingDocument) => {
    // Revoke previous blob if any
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    setPreviewDoc(docItem);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewFileType(null);
    setPreviewError(null);
    setPreviewLoading(true);

    const rawFileName = (docItem.fileName || docItem.title || '').trim();
    const lowerName = rawFileName.toLowerCase();
    const isDocx = lowerName.endsWith('.docx');
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv');
    const isPdf = lowerName.endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName) || (docItem.fileUrl?.startsWith('data:image') ?? false);
    const isOtherOffice = /\.(doc|pptx|ppt)$/i.test(lowerName);

    try {
      // 1. Check IndexedDB for local file blob (primary local storage)
      const localBlob = await getFileLocally(docItem.id);
      if (localBlob) {
        if (isExcel) {
          setPreviewBlob(localBlob);
          setPreviewFileType('excel');
          setPreviewLoading(false);
          return;
        }

        if (isDocx) {
          setPreviewBlob(localBlob);
          setPreviewFileType('docx');
          setPreviewLoading(false);
          return;
        }

        if (isPdf) {
          const pdfBlob = new Blob([localBlob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          activeBlobUrlRef.current = blobUrl;
          setPreviewUrl(blobUrl);
          setPreviewFileType('pdf');
          setPreviewLoading(false);
          return;
        }

        if (isImage) {
          const imgBlob = new Blob([localBlob], { type: localBlob.type || 'image/jpeg' });
          const blobUrl = URL.createObjectURL(imgBlob);
          activeBlobUrlRef.current = blobUrl;
          setPreviewUrl(blobUrl);
          setPreviewFileType('image');
          setPreviewLoading(false);
          return;
        }

        if (isOtherOffice) {
          // Do NOT load into iframe to avoid automatic browser download
          setPreviewBlob(localBlob);
          setPreviewFileType('other');
          setPreviewLoading(false);
          return;
        }

        // Generic blob: check MIME type for spreadsheet or pdf
        const mime = (localBlob.type || '').toLowerCase();
        if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) {
          setPreviewBlob(localBlob);
          setPreviewFileType('excel');
          setPreviewLoading(false);
          return;
        }

        if (mime.includes('pdf')) {
          const pdfBlob = new Blob([localBlob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          activeBlobUrlRef.current = blobUrl;
          setPreviewUrl(blobUrl);
          setPreviewFileType('pdf');
          setPreviewLoading(false);
          return;
        }

        // Fallback for non-renderable local files: display clean document info card
        setPreviewBlob(localBlob);
        setPreviewFileType('other');
        setPreviewLoading(false);
        return;
      }

      // 2. Base64 data URL
      if (docItem.fileUrl && docItem.fileUrl.startsWith('data:')) {
        const parsedBlob = dataUrlToBlob(docItem.fileUrl);
        if (isExcel) {
          setPreviewBlob(parsedBlob);
          setPreviewFileType('excel');
          setPreviewLoading(false);
          return;
        }

        if (isDocx) {
          setPreviewBlob(parsedBlob);
          setPreviewFileType('docx');
          setPreviewLoading(false);
          return;
        }

        if (isPdf) {
          setPreviewUrl(docItem.fileUrl);
          setPreviewFileType('pdf');
          setPreviewLoading(false);
          return;
        }

        if (isImage) {
          setPreviewUrl(docItem.fileUrl);
          setPreviewFileType('image');
          setPreviewLoading(false);
          return;
        }

        setPreviewBlob(parsedBlob);
        setPreviewFileType('other');
        setPreviewLoading(false);
        return;
      }

      // 3. External HTTP/HTTPS URL (Google Drive / Firebase Storage / Web)
      if (docItem.fileUrl && (docItem.fileUrl.startsWith('http://') || docItem.fileUrl.startsWith('https://'))) {
        // If Google Drive or Google Docs link
        if (docItem.fileUrl.includes('drive.google.com') || docItem.fileUrl.includes('docs.google.com')) {
          setPreviewUrl(getEmbeddableUrl(docItem.fileUrl));
          setPreviewFileType('web');
          setPreviewLoading(false);
          return;
        }

        // If Excel on HTTP/HTTPS, fetch blob so ExcelViewer can render it
        if (isExcel) {
          try {
            const res = await fetch(docItem.fileUrl);
            if (res.ok) {
              const fetchedBlob = await res.blob();
              setPreviewBlob(fetchedBlob);
              setPreviewFileType('excel');
              setPreviewLoading(false);
              return;
            }
          } catch {
            // CORS or fetch blocked, fallback to Google Docs viewer embed
          }
          setPreviewUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(docItem.fileUrl)}&embedded=true`);
          setPreviewFileType('web');
          setPreviewLoading(false);
          return;
        }

        // If docx on HTTP/HTTPS, fetch blob so docx-preview can render it
        if (isDocx) {
          try {
            const res = await fetch(docItem.fileUrl);
            if (res.ok) {
              const fetchedBlob = await res.blob();
              setPreviewBlob(fetchedBlob);
              setPreviewFileType('docx');
              setPreviewLoading(false);
              return;
            }
          } catch {
            // CORS or fetch blocked, fallback to Google Docs viewer embed
          }
          setPreviewUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(docItem.fileUrl)}&embedded=true`);
          setPreviewFileType('web');
          setPreviewLoading(false);
          return;
        }

        if (isPdf) {
          setPreviewUrl(docItem.fileUrl);
          setPreviewFileType('pdf');
          setPreviewLoading(false);
          return;
        }

        if (isImage) {
          setPreviewUrl(docItem.fileUrl);
          setPreviewFileType('image');
          setPreviewLoading(false);
          return;
        }

        // For other documents online, use Google Docs viewer
        setPreviewUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(docItem.fileUrl)}&embedded=true`);
        setPreviewFileType('web');
        setPreviewLoading(false);
        return;
      }

      setPreviewError('Berkas pratinjau belum dapat dibuka langsung. Anda dapat mencoba tombol Unduh di bawah untuk mengunduh dokumen.');
    } catch (e) {
      console.warn('Error reading file for preview:', e);
      setPreviewError('Terjadi kesalahan saat membuka pratinjau berkas.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadDocument = async (docItem: TeachingDocument) => {
    const defaultName = docItem.fileName || `${docItem.title.replace(/\s+/g, '_')}.pdf`;

    // 1. Check IndexedDB for local file blob
    try {
      const localBlob = await getFileLocally(docItem.id);
      if (localBlob) {
        const blobUrl = URL.createObjectURL(localBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (e) {
      console.warn('Error downloading from local storage:', e);
    }

    // 2. If Base64 data URL
    if (docItem.fileUrl && docItem.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = docItem.fileUrl;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 3. If external HTTP/HTTPS URL
    if (docItem.fileUrl && (docItem.fileUrl.startsWith('http://') || docItem.fileUrl.startsWith('https://'))) {
      try {
        const res = await fetch(docItem.fileUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = defaultName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      } catch {
        // Fallback for CORS: trigger download via link or new tab
      }

      const a = document.createElement('a');
      a.href = docItem.fileUrl;
      a.download = defaultName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    alert('Berkas fisik dokumen ini tidak ditemukan atau belum diunggah.');
  };

  const handleOpenVerify = (docItem: TeachingDocument) => {
    setVerifyingDoc(docItem);
    setVerifyStatus(docItem.status === 'Draft' || docItem.status === 'Diajukan' ? 'Diverifikasi' : docItem.status);
    setVerifyFeedback(docItem.feedback || '');
  };

  const handleSubmitVerification = async () => {
    if (!verifyingDoc) return;
    setVerifyLoading(true);
    try {
      await onVerifyDocument(verifyingDoc.id, verifyStatus, verifyFeedback);
      setVerifyingDoc(null);
    } catch (err: unknown) {
      alert('Gagal memverifikasi dokumen: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-700" />
            Perangkat Pembelajaran Guru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen dokumen administrasi mengajar: Kalender, RPP/Modul Ajar KBC, ATP, KKTP, Materi & Instrumen Asesmen MAN 2 Gorontalo
          </p>
        </div>

        <button
          type="button"
          id="btn-upload-perangkat"
          onClick={handleOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4 text-amber-300" />
          Unggah Perangkat Ajar
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-docs-input"
            type="text"
            placeholder="Cari judul, kategori, guru, mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px]"
          >
            <option value="all">Semua Kategori Dokumen</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Diajukan">Diajukan</option>
            <option value="Diverifikasi">Diverifikasi</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar (for Admin) */}
      {role === 'admin' && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-select-all-docs"
              onClick={() => {
                if (selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0) {
                  setSelectedDocIds([]);
                } else {
                  setSelectedDocIds(filteredDocs.map(d => d.id));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition"
            >
              {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua Dokumen'}
              </span>
            </button>

            {selectedDocIds.length > 0 && (
              <span className="font-semibold text-slate-700 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px]">
                {selectedDocIds.length} berkas dipilih
              </span>
            )}
          </div>

          {selectedDocIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-batch-delete-docs"
                onClick={() => {
                  setBatchDeleteError(null);
                  setIsBatchDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Sekaligus ({selectedDocIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocIds([])}
                className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const isVerified = doc.status === 'Diverifikasi';
          const isNeedsFix = doc.status === 'Perlu Perbaikan';
          const isSelected = selectedDocIds.includes(doc.id);

          return (
            <div 
              key={doc.id}
              className={`bg-white rounded-xl border transition flex flex-col justify-between p-4 relative ${
                isSelected 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20' 
                  : 'border-slate-200/90 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                {/* Header item: Category & Status + Checkbox for Admin */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocIds(prev => 
                            prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                          );
                        }}
                        className="text-slate-400 hover:text-emerald-700 focus:outline-hidden"
                        title={isSelected ? 'Batalkan pilihan' : 'Pilih dokumen'}
                        aria-label="Pilih dokumen"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 line-clamp-1">
                      {doc.category}
                    </span>
                  </div>
                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Terverifikasi
                      </span>
                    ) : isNeedsFix ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Perlu Perbaikan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Diajukan
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-slate-800 text-sm line-clamp-2">
                  {doc.title}
                </h4>

                {/* Teacher & Class Info */}
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">
                    Oleh: {doc.guruName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {doc.mataPelajaran} • {doc.kelas} • TP {doc.tahunPelajaran} ({doc.semester})
                  </p>
                  {doc.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                      "{doc.notes}"
                    </p>
                  )}
                  {doc.feedback && (
                    <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 mt-2">
                      <span className="font-bold">Catatan Penilai: </span>
                      {doc.feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Tombol Lihat Berkas Dokumen */}
                  <button
                    type="button"
                    onClick={() => handleViewDocument(doc)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    title="Lihat Dokumen"
                    aria-label="Lihat Dokumen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Tombol Unduh Berkas Dokumen */}
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    title="Unduh Dokumen"
                    aria-label="Unduh Dokumen"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Verification Button for Penilai, Kamad, Admin */}
                  {(role === 'penilai' || role === 'kamad' || role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => handleOpenVerify(doc)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition flex items-center gap-1"
                      title="Periksa dan Beri Catatan"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Periksa
                    </button>
                  )}

                  {(role === 'admin' || (role === 'guru' && isItemForUser(doc, profile, user?.uid))) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeletingDoc(doc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full bg-white rounded-xl p-10 border border-slate-200 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm text-slate-700">Tidak ada berkas perangkat pembelajaran</p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol "Unggah Perangkat Ajar" di atas untuk menambahkan dokumen baru.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                Unggah Dokumen Perangkat Pembelajaran
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
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

            <form onSubmit={handleSubmitUpload} className="mt-4 space-y-3.5 text-xs">
              
              {/* Select Guru (For Admin or Penilai, Guru defaults to self) */}
              {(role === 'admin' || role === 'penilai') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guru Pemilik Dokumen *
                  </label>
                  <select
                    value={formGuruId}
                    onChange={(e) => {
                      setFormGuruId(e.target.value);
                      const g = teachers.find(t => t.uid === e.target.value);
                      if (g?.mataPelajaran) setFormMapel(g.mataPelajaran);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {teachers.map(t => (
                      <option key={t.uid} value={t.uid}>{t.displayName} ({t.mataPelajaran || t.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Perangkat Pembelajaran *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Dokumen / Nama Berkas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar Biologi Fase F - Ekosistem & Keanekaragaman Hayati"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {existingSameDoc && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        Dokumen dengan judul dan kategori serupa ditemukan: "{existingSameDoc.title}" ({existingSameDoc.category})
                      </p>
                      <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                        Secara standar, unggahan ini akan disimpan sebagai dokumen baru terpisah (misal: Kalender Pendidikan dan Kalender Madrasah).
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1.5 border-t border-amber-200/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={replaceExistingDoc}
                      onChange={(e) => setReplaceExistingDoc(e.target.checked)}
                      className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800 text-xs">
                      Ganti / timpa berkas dokumen lama di atas (Replace)
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Biologi"
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas / Fase
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: X IPA 1 / Fase E"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Upload file directly or Drive link */}
              <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40">
                <label className="block font-semibold text-slate-800 mb-1">
                  Pilih Berkas Dokumen (PDF, Word, Excel)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800"
                />

                <div className="mt-3">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Atau Cantumkan Tautan Google Drive / Cloud:
                  </span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={formDriveLink}
                    onChange={(e) => setFormDriveLink(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Catatan: Berkas lokal disimpan secara instan. Untuk berkas berukuran besar (Modul P5RA/buku ajar), Anda juga dapat menyematkan tautan Google Drive.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai pertemuan ke-berapa atau target ketercapaian..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition"
                >
                  {uploadLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan Dokumen...</span>
                    </>
                  ) : (
                    'Simpan & Ajukan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify & Feedback Modal */}
      {verifyingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                Verifikasi Dokumen Pendidik
              </h3>
              <button
                onClick={() => setVerifyingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <p className="font-semibold text-slate-800">{verifyingDoc.title}</p>
              <p className="text-slate-500 mt-0.5">
                Guru: {verifyingDoc.guruName} • Kategori: {verifyingDoc.category}
              </p>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Verifikasi
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as TeachingDocument['status'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Diverifikasi">Diverifikasi (Lengkap & Sesuai)</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan (Ada yang kurang)</option>
                  <option value="Diajukan">Diajukan (Belum Selesai Periksa)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Umpan Balik / Rekomendasi Perbaikan
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: KKTP sudah sangat baik. Mohon tambahkan rubrik asesmen unjuk kerja pada modul ajar pertemuan kedua..."
                  value={verifyFeedback}
                  onChange={(e) => setVerifyFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyingDoc(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={verifyLoading}
                  onClick={handleSubmitVerification}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold disabled:opacity-50"
                >
                  {verifyLoading ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Dokumen (Lihat Berkas) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header Pratinjau */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300/60">
                    {previewDoc.category}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {previewDoc.guruName} • {previewDoc.mapel}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={previewDoc.title}>
                  {previewDoc.title}
                </h3>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  title="Unduh Dokumen Ini"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Unduh Berkas</span>
                </button>

                {previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('http://') || previewDoc.fileUrl.startsWith('https://')) && (
                  <button
                    type="button"
                    onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                    title="Buka di Tab Terpisah"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Tab Baru</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden">
              {previewLoading && (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <span className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-medium">Memuat berkas dokumen...</p>
                </div>
              )}

              {!previewLoading && previewError && (
                <div className="max-w-md w-full p-6 text-center bg-white rounded-xl border border-slate-200 shadow-sm mx-4">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2.5" />
                  <p className="font-semibold text-sm text-slate-800 mb-1">Pratinjau Langsung Tidak Tersedia</p>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">{previewError}</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(previewDoc)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs"
                    >
                      <Download className="w-4 h-4 text-amber-300" />
                      Unduh Berkas Sekarang
                    </button>
                    {previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('http://') || previewDoc.fileUrl.startsWith('https://')) && (
                      <button
                        type="button"
                        onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buka Tautan Eksternal
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!previewLoading && !previewError && previewFileType === 'docx' && previewBlob && (
                <DocxViewer blob={previewBlob} fileName={previewDoc.fileName} />
              )}

              {!previewLoading && !previewError && previewFileType === 'excel' && previewBlob && (
                <ExcelViewer 
                  blob={previewBlob} 
                  fileName={previewDoc.fileName} 
                  onDownload={() => handleDownloadDocument(previewDoc)}
                />
              )}

              {!previewLoading && !previewError && previewFileType === 'image' && previewUrl && (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-slate-900/5">
                  <img 
                    src={previewUrl} 
                    alt={previewDoc.title} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>
              )}

              {!previewLoading && !previewError && previewFileType === 'pdf' && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  title={previewDoc.title}
                />
              )}

              {!previewLoading && !previewError && previewFileType === 'web' && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  title={previewDoc.title}
                  allow="autoplay"
                />
              )}

              {!previewLoading && !previewError && previewFileType === 'other' && (
                <div className="max-w-md w-full p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-md mx-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-slate-800 mb-1">{previewDoc.title}</h4>
                  <p className="text-xs text-slate-500 font-mono mb-4 break-all">
                    {previewDoc.fileName || 'Berkas Dokumen'}
                  </p>
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs text-left mb-5 leading-relaxed">
                    <strong>Informasi Format Berkas:</strong> Berkas ini menggunakan format presentasi atau arsip khusus (seperti PowerPoint .pptx, ZIP, dll). Untuk mempertahankan tata letak animasi dan isi, Anda dapat mengunduh berkas fisik ini ke perangkat Anda.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(previewDoc)}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition active:scale-98"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    Unduh Berkas Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span className="truncate">
                Nama Berkas: <strong className="text-slate-700">{previewDoc.fileName || 'dokumen.pdf'}</strong>
              </span>
              <span>
                TP: {previewDoc.tahunPelajaran} • Semester {previewDoc.semester} • Kelas {previewDoc.kelas}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dokumen (Iframe-Safe) */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus Dokumen Perangkat Ajar</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus berkas secara permanen</p>
              </div>
            </div>

            <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 text-sm">{deletingDoc.title}</div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>Kategori: {deletingDoc.category}</span>
                <span>•</span>
                <span>Oleh: {deletingDoc.guruName}</span>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeletingDoc(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError(null);
                  try {
                    await onDeleteDocument(deletingDoc.id);
                    setDeletingDoc(null);
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus dokumen.');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Dokumen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dokumen Sekaligus (Batch Delete) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus {selectedDocIds.length} Dokumen Sekaligus</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus semua berkas terpilih secara permanen.</p>
              </div>
            </div>

            <div className="mb-4 bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 text-xs text-rose-800">
              Apakah Anda yakin ingin menghapus <strong>{selectedDocIds.length}</strong> perangkat pembelajaran yang telah dipilih? Tindakan ini tidak dapat dibatalkan.
            </div>

            {batchDeleteError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {batchDeleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={batchDeleteLoading}
                onClick={() => {
                  setIsBatchDeleteModalOpen(false);
                  setBatchDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-batch-delete"
                disabled={batchDeleteLoading}
                onClick={async () => {
                  setBatchDeleteLoading(true);
                  setBatchDeleteError(null);
                  try {
                    if (onBatchDeleteDocuments) {
                      await onBatchDeleteDocuments(selectedDocIds);
                    } else {
                      for (const id of selectedDocIds) {
                        await onDeleteDocument(id);
                      }
                    }
                    setSelectedDocIds([]);
                    setIsBatchDeleteModalOpen(false);
                  } catch (err) {
                    setBatchDeleteError(err instanceof Error ? err.message : 'Gagal menghapus beberapa dokumen.');
                  } finally {
                    setBatchDeleteLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {batchDeleteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Menghapus {selectedDocIds.length} berkas...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Semua ({selectedDocIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
