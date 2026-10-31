import { useEffect } from 'react';
import { useBackend } from '@/providers/backend-provider';
import { useAppTheme } from '@/providers/app-provider';
export function ProfileSync() {
  const { patient, session } = useBackend(); const { saveProfile } = useAppTheme();
  const name = session?.user.name ?? ''; const email = session?.user.email ?? ''; const phone = session?.user.phone ?? ''; const dob = patient?.dob?.slice(0,10) ?? '';
  useEffect(() => { const parts = name.trim().split(/\s+/); saveProfile(current => ({ ...current, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' '), email, phone, dob })); }, [name, email, phone, dob, saveProfile]);
  return null;
}
