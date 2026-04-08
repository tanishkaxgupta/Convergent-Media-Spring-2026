import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// listContent paddingHorizontal (16) + card padding (16) on each side
const CARD_IMAGE_WIDTH = SCREEN_WIDTH - 64;

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePostSearch } from '../hooks/use-post-search';
import { Post } from '../types/post';
import { UserProfile } from '../types/user';
import { MOCK_PEOPLE } from '../data/mockPeople';
import { ApplyScreen } from './ApplyScreen';

// ── Constants ─────────────────────────────────────────────────────────────────

const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';
const SEARCH_BG = '#F5F5F5';
const APPLY_BTN = '#1A1A1A';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Autocomplete suggestion row shown while the user is typing */
const SuggestionRow = ({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={styles.suggestionRow}>
    <Text style={styles.suggestionText} numberOfLines={1}>
      {text}
    </Text>
    <Text style={styles.suggestionArrow}>↗</Text>
  </Pressable>
);

/** Full-screen modal showing all details for a post */
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

  const dateRange = formatDateRange(
    post.shootingTimeline.startDate,
    post.shootingTimeline.endDate,
  );
  const deadline = new Date(post.recruitmentDeadline);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const deadlineStr = `${months[deadline.getMonth()]} ${deadline.getDate()}, ${deadline.getFullYear()}`;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailContainer}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.detailBackBtn}>
            <Text style={styles.detailBackText}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Poster info */}
          <View style={styles.detailPosterRow}>
            <View style={styles.detailAvatar} />
            <View>
              <Text style={styles.detailPosterName}>{post.postedBy.name}</Text>
              {post.postedBy.school ? (
                <Text style={styles.detailPosterSchool}>{post.postedBy.school}</Text>
              ) : null}
            </View>
          </View>

          {/* Film name */}
          <Text style={styles.detailFilmName}>{post.filmName}</Text>
          {post.director.length > 0 && (
            <Text style={styles.detailDirector}>
              directed by {post.director.join(', ')}
            </Text>
          )}

          {/* Meta row */}
          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaItem}>
              📍 {post.shootingLocation.city}, {post.shootingLocation.state}
            </Text>
            <Text style={styles.detailMetaItem}>🎬 {dateRange}</Text>
            <Text style={styles.detailMetaItem}>⏰ Apply by {deadlineStr}</Text>
          </View>

          {post.shootingLocation.details ? (
            <Text style={styles.detailLocationDetails}>{post.shootingLocation.details}</Text>
          ) : null}

          {/* Roles */}
          <Text style={styles.detailSectionTitle}>Roles</Text>
          {post.roles.map((role, i) => (
            <View key={i} style={styles.detailRoleCard}>
              <Text style={styles.detailRoleTitle}>{role.title}</Text>
              <Text style={styles.detailRoleType}>{role.type}</Text>
              <Text style={styles.detailRoleDesc}>{role.description}</Text>
            </View>
          ))}

          {/* Images */}
          {post.media.images.length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Photos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.detailImageScroll}
                contentContainerStyle={styles.imageScrollContent}
              >
                {post.media.images.map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.url }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* Apply button */}
          <Pressable
            style={styles.applyButton}
            onPress={() => { onApply(post); onClose(); }}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

/** Post card matching the Figma design */
const PostCard = ({
  post,
  onApply,
  onPress,
}: {
  post: Post;
  onApply: (post: Post) => void;
  onPress: (post: Post) => void;
}) => {
  const description = post.roles[0]?.description ?? `Looking for crew for "${post.filmName}"`;
  const dateRange = formatDateRange(
    post.shootingTimeline.startDate,
    post.shootingTimeline.endDate,
  );
  const bullets: string[] = [
    `filming in ${post.shootingLocation.city}, ${dateRange}`,
    ...post.roles.slice(1).map((r) => r.description),
  ].slice(0, 4);

  const hasImages = post.media.images.length > 0;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(post)} style={styles.card}>
      {/* Header: avatar + poster name */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar} />
        <Text style={styles.posterName}>{post.postedBy.name}</Text>
      </View>

      {/* Main description */}
      <Text style={styles.cardDescription}>{description}</Text>

      {/* Bullet points */}
      {bullets.map((b, i) => (
        <Text key={i} style={styles.bulletItem}>{'• '}{b}</Text>
      ))}

      {/* Photos */}
      {hasImages && (
        post.media.images.length === 1 ? (
          <Image
            source={{ uri: post.media.images[0].url }}
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
            {post.media.images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )
      )}

      {/* Apply button */}
      <Pressable
        style={styles.applyButton}
        onPress={(e) => { e.stopPropagation?.(); onApply(post); }}
      >
        <Text style={styles.applyButtonText}>Apply</Text>
      </Pressable>
    </TouchableOpacity>
  );
};

