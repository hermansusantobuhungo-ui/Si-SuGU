import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AuditActionType, AuditLog, UserProfile } from '../types';

export interface LogAuditParams {
  action: AuditActionType;
  title: string;
  description: string;
  actor?: UserProfile | null;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const actorUid = params.actor?.uid || 'system';
    const actorName = params.actor?.displayName || 'Pengguna Sistem';
    const actorEmail = params.actor?.email || '';
    const actorRole = params.actor?.role || 'admin';

    const logEntry: Omit<AuditLog, 'id'> = {
      action: params.action,
      title: params.title,
      description: params.description,
      actorUid,
      actorName,
      actorEmail,
      actorRole,
      targetId: params.targetId || '',
      targetName: params.targetName || '',
      details: params.details || {},
      timestamp: new Date().toISOString()
    };

    // Filter out undefined fields for clean Firestore storage
    const cleanLog: Record<string, any> = {};
    for (const [key, value] of Object.entries(logEntry)) {
      if (value !== undefined) {
        cleanLog[key] = value;
      }
    }

    await addDoc(collection(db, 'auditLogs'), cleanLog);
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
}
