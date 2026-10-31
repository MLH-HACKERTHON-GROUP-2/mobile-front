import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { AppIcon, type IconName } from '@/components/app-icon';
import { ZenArtwork } from '@/components/zen-artwork';
import { MindfulSession } from '@/components/mindful-session';
import { useBackend } from '@/providers/backend-provider';
import { useAppTheme } from '@/providers/app-provider';
const sessions: { title: string; minutes: number; icon: IconName; color: string; tint: string }[] = [
  { title: 'Sleep', minutes: 10, icon: 'moon', color: '#9B7ABD', tint: '#F5F1F9' },
  { title: 'Calm', minutes: 5, icon: 'cloud', color: '#7AA7CC', tint: '#F0F5FC' },
  { title: 'Focus', minutes: 15, icon: 'leaf', color: '#79A68B', tint: '#F1F6F2' },
  { title: 'Morning', minutes: 10, icon: 'sun', color: '#D5A66B', tint: '#FCF6EE' },
];
export default function CareScreen() {
  const { colors } = useAppTheme();
  const { patient } = useBackend();
  const [selected, setSelected] = useState<typeof sessions[number] | null>(null);
  const [progress, setProgress] = useState({ sessions: 0, minutes: 0 });
  const [ready, setReady] = useState(false);
  const [details, setDetails] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('healthcare-mindful-progress').then(raw => {
      if (!raw || !active) return;
      const value = JSON.parse(raw);
      if (Number.isInteger(value.sessions) && value.sessions >= 0 && Number.isInteger(value.minutes) && value.minutes >= 0) setProgress(value);
    }).catch(() => { if (active) setStorageError('Saved progress could not be loaded.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('healthcare-mindful-progress', JSON.stringify(progress)).catch(() => setStorageError('Progress could not be saved on this device.')); }, [progress, ready]);
  const complete = useCallback(() => { if (selected) setProgress(p => ({ sessions: p.sessions + 1, minutes: p.minutes + selected.minutes })); }, [selected]);
  const hour = new Date().getHours();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={s.page}>
    <View style={s.top}><Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={s.iconButton}><AppIcon name="menu" color={colors.text} size={29} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[s.avatar, { backgroundColor: colors.tint }]}><AppIcon name="profile" color={colors.muted} size={30} /></Pressable></View>
    <View style={s.welcome}><Text style={[s.greeting, { color: colors.text }]}>Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}</Text><View style={s.row}><Text style={{ fontSize: 15, color: colors.muted }}>Take a deep breath</Text><AppIcon name="leaf" color="#81A78A" size={20} /></View></View>
    <View style={[s.focus, { backgroundColor: colors.surface }]}><View style={{ flex: 1, gap: 12 }}><Text style={{ color: colors.muted, fontSize: 12 }}>Today’s focus</Text><Text style={{ color: colors.text, fontSize: 25, fontWeight: '600', letterSpacing: -0.6 }}>Stay present</Text><Text style={{ color: colors.muted, fontSize: 13 }}>One step at a time.</Text></View><ZenArtwork /></View>
    <Text style={[s.heading, { color: colors.text }]}>Start meditation</Text><View style={s.sessions}>{sessions.map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.minutes} minute silent session`} disabled={!ready} onPress={() => setSelected(item)} style={({ pressed }) => [s.session, { backgroundColor: colors.dark ? colors.surface : item.tint, opacity: pressed ? 0.6 : 1 }]}><AppIcon name={item.icon} size={30} color={item.color} /><Text style={{ color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 13 }}>{item.title}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{item.minutes} min</Text></Pressable>)}</View>
    <View style={s.sectionRow}><Text style={[s.heading, { color: colors.text, marginTop: 0 }]}>Your progress</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} hitSlop={10}><Text style={{ color: colors.accent, fontSize: 12 }}>{details ? 'View less' : 'View all'}</Text></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel="View mindfulness progress" onPress={() => setDetails(!details)} style={[s.progress, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={s.ring}><Svg width={86} height={86} viewBox="0 0 86 86"><Circle cx={43} cy={43} r={37} fill="none" stroke={colors.border} strokeWidth={4} /><Circle cx={43} cy={43} r={37} fill="none" stroke="#81AC8C" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${Math.min(progress.sessions / 5, 1) * 232.48} 232.48`} rotation={-90} origin="43,43" /></Svg><View style={s.ringText}><Text style={{ color: colors.text, fontSize: 22, fontWeight: '600' }}>{progress.sessions}</Text><Text style={{ color: colors.muted, fontSize: 9 }}>Sessions</Text></View></View><View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.muted, fontSize: 11 }}>Your mindful moments</Text><Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{progress.sessions ? 'Keep it going!' : 'Begin with a little pause'}</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 18 }}>{progress.minutes} mindful minutes completed.</Text></View><Text style={{ color: colors.muted, fontSize: 25 }}>›</Text></Pressable>
    {details && <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}>Your first goal is 5 completed sessions. Progress is saved on this device. Silent sessions count when their timer finishes.</Text>}{!!storageError && <Text style={{ color: colors.muted, fontSize: 11 }}>{storageError}</Text>}
    <View style={[s.quote, { backgroundColor: colors.surface }]}><AppIcon name="quote" size={27} color="#81AC8C" /><Text style={{ flex: 1, color: colors.text, fontSize: 14, lineHeight: 23 }}>A little pause can make room for a better day.</Text><AppIcon name="leaf" size={44} color="#88AB87" /></View>
    <Text style={[s.heading, { color: colors.text }]}>Your healthcare</Text><View style={s.links}>{([{ title: 'Lab tests', icon: 'lab', path: '/lab-tests' }, { title: 'Check-in', icon: 'scan', path: '/checkup' }, { title: 'Medications', icon: 'medication', path: '/medications' }] as const).map(link => <Pressable accessibilityRole="button" key={link.title} onPress={() => router.push(link.path)} style={[s.link, { backgroundColor: colors.surface, borderColor: colors.border }]}><AppIcon name={link.icon} size={23} /><Text style={{ color: colors.text, fontSize: 11 }}>{link.title}</Text></Pressable>)}</View><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 18 }}>Appointment booking is not available in this backend.</Text>
    {!!patient?.sessions.length && <><Text style={[s.heading, { color: colors.text }]}>Consultation history</Text>{[...patient.sessions].sort((a,b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)).map(session => <View key={session.id} style={[s.progress, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}><Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{session.hospital.name}</Text><Text style={{ color: colors.accent, fontSize: 11 }}>{session.status}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>Started {new Date(session.startedAt).toLocaleString()}</Text>{session.finalizedAt && <Text style={{ color: colors.muted, fontSize: 12 }}>Completed {new Date(session.finalizedAt).toLocaleString()}</Text>}{session.diagnosis && <Text style={{ color: colors.text, fontSize: 12, lineHeight: 20 }}>{session.diagnosis.notes}</Text>}</View>)}</>}
    {selected && <MindfulSession title={selected.title} minutes={selected.minutes} onComplete={complete} onClose={() => setSelected(null)} />}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({ page: { padding: 23, paddingBottom: 40, maxWidth: 660, width: '100%', alignSelf: 'center', gap: 15 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }, iconButton: { padding: 7, minWidth: 44, minHeight: 44 }, avatar: { width: 44, height: 44, borderRadius: 23, justifyContent: 'center', alignItems: 'center' }, welcome: { gap: 12, marginTop: 17, marginBottom: 11 }, greeting: { fontSize: 31, fontWeight: '600', letterSpacing: -1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 7 }, focus: { borderRadius: 23, paddingVertical: 17, paddingLeft: 21, paddingRight: 2, flexDirection: 'row', alignItems: 'center', minHeight: 155 }, heading: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3, marginTop: 10 }, sessions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, session: { flex: 1, minWidth: 61, borderRadius: 17, paddingVertical: 22, alignItems: 'center', gap: 7 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }, progress: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, borderWidth: 1, borderRadius: 22 }, ring: { width: 86, height: 86 }, ringText: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 3 }, quote: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, gap: 13, marginTop: 3 }, links: { flexDirection: 'row', gap: 9 }, link: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 17, alignItems: 'center', gap: 12 } });
