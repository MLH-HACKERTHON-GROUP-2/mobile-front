import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { Action, Card, Heading, Input, Note, Page } from '@/components/screen-ui';
import { useAppTheme } from '@/providers/app-provider';
import { useBackend } from '@/providers/backend-provider';
import { errorMessage } from '@/api/graphql-client';
export default function ProfileScreen() {
  const { colors, profile, saveProfile, logout: clearLocal } = useAppTheme(); const { session, patient, completeProfile, logout } = useBackend();
  const [form, setForm] = useState(profile); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { if (!dirty) setForm(profile); }, [profile, dirty]);
  const change = (key: keyof typeof form, value: string) => { setDirty(true); setForm(current => ({ ...current, [key]: value })); setMessage(''); };
  async function save() {
    if (!form.firstName.trim()) return setMessage('Enter your first name.');
    if (form.dob && (!/^\d{4}-\d{2}-\d{2}$/.test(form.dob) || Number.isNaN(Date.parse(form.dob)) || new Date(form.dob).toISOString().slice(0,10) !== form.dob || Date.parse(form.dob) > Date.now())) return setMessage('Enter a valid date of birth as YYYY-MM-DD.');
    setBusy(true); setMessage('');
    try { await completeProfile({ name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(), dob: form.dob ? `${form.dob}T00:00:00.000Z` : null, ...(patient?.sex ? { sex: patient.sex } : {}), ...(patient?.allergies ? { allergies: patient.allergies } : {}) }); saveProfile(form); setDirty(false); setMessage('Name and date of birth saved. Languages are kept for this session only.'); } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  }
  async function signOut() { setBusy(true); try { await logout(); clearLocal(); } catch (error) { setMessage(errorMessage(error)); setBusy(false); } }
  return <Page title="My profile" subtitle="Your personal patient information."><View style={{ alignItems: 'center', gap: 12, paddingVertical: 10 }}><View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="profile" size={65} /></View><Heading>{session?.user.name}</Heading><Note>{session?.user.email || session?.user.phone}</Note></View><Card><Heading>Personal details</Heading><Input label="First name" value={form.firstName} onChangeText={text => change('firstName', text)} autoComplete="given-name" /><Input label="Last name" value={form.lastName} onChangeText={text => change('lastName', text)} autoComplete="family-name" /><Input label="Email address" value={session?.user.email ?? ''} editable={false} placeholder="Not provided" /><Input label="Phone number" value={session?.user.phone ?? ''} editable={false} placeholder="Not provided" /><Note>Contact changes are not supported by this backend.</Note><Input label="Date of birth" value={form.dob} onChangeText={text => change('dob', text)} placeholder="YYYY-MM-DD" maxLength={10} /><Input label="Languages spoken" value={form.languages} onChangeText={text => change('languages', text)} placeholder="e.g. English, Bemba" /><Note>Languages stay in this session; the backend has no language field.</Note>{!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}>{message}</Text>}<Action title={busy ? 'Saving…' : 'Save profile'} icon="check" disabled={busy} onPress={() => void save()} /></Card><Card><View style={{ flexDirection: 'row', gap: 10 }}><AppIcon name="password" /><Heading>Sign-in & security</Heading></View><Note>This account uses one-time codes. There is no password to change.</Note></Card><Card><Heading>Log out</Heading><Note>Clear your access and refresh tokens from this device.</Note><Action title="Log out" secondary icon="logout" disabled={busy} onPress={() => void signOut()} /></Card></Page>;
}
