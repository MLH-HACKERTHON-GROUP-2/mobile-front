import { useEffect, useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Action, Heading, Note, ui } from './screen-ui';
import { AppIcon } from './app-icon';
import { useAppTheme } from '@/providers/app-provider';
export function MindfulSession({ title, minutes, onClose, onComplete }: { title: string; minutes: number; onClose: () => void; onComplete: () => void }) {
  const { colors } = useAppTheme();
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const completed = useRef(false);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !completed.current) { completed.current = true; setRunning(false); onComplete(); }
    };
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [running, onComplete]);
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#10231B77', padding: 25 }}><View accessibilityViewIsModal style={[ui.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', maxWidth: 420, width: '100%', alignSelf: 'center', gap: 22 }]}><AppIcon name="leaf" size={35} /><Heading>{title}</Heading><Note>Silent mindfulness timer · No audio track</Note><Text style={{ fontSize: 52, color: colors.text, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}</Text><Note>{completed.current ? 'Your session is complete. A little moment, just for you.' : 'Settle into a comfortable position and take a quiet moment.'}</Note><View style={{ width: '100%', gap: 10 }}>{!completed.current && <Action title={running ? 'Pause session' : remaining === minutes * 60 ? 'Begin session' : 'Resume session'} icon={running ? 'pause' : 'play'} onPress={() => { if (running) setRunning(false); else { deadline.current = Date.now() + remaining * 1000; setRunning(true); } }} />}<Action title={completed.current ? 'Done' : 'Close session'} secondary onPress={onClose} /></View></View></View></Modal>;
}
