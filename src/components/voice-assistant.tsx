import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useAppTheme } from '@/providers/app-provider';
import { AppIcon } from './app-icon';
import { Note, ui } from './screen-ui';
export function VoiceAssistant({ onChat }: { onChat: () => void }) {
  const { colors } = useAppTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const operation = useRef(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(uri);
  const playback = useAudioPlayerStatus(player);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      // The web recorder needs an explicit stop to release microphone tracks.
      if (Platform.OS === 'web') { try { if (recorder.isRecording) void recorder.stop().catch(() => {}); } catch {} }
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);
  useEffect(() => {
    if (!state.isRecording) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.07, duration: 1000, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [state.isRecording, pulse]);
  async function toggle() {
    if (operation.current) return;
    operation.current = true; setBusy(true); setError('');
    try {
      if (recorder.isRecording) {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        if (active.current) setUri(recorder.uri);
      } else {
        player.pause();
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!active.current) return;
        if (!permission.granted) { setError('Microphone access was denied. Enable it in device settings, or switch to Chat.'); return; }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!active.current) { recorder.record(); await recorder.stop(); return; }
        setUri(null); recorder.record();
      }
    } catch { if (active.current) setError('Audio is unavailable. Check microphone access and try again, or use Chat.'); }
    finally { operation.current = false; if (active.current) setBusy(false); }
  }
  async function play() {
    try { if (playback.playing) player.pause(); else { await player.seekTo(0); player.play(); } }
    catch { setError('This recording could not be played. Try recording again.'); }
  }
  const seconds = Math.floor(state.durationMillis / 1000);
  const level = state.isRecording ? Math.max(0.1, Math.min(1, ((state.metering ?? -35) + 60) / 60)) : 0.12;
  return <View style={s.page}>
    <View style={[s.badge, { backgroundColor: colors.surface + 'BB' }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: state.isRecording ? '#D35B68' : colors.accent }} /><Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 10, letterSpacing: 1.4 }}>{state.isRecording ? 'RECORDING YOUR VOICE' : uri ? 'RECORDING READY' : 'A MOMENT TO BE HEARD'}</Text></View>
    <View style={s.orbArea}><View style={[s.outerRing, { borderColor: colors.accent + '15' }]} /><View style={[s.innerRing, { borderColor: colors.accent + '22' }]} /><Animated.View style={{ transform: [{ scale: pulse }] }}><Pressable accessibilityRole="button" accessibilityLabel={state.isRecording ? 'Stop recording' : 'Start voice recording'} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void toggle()}><LinearGradient colors={[colors.accent + '55', colors.accent, colors.accent + 'CC']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.orb}><View style={s.shine} /><AppIcon name={state.isRecording ? 'stop' : 'voice'} size={52} color="#FFFFFF" /></LinearGradient></Pressable></Animated.View></View>
    <Text style={{ color: colors.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.5 }}>{state.isRecording ? 'I’m listening.' : uri ? 'Your moment, captured.' : 'What’s on your mind?'}</Text><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: 'center', maxWidth: 275 }}>{state.isRecording ? 'Speak at your own pace. Tap the microphone to stop.' : uri ? 'Listen back, or record another voice note.' : 'Tap the microphone to record a voice note. There’s no rush.'}</Text>
    <View style={s.wave} accessibilityLabel={state.isRecording ? 'Microphone audio level' : 'Microphone is off'}>{Array.from({ length: 19 }, (_, index) => <View key={index} style={{ width: 3, borderRadius: 3, height: 5 + (12 + Math.sin(index * 1.7) * 11) * level * 2, backgroundColor: colors.accent, opacity: state.isRecording ? 0.8 : 0.3 }} />)}</View>
    {(state.isRecording || uri) && <Text style={{ color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</Text>}
    {uri && !state.isRecording && <View style={ui.row}><Pressable accessibilityRole="button" accessibilityLabel={playback.playing ? 'Pause voice note' : 'Play voice note'} onPress={() => void play()} style={[s.control, { backgroundColor: colors.surface }]}><AppIcon name={playback.playing ? 'pause' : 'play'} size={22} /><Text style={{ color: colors.text, fontSize: 12 }}>{playback.playing ? 'Pause' : 'Listen back'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete voice note" onPress={() => { player.pause(); setUri(null); }} style={[s.control, { backgroundColor: colors.surface }]}><AppIcon name="close" size={19} color={colors.muted} /><Text style={{ color: colors.muted, fontSize: 12 }}>Discard</Text></Pressable></View>}
    {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 12, lineHeight: 19, textAlign: 'center' }}>{error}</Text>}
    <View style={{ paddingTop: 18, alignItems: 'center', gap: 10 }}><Note>Voice notes stay on this device. AI replies are not connected yet.</Note><Pressable accessibilityRole="button" onPress={onChat} style={{ padding: 12 }}><Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>Prefer to type? Open Chat →</Text></Pressable></View>
  </View>;
}
const s = StyleSheet.create({ page: { alignItems: 'center', gap: 14, paddingBottom: 16 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 }, orbArea: { width: 250, height: 245, alignItems: 'center', justifyContent: 'center' }, outerRing: { position: 'absolute', width: 238, height: 238, borderRadius: 120, borderWidth: 1 }, innerRing: { position: 'absolute', width: 205, height: 205, borderRadius: 103, borderWidth: 1 }, orb: { width: 170, height: 170, borderRadius: 85, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0px 14px 35px #087F5B22' }, shine: { position: 'absolute', top: 16, left: 29, width: 85, height: 42, backgroundColor: '#FFFFFF25', borderRadius: 45, transform: [{ rotate: '-30deg' }] }, wave: { height: 45, flexDirection: 'row', alignItems: 'center', gap: 5 }, control: { paddingHorizontal: 17, paddingVertical: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7 } });
