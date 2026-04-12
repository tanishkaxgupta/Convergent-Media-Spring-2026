//PLACEHOLDER UNTIL FIGMA IS DONE
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';
import { RoleType, UserProfile } from '../types/user';

const { width } = Dimensions.get('window');
const GALLERY_ITEM_SIZE = (width - 48) / 3;

// ── Availability badge ──────────────────────────────────────────
const AvailabilityBadge = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    available: { bg: '#dcfce7', text: '#166534' },
    unavailable: { bg: '#fee2e2', text: '#991b1b' },
    'open to offers': { bg: '#fef9c3', text: '#854d0e' },
  };
  const c = colors[status] ?? colors['unavailable'];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
};

// ── Role pill ───────────────────────────────────────────────────
const RolePill = ({ role }: { role: RoleType }) => (
  <View style={styles.pill}>
    <Text style={styles.pillText}>{role}</Text>
  </View>
);

// ── Tag chip (skills, languages, etc) ──────────────────────────
const Tag = ({ label }: { label: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

// ── Section header ──────────────────────────────────────────────
const SectionHeader = ({ title, isDark }: { title: string; isDark: boolean }) => (
  <Text style={[styles.sectionTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
    {title}
  </Text>
);

// ── Gallery grid ────────────────────────────────────────────────
const GalleryGrid = ({ photos }: { photos: { id: string; url: string }[] }) => (
  <View style={styles.galleryGrid}>
    {photos.map(photo => (
      <TouchableOpacity key={photo.id} style={styles.galleryItem}>
        <Image
          source={{ uri: photo.url }}
          style={styles.galleryImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ))}
  </View>
);

// ── Credits list ────────────────────────────────────────────────
const CreditRow = ({
  credit,
  isDark,
}: {
  credit: UserProfile['credits'][0];
  isDark: boolean;
}) => (
  <View style={[styles.creditRow, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.creditTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
        {credit.title}
      </Text>
      <Text style={[styles.creditSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {credit.role} · {credit.type} · {credit.year}
      </Text>
    </View>
    <Text style={[styles.creditDirector, { color: isDark ? '#94a3b8' : '#64748b' }]}>
      dir. {credit.director}
    </Text>
  </View>
);

// ── Tab bar ─────────────────────────────────────────────────────
type Tab = 'postings' | 'applications';
const TabBar = ({
  active,
  onChange,
  isDark,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  isDark: boolean;
}) => (
  <View style={[styles.tabBar, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
    {(['postings', 'applications'] as Tab[]).map(tab => (
      <TouchableOpacity
        key={tab}
        style={[styles.tabItem, active === tab && styles.tabItemActive]}
        onPress={() => onChange(tab)}
      >
        <Text
          style={[
            styles.tabText,
            { color: isDark ? '#94a3b8' : '#64748b' },
            active === tab && { color: '#6366f1', fontWeight: '600' },
          ]}
        >
          {tab === 'postings' ? 'My Postings' : 'My Applications'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Main screen ─────────────────────────────────────────────────
// Replace 'CURRENT_USER_ID' with your auth user id once auth is set up
const TEMP_USER_ID = 'CURRENT_USER_ID';

export const ProfileScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const { profile, loading, error } = useUserProfile(TEMP_USER_ID);
  const [activeTab, setActiveTab] = useState<Tab>('postings');

  const bg = isDark ? '#0f172a' : '#ffffff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <Text style={{ color: textSecondary }}>Could not load profile.</Text>
      </View>
    );
  }

  const { basicInfo, roleInfo, attributes, gallery, credits, socialLinks } = profile;
  const hasAttributes =
    attributes.skills.length > 0 ||
    attributes.languages.length > 0 ||
    attributes.instruments.length > 0 ||
    attributes.danceStyles.length > 0 ||
    attributes.specialSkills.length > 0;

  return (
    <ScrollView
      style={{ backgroundColor: bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: cardBg }]}>
        <Image
          source={
            basicInfo.headshotUrl
            ? { uri: basicInfo.headshotUrl }
            : { uri: 'https://ui-avatars.com/api/?name=User&background=888&color=fff' }
          }
          style={styles.headshot}
        />
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit profile</Text>
        </TouchableOpacity>
        <Text style={[styles.name, { color: textPrimary }]}>{basicInfo.name}</Text>
        {basicInfo.pronouns ? (
          <Text style={[styles.pronouns, { color: textSecondary }]}>
            {basicInfo.pronouns}
          </Text>
        ) : null}
        <Text style={[styles.location, { color: textSecondary }]}>
          {basicInfo.location.city}, {basicInfo.location.state}
          {basicInfo.location.willingToRelocate ? ' · open to relocation' : ''}
        </Text>
        <AvailabilityBadge status={roleInfo.availability} />
      </View>

      {/* ── Roles ── */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <SectionHeader title="Roles" isDark={isDark} />
        <View style={styles.pillRow}>
          <RolePill role={roleInfo.primaryRole} />
          {roleInfo.secondaryRoles.map(r => (
            <RolePill key={r} role={r} />
          ))}
        </View>
        <Text style={[styles.meta, { color: textSecondary }]}>
          {roleInfo.experienceLevel} · {roleInfo.yearsOfExperience} yrs experience
        </Text>
      </View>

      {/* ── Bio ── */}
      {basicInfo.bio ? (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader title="Bio" isDark={isDark} />
          <Text style={[styles.bio, { color: textSecondary }]}>{basicInfo.bio}</Text>
        </View>
      ) : null}

      {/* ── Attributes ── */}
      {hasAttributes && (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader title="Skills & attributes" isDark={isDark} />
          {attributes.skills.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.tagLabel, { color: textSecondary }]}>Skills</Text>
              <View style={styles.tagRow}>
                {attributes.skills.map(s => <Tag key={s} label={s} />)}
              </View>
            </View>
          )}
          {attributes.instruments.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.tagLabel, { color: textSecondary }]}>Instruments</Text>
              <View style={styles.tagRow}>
                {attributes.instruments.map(i => <Tag key={i} label={i} />)}
              </View>
            </View>
          )}
          {attributes.danceStyles.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.tagLabel, { color: textSecondary }]}>Dance styles</Text>
              <View style={styles.tagRow}>
                {attributes.danceStyles.map(d => <Tag key={d} label={d} />)}
              </View>
            </View>
          )}
          {attributes.languages.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.tagLabel, { color: textSecondary }]}>Languages</Text>
              <View style={styles.tagRow}>
                {attributes.languages.map(l => <Tag key={l} label={l} />)}
              </View>
            </View>
          )}
          {attributes.specialSkills.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.tagLabel, { color: textSecondary }]}>Special skills</Text>
              <View style={styles.tagRow}>
                {attributes.specialSkills.map(s => <Tag key={s} label={s} />)}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Gallery ── */}
      {gallery.photos.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader title="Gallery" isDark={isDark} />
          <GalleryGrid photos={gallery.photos} />
        </View>
      )}

      {/* ── Credits ── */}
      {credits.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader title="Credits" isDark={isDark} />
          {credits.map(c => (
            <CreditRow key={c.id} credit={c} isDark={isDark} />
          ))}
        </View>
      )}

      {/* ── Social links ── */}
      {Object.values(socialLinks).some(Boolean) && (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader title="Links" isDark={isDark} />
          <View style={styles.tagRow}>
            {Object.entries(socialLinks).map(([platform, url]) =>
              url ? <Tag key={platform} label={platform} /> : null
            )}
          </View>
        </View>
      )}

      {/* ── Postings / Applications tabs ── */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <TabBar active={activeTab} onChange={setActiveTab} isDark={isDark} />
        {activeTab === 'postings' ? (
          profile.myPostings.length === 0 ? (
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No postings yet.
            </Text>
          ) : (
            <Text style={{ color: textSecondary }}>
              {profile.myPostings.length} posting(s)
            </Text>
          )
        ) : profile.myApplications.length === 0 ? (
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            No applications yet.
          </Text>
        ) : (
          <Text style={{ color: textSecondary }}>
            {profile.myApplications.length} application(s)
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  headshot: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  editButtonText: { color: '#6366f1', fontSize: 13, fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '600', marginBottom: 2 },
  pronouns: { fontSize: 14, marginBottom: 4 },
  location: { fontSize: 13, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  meta: { fontSize: 13 },
  bio: { fontSize: 15, lineHeight: 22 },
  tagSection: { marginBottom: 12 },
  tagLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: { color: '#6366f1', fontSize: 12 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  galleryItem: { width: GALLERY_ITEM_SIZE, height: GALLERY_ITEM_SIZE, borderRadius: 8, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  creditRow: { paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  creditTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  creditSub: { fontSize: 12 },
  creditDirector: { fontSize: 12 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { fontSize: 14 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
});