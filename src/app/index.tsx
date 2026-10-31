import { Redirect } from 'expo-router';
import { useBackend } from '@/providers/backend-provider';
export default function Index() { const { session } = useBackend(); return <Redirect href={!session ? '/login' : !session.user.profileComplete ? '/complete-profile' : '/home'} />; }
