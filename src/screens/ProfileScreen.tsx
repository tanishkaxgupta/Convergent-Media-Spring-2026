import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '../hooks/useUserProfile';

const { width } = Dimensions.get('window');
const BG = '#2C2C2C';
const WHITE = '#FFFFFF';
const PORTFOLIO_CARD_W = width * 0.72;
const PORTFOLIO_CARD_H = PORTFOLIO_CARD_W * 0.65;

// Replace with real auth user ID once auth is set up
const TEMP_USER_ID = 'CURRENT_USER_ID';

const PortfolioCard = ({ url, caption }: { url: string | null; caption: string }) => (
  <View style={styles.portfolioCard}>
    {url ? (
      <Image source={{ uri: url }} style={styles.portfolioImage} resizeMode="cover" />
    ) : (
      <View style={styles.portfolioPlaceholder} />
    )}
    {caption ? <Text style={styles.portfolioCaption} numberOfLines={1}>{caption}</Text> : null}
  </View>
);

const PostCard = ({ headshot, text }: { headshot: string | null; text: string }) => (
  <View style={styles.postCard}>
    <View style={styles.postHeader}>
      {headshot ? (
        <Image source={{ uri: headshot }} style={styles.postAvatar} />
      ) : (
        <View style={styles.postAvatar} />
      )}
    </View>
    <Text style={styles.postText}>{text}</Text>
  </View>
);

export const ProfileScreen = () => {
  const { top } = useSafeAreaInsets();
  const { profile, loading, error } = useUserProfile(TEMP_USER_ID);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: BG }]}>
        <ActivityIndicator color={WHITE} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: BG }]}>
        <Text style={{ color: WHITE }}>Could not load profile.</Text>
      </View>
    );
  }

  const { basicInfo, roleInfo, attributes, gallery } = profile;

  // Build tags from roles + skills
  const tags = [
    `#${roleInfo.primaryRole}`,
    ...roleInfo.secondaryRoles.map(r => `#${r}`),
    ...attributes.skills.slice(0, 4).map(s => `#${s}`),
    ...roleInfo.specialties.slice(0, 2).map(s => `#${s}`),
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          {basicInfo.headshotUrl ? (
            <Image source={{ uri: basicInfo.headshotUrl }} style={styles.headshot} resizeMode="cover" />
          ) : (
            <View style={styles.headshot} />
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{basicInfo.name}</Text>
            <TouchableOpacity hitSlop={10}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bio}>{basicInfo.bio}</Text>
        </View>
      </View>

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <View style={styles.tagsCard}>
          <Text style={styles.tagsText}>{tags.join(' ')}</Text>
        </View>
      )}

      {/* ── Portfolio ── */}
      {gallery.photos.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.portfolioScroll}
            contentContainerStyle={styles.portfolioScrollContent}
          >
            {gallery.photos.map(photo => (
              <PortfolioCard key={photo.id} url={photo.url} caption={photo.caption} />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Posts (myPostings) ── */}
      {profile.myPostings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.postsContainer}>
            {profile.myPostings.map(postId => (
              <PostCard
                key={postId}
                headshot={basicInfo.headshotUrl}
                text={postId}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  // Header
  header: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  headerLeft: {},
  headshot: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#888888',
  },
  headerRight: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '700',
  },
  settingsBtn: {},
  settingsIcon: {
    fontSize: 20,
  },
  bio: {
    color: WHITE,
    fontSize: 13,
    lineHeight: 19,
  },

  // Tags card
  tagsCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tagsText: {
    color: '#222222',
    fontSize: 15,
    lineHeight: 24,
    flexWrap: 'wrap',
  },

  // Section titles
  sectionTitle: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },

  // Portfolio
  portfolioScroll: {
    marginHorizontal: -20,
    marginBottom: 28,
  },
  portfolioScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  portfolioCard: {
    width: PORTFOLIO_CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#D0DAE8',
  },
  portfolioImage: {
    width: PORTFOLIO_CARD_W,
    height: PORTFOLIO_CARD_H,
  },
  portfolioPlaceholder: {
    width: PORTFOLIO_CARD_W,
    height: PORTFOLIO_CARD_H,
    backgroundColor: '#D0DAE8',
  },
  portfolioCaption: {
    color: '#333333',
    fontSize: 12,
    padding: 8,
  },

  // Posts
  postsContainer: {
    gap: 10,
  },
  postCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    marginBottom: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C0C4CC',
  },
  postText: {
    color: '#222222',
    fontSize: 14,
    lineHeight: 20,
  },
});