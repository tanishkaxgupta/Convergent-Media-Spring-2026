// PLACEHOLDER — update once Figma is finalized
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

const BG = '#2D2C2C';
const CARD_BG = '#F8F8F7';

const LOCATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M14.714 13.8807C13.9864 14.6083 12.5188 16.0758 11.4134 17.1813C10.6323 17.9624 9.36751 17.9623 8.58646 17.1813C7.50084 16.0957 6.06038 14.6552 5.28587 13.8807C2.68238 11.2772 2.68238 7.05612 5.28587 4.45262C7.88937 1.84913 12.1105 1.84913 14.714 4.45262C17.3175 7.05612 17.3175 11.2772 14.714 13.8807Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.4999 9.16667C12.4999 10.5474 11.3806 11.6667 9.99992 11.6667C8.61921 11.6667 7.49992 10.5474 7.49992 9.16667C7.49992 7.78596 8.61921 6.66667 9.99992 6.66667C11.3806 6.66667 12.4999 7.78596 12.4999 9.16667Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const MOCK_SAVES = [
  { id: '1', name: 'John Doe', university: 'University of Texas at Austin', date: 'Apr 10, 2026', description: "we're working on a short film and need some help!", status: 'Saved' },
  { id: '2', name: 'Jane Doe', university: 'University of Texas at Austin', date: 'Apr 20, 2026', description: 'i would love to do sfx makeup like this for a horror film! looking for models or projects', status: 'Saved' },
];

const MOCK_APPLIED = [
  { id: '1', name: 'John Doe', university: 'University of Texas at Austin', date: 'Apr 10, 2026', description: "we're working on a short film and need some help!", status: 'Applied' },
  { id: '2', name: 'Jane Doe', university: 'University of Texas at Austin', date: 'Apr 20, 2026', description: 'i would love to do sfx makeup like this for a horror film! looking for models or projects', status: 'Under Review' },
];

const MOCK_PAST = [
  { id: '1', name: 'John Doe', university: 'University of Texas at Austin', date: 'Apr 10, 2026', description: "we're working on a short film and need some help!", status: 'Rejected' },
  { id: '2', name: 'Jane Doe', university: 'University of Texas at Austin', date: 'Apr 20, 2026', description: 'i would love to do sfx makeup like this for a horror film! looking for models or projects', status: 'Accepted' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Saved:          { bg: '#C7C7C7', text: '#545F71' },
  Applied:        { bg: '#C8D7FB', text: '#545F71'},
  'Under Review': { bg: '#FFF0AF', text: '#545F71' },
  Accepted:       { bg: '#C2F0C9', text: '#545F71' },
  Rejected:       { bg: '#FFB5B5', text: '#545F71' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS['Saved'];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

type CardItem = {
  id: string; name: string; university: string;
  date: string; description: string; status: string;
};

const SaveCard = ({ item, showApply }: { item: CardItem; showApply: boolean }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.name}</Text>
      </View>
      <StatusBadge status={item.status} />
    </View>
    <View style={styles.metaRow}>
      <SvgXml xml={LOCATION_SVG} width={16} height={16} />
      <Text style={styles.metaText}>{item.university}</Text>
    </View>
    <View style={styles.metaRow}>
      <SvgXml xml={CALENDAR_SVG} width={16} height={16} />
      <Text style={styles.metaText}>{item.date}</Text>
    </View>
    <Text style={styles.description}>{item.description}</Text>
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>{showApply ? 'Apply' : 'View Details'}</Text>
    </TouchableOpacity>
  </View>
);

type TabType = 'Saved' | 'Applied' | 'Past';

export const SavesScreen = () => {
  const { top } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('Saved');

  const data =
    activeTab === 'Saved' ? MOCK_SAVES :
    activeTab === 'Applied' ? MOCK_APPLIED :
    MOCK_PAST;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.tabRow}>
        {(['Saved', 'Applied', 'Past'] as TabType[]).map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab} (2)
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SaveCard item={item} showApply={activeTab === 'Saved'} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
    marginBottom: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText: { color: '#888888', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: '#FFFFFF', borderRadius: 1,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: CARD_BG, borderRadius: 10, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#C7C7C7' },
  cardName: { color: '#000000', fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#545F71', fontSize: 13 },
  description: { color: '#000000', fontSize: 14, lineHeight: 20, marginTop: 4 },
  button: {
    backgroundColor: '#2D2C2C', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});