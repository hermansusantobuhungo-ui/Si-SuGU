import React, { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './lib/firebase';
import { saveFileLocally, deleteFileLocally, fileToDataUrl } from './lib/fileStorage';
import { optimizeImageForBanner } from './lib/imageCompression';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TeachersView } from './components/TeachersView';
import { DocumentsView } from './components/DocumentsView';
import { SchedulesView } from './components/SchedulesView';
import { AdminSupervisionView } from './components/AdminSupervisionView';
import { TeachingSupervisionView } from './components/TeachingSupervisionView';
import { FollowUpView } from './components/FollowUpView';
import { ReportsView } from './components/ReportsView';
import { FormatSettingsView } from './components/FormatSettingsView';
import { SettingsView } from './components/SettingsView';
import { PopupBannerSettingsView } from './components/PopupBannerSettingsView';
import { PopupBannerModal } from './components/PopupBannerModal';
import { AuditLogsView } from './components/AuditLogsView';
import { UserProfileModal } from './components/UserProfileModal';
import { logAuditEvent } from './lib/auditLogger';
import { 
  UserProfile, 
  TeachingDocument, 
  SupervisionSchedule, 
  AdminSupervisionAssessment, 
  TeachingSupervisionAssessment, 
  FollowUpPlan, 
  AppSetting, 
  AdminIndicator, 
  TeachingIndicator, 
  DocumentCategory,
  PopupBannerConfig,
  AuditLog
} from './types';
import { 
  DEFAULT_DOCUMENT_CATEGORIES, 
  DEFAULT_ADMIN_INDICATORS, 
  DEFAULT_TEACHING_INDICATORS, 
  DEFAULT_MADRASAH_SETTING,
  DEFAULT_POPUP_BANNER
} from './data/defaultData';
import { exportAdminSupervisionPdf, exportTeachingSupervisionPdf } from './lib/pdfExport';

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataLoading, setDataLoading] = useState(true);

  // Firestore States
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [documents, setDocuments] = useState<TeachingDocument[]>(() => {
    try {
      const cached = localStorage.getItem('cached_teaching_documents');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return [];
  });
  const [schedules, setSchedules] = useState<SupervisionSchedule[]>([]);
  const [adminAssessments, setAdminAssessments] = useState<AdminSupervisionAssessment[]>([]);
  const [teachingAssessments, setTeachingAssessments] = useState<TeachingSupervisionAssessment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSetting>(() => {
    try {
      const cached = localStorage.getItem('cached_madrasah_settings');
      if (cached) return { ...DEFAULT_MADRASAH_SETTING, ...JSON.parse(cached) };
    } catch {}
    return DEFAULT_MADRASAH_SETTING;
  });
  const [adminIndicators, setAdminIndicators] = useState<AdminIndicator[]>(() => {
    try {
      const cached = localStorage.getItem('cached_admin_indicators');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_ADMIN_INDICATORS;
  });
  const [teachingIndicators, setTeachingIndicators] = useState<TeachingIndicator[]>(() => {
    try {
      const cached = localStorage.getItem('cached_teaching_indicators');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_TEACHING_INDICATORS;
  });
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>(() => {
    try {
      const cached = localStorage.getItem('cached_document_categories');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_DOCUMENT_CATEGORIES;
  });
  const [popupBanner, setPopupBanner] = useState<PopupBannerConfig | null>(() => {
    try {
      const cached = localStorage.getItem('cached_popup_banner');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_POPUP_BANNER;
  });
  const [previewBanner, setPreviewBanner] = useState<PopupBannerConfig | null>(null);

  // User Profile Modal state
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Upload concurrency locks to prevent double-submissions
  const isUploadingDocRef = useRef(false);
  const lastUploadSignatureRef = useRef<{ sig: string; timestamp: number } | null>(null);

  // Dynamic branding synchronization across the whole application
  useEffect(() => {
    const brandColor = settings.primaryColor || '#047857';
    document.documentElement.style.setProperty('--brand-primary', brandColor);

    const appName = settings.appName || 'Si-SuGu';
    const madrasah = settings.madrasahName || 'MAN 2 Kabupaten Gorontalo';
    document.title = `${appName} - ${madrasah}`;

    let styleTag = document.getElementById('dynamic-branding-style') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-branding-style';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      :root {
        --color-brand-primary: ${brandColor};
      }
      .brand-color-text {
        color: ${brandColor} !important;
      }
      .brand-color-bg {
        background-color: ${brandColor} !important;
      }
      .brand-color-border {
        border-color: ${brandColor} !important;
      }
    `;
  }, [settings.primaryColor, settings.appName, settings.madrasahName]);

  // Public/Persistent settings listener (so login page and branding sync immediately)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'madrasahConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppSetting;
        setSettings(prev => ({ ...prev, ...data }));
        try {
          localStorage.setItem('cached_madrasah_settings', JSON.stringify(data));
        } catch {}
      }
    }, (err) => {
      console.warn('Notice: settings listener fallback to cache or default:', err);
    });

    return () => unsub();
  }, []);

  // Initial Data Fetching from Firestore
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    // 1. Fetch Teachers / Users
    const unsubTeachers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as UserProfile));
      if (list.length > 0) setTeachers(list);
    }, (err) => {
      console.warn('Gagal subscribe data users:', err);
    });

    // 2. Fetch Documents with safe and non-destructive parsing
    const unsubDocs = onSnapshot(collection(db, 'teachingDocuments'), (snap) => {
      try {
        const list: TeachingDocument[] = [];
        const seenIds = new Set<string>();

        snap.forEach(docSnap => {
          const item = { ...docSnap.data(), id: docSnap.id } as TeachingDocument;
          if (item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            list.push(item);
          }
        });

        // Sort newest first
        list.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

        setDocuments(list);
        try {
          localStorage.setItem('cached_teaching_documents', JSON.stringify(list));
        } catch {
          // Ignore storage quota error
        }
      } catch (err) {
        console.error('Error in onSnapshot teachingDocuments:', err);
      }
    }, (err) => console.warn('Docs err:', err));

    // 3. Fetch Schedules
    const unsubSchedules = onSnapshot(collection(db, 'supervisionSchedules'), (snap) => {
      const list: SupervisionSchedule[] = [];
      snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id } as SupervisionSchedule));
      setSchedules(list);
    }, (err) => console.warn('Schedules err:', err));

    // 4. Fetch Admin Assessments
    const unsubAdminAssess = onSnapshot(collection(db, 'adminAssessments'), (snap) => {
      const list: AdminSupervisionAssessment[] = [];
      snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id } as AdminSupervisionAssessment));
      setAdminAssessments(list);
    }, (err) => console.warn('AdminAssess err:', err));

    // 5. Fetch Teaching Assessments
    const unsubTeachAssess = onSnapshot(collection(db, 'teachingAssessments'), (snap) => {
      const list: TeachingSupervisionAssessment[] = [];
      snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id } as TeachingSupervisionAssessment));
      setTeachingAssessments(list);
    }, (err) => console.warn('TeachAssess err:', err));

    // 6. Fetch Follow Ups
    const unsubFollowUps = onSnapshot(collection(db, 'followUpPlans'), (snap) => {
      const list: FollowUpPlan[] = [];
      snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id } as FollowUpPlan));
      setFollowUps(list);
    }, (err) => console.warn('FollowUps err:', err));

    // 7. Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'madrasahConfig'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSetting);
      }
    }, (err) => console.warn('Settings err:', err));

    // 8. Fetch Admin Indicators
    const unsubAdminInd = onSnapshot(doc(db, 'settings', 'adminIndicators'), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list) && snap.data().list.length > 0) {
        setAdminIndicators(snap.data().list as AdminIndicator[]);
        try {
          localStorage.setItem('cached_admin_indicators', JSON.stringify(snap.data().list));
        } catch {}
      }
    }, (err) => console.warn('AdminInd err:', err));

    // 9. Fetch Teaching Indicators
    const unsubTeachInd = onSnapshot(doc(db, 'settings', 'teachingIndicators'), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list) && snap.data().list.length > 0) {
        setTeachingIndicators(snap.data().list as TeachingIndicator[]);
        try {
          localStorage.setItem('cached_teaching_indicators', JSON.stringify(snap.data().list));
        } catch {}
      }
    }, (err) => console.warn('TeachInd err:', err));

    // 10. Fetch Document Categories
    const unsubCategories = onSnapshot(doc(db, 'settings', 'documentCategories'), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list) && snap.data().list.length > 0) {
        setDocumentCategories(snap.data().list as DocumentCategory[]);
        try {
          localStorage.setItem('cached_document_categories', JSON.stringify(snap.data().list));
        } catch {}
      }
    }, (err) => console.warn('Categories err:', err));

    // 11. Fetch Popup Banner Configuration
    const unsubPopup = onSnapshot(doc(db, 'settings', 'popupBanner'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PopupBannerConfig;
        setPopupBanner(data);
        try {
          localStorage.setItem('cached_popup_banner', JSON.stringify(data));
        } catch {}
      }
    }, (err) => console.warn('PopupBanner err:', err));

    // 12. Fetch Audit Logs
    const unsubAudit = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      const list: AuditLog[] = [];
      snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id } as AuditLog));
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setAuditLogs(list);
    }, (err) => console.warn('AuditLogs err:', err));

    setDataLoading(false);

    return () => {
      unsubTeachers();
      unsubDocs();
      unsubSchedules();
      unsubAdminAssess();
      unsubTeachAssess();
      unsubFollowUps();
      unsubSettings();
      unsubAdminInd();
      unsubTeachInd();
      unsubCategories();
      unsubPopup();
      unsubAudit();
    };
  }, [user]);

  // Seeder disabled for clean production
  const seedInitialData = async () => {};

  // Operations Handlers
  const handleAddTeacher = async (teacherData: Partial<UserProfile> & { password?: string }) => {
    const id = 'user-' + Date.now();
    const newProf: UserProfile = {
      uid: id,
      email: teacherData.email || '',
      displayName: teacherData.displayName || '',
      role: teacherData.role || 'guru',
      nip: teacherData.nip || '',
      pangkatGolongan: teacherData.pangkatGolongan || '',
      mataPelajaran: teacherData.mataPelajaran || '',
      phone: teacherData.phone || '',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    await setDoc(doc(db, 'users', id), newProf);
    setTeachers(prev => [newProf, ...prev]);

    // Record audit event
    await logAuditEvent({
      action: 'user_created',
      title: `Pengguna Baru Didaftarkan: ${newProf.displayName}`,
      description: `Menambahkan akun pengguna baru dengan peran ${newProf.role} (${newProf.email})`,
      actor: profile,
      targetId: id,
      targetName: newProf.displayName,
      details: { role: newProf.role, email: newProf.email, mataPelajaran: newProf.mataPelajaran }
    });
  };

  const handleUpdateTeacher = async (uid: string, data: Partial<UserProfile>) => {
    await updateDoc(doc(db, 'users', uid), data);
    setTeachers(prev => prev.map(t => t.uid === uid ? { ...t, ...data } : t));

    const updatedUser = teachers.find(t => t.uid === uid);
    const targetName = data.displayName || updatedUser?.displayName || uid;

    // Record audit event
    await logAuditEvent({
      action: 'user_updated',
      title: `Pembaruan Akun Pengguna: ${targetName}`,
      description: `Memperbarui informasi profil atau peran akun untuk ${targetName}`,
      actor: profile,
      targetId: uid,
      targetName,
      details: data
    });
  };

  const handleUploadDocument = async (
    docData: Omit<TeachingDocument, 'id' | 'uploadedAt'> & { fileBlob?: File; replaceDocId?: string }
  ) => {
    // Generate signature to prevent rapid double-submissions
    const signature = `${docData.guruId || docData.guruName}_${docData.category}_${docData.title}_${docData.semester}_${docData.tahunPelajaran}_${docData.kelas}`;
    const now = Date.now();

    if (
      isUploadingDocRef.current ||
      (lastUploadSignatureRef.current &&
        lastUploadSignatureRef.current.sig === signature &&
        now - lastUploadSignatureRef.current.timestamp < 5000)
    ) {
      console.warn('Duplicate upload prevented for:', signature);
      return;
    }

    isUploadingDocRef.current = true;
    lastUploadSignatureRef.current = { sig: signature, timestamp: now };

    try {
      const id = docData.replaceDocId || ('doc-' + now);
      let finalFileUrl = docData.fileUrl?.trim() || '';

      // If a physical file was provided
      if (docData.fileBlob) {
        // 1. Immediately store file in local IndexedDB (instant, reliable, works offline and for any size)
        try {
          await saveFileLocally(id, docData.fileBlob);
        } catch (err) {
          console.warn('Local storage error:', err);
        }

        // 2. If under 500KB and no drive link, convert to data URL so it syncs directly via Firestore
        if (!finalFileUrl && docData.fileBlob.size <= 500 * 1024) {
          try {
            finalFileUrl = await fileToDataUrl(docData.fileBlob);
          } catch (err) {
            console.warn('DataURL error:', err);
          }
        }

        // 3. Attempt Firebase Storage with a strict 2.5-second timeout so it NEVER freezes or hangs
        try {
          const cleanName = encodeURIComponent(docData.fileBlob.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
          const storageRef = ref(storage, `teaching_documents/${id}_${cleanName}`);
          
          const uploadTask = (async () => {
            const snapshot = await uploadBytes(storageRef, docData.fileBlob!);
            return await getDownloadURL(snapshot.ref);
          })();

          const timeoutTask = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 2500);
          });

          const cloudUrl = await Promise.race([uploadTask, timeoutTask]);
          if (cloudUrl) {
            finalFileUrl = cloudUrl;
          }
        } catch (storageErr) {
          console.warn('Firebase Storage timeout/skipped:', storageErr);
        }

        // 4. If still no URL, mark with local scheme
        if (!finalFileUrl) {
          finalFileUrl = `local:${id}`;
        }
      }

      // CRITICAL: Extract fileBlob and replaceDocId out so that Firestore only receives JSON-serializable fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fileBlob, replaceDocId, ...cleanDocData } = docData;

      const newDoc: TeachingDocument = {
        ...cleanDocData,
        id,
        fileUrl: finalFileUrl,
        uploadedAt: new Date(now).toISOString()
      };

      await setDoc(doc(db, 'teachingDocuments', id), newDoc);

      // Update state without duplicating
      setDocuments(prev => {
        const withoutTarget = prev.filter(d => d.id !== id);
        return [newDoc, ...withoutTarget];
      });
    } finally {
      isUploadingDocRef.current = false;
    }
  };

  const handleVerifyDocument = async (docId: string, status: TeachingDocument['status'], feedback?: string) => {
    const updates = { status, feedback, verifiedBy: profile?.displayName };
    await updateDoc(doc(db, 'teachingDocuments', docId), updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));

    const targetDoc = documents.find(d => d.id === docId);

    // Record audit event
    await logAuditEvent({
      action: 'document_verified',
      title: `Verifikasi Dokumen: ${targetDoc?.title || docId}`,
      description: `Status berkas diubah menjadi '${status}' oleh ${profile?.displayName || 'Verifikator'}. ${feedback ? `Catatan: "${feedback}"` : ''}`,
      actor: profile,
      targetId: docId,
      targetName: targetDoc?.title || docId,
      details: { status, feedback, guruName: targetDoc?.guruName, category: targetDoc?.category }
    });
  };

  const handleDeleteDocument = async (docId: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    try {
      await deleteDoc(doc(db, 'teachingDocuments', docId));
      await deleteFileLocally(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));

      // Record audit event
      await logAuditEvent({
        action: 'document_deleted',
        title: `Penghapusan Berkas Ajar: ${targetDoc?.title || docId}`,
        description: `Menghapus berkas ${targetDoc?.category || 'dokumen'} milik ${targetDoc?.guruName || 'guru'}`,
        actor: profile,
        targetId: docId,
        targetName: targetDoc?.title || docId,
        details: { category: targetDoc?.category, guruName: targetDoc?.guruName }
      });
    } catch (err) {
      console.error('Failed to delete document from Firestore:', err);
      // Ensure UI state and local storage are cleaned up so user is not stuck
      await deleteFileLocally(docId).catch(() => {});
      setDocuments(prev => prev.filter(d => d.id !== docId));
      throw err;
    }
  };

  const handleBatchDeleteDocuments = async (docIds: string[]) => {
    if (!docIds || docIds.length === 0) return;

    // Use Firestore writeBatch for atomic or chunked deletion
    const batch = writeBatch(db);
    docIds.forEach(id => {
      batch.delete(doc(db, 'teachingDocuments', id));
    });

    await batch.commit();

    // Clean up local IndexedDB blobs
    for (const id of docIds) {
      await deleteFileLocally(id).catch(() => {});
    }

    // Update state
    setDocuments(prev => prev.filter(d => !docIds.includes(d.id)));

    // Log audit event
    await logAuditEvent({
      action: 'document_deleted',
      title: `Penghapusan Massal ${docIds.length} Berkas Ajar`,
      description: `Administrator (${profile?.displayName || 'Admin'}) menghapus sekaligus ${docIds.length} dokumen perangkat pembelajaran.`,
      actor: profile,
      details: { count: docIds.length, documentIds: docIds }
    });
  };

  const handleAddSchedule = async (scheduleData: Omit<SupervisionSchedule, 'id' | 'createdAt'>) => {
    const id = 'sched-' + Date.now();
    const newSchedule: SupervisionSchedule = {
      ...scheduleData,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'supervisionSchedules', id), newSchedule);
    setSchedules(prev => {
      if (prev.some(s => s.id === newSchedule.id)) return prev;
      return [newSchedule, ...prev];
    });
  };

  const handleUpdateScheduleStatus = async (id: string, status: SupervisionSchedule['status']) => {
    await updateDoc(doc(db, 'supervisionSchedules', id), { status });
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteDoc(doc(db, 'supervisionSchedules', id));
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Helper to remove any undefined or null-like issues before Firestore setDoc
  const cleanForFirestore = <T extends Record<string, any>>(data: T): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        result[key] = val;
      }
    }
    return result;
  };

  const handleSaveAdminAssessment = async (assessmentData: Omit<AdminSupervisionAssessment, 'createdAt'> & { id?: string; createdAt?: string }) => {
    const id = assessmentData.id || ('adm-assess-' + Date.now());
    const now = new Date().toISOString();
    const newAssess: AdminSupervisionAssessment = {
      ...assessmentData,
      scheduleId: assessmentData.scheduleId || '',
      id,
      createdAt: assessmentData.createdAt || now,
      updatedAt: now
    };
    const cleanData = cleanForFirestore(newAssess);
    await setDoc(doc(db, 'adminAssessments', id), cleanData, { merge: true });
    setAdminAssessments(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newAssess;
        return copy;
      }
      return [newAssess, ...prev];
    });

    // If there is a schedule attached, mark schedule as Selesai safely
    if (newAssess.scheduleId) {
      try {
        await updateDoc(doc(db, 'supervisionSchedules', newAssess.scheduleId), { status: 'Selesai' });
        setSchedules(prev => prev.map(s => s.id === newAssess.scheduleId ? { ...s, status: 'Selesai' } : s));
      } catch (e) {
        console.warn('Schedule update skipped:', e);
      }
    }

    // Automatically generate or update companion RTL item
    if (newAssess.rekomendasi) {
      const rtlId = 'rtl-adm-' + id.replace('adm-assess-', '');
      const rtlItem: FollowUpPlan = {
        id: rtlId,
        guruId: newAssess.guruId,
        guruName: newAssess.guruName,
        supervisionType: 'Administrasi',
        assessmentId: id,
        tanggalSupervisi: newAssess.tanggalPenilaian,
        rekomendasiPenilai: newAssess.rekomendasi,
        rencanaTindakLanjut: 'Penyempurnaan kelengkapan berkas administrasi dan asesmen formatif.',
        kegiatanBimbingan: 'Pendampingan Teman Sejawat',
        targetPenyelesaian: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        status: 'Dalam Proses',
        updatedAt: now
      };
      await setDoc(doc(db, 'followUpPlans', rtlId), cleanForFirestore(rtlItem), { merge: true });
      setFollowUps(prev => {
        const idx = prev.findIndex(f => f.id === rtlId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = rtlItem;
          return copy;
        }
        return [rtlItem, ...prev];
      });
    }
  };

  const handleDeleteAdminAssessment = async (id: string) => {
    const target = adminAssessments.find(a => a.id === id);
    try {
      await deleteDoc(doc(db, 'adminAssessments', id));

      // Record audit event
      await logAuditEvent({
        action: 'assessment_deleted',
        title: `Penghapusan Penilaian Supervisi Administrasi`,
        description: `Menghapus dokumen penilaian administrasi guru ${target?.guruName || id} (Skor: ${target?.percentage || 0}%)`,
        actor: profile,
        targetId: id,
        targetName: target?.guruName || id,
        details: { type: 'Administrasi', score: target?.percentage, guruName: target?.guruName }
      });
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }
    setAdminAssessments(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveTeachingAssessment = async (assessmentData: Omit<TeachingSupervisionAssessment, 'createdAt'> & { id?: string; createdAt?: string }) => {
    const id = assessmentData.id || ('tch-assess-' + Date.now());
    const now = new Date().toISOString();
    const newAssess: TeachingSupervisionAssessment = {
      ...assessmentData,
      scheduleId: assessmentData.scheduleId || '',
      id,
      createdAt: assessmentData.createdAt || now,
      updatedAt: now
    };
    const cleanData = cleanForFirestore(newAssess);
    await setDoc(doc(db, 'teachingAssessments', id), cleanData, { merge: true });
    setTeachingAssessments(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newAssess;
        return copy;
      }
      return [newAssess, ...prev];
    });

    // If there is a schedule attached, mark schedule as Selesai safely
    if (newAssess.scheduleId) {
      try {
        await updateDoc(doc(db, 'supervisionSchedules', newAssess.scheduleId), { status: 'Selesai' });
        setSchedules(prev => prev.map(s => s.id === newAssess.scheduleId ? { ...s, status: 'Selesai' } : s));
      } catch (e) {
        console.warn('Schedule update skipped:', e);
      }
    }

    // Automatically create or update companion RTL item
    if (newAssess.rekomendasi) {
      const rtlId = 'rtl-tch-' + id.replace('tch-assess-', '');
      const rtlItem: FollowUpPlan = {
        id: rtlId,
        guruId: newAssess.guruId,
        guruName: newAssess.guruName,
        supervisionType: 'Mengajar',
        assessmentId: id,
        tanggalSupervisi: newAssess.tanggalPenilaian,
        rekomendasiPenilai: newAssess.rekomendasi,
        rencanaTindakLanjut: `Optimalisasi proses pembelajaran materi ${newAssess.materiPokok}.`,
        kegiatanBimbingan: 'Pendampingan Teman Sejawat / KKG',
        targetPenyelesaian: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        status: 'Dalam Proses',
        updatedAt: now
      };
      await setDoc(doc(db, 'followUpPlans', rtlId), cleanForFirestore(rtlItem), { merge: true });
      setFollowUps(prev => {
        const idx = prev.findIndex(f => f.id === rtlId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = rtlItem;
          return copy;
        }
        return [rtlItem, ...prev];
      });
    }
  };

  const handleDeleteTeachingAssessment = async (id: string) => {
    const target = teachingAssessments.find(a => a.id === id);
    try {
      await deleteDoc(doc(db, 'teachingAssessments', id));

      // Record audit event
      await logAuditEvent({
        action: 'assessment_deleted',
        title: `Penghapusan Penilaian Supervisi Mengajar`,
        description: `Menghapus penilaian observasi kelas guru ${target?.guruName || id} (Mata Pelajaran: ${target?.mataPelajaran || '-'}, Skor: ${target?.nilaiAkhir || 0})`,
        actor: profile,
        targetId: id,
        targetName: target?.guruName || id,
        details: { type: 'Mengajar', score: target?.nilaiAkhir, guruName: target?.guruName, mataPelajaran: target?.mataPelajaran }
      });
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }
    setTeachingAssessments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddFollowUp = async (plan: Omit<FollowUpPlan, 'id' | 'updatedAt'>) => {
    const id = 'rtl-' + Date.now();
    const newPlan: FollowUpPlan = {
      ...plan,
      id,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'followUpPlans', id), cleanForFirestore(newPlan));
    setFollowUps(prev => [newPlan, ...prev]);
  };

  const handleUpdateFollowUp = async (id: string, updates: Partial<FollowUpPlan>) => {
    const withTimestamp = { ...updates, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'followUpPlans', id), cleanForFirestore(withTimestamp));
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, ...withTimestamp } : f));
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSetting>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem('cached_madrasah_settings', JSON.stringify(updated));
    } catch {}
    await setDoc(doc(db, 'settings', 'madrasahConfig'), cleanForFirestore(updated), { merge: true });
  };

  // Indicators & Category Handlers with Firestore Persistence
  const persistAdminIndicators = async (newList: AdminIndicator[]) => {
    setAdminIndicators(newList);
    try {
      localStorage.setItem('cached_admin_indicators', JSON.stringify(newList));
    } catch {}
    try {
      await setDoc(doc(db, 'settings', 'adminIndicators'), { list: newList });
    } catch (e) {
      console.warn('Gagal simpan admin indicators ke Firestore:', e);
    }
  };

  const handleAddAdminIndicator = async (ind: Omit<AdminIndicator, 'id'>) => {
    const newInd: AdminIndicator = { ...ind, id: 'adm-' + Date.now() };
    const updated = [...adminIndicators, newInd];
    await persistAdminIndicators(updated);
  };

  const handleUpdateAdminIndicator = async (id: string, updates: Partial<AdminIndicator>) => {
    const updated = adminIndicators.map(i => i.id === id ? { ...i, ...updates } : i);
    await persistAdminIndicators(updated);
  };

  const handleDeleteAdminIndicator = async (id: string) => {
    const updated = adminIndicators.filter(i => i.id !== id);
    await persistAdminIndicators(updated);
  };

  const handleResetAdminIndicators = async () => {
    await persistAdminIndicators(DEFAULT_ADMIN_INDICATORS);
  };

  const persistTeachingIndicators = async (newList: TeachingIndicator[]) => {
    setTeachingIndicators(newList);
    try {
      localStorage.setItem('cached_teaching_indicators', JSON.stringify(newList));
    } catch {}
    try {
      await setDoc(doc(db, 'settings', 'teachingIndicators'), { list: newList });
    } catch (e) {
      console.warn('Gagal simpan teaching indicators ke Firestore:', e);
    }
  };

  const handleAddTeachingIndicator = async (ind: Omit<TeachingIndicator, 'id'>) => {
    const newInd: TeachingIndicator = { ...ind, id: 'tch-' + Date.now() };
    const updated = [...teachingIndicators, newInd];
    await persistTeachingIndicators(updated);
  };

  const handleUpdateTeachingIndicator = async (id: string, updates: Partial<TeachingIndicator>) => {
    const updated = teachingIndicators.map(i => i.id === id ? { ...i, ...updates } : i);
    await persistTeachingIndicators(updated);
  };

  const handleDeleteTeachingIndicator = async (id: string) => {
    const updated = teachingIndicators.filter(i => i.id !== id);
    await persistTeachingIndicators(updated);
  };

  const handleResetTeachingIndicators = async () => {
    await persistTeachingIndicators(DEFAULT_TEACHING_INDICATORS);
  };

  const persistDocumentCategories = async (newList: DocumentCategory[]) => {
    setDocumentCategories(newList);
    try {
      localStorage.setItem('cached_document_categories', JSON.stringify(newList));
    } catch {}
    try {
      await setDoc(doc(db, 'settings', 'documentCategories'), { list: newList });
    } catch (e) {
      console.warn('Gagal simpan kategori dokumen ke Firestore:', e);
    }
  };

  const handleAddCategory = async (cat: string) => {
    if (!documentCategories.includes(cat as DocumentCategory)) {
      const updated = [...documentCategories, cat as DocumentCategory];
      await persistDocumentCategories(updated);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    const updated = documentCategories.filter(c => c !== cat);
    await persistDocumentCategories(updated);
  };

  const handleSavePopupBanner = async (updated: PopupBannerConfig) => {
    let finalConfig: PopupBannerConfig = { ...updated };

    // If image is a Base64 Data URL, make sure it is optimized for Firestore
    if (finalConfig.imageUrl && finalConfig.imageUrl.startsWith('data:image/')) {
      try {
        const compressed = await optimizeImageForBanner(finalConfig.imageUrl, 1200, 900, 0.82);
        finalConfig.imageUrl = compressed.dataUrl;
        // Also save a local copy to IndexedDB as reliable offline backup
        await saveFileLocally('active_popup_banner_image', compressed.blob).catch(() => {});
      } catch (err) {
        console.warn('Image optimization notice in App.tsx:', err);
      }
    }

    setPopupBanner(finalConfig);

    try {
      localStorage.setItem('cached_popup_banner', JSON.stringify(finalConfig));
    } catch {
      // Ignore quota error if browser localStorage is full
    }

    try {
      await setDoc(doc(db, 'settings', 'popupBanner'), cleanForFirestore(finalConfig), { merge: true });
    } catch (firestoreErr) {
      console.error('Failed to save popup banner to Firestore:', firestoreErr);
      throw firestoreErr;
    }
  };

  if (authLoading) {
    const brandColor = settings.primaryColor || '#047857';
    const appLogo = settings.appLogoUrl || settings.logoUrl;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div 
          className="w-12 h-12 rounded-2xl text-white flex items-center justify-center animate-pulse mb-3 shadow-md p-1 overflow-hidden"
          style={{ backgroundColor: brandColor }}
        >
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="font-bold text-lg text-amber-300">Si</span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Memuat {settings.appName || 'Si-SuGu'} {settings.madrasahName}...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage settings={settings} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        madrasahName={settings.madrasahName}
        teachers={teachers}
        documents={documents}
        schedules={schedules}
        followUps={followUps}
        settings={settings}
        onOpenUserProfile={(targetUser) => {
          setSelectedProfileUser(targetUser || profile || null);
          setIsProfileModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            gurus={teachers}
            documents={documents}
            schedules={schedules}
            adminAssessments={adminAssessments}
            teachingAssessments={teachingAssessments}
            followUps={followUps}
            settings={settings}
          />
        )}

        {activeTab === 'data-guru' && (
          <TeachersView
            teachers={teachers}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onOpenUserProfile={(t) => {
              setSelectedProfileUser(t);
              setIsProfileModalOpen(true);
            }}
          />
        )}

        {activeTab === 'perangkat' && (
          <DocumentsView
            documents={documents}
            categories={documentCategories}
            teachers={teachers}
            onUploadDocument={handleUploadDocument}
            onVerifyDocument={handleVerifyDocument}
            onDeleteDocument={handleDeleteDocument}
            onBatchDeleteDocuments={handleBatchDeleteDocuments}
          />
        )}

        {activeTab === 'jadwal' && (
          <SchedulesView
            schedules={schedules}
            teachers={teachers}
            onAddSchedule={handleAddSchedule}
            onUpdateScheduleStatus={handleUpdateScheduleStatus}
            onDeleteSchedule={handleDeleteSchedule}
            onStartSupervision={(s, type) => {
              if (type === 'Administrasi') setActiveTab('supervisi-administrasi');
              else setActiveTab('supervisi-mengajar');
            }}
          />
        )}

        {activeTab === 'supervisi-administrasi' && (
          <AdminSupervisionView
            assessments={adminAssessments}
            indicators={adminIndicators}
            teachers={teachers}
            schedules={schedules}
            onSaveAssessment={handleSaveAdminAssessment}
            onDeleteAssessment={handleDeleteAdminAssessment}
            onExportPdf={(a) => exportAdminSupervisionPdf(a, settings)}
            onAddIndicator={handleAddAdminIndicator}
            onUpdateIndicator={handleUpdateAdminIndicator}
            onDeleteIndicator={handleDeleteAdminIndicator}
            onResetIndicators={handleResetAdminIndicators}
          />
        )}

        {activeTab === 'supervisi-mengajar' && (
          <TeachingSupervisionView
            assessments={teachingAssessments}
            indicators={teachingIndicators}
            teachers={teachers}
            schedules={schedules}
            onSaveAssessment={handleSaveTeachingAssessment}
            onDeleteAssessment={handleDeleteTeachingAssessment}
            onExportPdf={(a) => exportTeachingSupervisionPdf(a, settings)}
            onAddIndicator={handleAddTeachingIndicator}
            onUpdateIndicator={handleUpdateTeachingIndicator}
            onDeleteIndicator={handleDeleteTeachingIndicator}
            onResetIndicators={handleResetTeachingIndicators}
          />
        )}

        {activeTab === 'tindak-lanjut' && (
          <FollowUpView
            followUps={followUps}
            teachers={teachers}
            adminAssessments={adminAssessments}
            teachingAssessments={teachingAssessments}
            onAddFollowUp={handleAddFollowUp}
            onUpdateFollowUp={handleUpdateFollowUp}
          />
        )}

        {activeTab === 'laporan' && (
          <ReportsView
            adminAssessments={adminAssessments}
            teachingAssessments={teachingAssessments}
            followUps={followUps}
            settings={settings}
          />
        )}

        {activeTab === 'format-penilaian' && (
          <FormatSettingsView
            adminIndicators={adminIndicators}
            teachingIndicators={teachingIndicators}
            documentCategories={documentCategories}
            onAddAdminIndicator={handleAddAdminIndicator}
            onUpdateAdminIndicator={handleUpdateAdminIndicator}
            onDeleteAdminIndicator={handleDeleteAdminIndicator}
            onResetAdminIndicators={handleResetAdminIndicators}
            onAddTeachingIndicator={handleAddTeachingIndicator}
            onUpdateTeachingIndicator={handleUpdateTeachingIndicator}
            onDeleteTeachingIndicator={handleDeleteTeachingIndicator}
            onResetTeachingIndicators={handleResetTeachingIndicators}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsView
            logs={auditLogs}
            loading={dataLoading}
          />
        )}

        {activeTab === 'popup-banner' && (
          <PopupBannerSettingsView
            config={popupBanner}
            teachers={teachers}
            onSaveConfig={handleSavePopupBanner}
            onTriggerPreview={(cfg) => setPreviewBanner(cfg)}
          />
        )}

        {activeTab === 'pengaturan' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateTab={setActiveTab}
            backupData={{
              version: '1.0.0',
              appName: settings.appName || 'Si-SuGu',
              madrasahName: settings.madrasahName,
              exportedAt: new Date().toISOString(),
              teachers,
              teachingDocuments: documents,
              supervisionSchedules: schedules,
              adminSupervisionAssessments: adminAssessments,
              teachingSupervisionAssessments: teachingAssessments,
              followUpPlans: followUps,
              adminIndicators,
              teachingIndicators,
              documentCategories,
              settings
            }}
          />
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedProfileUser}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfileUser(null);
        }}
        documents={documents}
        schedules={schedules}
        adminAssessments={adminAssessments}
        teachingAssessments={teachingAssessments}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsProfileModalOpen(false);
        }}
      />

      {/* Main Screen Popup Banner Modal (Auto Trigger) */}
      <PopupBannerModal
        config={popupBanner}
        currentUser={profile}
        onNavigateTab={setActiveTab}
      />

      {/* Admin Live Preview Modal */}
      {previewBanner && (
        <PopupBannerModal
          config={previewBanner}
          currentUser={profile}
          forcePreview={true}
          onClosePreview={() => setPreviewBanner(null)}
          onNavigateTab={setActiveTab}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {settings.madrasahName} • {settings.appName || 'Si-SuGu'} ({settings.tagline || 'Sistem Supervisi Akademik Guru'})</p>
          <p className="text-slate-400">
            Kementerian Agama Republik Indonesia • Prov. Gorontalo
          </p>
        </div>
      </footer>
    </div>
  );
}
