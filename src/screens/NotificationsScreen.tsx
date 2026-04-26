import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification } from '../types/notification';

// ── SVG icons ──────────────────────────────────────────────────────────────────

/**
 * Outline briefcase — matches Figma: stroke-style, muted blue lines on
 * the light-blue (#D8E2F9) circle background.
 */
const BRIEFCASE_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="#6B86D8" stroke-width="2"/>
  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#6B86D8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="2" y1="13" x2="22" y2="13" stroke="#6B86D8" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/**
 * 4-pointed sparkle + two accent dots — matches Figma: green fill on
 * the light-green (#DCF6E6) circle background.
 */
const SPARKLE_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" fill="#3DBF6E"/>
  <circle cx="19.5" cy="4.5" r="1.4" fill="#3DBF6E"/>
  <circle cx="21.5" cy="8.5" r="0.9" fill="#3DBF6E"/>
</svg>`;

// ── Mock data ──────────────────────────────────────────────────────────────────

const TODAY_DATA: Notification[] = [
  {
    id: '1',
    type: 'application_status',
    title: 'Application Status Update',
    body: 'Your application for John Doe is now Under Review',
    createdAt: '5 hours ago',
    isRead: false,
    targetUserId: 'user123',
  },
];

const MONTH_DATA: Notification[] = [
  {
    id: '2',
    type: 'post_recommendation',
    title: 'New Post You Might Like',
    body: '3 new acting postings match your saved searches',
    createdAt: '3 days ago',
    isRead: false,
    targetUserId: 'user123',
  },
  {
    id: '3',
    type: 'application_status',
    title: 'Application Status Update',
    body: 'Your application for Jane Doe has been Accepted',
    createdAt: '1 week ago',
    isRead: true,
    targetUserId: 'user123',
  },
];

// ── NotifCard ─────────────────────────────────────────────────────────────────

const NotifCard = ({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (id: string) => void;
}) => {
  const isStatus = item.type === 'application_status';
  return (
    <TouchableOpacity
      style={styles.cardRow}
      onPress={() => onPress(item.id)}
      activeOpacity={0.8}
    >
      {/* Dot — LEFT of card. Bright white when unread, faint gray when read. */}
      <View style={styles.dotCol}>
        <View style={[styles.dot, item.isRead ? styles.dotRead : styles.dotUnread]} />
      </View>

      {/* White card */}
      <View style={styles.card}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: isStatus ? '#D8E2F9' : '#DCF6E6' }]}>
          <SvgXml xml={isStatus ? BRIEFCASE_SVG : SPARKLE_SVG} width={22} height={22} />
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardTime}>{item.createdAt}</Text>
          <Text style={styles.cardBody}>{item.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── SectionHeader ─────────────────────────────────────────────────────────────

const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ── NotificationsScreen ───────────────────────────────────────────────────────

export const NotificationsScreen = () => {
  const { top } = useSafeAreaInsets();
  const [todayItems, setTodayItems] = useState(TODAY_DATA);
  const [monthItems, setMonthItems] = useState(MONTH_DATA);

  const markRead = (id: string) => {
    setTodayItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setMonthItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  type ListRow =
    | { kind: 'header'; label: string; key: string }
    | { kind: 'notif'; item: Notification; key: string };

  const rows: ListRow[] = [
    { kind: 'header', label: 'Today', key: 'h-today' },
    ...todayItems.map(n => ({ kind: 'notif' as const, item: n, key: n.id })),
    { kind: 'header', label: 'This Month', key: 'h-month' },
    ...monthItems.map(n => ({ kind: 'notif' as const, item: n, key: n.id })),
  ];

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <Text style={styles.pageTitle}>Notifications</Text>
      <FlatList
        data={rows}
        keyExtractor={r => r.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row }) => {
          if (row.kind === 'header') return <SectionHeader label={row.label} />;
          return <NotifCard item={row.item} onPress={markRead} />;
        }}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C2C2C' },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 20,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },

  // Row: card takes up all flex, dot sits to its right
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111111' },
  cardTime:  { fontSize: 12, color: '#888888' },
  cardBody:  { fontSize: 14, color: '#333333', lineHeight: 20, marginTop: 2 },

  // Dot column — sits to the LEFT of each card
  dotCol: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  /** Unread — bright white, clearly visible against dark background */
  dotUnread: {
    backgroundColor: '#FFFFFF',
  },
  /** Read — faint gray, barely visible */
  dotRead: {
    backgroundColor: '#4A4A4A',
  },
});
