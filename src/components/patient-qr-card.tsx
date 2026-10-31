import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAppTheme } from '@/providers/app-provider';
import { useBackend } from '@/providers/backend-provider';
import { shareQrImage } from '@/utils/share-qr';
import { AppIcon } from './app-icon';
import { Action, Card, Heading, Note, ui } from './screen-ui';
export function PatientQrCard({ medication = false }: { medication?: boolean }) {
  const { colors } = useAppTheme();
  const { session, qrToken, qrBusy, qrError, generateQr } = useBackend();
  const [now, setNow] = useState(Date.now()); const [message, setMessage] = useState(''); const [sharing, setSharing] = useState(false);
  const qr = useRef<{ toDataURL: (callback: (data: string) => void, options?: { width: number; height: number }) => void } | null>(null);
  useEffect(() => { if (!qrToken) void generateQr(); }, [qrToken, generateQr]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const seconds = qrToken ? Math.max(0, Math.ceil((Date.parse(qrToken.expiresAt) - now) / 1000)) : 0;
  async function share() {
    if (!qrToken || !qr.current || seconds === 0 || sharing) return;
    setSharing(true); setMessage('');
    try { const base64 = await new Promise<string>((resolve, reject) => { const timer = setTimeout(() => reject(new Error('QR export timed out')), 10000); try { qr.current!.toDataURL(data => { clearTimeout(timer); resolve(data); }, { width: 640, height: 640 }); } catch (error) { clearTimeout(timer); reject(error); } }); await shareQrImage(base64, medication ? 'medi-card' : 'patient-card'); }
    catch { setMessage('The QR image could not be shared. Show your card to the provider instead.'); } finally { setSharing(false); }
  }
  return <Card style={{ padding: 0, overflow: 'hidden' }}><View style={{ backgroundColor: colors.accent, padding: 22, gap: 18 }}><View style={ui.between}><View style={ui.row}><AppIcon name={medication ? 'medication' : 'profile'} color="#FFFFFF" /><Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 18 }}>{medication ? 'Medi Card' : 'Patient card'}</Text></View><AppIcon name="qr" color="#FFFFFFBB" /></View><Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '600' }}>{session?.user.name}</Text><Text style={{ color: '#FFFFFFCC', fontSize: 11 }}>PERSONAL ACCESS CODE · VALID FOR 2 MINUTES</Text></View>
    <View style={{ padding: 22, gap: 16, alignItems: 'center' }}>{qrToken && seconds > 0 && !qrBusy ? <View accessibilityLabel="Scannable patient access QR code" style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 18 }}><QRCode getRef={ref => { qr.current = ref; }} value={qrToken.qrCodeUrl} size={160} color="#10251A" backgroundColor="#FFFFFF" ecl="M" quietZone={16} /></View> : <View style={{ padding: 30 }}><AppIcon name="qr" size={110} color={colors.muted} /></View>}<Heading>{qrBusy ? 'Preparing your code…' : seconds ? `Expires in ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}` : qrToken ? 'This code has expired' : 'Your patient access code'}</Heading><Note>{medication ? 'Let your pharmacist scan this code to retrieve your pending prescriptions.' : 'Show this code at your hospital. Authorised staff can identify your record and begin a consultation.'}</Note><Note>Refreshing immediately replaces your previous code. Codes never refresh automatically.</Note>{!!(qrError || message) && <Note>{qrError || message}</Note>}<View style={{ alignSelf: 'stretch', gap: 9 }}><Action title={qrBusy ? 'Preparing…' : 'Refresh QR code'} icon="qr" disabled={qrBusy || sharing} onPress={() => void generateQr()} /><Action title={sharing ? 'Preparing image…' : Platform.OS === 'web' ? 'Download QR code' : 'Share QR code'} secondary icon="share" disabled={!seconds || qrBusy || sharing} onPress={() => void share()} /></View></View></Card>;
}
