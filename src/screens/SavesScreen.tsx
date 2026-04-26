import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Post } from '../types/post';
import { useSavesData, SavesApplication } from '../hooks/useSavesData';
import { ApplyScreen } from './ApplyScreen';

// ── Constants ─────────────────────────────────────────────────────────────────

const BG       = '#2D2C2C';
const CARD_BG  = '#F8F8F7';
const DETAIL_BG   = '#2D2C2C';
const DETAIL_CARD = '#FFFFFF';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_IMAGE_WIDTH = SCREEN_WIDTH - 64;

// ── Icons ─────────────────────────────────────────────────────────────────────

const LOCATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none">
  <path d="M14.714 13.8807C13.9864 14.6083 12.5188 16.0758 11.4134 17.1813C10.6323 17.9624 9.36751 17.9623 8.58646 17.1813C7.50084 16.0957 6.06038 14.6552 5.28587 13.8807C2.68238 11.2772 2.68238 7.05612 5.28587 4.45262C7.88937 1.84913 12.1105 1.84913 14.714 4.45262C17.3175 7.05612 17.3175 11.2772 14.714 13.8807Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.4999 9.16667C12.4999 10.5474 11.3806 11.6667 9.99992 11.6667C8.61921 11.6667 7.49992 10.5474 7.49992 9.16667C7.49992 7.78596 8.61921 6.66667 9.99992 6.66667C11.3806 6.66667 12.4999 7.78596 12.4999 9.16667Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none">
  <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ── Badge colors ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Saved:          { bg: '#E8E8E8',  text: '#888888' },
  Applied:        { bg: '#DDE5FF',  text: '#666666' },
  'Under Review': { bg: '#FFF8CC',  text: '#666666' },
  Accepted:       { bg: '#D5F5DA',  text: '#666666' },
  Rejected:       { bg: '#FFD9D9',  text: '#666666' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatAppliedAt(ts: SavesApplication['appliedAt']): string {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function cardDescription(post: Post): string {
  const raw =
    post.description?.trim() ||
    post.roles[0]?.description?.trim() ||
    `Looking for crew for "${post.filmName}"`;
  return raw.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
}

/** 'pending' / 'submitted' → "Applied"; 'under review' → "Under Review"; etc. */
function resolveBadge(status: string): string {
  const s = (status || '').toLowerCase().trim();
  if (!s || s === 'pending' || s === 'submitted' || s === 'applied') return 'Applied';
  if (s === 'under review') return 'Under Review';
  if (s === 'accepted') return 'Accepted';
  if (s === 'rejected') return 'Rejected';
  return 'Applied';
}

function isTerminal(status: string): boolean {
  const s = resolveBadge(status);
  return s === 'Accepted' || s === 'Rejected';
}

function sortByDate(apps: SavesApplication[]): SavesApplication[] {
  return [...apps].sort((a, b) =>
    (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0)
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ label }: { label: string }) => {
  const colors = STATUS_COLORS[label] ?? STATUS_COLORS.Saved;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

// ── SaveCard ──────────────────────────────────────────────────────────────────

interface SaveCardProps {
  post: Post;
  badgeLabel: string;
  dateLabel: string;
  locationLabel: string;
  description: string;
  avatarUrl?: string;
  rejectionReason?: string;
  actionLabel: 'Apply' | 'View Details';
  onAction: () => void;
}

const SaveCard = ({
  post,
  badgeLabel,
  dateLabel,
  locationLabel,
  description,
  avatarUrl,
  rejectionReason,
  actionLabel,
  onAction,
}: SaveCardProps) => {
  const images = post.media?.images ?? [];

  return (
    <View style={styles.card}>
      {/* Header: avatar · name · badge */}
      <View style={styles.cardHeader}>
        {avatarUrl
          ? <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          : <View style={styles.avatar} />
        }
        <Text style={styles.cardName}>{post.postedBy.name}</Text>
        <StatusBadge label={badgeLabel} />
      </View>

      {/* Location */}
      <View style={styles.metaRow}>
        <SvgXml xml={LOCATION_SVG} width={14} height={14} />
        <Text style={styles.metaText}>{locationLabel}</Text>
      </View>

      {/* Date */}
      <View style={styles.metaRow}>
        <SvgXml xml={CALENDAR_SVG} width={14} height={14} />
        <Text style={styles.metaText}>{dateLabel}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Images (if any) */}
      {images.length === 1 && (
        <Image source={{ uri: images[0].url }} style={styles.postImageFull} resizeMode="cover" />
      )}
      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.imageScroll} contentContainerStyle={styles.imageScrollContent}>
          {images.map(img => (
            <Image key={img.id} source={{ uri: img.url }} style={styles.postImage} resizeMode="cover" />
          ))}
        </ScrollView>
      )}

      {/* Feedback box — shown for Rejected (always, even if empty) */}
      {badgeLabel === 'Rejected' && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackLabel}>FEEDBACK</Text>
          <Text style={[styles.feedbackText, !rejectionReason && styles.feedbackPlaceholder]}>
            {rejectionReason || 'No feedback provided.'}
          </Text>
        </View>
      )}

      {/* Action button */}
      <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Post detail modal ─────────────────────────────────────────────────────────

