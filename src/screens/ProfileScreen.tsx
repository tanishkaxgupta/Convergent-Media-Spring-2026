import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';
const PORTFOLIO_CARD_W = width * 0.72;
const PORTFOLIO_CARD_H = PORTFOLIO_CARD_W * 0.65;

const MOCK_PROFILE = {
  name: 'Mr. Actor',
  headshot: null as string | null,
  bio: 'twenny & funny and wish to be an actor but this is really hard please hire me pleasseeeuuhhhh',
  tags: ['#genre', '#actor', '#setstylist', '#genre', '#tag', '#tag', '#genre', '#tag'],
  portfolio: [
    { id: '1', url: null as string | null, caption: 'Short film 2024' },
    { id: '2', url: null as string | null, caption: 'Student film' },
    { id: '3', url: null as string | null, caption: 'Commercial' },
  ],
  posts: [
    {
      id: '1',
      text: "i wish i wasn't jobless! hire me hire me! i want to be an actor sooo badddd cast me cast me",
    },
    {
      id: '2',
      text: 'just finished shooting a short film, it was amazing experience working with the crew!',
    },
  ],
};

const PortfolioCard = ({ url, caption }: { url: string | null; caption: string }) => (
  <View style={styles.portfolioCard}>
    {url ? (
      <Image source={{ uri: url }} style={styles.portfolioImage} resizeMode="cover" />
    ) : (
      <View style={styles.portfolioPlaceholder} />
    )}
  </View>
);

const PostCard = ({ text, headshot }: { text: string; headshot: string | null }) => (
  <View style={styles.postCard}>
    <View style={styles.postAvatarRow}>
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
  const profile = MOCK_PROFILE;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        {profile.headshot ? (
          <Image
            source={{ uri: profile.headshot }}
            style={styles.headshot}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headshot} />
        )}
        <View style={styles.headerRight}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            <TouchableOpacity hitSlop={10}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      </View>

      {/* ── Tags ── */}
      <View style={styles.tagsCard}>
        <Text style={styles.tagsText}>{profile.tags.join(' ')}</Text>
      </View>

      {/* ── Portfolio ── */}
      <Text style={styles.sectionTitle}>Portfolio</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.portfolioScroll}
        contentContainerStyle={styles.portfolioScrollContent}
      >
        {profile.portfolio.map(item => (
          <PortfolioCard key={item.id} url={item.url} caption={item.caption} />
        ))}
      </ScrollView>

      {/* ── Posts ── */}
      <Text style={styles.sectionTitle}>Posts</Text>
      <View style={styles.postsContainer}>
        {profile.posts.map(post => (
          <PostCard key={post.id} text={post.text} headshot={profile.headshot} />
        ))}
      </View>
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  settingsIcon: {
    fontSize: 20,
  },
  bio: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },

  // Tags
  tagsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tagsText: {
    color: '#222222',
    fontSize: 15,
    lineHeight: 24,
  },

  // Section titles
  sectionTitle: {
    color: '#FFFFFF',
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
    height: PORTFOLIO_CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#D0DAE8',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D0DAE8',
  },

  // Posts
  postsContainer: {
    gap: 10,
  },
  postCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
  },
  postAvatarRow: {
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
