import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from './app-icon';
export function DashboardSection({ title, icon, description }: { title: string; icon: IconName; description: string }) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>{title}</Text><View style={styles.card}><AppIcon name={icon} size={36} /><Text style={styles.heading}>{title === 'Care' ? 'Your care, in one place' : title === 'Profile' ? 'Your personal health profile' : 'Make it yours'}</Text><Text style={styles.description}>{description}</Text>{title === 'Profile' && <Link href="/login" style={styles.link}>Log in or create an account →</Link>}</View></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F5F8F5' }, content: { padding: 24, maxWidth: 680, width: '100%', alignSelf: 'center' }, title: { color: '#193D2D', fontSize: 28, fontWeight: '700', marginVertical: 24 }, card: { backgroundColor: '#FFFFFF', padding: 26, borderRadius: 24, gap: 18, borderWidth: 1, borderColor: '#E8EEE8' }, heading: { fontSize: 20, fontWeight: '600', color: '#193D2D' }, description: { fontSize: 14, color: '#7D9082', lineHeight: 23 }, link: { color: '#087F5B', fontSize: 14, fontWeight: '600', paddingVertical: 12 } });