const PostDetailModal = ({
  post,
  onClose,
  onApply,
}: {
  post: Post | null;
  onClose: () => void;
  onApply: (post: Post) => void;
}) => {
  if (!post) return null;
  const months = MONTHS;
  const start  = new Date(post.shootingTimeline.startDate);
  const end    = new Date(post.shootingTimeline.endDate);
  const dateRange = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
  const deadline  = new Date(post.recruitmentDeadline);
  const deadlineStr = `${months[deadline.getMonth()]} ${deadline.getDate()}, ${deadline.getFullYear()}`;
  const images = post.media?.images ?? [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.container}>
        <View style={detailStyles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={detailStyles.backText}>← Back</Text>
          </Pressable>
        </View>
        <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={detailStyles.posterRow}>
            <View style={detailStyles.posterAvatar} />
            <View>
              <Text style={detailStyles.posterName}>{post.postedBy.name}</Text>
              {post.postedBy.school
                ? <Text style={detailStyles.posterSchool}>{post.postedBy.school}</Text>
                : null}
            </View>
          </View>
          <Text style={detailStyles.filmName}>{post.filmName}</Text>
          {post.director.length > 0 && (
            <Text style={detailStyles.director}>directed by {post.director.join(', ')}</Text>
          )}
          <View style={detailStyles.metaBlock}>
            <Text style={detailStyles.metaItem}>{post.shootingLocation.city}, {post.shootingLocation.state}</Text>
            <Text style={detailStyles.metaItem}>{dateRange}</Text>
            <Text style={detailStyles.metaItem}>Apply by {deadlineStr}</Text>
          </View>
          <Text style={detailStyles.sectionTitle}>Roles</Text>
          {post.roles.map((role, i) => (
            <View key={i} style={detailStyles.roleCard}>
              <Text style={detailStyles.roleTitle}>{role.title}</Text>
              <Text style={detailStyles.roleType}>{role.type}</Text>
              <Text style={detailStyles.roleDesc}>{role.description}</Text>
            </View>
          ))}
          {images.length > 0 && (
            <>
              <Text style={detailStyles.sectionTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={detailStyles.imageScroll} contentContainerStyle={detailStyles.imageScrollContent}>
                {images.map(img => (
                  <Image key={img.id} source={{ uri: img.url }} style={detailStyles.detailImage} resizeMode="cover" />
                ))}
              </ScrollView>
            </>
          )}
          <Pressable style={detailStyles.applyButton} onPress={() => { onApply(post); onClose(); }}>
            <Text style={detailStyles.applyButtonText}>Apply</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

type TabType = 'Saved' | 'Applied' | 'Past';

export const SavesScreen = () => {
  const { top } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('Saved');
  const { savedPostId, applications, postsById, posterHeadshotById, loading } = useSavesData();
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const savedPosts = useMemo(
    () => savedPostId.map(id => postsById[id]).filter(Boolean) as Post[],
    [savedPostId, postsById]
  );

  const activeApps = useMemo(
    () => sortByDate(applications.filter(a => !isTerminal(a.status))),
    [applications]
  );

  const pastApps = useMemo(
    () => sortByDate(applications.filter(a => isTerminal(a.status))),
    [applications]
  );

  const counts = {
    Saved:   savedPosts.length,
    Applied: activeApps.length,
    Past:    pastApps.length,
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderSaved = ({ item: post }: { item: Post }) => (
    <SaveCard
      post={post}
      badgeLabel="Saved"
      locationLabel={post.postedBy.school || `${post.shootingLocation.city}, ${post.shootingLocation.state}`}
      dateLabel={formatDate(post.recruitmentDeadline)}
      description={cardDescription(post)}
      actionLabel="Apply"
      onAction={() => setApplyPost(post)}
    />
  );

  const renderApplied = ({ item: app }: { item: SavesApplication }) => {
    const post = postsById[app.postId];
    if (!post) return null;
    return (
      <SaveCard
        post={post}
        badgeLabel={resolveBadge(app.status)}
        locationLabel={post.postedBy.school || `${post.shootingLocation.city}, ${post.shootingLocation.state}`}
        dateLabel={formatAppliedAt(app.appliedAt) || formatDate(post.recruitmentDeadline)}
        description={cardDescription(post)}
        actionLabel="View Details"
        onAction={() => setDetailPost(post)}
      />
    );
  };

  const renderPast = ({ item: app }: { item: SavesApplication }) => {
    const post = postsById[app.postId];
    if (!post) return null;
    return (
      <SaveCard
        post={post}
        badgeLabel={resolveBadge(app.status)}
        locationLabel={post.postedBy.school || `${post.shootingLocation.city}, ${post.shootingLocation.state}`}
        dateLabel={formatAppliedAt(app.appliedAt) || formatDate(post.recruitmentDeadline)}
        description={cardDescription(post)}
        rejectionReason={app.rejectionReason}
        actionLabel="View Details"
        onAction={() => setDetailPost(post)}
      />
    );
  };

  const emptyText =
    activeTab === 'Saved'   ? 'No saved posts yet.\nBrowse the home feed and save posts you like.' :
    activeTab === 'Applied' ? 'No applications in progress.' :
                              'No past applications.';

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Tab row */}
      <View style={styles.tabRow}>
        {(['Saved', 'Applied', 'Past'] as TabType[]).map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab} ({counts[tab]})
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : activeTab === 'Saved' ? (
        <FlatList
          data={savedPosts}
          keyExtractor={item => item.id}
          renderItem={renderSaved}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.emptyText}>{emptyText}</Text></View>}
        />
      ) : activeTab === 'Applied' ? (
        <FlatList
          data={activeApps}
          keyExtractor={a => a.id}
          renderItem={renderApplied}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.emptyText}>{emptyText}</Text></View>}
        />
      ) : (
        <FlatList
          data={pastApps}
          keyExtractor={a => a.id}
          renderItem={renderPast}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.emptyText}>{emptyText}</Text></View>}
        />
      )}

      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onApply={p => { setDetailPost(null); setApplyPost(p); }}
      />
      <ApplyScreen post={applyPost} visible={applyPost !== null} onClose={() => setApplyPost(null)} />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap:   { paddingVertical: 60, paddingHorizontal: 32, alignItems: 'center' },
  emptyText:   { color: '#AAAAAA', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabItemActive: {},          // kept for future use
  tabText:       { color: '#888888', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12, flexGrow: 1 },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#C7C7C7' },
  cardName: { flex: 1, color: '#111111', fontSize: 15, fontWeight: '700' },

  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#545F71', fontSize: 13 },

  description: { color: '#111111', fontSize: 14, lineHeight: 20, marginTop: 2 },

  // Images
  imageScroll:        { marginTop: 6, marginHorizontal: -16 },
  imageScrollContent: { paddingHorizontal: 16, gap: 8 },
  postImage:     { width: 220, height: 150, borderRadius: 10, backgroundColor: '#D8E4F0' },
  postImageFull: { width: CARD_IMAGE_WIDTH, height: 150, borderRadius: 10, backgroundColor: '#D8E4F0', marginTop: 6 },

  // Feedback box
  feedbackBox: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: '#FFB5B5',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFF5F5',
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C0392B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  feedbackText:        { fontSize: 13, color: '#333333', lineHeight: 18 },
  feedbackPlaceholder: { color: '#AAAAAA' },

  // Action button
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DETAIL_BG },
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3D3D3D',
  },
  backText:   { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  scroll:     { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  posterRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  posterAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C0C4CC' },
  posterName:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  posterSchool: { color: '#AAAAAA', fontSize: 13, marginTop: 2 },
  filmName:   { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  director:   { color: '#AAAAAA', fontSize: 14, marginBottom: 16 },
  metaBlock:  { gap: 6, marginBottom: 4 },
  metaItem:   { color: '#CCCCCC', fontSize: 14 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  roleCard:   { backgroundColor: DETAIL_CARD, borderRadius: 12, padding: 14, marginBottom: 10 },
  roleTitle:  { color: '#111111', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  roleType:   { color: '#888888', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  roleDesc:   { color: '#333333', fontSize: 14, lineHeight: 20 },
  imageScroll:        { marginHorizontal: -20 },
  imageScrollContent: { paddingHorizontal: 20, gap: 8 },
  detailImage: { width: 260, height: 180, borderRadius: 10, backgroundColor: '#D8E4F0' },
  applyButton: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
