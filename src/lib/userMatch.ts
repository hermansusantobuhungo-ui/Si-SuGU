import { UserProfile } from '../types';

/**
 * Universal matcher to check if an item (document, schedule, assessment, follow-up)
 * belongs to the currently logged in user / teacher.
 * Matches by UID, NIP, Display Name, and Email to guarantee 100% reliability
 * even across demo switches or profile load delays.
 */
export function isItemForUser(
  item: { guruId?: string; guruNip?: string; guruName?: string; guruEmail?: string },
  profile: UserProfile | null | undefined,
  authUid?: string | null
): boolean {
  if (!profile && !authUid) return false;

  const validUids = [profile?.uid, authUid].filter(Boolean);
  if (item.guruId && validUids.includes(item.guruId)) {
    return true;
  }

  if (profile?.nip && item.guruNip) {
    const pNip = profile.nip.replace(/\D/g, '');
    const iNip = item.guruNip.replace(/\D/g, '');
    if (pNip && iNip && pNip === iNip) {
      return true;
    }
  }

  if (profile?.displayName && item.guruName) {
    const cleanProfileName = profile.displayName
      .toLowerCase()
      .replace(/[,.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanItemName = item.guruName
      .toLowerCase()
      .replace(/[,.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanProfileName && cleanItemName && cleanProfileName === cleanItemName) {
      return true;
    }
  }

  if (profile?.email && item.guruEmail) {
    if (profile.email.trim().toLowerCase() === item.guruEmail.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}
