import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { Card, Heading, Note, Page, ui } from '@/components/screen-ui';
import { useAppTheme } from '@/providers/app-provider';
const samples = [
  { title: 'Complete blood count', description: 'A blood sample used to measure red cells, white cells, and platelets.', date: '28 Oct 2026', time: '09:30' },
  { title: 'Blood glucose test', description: 'A laboratory measurement of the glucose level in a blood sample.', date: '15 Oct 2026', time: '08:15' },
  { title: 'Lipid panel', description: 'A blood test that measures cholesterol and triglycerides.', date: '02 Oct 2026', time: '10:45' },
];
export default function LabTestsScreen() {
  const { colors } = useAppTheme();
  const [demo, setDemo] = useState(false);
  const [search, setSearch] = useState('');
  const tests = demo ? samples.filter(test => `${test.title} ${test.description}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <Page title="My lab tests" subtitle="Your test history, simply organised." back>
    <View style={ui.between}><Note>Preview sample test cards</Note><Switch accessibilityLabel="Show sample lab tests" value={demo} onValueChange={setDemo} trackColor={{ true: colors.accent }} /></View>
    {demo && <Note>Sample records for preview. These are not your medical records.</Note>}
    <View style={[ui.row, { paddingHorizontal: 15, backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.border }]}><AppIcon name="search" size={20} /><TextInput accessibilityLabel="Search lab tests" value={search} onChangeText={setSearch} placeholder="Search your tests" placeholderTextColor={colors.muted} style={{ flex: 1, minWidth: 0, paddingVertical: 16, color: colors.text }} /></View>
    <Heading>{demo ? `${tests.length} sample tests` : 'Test history'}</Heading>
    {tests.map(test => <Card key={test.title}><View style={ui.between}><View style={{ backgroundColor: colors.tint, padding: 12, borderRadius: 14 }}><AppIcon name="lab" /></View><Text style={{ color: colors.accent, backgroundColor: colors.tint, padding: 8, borderRadius: 9, fontSize: 10 }}>Completed · Sample</Text></View><Heading>{test.title}</Heading><Note>{test.description}</Note><View style={[ui.row, { borderTopWidth: 1, borderColor: colors.border, paddingTop: 14, flexWrap: 'wrap' }]}><AppIcon name="calendar" size={17} /><Note>{test.date}</Note><AppIcon name="clock" size={17} /><Note>{test.time}</Note></View></Card>)}
    {!tests.length && <Card><AppIcon name="lab" size={35} /><Heading>{demo ? 'No matching tests' : 'No tests recorded yet'}</Heading><Note>{demo ? 'Try searching for a different test.' : 'Your backend does not expose lab-test records yet. Sample cards are available for preview.'}</Note></Card>}
  </Page>;
}
