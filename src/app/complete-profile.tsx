import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Action, Card, Heading, Input, Note, Page } from '@/components/screen-ui';
import { useBackend } from '@/providers/backend-provider';
import { useAppTheme } from '@/providers/app-provider';
import { errorMessage } from '@/api/graphql-client';
export default function CompleteProfileScreen() {
  const { session, completeProfile } = useBackend(); const { colors } = useAppTheme();
  const [name, setName] = useState(session?.user.name ?? ''); const [dob, setDob] = useState(''); const [allergies, setAllergies] = useState(''); const [sex, setSex] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function save() {
    if (!name.trim()) return setMessage('Enter your full name.');
    if (dob && (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob || Date.parse(dob) > Date.now())) return setMessage('Enter a valid date of birth as YYYY-MM-DD.');
    setBusy(true); setMessage('');
    try { await completeProfile({ name: name.trim(), ...(dob ? { dob: `${dob}T00:00:00.000Z` } : {}), ...(sex.trim() ? { sex: sex.trim() } : {}), ...(allergies.trim() ? { allergies: allergies.trim() } : {}) }); router.replace('/home'); } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  }
  return <Page title="Complete your profile" subtitle="A few details before we begin."><Card><Heading>Your patient information</Heading><Input label="Full name" value={name} onChangeText={setName} autoComplete="name" /><Input label="Date of birth (optional)" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" maxLength={10} /><Input label="Sex (optional)" value={sex} onChangeText={setSex} /><Input label="Allergies (optional)" value={allergies} onChangeText={setAllergies} multiline /><Note>These details will be saved to your patient record.</Note>{!!message && <Text style={{ color: colors.danger, fontSize: 12 }}>{message}</Text>}<Action title={busy ? 'Saving…' : 'Complete profile'} disabled={busy} onPress={() => void save()} /></Card></Page>;
}
