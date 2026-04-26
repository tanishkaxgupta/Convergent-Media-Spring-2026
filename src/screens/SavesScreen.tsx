// PLACEHOLDER — update once Figma is finalized
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

const BG = '#2D2C2C';
const CARD_BG = '#F8F8F7';
const DETAIL_BG = '#2D2C2C';
const DETAIL_CARD = '#FFFFFF';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_IMAGE_WIDTH = SCREEN_WIDTH - 64;

const LOCATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M14.714 13.8807C13.9864 14.6083 12.5188 16.0758 11.4134 17.1813C10.6323 17.9624 9.36751 17.9623 8.58646 17.1813C7.50084 16.0957 6.06038 14.6552 5.28587 13.8807C2.68238 11.2772 2.68238 7.05612 5.28587 4.45262C7.88937 1.84913 12.1105 1.84913 14.714 4.45262C17.3175 7.05612 17.3175 11.2772 14.714 13.8807Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.4999 9.16667C12.4999 10.5474 11.3806 11.6667 9.99992 11.6667C8.61921 11.6667 7.49992 10.5474 7.49992 9.16667C7.49992 7.78596 8.61921 6.66667 9.99992 6.66667C11.3806 6.66667 12.4999 7.78596 12.4999 9.16667Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#545F71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Saved: { bg: '#C7C7C7', text: '#545F71' },
  Applied: { bg: '#C8D7FB', text: '#545F71' },
  'Under Review': { bg: '#FFF0AF', text: '#545F71' },
  Accepted: { bg: '#C2F0C9', text: '#545F71' },
  Rejected: { bg: '#FFB5B5', text: '#545F71' },
};

const MOCK_AVATAR_BY_POST_ID: Record<string, string> = {
  'mock-1': 'https://i.pravatar.cc/120?img=5',
  'mock-2': 'https://i.pravatar.cc/120?img=12',
  'mock-3': 'https://i.pravatar.cc/120?img=20',
  'mock-4': 'https://i.pravatar.cc/120?img=28',
};



