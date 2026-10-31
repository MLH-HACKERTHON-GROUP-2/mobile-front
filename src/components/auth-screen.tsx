import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppIcon } from './app-icon';
import { Action, Card, Heading, Input, Note, Page } from './screen-ui';
import { useBackend } from '@/providers/backend-provider';
import { useAppTheme } from '@/providers/app-provider';
import { errorMessage } from '@/api/graphql-client';
export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const { colors } = useAppTheme(); const { requestOtp, verifyOtp, error } = useBackend();
  const [identifier, setIdentifier] = useState(''); const [otp, setOtp] = useState(''); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit() {
    if (!identifier.trim() || (!identifier.includes('@') && identifier.replace(/\D/g, '').length < 7)) return setMessage('Enter your email address or phone number.');
    if (sent && !/^\d{6}$/.test(otp)) return setMessage('Enter the six-digit code.');
    setBusy(true); setMessage('');
    try { if (!sent) { await requestOtp(identifier); setSent(true); } else { const session = await verifyOtp(identifier, otp); router.replace(session.user.profileComplete ? '/home' : '/complete-profile'); } }
    catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  }
  return <Page title={mode === 'register' ? 'Start your care journey.' : 'Welcome back.'} subtitle="Your health, a little closer."><View style={{ backgroundColor: colors.accent, borderRadius: 25, padding: 27, gap: 17 }}><AppIcon name="care" color="#FFFFFF" size={36} /><Text style={{ color: '#FFFFFF', fontSize: 30, lineHeight: 38, fontWeight: '600' }}>A little care.{ '\n' }A healthier you.</Text></View><Card><Heading>{sent ? 'Check your verification code' : mode === 'register' ? 'Create a patient account' : 'Log in to your account'}</Heading><Note>{sent ? 'This demo environment uses the code 000000. No SMS or email is sent.' : 'Use your email or phone to receive a verification code. No password needed.'}</Note><Input label="Email or phone number" value={identifier} onChangeText={setIdentifier} editable={!sent && !busy} autoCapitalize="none" autoCorrect={false} placeholder="you@example.com or +260…" autoComplete="username" />{sent && <Input label="Verification code" value={otp} onChangeText={text => setOtp(text.replace(/\D/g, ''))} placeholder="6-digit code" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} editable={!busy} />}{!!(message || error) && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 12, lineHeight: 20 }}>{message || error}</Text>}<Action title={busy ? 'Please wait…' : sent ? 'Verify & continue' : 'Send verification code'} onPress={() => void submit()} disabled={busy} />{sent && <Pressable accessibilityRole="button" onPress={() => { setSent(false); setOtp(''); setMessage(''); }} disabled={busy} style={{ padding: 12 }}><Text style={{ color: colors.accent, textAlign: 'center', fontSize: 12 }}>Use a different email or phone</Text></Pressable>}</Card><Link href={mode === 'register' ? '/login' : '/register'} replace style={{ color: colors.accent, textAlign: 'center', padding: 15, fontSize: 13 }}>{mode === 'register' ? 'Already have an account? Log in' : 'New here? Create an account'}</Link></Page>;
}