/** Person card matching the Figma design */
const PeopleCard = ({
  person,
  onPress,
}: {
  person: UserProfile;
  onPress: (person: UserProfile) => void;
}) => {
  const role = person.roleInfo.specialties[0] ?? person.roleInfo.primaryRole;
  const location = person.basicInfo.school ?? `${person.basicInfo.location.city}, ${person.basicInfo.location.state}`;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(person)} style={styles.peopleCard}>
      <View style={styles.peopleAvatar} />
      <View style={styles.peopleCardText}>
        <Text style={styles.peopleCardName}>{person.basicInfo.name}</Text>
        <Text style={styles.peopleCardSub}>{role} @ {location}</Text>
      </View>
    </TouchableOpacity>
  );
};

/** Posts / People tab bar */
const TabBar = ({
  active,
  onChange,
}: {
  active: 'posts' | 'people';
  onChange: (t: 'posts' | 'people') => void;
}) => (
  <View style={styles.tabBar}>
    {(['posts', 'people'] as const).map((tab) => (
      <Pressable key={tab} onPress={() => onChange(tab)} style={styles.tabItem}>
        <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Text>
        {active === tab && <View style={styles.tabUnderline} />}
      </Pressable>
    ))}
  </View>
);

/** Filters modal — location + school */
const FiltersModal = ({
  visible,
  initialCity,
  initialState,
  initialSchool,
  onApply,
  onClose,
}: {
  visible: boolean;
  initialCity: string;
  initialState: string;
  initialSchool: string;
  onApply: (city: string, state: string, school: string) => void;
  onClose: () => void;
}) => {
  const [cityInput, setCityInput] = useState(initialCity);
  const [stateInput, setStateInput] = useState(initialState);
  const [schoolInput, setSchoolInput] = useState(initialSchool);
  const [detecting, setDetecting] = useState(false);

  // Sync inputs when modal opens with new initial values
  useEffect(() => {
    if (visible) {
      setCityInput(initialCity);
      setStateInput(initialState);
      setSchoolInput(initialSchool);
    }
  }, [visible, initialCity, initialState, initialSchool]);

  async function handleDetect() {
    setDetecting(true);
    try {
      const res = await fetch('https://ip-api.com/json/');
      const data = await res.json();
      if (data.status === 'success') {
        setCityInput(data.city ?? '');
        setStateInput(data.regionName ?? '');
      }
    } catch {
      // Silently fail — user can type manually
    } finally {
      setDetecting(false);
    }
  }

  function handleApply() {
    Keyboard.dismiss();
    onApply(cityInput.trim(), stateInput.trim(), schoolInput.trim());
    onClose();
  }

  function handleClear() {
    setCityInput('');
    setStateInput('');
    setSchoolInput('');
    onApply('', '', '');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Filter Posts</Text>

          {/* ── School section ── */}
          <Text style={styles.modalSectionLabel}>SCHOOL</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="e.g. UT Austin"
            placeholderTextColor="#999"
            value={schoolInput}
            onChangeText={setSchoolInput}
            autoCapitalize="words"
          />

          {/* ── Location section ── */}
          <Text style={styles.modalSectionLabel}>FILMING LOCATION</Text>

          <Pressable
            style={styles.detectButton}
            onPress={handleDetect}
            disabled={detecting}
          >
            <Text style={styles.detectButtonText}>
              {detecting ? 'Detecting…' : '📍 Use my current location'}
            </Text>
          </Pressable>

          <Text style={styles.modalDividerText}>or enter manually</Text>

          <TextInput
            style={styles.locationInput}
            placeholder="City"
            placeholderTextColor="#999"
            value={cityInput}
            onChangeText={setCityInput}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.locationInput}
            placeholder="State (e.g. TX)"
            placeholderTextColor="#999"
            value={stateInput}
            onChangeText={setStateInput}
            autoCapitalize="characters"
            maxLength={2}
          />

          {/* Action buttons */}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalClearBtn} onPress={handleClear}>
              <Text style={styles.modalClearText}>Clear all</Text>
            </Pressable>
            <Pressable style={styles.modalApplyBtn} onPress={handleApply}>
              <Text style={styles.modalApplyText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

export const SearchScreen = () => {
  const { top } = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<UserProfile | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);
  const inputRef = useRef<TextInput>(null);

  const {
    results,
    isLoading,
    error,
    query,
    city,
    state,
    school,
    setQuery,
    setCity,
    setState,
    setSchool,
  } = usePostSearch();

  // Default to UT Austin on first load
  useEffect(() => {
    setSchool('UT Austin');
  }, []);

  // Derive autocomplete suggestions from current results
  const suggestions: string[] = results.posts
    .slice(0, 5)
    .flatMap((p) => [
      `looking for ${p.roles.map((r) => r.title.toLowerCase()).join(' ')}`,
      p.filmName.toLowerCase(),
    ])
    .filter((s) => s.length > 0 && (!query || s.includes(query.toLowerCase())))
    .slice(0, 4);

  const locationLabel =
    city && state ? `${city}, ${state.toUpperCase()}`
    : city ? city
    : state ? state.toUpperCase()
    : null;

  const filterParts = [
    school || null,
    locationLabel,
  ].filter(Boolean);

  const filterLabel = filterParts.length > 0 ? filterParts.join(' · ') : 'Set filters';
  const hasFilters = !!(school || city || state);

  const showSuggestions = isFocused && query.length > 0 && suggestions.length > 0;
  const showResults = !isFocused || query.length === 0;

  function handleSuggestionPress(suggestion: string) {
    setQuery(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  }

  function handleApply(post: Post) {
    setSelectedPost(null); // close detail modal if open
    setApplyPost(post);
  }

  function handleFiltersApply(newCity: string, newState: string, newSchool: string) {
    setCity(newCity);
    setState(newState);
    setSchool(newSchool);
  }

  const renderPostCard = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onApply={handleApply}
      onPress={(post) => setSelectedPost(post)}
    />
  );

  const renderPeopleCard = ({ item }: { item: UserProfile }) => (
    <PeopleCard person={item} onPress={(person) => setSelectedPerson(person)} />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No posts found</Text>
        <Text style={styles.emptySubtext}>Try a different search</Text>
      </View>
    );
  };

  const renderFooter = () =>
    isLoading ? (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {/* ── Search bar ── */}
      <View style={[styles.searchBarWrapper, { paddingTop: top + 16 }]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => setIsFocused(false)}
            placeholder="Search"
            placeholderTextColor="#999999"
            returnKeyType="search"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Autocomplete suggestions ── */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={i}
              text={s}
              onPress={() => handleSuggestionPress(s)}
            />
          ))}
        </View>
      )}

      {/* ── Results area ── */}
      {showResults && (
        <>
          {/* Filter row — always visible, tappable */}
          <Pressable
            style={styles.locationRow}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.locationPin}>📍</Text>
            <Text style={[styles.locationText, !hasFilters && styles.locationPlaceholder]}>
              {filterLabel}
            </Text>
            {hasFilters && (
              <Pressable
                hitSlop={10}
                onPress={() => { setCity(''); setState(''); setSchool(''); }}
                style={styles.locationClear}
              >
                <Text style={styles.locationClearText}>✕</Text>
              </Pressable>
            )}
          </Pressable>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Posts / People tabs */}
          <TabBar active={activeTab} onChange={setActiveTab} />

          {/* Post results */}
          {activeTab === 'posts' ? (
            <FlatList
              data={results.posts}
              keyExtractor={(item) => item.id}
              renderItem={renderPostCard}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <FlatList
              data={MOCK_PEOPLE}
              keyExtractor={(item) => item.id}
              renderItem={renderPeopleCard}
              contentContainerStyle={styles.peopleListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* ── Filters modal ── */}
      <FiltersModal
        visible={showLocationModal}
        initialCity={city}
        initialState={state}
        initialSchool={school}
        onApply={handleFiltersApply}
        onClose={() => setShowLocationModal(false)}
      />

      {/* ── Post detail modal ── */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onApply={handleApply}
      />

      {/* ── Apply screen ── */}
      <ApplyScreen
        post={applyPost}
        visible={applyPost !== null}
        onClose={() => setApplyPost(null)}
      />

      {/* ── Person profile placeholder modal ── */}
      <Modal
        visible={selectedPerson !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPerson(null)}
      >
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Pressable
              onPress={() => setSelectedPerson(null)}
              hitSlop={12}
              style={styles.detailBackBtn}
            >
              <Text style={styles.detailBackText}>← Back</Text>
            </Pressable>
          </View>
          <View style={styles.profilePlaceholder}>
            <View style={styles.profilePlaceholderAvatar} />
            <Text style={styles.profilePlaceholderName}>
              {selectedPerson?.basicInfo.name}
            </Text>
            <Text style={styles.profilePlaceholderMsg}>
              Profile page coming soon
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Search bar
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEARCH_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: '#999999',
    paddingLeft: 8,
  },

  // Autocomplete suggestions
  suggestionsContainer: {
    paddingHorizontal: 16,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  suggestionArrow: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationPin: {
    fontSize: 13,
    marginRight: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 13,
    textDecorationLine: 'underline',
    flex: 1,
  },
  locationPlaceholder: {
    color: '#888888',
    textDecorationLine: 'none',
  },
  locationClear: {
    paddingLeft: 8,
  },
  locationClearText: {
    color: '#888888',
    fontSize: 12,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },

  // Post cards
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C0C4CC',
  },
  posterName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#222222',
    marginBottom: 6,
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
  },

  // Post images
  imageScroll: {
    marginTop: 12,
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
    marginTop: 12,
  },

  applyButton: {
    backgroundColor: APPLY_BTN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // People cards
  peopleListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  peopleCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  peopleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8A95A3',
    flexShrink: 0,
  },
  peopleCardText: {
    flex: 1,
    gap: 3,
  },
  peopleCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  peopleCardSub: {
    fontSize: 13,
    color: '#666666',
  },

  // Empty / loading
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Post detail screen
  detailContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  detailHeader: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  detailBackBtn: {
    alignSelf: 'flex-start',
  },
  detailBackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  detailPosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C0C4CC',
  },
  detailPosterName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailPosterSchool: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  detailFilmName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailDirector: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 16,
  },
  detailMetaRow: {
    gap: 6,
    marginBottom: 4,
  },
  detailMetaItem: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  detailLocationDetails: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  detailSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  detailRoleCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  detailRoleTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailRoleType: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailRoleDesc: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },
  detailImageScroll: {
    marginHorizontal: -20,
  },
  detailImage: {
    width: 260,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#D8E4F0',
  },

  // Profile placeholder
  profilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  profilePlaceholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C0C4CC',
  },
  profilePlaceholderName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profilePlaceholderMsg: {
    color: '#888888',
    fontSize: 15,
  },

  // Error
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#450a0a',
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },

  // Location modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  detectButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  detectButtonText: {
    fontSize: 14,
    color: '#222222',
    fontWeight: '500',
  },
  modalDividerText: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 14,
  },
  locationInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111111',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalClearBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  modalClearText: {
    fontSize: 15,
    color: '#444444',
    fontWeight: '500',
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: APPLY_BTN,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
