import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/app-provider';
import { AppIcon, type IconName } from './app-icon';
import { VoiceAssistant } from './voice-assistant';
import { ui } from './screen-ui';
type Attachment = { uri: string; name: string; image: boolean; size?: number };
export function AiDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors, profile } = useAppTheme();
  const [mode, setMode] = useState<'chat' | 'voice'>('voice');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function pick(kind: 'file' | 'image') {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      let selected: Attachment[] = [];
      if (kind === 'file') {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'text/plain', 'image/*'], multiple: true, copyToCacheDirectory: true });
        if (!result.canceled) selected = result.assets.map(a => ({ uri: a.uri, name: a.name, image: a.mimeType?.startsWith('image/') ?? false, size: a.size }));
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8 });
        if (!result.canceled) selected = result.assets.map(a => ({ uri: a.uri, name: a.fileName ?? 'Selected image', image: true, size: a.fileSize }));
      }
      if (!selected.length) return;
      if (selected.some(a => a.size === undefined || a.size > 10 * 1024 * 1024)) { setMessage('Choose files with a known size of 10 MB or less.'); return; }
      const combined = [...attachments, ...selected].filter((a, index, all) => all.findIndex(b => b.uri === a.uri) === index);
      if (combined.length > 5) { setMessage('You can attach up to 5 files. Remove a file to add another.'); return; }
      setAttachments(combined);
    } catch { setMessage('The picker could not open. Please try again.'); }
    finally { setBusy(false); }
  }
  const suggestions: { title: string; icon: IconName; color: string }[] = [
    { title: 'Help me understand\nmy lab results', icon: 'lab', color: '#B45BB5' },
    { title: 'What should I ask\nmy doctor?', icon: 'care', color: '#329BBC' },
    { title: 'Help me organise\nmy medications', icon: 'medication', color: '#D6608D' },
    { title: 'Prepare for my\nnext checkup', icon: 'heart', color: '#BA942B' },
  ];
  function send() { setMessage('AI responses are not connected yet. Your question and attachments have not been sent.'); }
  return <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { setMode('voice'); onClose(); }}>
    <LinearGradient colors={colors.dark ? ['#14231C', '#193C2B', '#254936'] : ['#FFFFFF', '#F0FAF7', colors.accent + '38']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}><KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Close AI assistant" onPress={() => { setMode('voice'); onClose(); }} style={[s.round, { backgroundColor: colors.surface + 'AA' }]}><AppIcon name="close" size={21} color={colors.muted} /></Pressable>
          <View style={[s.tabs, { backgroundColor: colors.surface + '66' }]}>{(['chat', 'voice'] as const).map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: mode === tab }} onPress={() => { setMode(tab); setMessage(''); }} style={[s.tab, { backgroundColor: mode === tab ? colors.surface : 'transparent' }]}><AppIcon name={tab === 'chat' ? 'ai' : 'voice'} size={15} color={mode === tab ? colors.accent : colors.muted} /><Text style={{ fontSize: 12, color: mode === tab ? colors.accent : colors.muted, textTransform: 'capitalize' }}>{tab}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="About this AI preview" onPress={() => setMessage('This is an AI interface preview. Voice notes can be recorded and played locally. AI replies and file analysis are not connected yet.')} style={[s.round, { backgroundColor: colors.surface + 'AA' }]}><AppIcon name="info" size={20} color={colors.muted} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={s.body}>
          <View style={s.greeting}><View style={ui.row}><AppIcon name="ai" size={19} /><Text style={{ color: colors.muted, fontSize: 13 }}>Hello{profile.firstName ? ', ' + profile.firstName : ', welcome'}</Text></View><Text style={[s.title, { color: colors.text }]}>{mode === 'chat' ? 'How can I help?' : 'Let’s talk about your care.'}</Text></View>
          {mode === 'chat' ? <View style={s.grid}>{suggestions.map(item => <Pressable key={item.title} accessibilityRole="button" onPress={() => { setPrompt(item.title.replace('\n', ' ')); setMessage(''); }} style={({ pressed }) => [s.suggestion, { backgroundColor: colors.surface + 'B3', borderColor: colors.dark ? colors.border : '#FFFFFFDD', opacity: pressed ? 0.65 : 1 }]}><AppIcon name={item.icon} size={24} color={item.color} /><Text style={{ color: colors.dark ? colors.text : item.color, fontSize: 13, lineHeight: 19, fontWeight: '500' }}>{item.title}</Text></Pressable>)}</View> : open ? <VoiceAssistant onChat={() => setMode('chat')} /> : null}
          {mode === 'chat' && <View style={s.intro}><Text style={{ color: colors.text, fontSize: 13, lineHeight: 21, textAlign: 'center' }}>{'I’m your healthcare assistant.\nA little clarity for your care journey.\nAI responses are coming soon.'}</Text></View>}
          {!!message && <View style={[s.notice, { backgroundColor: colors.surface + 'BB' }]}><Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 12, lineHeight: 19 }}>{message}</Text></View>}
        </ScrollView>
        {mode === 'chat' && <View style={s.composerArea}>
          {!!attachments.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>{attachments.map(a => <View key={a.uri} style={[s.attachment, { backgroundColor: colors.surface }]}>{a.image ? <Image source={{ uri: a.uri }} style={s.thumbnail} contentFit="cover" /> : <AppIcon name="file" size={18} />}<Text numberOfLines={1} style={{ maxWidth: 115, color: colors.text, fontSize: 11 }}>{a.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + a.name} onPress={() => setAttachments(current => current.filter(file => file.uri !== a.uri))} style={{ padding: 8 }}><AppIcon name="close" size={16} color={colors.muted} /></Pressable></View>)}</ScrollView>}
          <View style={s.uploads}><Pressable accessibilityRole="button" disabled={busy} onPress={() => void pick('file')} style={s.upload}><AppIcon name="file" size={17} /><Text style={{ color: colors.text, fontSize: 11 }}>Upload file</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => void pick('image')} style={s.upload}><AppIcon name="image" size={17} /><Text style={{ color: colors.text, fontSize: 11 }}>Upload image</Text></Pressable></View>
          <View style={s.composerRow}><View style={[s.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput accessibilityLabel="Question for AI assistant" value={prompt} onChangeText={setPrompt} placeholder="Ask anything..." placeholderTextColor={colors.muted} multiline maxLength={2000} selectionColor={colors.accent} cursorColor={colors.accent} underlineColorAndroid="transparent" style={{ color: colors.text, width: '100%', minWidth: 0, fontSize: 16, lineHeight: 22, height: 72, paddingVertical: 8, textAlignVertical: 'top', backgroundColor: 'transparent' }} /></View><Pressable accessibilityRole="button" accessibilityLabel={prompt.trim() ? 'Send message' : 'Open Voice'} disabled={busy} onPress={() => prompt.trim() ? send() : setMode('voice')} style={[s.send, { backgroundColor: colors.accent, opacity: busy ? 0.5 : 1 }]}><AppIcon name={prompt.trim() ? 'send' : 'voice'} color="#FFFFFF" size={21} /></Pressable></View><Text style={{ color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 10 }}>Files stay on your device · Up to 5 files · 10 MB each</Text>
        </View>}
      </KeyboardAvoidingView></SafeAreaView>
    </LinearGradient>
  </Modal>;
}
const s = StyleSheet.create({
  page: { flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center', paddingHorizontal: 23 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, paddingBottom: 16 },
  round: { width: 38, height: 38, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, tabs: { flexDirection: 'row', padding: 4, borderRadius: 22 }, tab: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 14, gap: 5, borderRadius: 18, alignItems: 'center' },
  body: { flexGrow: 1, paddingBottom: 20 }, greeting: { alignItems: 'center', gap: 13, paddingTop: 27, paddingBottom: 35 }, title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.7 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, suggestion: { flexBasis: '45%', flexGrow: 1, borderWidth: 1.5, borderRadius: 23, padding: 18, minHeight: 120, justifyContent: 'space-between', gap: 13 }, intro: { alignItems: 'center', paddingVertical: 35, paddingHorizontal: 20, flexGrow: 1, justifyContent: 'center' }, notice: { padding: 15, borderRadius: 16, marginBottom: 10 }, voicePreview: { borderRadius: 25, padding: 28, alignItems: 'center', gap: 20 }, composerArea: { flexShrink: 0, paddingTop: 8, paddingBottom: 14 }, composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 }, composer: { flex: 1, borderWidth: 2, borderRadius: 25, paddingHorizontal: 17, paddingVertical: 12 }, send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, uploads: { flexDirection: 'row', justifyContent: 'center', gap: 23, paddingBottom: 12 }, upload: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9 }, attachment: { flexDirection: 'row', gap: 7, alignItems: 'center', borderRadius: 13, paddingLeft: 9 }, thumbnail: { width: 30, height: 30, borderRadius: 7 },
});