function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatAppliedAt(ts: SavesApplication['appliedAt']): string {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function cardDescription(post: Post): string {
  const raw =
    post.description?.trim() ||
    post.roles[0]?.description?.trim() ||
    `Looking for crew for "${post.filmName}"`;
  const firstParagraph = raw.split(/\n\s*\n/)[0] ?? raw;
  return firstParagraph.replace(/\s+/g, ' ').trim();
}

function applicationStatusKey(status: string): string {
  return (status || 'pending').toLowerCase().trim() || 'pending';
}

function applicationIsTerminal(status: string): boolean {
  const s = applicationStatusKey(status);
  return s === 'accepted' || s === 'rejected';
}

function applicationBadgeStatus(status: string): string {
  const s = applicationStatusKey(status);
  if (s === 'pending' || s === 'submitted' || s === 'applied' || s === 'under review') return 'Under Review';
  if (s === 'accepted') return 'Accepted';
  if (s === 'rejected') return 'Rejected';
  return status || 'Under Review';
}

function sortApplicationsByDate(apps: SavesApplication[], order: 'desc' | 'asc'): SavesApplication[] {
  return [...apps].sort((a, b) => {
    const ta = a.appliedAt?.toMillis?.() ?? 0;
    const tb = b.appliedAt?.toMillis?.() ?? 0;
    return order === 'desc' ? tb - ta : ta - tb;
  });
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.Saved;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

type SaveListRow = {
  rowKey: string;
  post: Post;
  statusLabel: string;
  application?: SavesApplication;
};

type CardItem = {
  name: string;
  university: string;
  description: string;
  status: string;
  avatarUrl?: string;
  post: Post;
  filmName: string;
  showPostPreview: boolean;
  /** Saved tab: single date line (recruitment deadline) */
  dateSingle?: string;
  /** Applied / Past: when you submitted */
  appliedDateLine?: string;
  /** Applied / Past: listing deadline */
  applyByLine?: string;
  rejectionReason?: string;
};

const SaveCard = ({
  item,
  showApply,
  onApply,
  onViewDetails,
}: {
  item: CardItem;
  showApply: boolean;
  onApply: (post: Post) => void;
  onViewDetails: (post: Post) => void;
}) => {
  const images = item.post.media?.images ?? [];

  if (item.showPostPreview) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardName}>{item.name}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.filmTitle}>{item.filmName}</Text>
        <Text style={styles.description}>{item.description}</Text>
        {images.length > 0 &&
          (images.length === 1 ? (
            <Image
              source={{ uri: images[0].url }}
              style={styles.postImageFull}
              resizeMode="cover"
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              contentContainerStyle={styles.imageScrollContent}
            >
              {images.map(img => (
                <Image
                  key={img.id}
                  source={{ uri: img.url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ))}
        <View style={styles.metaRow}>
          <SvgXml xml={LOCATION_SVG} width={16} height={16} />
          <Text style={styles.metaText}>{item.university}</Text>
        </View>
        {item.appliedDateLine ? (
          <View style={styles.metaRow}>
            <SvgXml xml={CALENDAR_SVG} width={16} height={16} />
            <Text style={styles.metaText}>{item.appliedDateLine}</Text>
          </View>
        ) : null}
        {item.applyByLine ? (
          <View style={styles.metaRow}>
            <SvgXml xml={CALENDAR_SVG} width={16} height={16} />
            <Text style={styles.metaText}>{item.applyByLine}</Text>
          </View>
        ) : null}
        {item.status === 'Rejected' && item.rejectionReason ? (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionTitle}>Feedback</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.button}
          onPress={() => onViewDetails(item.post)}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.cardTitleCol}>
          <Text style={styles.cardName}>{item.name}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {images.length > 0 &&
        (images.length === 1 ? (
          <Image
            source={{ uri: images[0].url }}
            style={styles.postImageFull}
            resizeMode="cover"
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {images.map(img => (
              <Image
                key={img.id}
                source={{ uri: img.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ))}
      <View style={styles.metaRow}>
        <SvgXml xml={LOCATION_SVG} width={16} height={16} />
        <Text style={styles.metaText}>{item.university}</Text>
      </View>
      <View style={styles.metaRow}>
        <SvgXml xml={CALENDAR_SVG} width={16} height={16} />
        <Text style={styles.metaText}>{item.dateSingle}</Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => (showApply ? onApply(item.post) : onViewDetails(item.post))}
      >
        <Text style={styles.buttonText}>{showApply ? 'Apply' : 'View Details'}</Text>
      </TouchableOpacity>
    </View>
  );
};

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

  const dateRange = formatDateRange(post.shootingTimeline.startDate, post.shootingTimeline.endDate);
  const deadline = new Date(post.recruitmentDeadline);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const deadlineStr = `${months[deadline.getMonth()]} ${deadline.getDate()}, ${deadline.getFullYear()}`;
  const images = post.media?.images ?? [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.container}>
        <View style={detailStyles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={detailStyles.backBtn}>
            <Text style={detailStyles.backText}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView
          style={detailStyles.scroll}
          contentContainerStyle={detailStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={detailStyles.posterRow}>
            <View style={detailStyles.posterAvatar} />
            <View>
              <Text style={detailStyles.posterName}>{post.postedBy.name}</Text>
              {post.postedBy.school ? (
                <Text style={detailStyles.posterSchool}>{post.postedBy.school}</Text>
              ) : null}
            </View>
          </View>

          <Text style={detailStyles.filmName}>{post.filmName}</Text>
          {post.director.length > 0 && (
            <Text style={detailStyles.director}>directed by {post.director.join(', ')}</Text>
          )}

          <View style={detailStyles.metaRow}>
            <Text style={detailStyles.metaItem}>
              {post.shootingLocation.city}, {post.shootingLocation.state}
            </Text>
            <Text style={detailStyles.metaItem}>{dateRange}</Text>
            <Text style={detailStyles.metaItem}>Apply by {deadlineStr}</Text>
          </View>

          {post.shootingLocation.details ? (
            <Text style={detailStyles.locationDetails}>{post.shootingLocation.details}</Text>
          ) : null}

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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={detailStyles.imageScroll}
                contentContainerStyle={detailStyles.imageScrollContent}
              >
                {images.map(img => (
                  <Image
                    key={img.id}
                    source={{ uri: img.url }}
                    style={detailStyles.detailImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </>
          )}

          <Pressable
            style={detailStyles.applyButton}
            onPress={() => {
              onApply(post);
              onClose();
            }}
          >
            <Text style={detailStyles.applyButtonText}>Apply</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

function rowToCardItem(
  row: SaveListRow,
  showPostPreview: boolean,
  posterHeadshotById: Record<string, string>,
): CardItem {
  const { post, statusLabel, application } = row;
  const deadline = formatDeadline(post.recruitmentDeadline);
  const applied =
    showPostPreview && application?.appliedAt
      ? `Applied ${formatAppliedAt(application.appliedAt)}`
      : undefined;
  const headshotUrl =
    posterHeadshotById[post.postedBy?.userId] ||
    MOCK_AVATAR_BY_POST_ID[post.id] ||
    undefined;
  return {
    name: post.postedBy.name,
    university:
      post.postedBy.school?.trim() ||
      `${post.shootingLocation.city}, ${post.shootingLocation.state}`,
    description: cardDescription(post),
    status: statusLabel,
    avatarUrl: headshotUrl,
    post,
    filmName: post.filmName,
    showPostPreview,
    dateSingle: showPostPreview ? undefined : deadline,
    appliedDateLine: applied,
    applyByLine: showPostPreview ? `Apply by ${deadline}` : undefined,
    rejectionReason: application?.rejectionReason,
  };
}

type TabType = 'Saved' | 'Applied' | 'Past';

export const SavesScreen = () => {
  const { top } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('Saved');
  const { savedPostId, applications, postsById, posterHeadshotById, loading } = useSavesData();
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);

  const savedRows: SaveListRow[] = useMemo(() => {
    return savedPostId
      .map(postId => {
        const post = postsById[postId];
        if (!post) return null;
        return { rowKey: `saved-${postId}`, post, statusLabel: 'Saved' };
      })
      .filter((r): r is SaveListRow => r !== null);
  }, [savedPostId, postsById]);

  const appliedRows: SaveListRow[] = useMemo(() => {
    return sortApplicationsByDate(
      applications.filter(a => !applicationIsTerminal(a.status)),
      'desc'
    )
      .map(app => {
        const post = postsById[app.postId];
        if (!post) return null;
        const row: SaveListRow = {
          rowKey: `app-${app.id}`,
          post,
          statusLabel: applicationBadgeStatus(app.status),
          application: app,
        };
        return row;
      })
      .filter((r): r is SaveListRow => r != null);
  }, [applications, postsById]);

  const pastRows: SaveListRow[] = useMemo(() => {
    return sortApplicationsByDate(
      applications.filter(a => applicationIsTerminal(a.status)),
      'desc'
    )
      .map(app => {
        const post = postsById[app.postId];
        if (!post) return null;
        const row: SaveListRow = {
          rowKey: `past-${app.id}`,
          post,
          statusLabel: applicationBadgeStatus(app.status),
          application: app,
        };
        return row;
      })
      .filter((r): r is SaveListRow => r != null);
  }, [applications, postsById]);

  const data: SaveListRow[] =
    activeTab === 'Saved' ? savedRows : activeTab === 'Applied' ? appliedRows : pastRows;

  const counts = useMemo(
    () => ({ Saved: savedRows.length, Applied: appliedRows.length, Past: pastRows.length }),
    [savedRows.length, appliedRows.length, pastRows.length]
  );

  const emptyMessage =
    activeTab === 'Saved'
      ? 'No saved posts yet.'
      : activeTab === 'Applied'
        ? 'No applications in progress.'
        : 'No past applications.';

  return (
    <View style={[styles.container, { paddingTop: top }]}>
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
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.rowKey}
          renderItem={({ item }) => (
            <SaveCard
              item={rowToCardItem(item, activeTab === 'Applied' || activeTab === 'Past', posterHeadshotById)}
              showApply={activeTab === 'Saved'}
              onApply={p => setApplyPost(p)}
              onViewDetails={p => setDetailPost(p)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onApply={p => setApplyPost(p)}
      />
      <ApplyScreen post={applyPost} visible={applyPost !== null} onClose={() => setApplyPost(null)} />
    </View>
  );
};

const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DETAIL_BG },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  posterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C0C4CC',
  },
  posterName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  posterSchool: { color: '#AAAAAA', fontSize: 13, marginTop: 2 },
  filmName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  director: { color: '#AAAAAA', fontSize: 14, marginBottom: 16 },
  metaRow: { gap: 6, marginBottom: 4 },
  metaItem: { color: '#CCCCCC', fontSize: 14 },
  locationDetails: { color: '#888888', fontSize: 13, marginTop: 4, marginBottom: 16 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  roleCard: {
    backgroundColor: DETAIL_CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  roleTitle: { color: '#111111', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  roleType: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleDesc: { color: '#333333', fontSize: 14, lineHeight: 20 },
  imageScroll: { marginHorizontal: -20 },
  imageScrollContent: { paddingHorizontal: 20, gap: 8 },
  detailImage: {
    width: 260,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#D8E4F0',
  },
  applyButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { paddingVertical: 48, paddingHorizontal: 24 },
  emptyText: { color: '#AAAAAA', fontSize: 14, lineHeight: 22, textAlign: 'center' },
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12, flexGrow: 1 },
  card: { backgroundColor: CARD_BG, borderRadius: 10, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardTitleCol: { flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#C7C7C7' },
  cardName: { color: '#000000', fontSize: 15, fontWeight: '600' },
  filmTitle: { color: '#111111', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#545F71', fontSize: 13 },
  description: { color: '#000000', fontSize: 14, lineHeight: 20, marginTop: 4 },
  imageScroll: {
    marginTop: 8,
    marginHorizontal: -16,
  },
  imageScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  postImage: {
    width: 260,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#D8E4F0',
  },
  postImageFull: {
    width: CARD_IMAGE_WIDTH,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#D8E4F0',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2D2C2C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  rejectionContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFB5B5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  rejectionTitle: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rejectionText: {
    color: '#545F71',
    fontSize: 13,
    lineHeight: 18,
  },
});
