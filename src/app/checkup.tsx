import { useState } from 'react';
import { Action, Card, Heading, Note, Page } from '@/components/screen-ui';
import { AppIcon } from '@/components/app-icon';
import { PatientQrCard } from '@/components/patient-qr-card';
import { ProviderScanner } from '@/components/provider-scanner';
export default function CheckupScreen() {
  const [scanner, setScanner] = useState(false);
  return <Page title="Hospital check-in" subtitle="A simpler arrival. More time for your care." back><Card><AppIcon name="scan" size={34} /><Heading>Scan your hospital</Heading><Note>This backend starts consultations when authorised hospital staff scan your patient card below. Hospital QR check-in is not exposed for patients.</Note><Action title="Open hospital code reader" icon="scan" onPress={() => setScanner(true)} /></Card><PatientQrCard /><Card><Heading>How it works</Heading><Note>1. Open the hospital scanner, or show your patient card at reception.</Note><Note>2. Your hospital verifies your identity and links your patient record.</Note><Note>3. Authorised staff begin your consultation using this short-lived access code.</Note></Card><ProviderScanner kind="hospital" open={scanner} onClose={() => setScanner(false)} /></Page>;
}
