import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useAppTheme } from '@/providers/app-provider';
const icons = {
  stop: 'stop', leaf: 'leaf', cloud: 'cloud-outline', menu: 'menu', quote: 'format-quote-open', play: 'play', pause: 'pause', voice: 'microphone-outline', info: 'information-outline', qr: 'qrcode', scan: 'qrcode-scan', share: 'share-variant-outline', search: 'magnify', calendar: 'calendar-month-outline', lab: 'flask-outline', medication: 'pill', shield: 'shield-plus-outline',
  home: 'home-outline', care: 'medical-bag', settings: 'cog-outline', profile: 'account-circle-outline', wallet: 'wallet-outline',
  ai: 'creation', weight: 'scale-bathroom', temperature: 'thermometer', heart: 'heart-outline', blood: 'water-outline',
  file: 'file-document-outline', image: 'image-outline', close: 'close', send: 'send-outline', back: 'arrow-left',
  savings: 'piggy-bank-outline', expense: 'arrow-top-right', chip: 'integrated-circuit-chip', clock: 'clock-outline',
  password: 'lock-outline', logout: 'logout', check: 'check', moon: 'weather-night', sun: 'white-balance-sunny',
} as const;
export type IconName = keyof typeof icons;
export function AppIcon({ name, color, size = 25 }: { name: IconName; color?: string; size?: number }) {
  const { colors, preferences } = useAppTheme();
  const glyph = preferences.iconStyle === 'solid' ? icons[name].replace('-outline', '') : icons[name];
  return <MaterialCommunityIcons name={glyph as ComponentProps<typeof MaterialCommunityIcons>['name']} color={color ?? colors.accent} size={size} />;
}
