import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient } from 'graphql-ws';
import { createGraphqlClient, errorMessage, ApiError } from '@/api/graphql-client';
import { tokenStorage } from '@/api/token-storage';
import { PATIENT_QUERY, USER_FIELDS, type AuthPayload, type Patient, type QrToken } from '@/api/types';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://unstarched-maritally-ike.ngrok-free.dev').replace(/\/$/, '') + '/graphql';
const Context = createContext<{
  session: AuthPayload | null; ready: boolean; patient: Patient | null; loading: boolean; error: string; notification: string; qrToken: QrToken | null; qrBusy: boolean; qrError: string; generateQr: () => Promise<void>;
  request: ReturnType<typeof createGraphqlClient>['request']; reload: () => Promise<void>; requestOtp: (identifier: string) => Promise<void>; verifyOtp: (identifier: string, otp: string) => Promise<AuthPayload>; completeProfile: (input: { name: string; dob?: string | null; sex?: string; allergies?: string }) => Promise<void>; logout: () => Promise<void>;
} | null>(null);
export function BackendProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [qrToken, setQrToken] = useState<QrToken | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState('');
  const qrFlight = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const storageQueue = useRef(Promise.resolve());
  const [client] = useState(() => createGraphqlClient(API_URL, value => {
    setSession(value); if (!value) { generation.current++; setPatient(null); setNotification(''); setQrToken(null); setQrError(''); }
    storageQueue.current = storageQueue.current.catch(() => {}).then(() => tokenStorage.write(value?.refreshToken ?? null));
    return storageQueue.current.catch(() => { setError('Session works, but could not be saved securely on this device.'); });
  }));
  useEffect(() => { let active = true; tokenStorage.read().then(async token => { if (token && active) await client.refresh(token); }).catch(error => { if (active) setError(errorMessage(error)); }).finally(() => { if (active) setReady(true); }); return () => { active = false; }; }, [client]);
  const reload = useCallback(async () => {
    if (!client.getSession()?.user.profileComplete) return;
    const requestGeneration = ++generation.current;
    setLoading(true); setError('');
    try { const data = await client.request<{ myPatientProfile: Patient }>(PATIENT_QUERY); if (generation.current === requestGeneration) setPatient(data.myPatientProfile); }
    catch (error) { if (generation.current === requestGeneration) setError(errorMessage(error)); }
    finally { if (generation.current === requestGeneration) setLoading(false); }
  }, [client]);
  useEffect(() => { if (session?.user.profileComplete && session.user.role === 'PATIENT') void reload(); }, [session?.user.id, session?.user.profileComplete, session?.user.role, reload]);
  useEffect(() => {
    if (!session?.user.profileComplete || session.user.role !== 'PATIENT') return;
    const socket = createClient({ url: API_URL.replace(/^http/, 'ws'), lazy: true, retryAttempts: 4, connectionParams: () => ({ authorization: `Bearer ${client.getSession()?.accessToken ?? ''}` }), on: { closed: event => { if (event && typeof event === 'object' && 'code' in event && (event.code === 4401 || event.code === 4403)) void client.refresh().catch(() => {}); } } });
    const fields = ['sessionStarted', 'sessionFinalized', 'prescriptionReady', 'prescriptionDispensed', 'myPaymentEvents'] as const;
    const labels = ['Your consultation has started.', 'Your consultation has been completed.', 'Your prescription is ready.', 'A prescription item was dispensed.', 'Your wallet has been updated.'];
    const cleanup = fields.map((field, i) => socket.subscribe({ query: `subscription { ${field} { ${field === 'myPaymentEvents' ? 'walletTransactionId' : 'id'} } }` }, { next: result => { if (!result.errors?.length) { setNotification(labels[i]); void reload(); } }, error: () => {}, complete: () => {} }));
    return () => { cleanup.forEach(dispose => dispose()); void socket.dispose(); };
  }, [session?.accessToken, session?.user.profileComplete, session?.user.role, client, reload]);
  const generateQr = useCallback(async () => {
    if (!client.getSession()) return;
    if (qrFlight.current) return qrFlight.current;
    const userId = client.getSession()?.user.id;
    setQrBusy(true); setQrError(''); setQrToken(null);
    qrFlight.current = client.request<{ generateQrToken: QrToken }>('mutation GeneratePatientQr { generateQrToken { token qrCodeUrl expiresAt } }').then(data => { if (client.getSession()?.user.id === userId) setQrToken(data.generateQrToken); }).catch(error => { if (client.getSession()?.user.id === userId) setQrError(errorMessage(error)); }).finally(() => { setQrBusy(false); qrFlight.current = null; });
    return qrFlight.current;
  }, [client]);
  async function requestOtp(identifier: string) { await client.request('mutation RequestOtp($input: RequestOtpInput!) { requestOtp(input: $input) }', { input: { identifier: identifier.trim() } }, false); }
  async function verifyOtp(identifier: string, otp: string) {
    const data = await client.request<{ verifyOtp: AuthPayload }>(`mutation VerifyOtp($input: VerifyOtpInput!) { verifyOtp(input: $input) { accessToken refreshToken user { ${USER_FIELDS} } } }`, { input: { identifier: identifier.trim(), otp } }, false);
    if (data.verifyOtp.user.role !== 'PATIENT') throw new ApiError('This mobile app supports patient accounts. Please use a patient identifier.', 'WRONG_ROLE');
    await client.setSession(data.verifyOtp); return data.verifyOtp;
  }
  async function completeProfile(input: { name: string; dob?: string | null; sex?: string; allergies?: string }) {
    const data = await client.request<{ completePatientProfile: { user: AuthPayload['user'] } }>(`mutation CompleteProfile($input: CompletePatientProfileInput!) { completePatientProfile(input: $input) { user { ${USER_FIELDS} } } }`, { input });
    const current = client.getSession(); if (current) await client.setSession({ ...current, user: data.completePatientProfile.user });
    await reload();
  }
  return <Context.Provider value={{ session, ready, patient, loading, error, notification, qrToken, qrBusy, qrError, generateQr, request: client.request, reload, requestOtp, verifyOtp, completeProfile, logout: async () => { await client.setSession(null); setError(''); setLoading(false); } }}>{children}</Context.Provider>;
}
export function useBackend() { const value = useContext(Context); if (!value) throw new Error('BackendProvider required'); return value; }
