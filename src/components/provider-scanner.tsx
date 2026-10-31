import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/app-provider';
import { AppIcon } from './app-icon';
import { Action, Card, Heading, Input, Note, ui } from './screen-ui';
export function ProviderScanner({ kind, open, onClose }: { kind: 'hospital' | 'pharmacy'; open: boolean; onClose: () => void }) {
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<{ data: string; time: string } | null>(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [cameraFailed, setCameraFailed] = useState(false);
  const locked = useRef(false);
  function scan(data: string) {
    if (locked.current) return;
    const value = data.trim();
    if (!value || value.length > 4096) { setError('This code is empty or too long. Please try a different code.'); return; }
    locked.current = true;
    setScanned({ data: value, time: new Date().toLocaleString() }); setError('');
  }
  function reset() { locked.current = false; setScanned(null); setManual(''); setError(''); setCameraFailed(false); }
  function close() { reset(); onClose(); }
  async function allowCamera() { try { await requestPermission(); } catch { setError('Camera permission could not be requested. Enter the provider code below instead.'); } }
  return <Modal visible={open} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}><View style={ui.between}><Heading>Scan {kind} code</Heading><Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={close} style={ui.iconButton}><AppIcon name="close" /></Pressable></View><Note>{kind === 'hospital' ? 'Scan the hospital QR code at reception to begin check-in.' : 'Scan the code displayed by your pharmacy to begin prescription sharing.'}</Note>
    {!scanned && <>{open && permission?.granted && !cameraFailed ? <View style={{ height: 290, borderRadius: 22, overflow: 'hidden', backgroundColor: '#071A12' }}><CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => scan(data)} onMountError={() => { setCameraFailed(true); setError('Camera unavailable. Enter the code below instead.'); }} /><View pointerEvents="none" style={{ margin: 45, flex: 1, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 20 }} /></View> : <Card><AppIcon name="scan" size={40} /><Heading>Camera access</Heading><Note>{permission?.canAskAgain === false ? 'Camera access is denied. Enable it in your device settings or enter the code below.' : 'Allow camera access to scan a QR code. You can also enter the provider code below.'}</Note>{permission?.canAskAgain !== false && !cameraFailed && <Action title="Allow camera" icon="scan" onPress={() => void allowCamera()} />}</Card>}
    <Card><Input label={`${kind === 'hospital' ? 'Hospital' : 'Pharmacy'} code`} placeholder="Enter or paste the provider code" value={manual} onChangeText={setManual} autoCapitalize="none" autoCorrect={false} maxLength={4096} /><Action title="Read code" secondary icon="qr" disabled={!manual.trim()} onPress={() => scan(manual)} /></Card></>}
    {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>}
    {scanned && <Card><AppIcon name="qr" size={38} /><Heading>Code read successfully</Heading><Note>{scanned.time}</Note><Text selectable numberOfLines={6} style={{ color: colors.text, fontSize: 12 }}>{scanned.data.slice(0, 300)}</Text><Note>{kind === 'hospital' ? 'This backend has no patient-facing hospital-code operation. You have not been checked in. Show your patient card to authorised staff.' : 'This backend has no patient-facing pharmacy-code operation. No information has been shared. Let the pharmacist scan your Medi Card.'}</Note><Action title="Scan another code" icon="scan" onPress={reset} /><Action title="Done" secondary onPress={close} /></Card>}
  </ScrollView></SafeAreaView></Modal>;
}
