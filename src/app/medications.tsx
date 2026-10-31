import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, Card, Heading, Note, Page, ui } from '@/components/screen-ui';
import { AppIcon } from '@/components/app-icon';
import { PatientQrCard } from '@/components/patient-qr-card';
import { ProviderScanner } from '@/components/provider-scanner';
import { useBackend } from '@/providers/backend-provider';
import { useAppTheme } from '@/providers/app-provider';
export default function MedicationsScreen() {
  const { patient, loading, error, reload } = useBackend(); const { colors } = useAppTheme(); const [scanner, setScanner] = useState(false);
  const prescriptions = (patient?.sessions ?? []).filter(s => s.prescription).sort((a,b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  return <Page title="Medications" subtitle="Your prescriptions, ready when you need them." back><PatientQrCard medication /><View style={ui.between}><Heading>My prescriptions</Heading><Pressable accessibilityRole="button" onPress={() => void reload()} disabled={loading}><Text style={{ color: colors.accent, padding: 10 }}>{loading ? 'Loading…' : 'Refresh'}</Text></Pressable></View>{!!error && <Note>{error}</Note>}{prescriptions.map(session => <Card key={session.id}><Heading>{session.hospital.name}</Heading><Note>{new Date(session.prescription!.createdAt).toLocaleString()}</Note>{session.prescription!.items.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 14, gap: 7 }}><View style={ui.between}><View style={ui.row}><AppIcon name="medication" size={20} /><Text style={{ color: colors.text, fontWeight: '600' }}>{item.drugName}</Text></View><Text style={{ color: colors.accent, fontSize: 10 }}>{item.status}</Text></View><Note>{item.dosage} · Quantity: {item.quantity}</Note>{!!item.instructions && <Note>{item.instructions}</Note>}{item.dispensedAt && <Note>Dispensed {new Date(item.dispensedAt).toLocaleString()}</Note>}</View>)}</Card>)}{!loading && !prescriptions.length && <Card><AppIcon name="medication" size={36} /><Heading>No prescriptions yet</Heading><Note>Your prescriptions will appear here after your doctor records them.</Note></Card>}<Card><Heading>Scan your pharmacy</Heading><Note>Patient-to-pharmacy code linking is not available in this backend. Your pharmacist can scan the Medi Card above.</Note><Action title="Open code reader" secondary icon="scan" onPress={() => setScanner(true)} /></Card><ProviderScanner kind="pharmacy" open={scanner} onClose={() => setScanner(false)} /></Page>;
}
