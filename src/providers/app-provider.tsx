import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useColorScheme } from 'react-native';
export const accents = ['#087F5B', '#2563EB', '#7C3AED', '#B54723'] as const;
type Preferences = { mode: 'system' | 'light' | 'dark'; accent: string; iconStyle: 'outline' | 'solid' };
export type Profile = { firstName: string; lastName: string; email: string; phone: string; dob: string; languages: string };
const emptyProfile: Profile = { firstName: '', lastName: '', email: '', phone: '', dob: '', languages: '' };
const defaults: Preferences = { mode: 'system', accent: accents[0], iconStyle: 'outline' };
function palette(dark: boolean, accent: string) {
  return { dark, accent, background: dark ? '#101D18' : '#F0F7F4', surface: dark ? '#1C2C24' : '#FFFFFF', text: dark ? '#EDF5EF' : '#203D2D', muted: dark ? '#A2B8AA' : '#788D80', border: dark ? '#31483A' : '#E2EBE4', tint: dark ? '#273E31' : '#E4F1E9', danger: dark ? '#FFA4A4' : '#B33434' };
}
export type AppColors = ReturnType<typeof palette>;
const Context = createContext<{
  preferences: Preferences; updatePreferences: (patch: Partial<Preferences>) => void; colors: AppColors;
  profile: Profile; saveProfile: Dispatch<SetStateAction<Profile>>; logout: () => void; preferenceError: string; cardId: string | null;
} | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [cardId, setCardId] = useState<string | null>(null);
  useEffect(() => { setCardId(Crypto.randomUUID()); }, []);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState('');
  const [profile, saveProfile] = useState<Profile>(emptyProfile);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('healthcare-appearance').then(raw => {
      if (!active || !raw) return;
      const p = JSON.parse(raw);
      setPreferences({ mode: ['system', 'light', 'dark'].includes(p.mode) ? p.mode : defaults.mode, accent: accents.includes(p.accent) ? p.accent : defaults.accent, iconStyle: p.iconStyle === 'solid' ? 'solid' : 'outline' });
    }).catch(() => { if (active) setPreferenceError('Saved appearance could not be loaded.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem('healthcare-appearance', JSON.stringify(preferences)).then(() => setPreferenceError('')).catch(() => setPreferenceError('Appearance changed, but could not be saved on this device.'));
  }, [preferences, ready]);
  const dark = preferences.mode === 'dark' || (preferences.mode === 'system' && system === 'dark');
  return <Context.Provider value={{ preferences, updatePreferences: patch => setPreferences(current => ({ ...current, ...patch })), colors: palette(dark, preferences.accent), profile, saveProfile, logout: () => { saveProfile({ ...emptyProfile }); setCardId(Crypto.randomUUID()); }, cardId, preferenceError }}>{children}</Context.Provider>;
}
export function useAppTheme() { const value = useContext(Context); if (!value) throw new Error('AppProvider is required'); return value; }
