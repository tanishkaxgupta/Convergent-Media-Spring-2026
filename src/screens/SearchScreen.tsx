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
  Alert,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostSearch } from '../hooks/use-post-search';
import { Post, RoleType, ALL_ROLE_TYPES } from '../types/post';
import { UserProfile } from '../types/user';
import { MOCK_PEOPLE } from '../data/mockPeople';
import { ApplyScreen } from './ApplyScreen';
import { firestore, Collections } from '../services/firebase';
import { toggleSavePost } from '../services/posts';
import { ProfileView } from './ProfileScreen';

const SEARCH_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="5.5" stroke="#888888" stroke-width="1.6"/>
  <path d="M12.5 12.5L16 16" stroke="#888888" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

const CLEAR_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 2L12 12M12 2L2 12" stroke="#999999" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

const BOOKMARK_ICON = (filled: boolean) =>
  filled
    ? `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2H16C16.5523 2 17 2.44772 17 3V20.382C17 20.7607 16.572 20.9895 16.2764 20.7764L9 15.5L1.72361 20.7764C1.42801 20.9895 1 20.7607 1 20.382V3C1 2.44772 1.44772 2 2 2Z" fill="#FB7257" stroke="#FB7257" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`
    : `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2H16C16.5523 2 17 2.44772 17 3V20.382C17 20.7607 16.572 20.9895 16.2764 20.7764L9 15.5L1.72361 20.7764C1.42801 20.9895 1 20.7607 1 20.382V3C1 2.44772 1.44772 2 2 2Z" stroke="#AAAAAA" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;

const PIN_ICON = `<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 0.5C3.515 0.5 1.5 2.515 1.5 5C1.5 8.375 6 14.5 6 14.5C6 14.5 10.5 8.375 10.5 5C10.5 2.515 8.485 0.5 6 0.5Z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="6" cy="5" r="1.5" fill="white"/>
</svg>`;

const CHEVRON_DOWN = `<svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 1L5.5 6L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ── Post detail meta icons (muted, on dark background) ────────────────────────

const META_PIN_SVG = `<svg viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 1C4.239 1 2 3.239 2 6C2 9.75 7 17 7 17C7 17 12 9.75 12 6C12 3.239 9.761 1 7 1Z" stroke="#888888" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="7" cy="6" r="2" stroke="#888888" stroke-width="1.4"/>
</svg>`;

const META_CAL_SVG = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="2.5" width="14" height="12.5" rx="2" stroke="#888888" stroke-width="1.4"/>
  <line x1="4.5" y1="1" x2="4.5" y2="4.5" stroke="#888888" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="11.5" y1="1" x2="11.5" y2="4.5" stroke="#888888" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="1" y1="7" x2="15" y2="7" stroke="#888888" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

const META_CLOCK_SVG = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="6.5" stroke="#888888" stroke-width="1.4"/>
  <polyline points="8,4.5 8,8 10.5,10" stroke="#888888" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SCREEN_WIDTH = Dimensions.get('window').width;
// listContent paddingHorizontal (16) + card padding (16) on each side
const CARD_IMAGE_WIDTH = SCREEN_WIDTH - 64;

// ── Logo asset ────────────────────────────────────────────────────────────────
const CUE_LOGO = require('../assets/images/Logo.png');

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPostedDate(createdAt: any): string {
  if (!createdAt) return '';
  let date: Date;
  if (typeof createdAt?.toDate === 'function') {
    date = createdAt.toDate();
  } else if (typeof createdAt === 'string') {
    date = new Date(createdAt);
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    return '';
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `Posted ${months[date.getMonth()]} ${date.getDate()}`;
}

const CURRENT_USER_ID = 'user_001'; // swap for real auth uid when ready

// ── Constants ─────────────────────────────────────────────────────────────────

const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';
const SEARCH_BG = '#F5F5F5';
const APPLY_BTN = '#1A1A1A';
const ACCENT = '#E5674E';

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

function getFirstParagraph(text: string): string {
  const normalized = text.trim();
  if (!normalized) return '';

  // Stop before markdown-like bullet lists if present.
  const bulletStartIndex = normalized.search(/\n\s*[•*-]\s+/);
  const textBeforeBullets =
    bulletStartIndex === -1 ? normalized : normalized.slice(0, bulletStartIndex);

  const firstParagraph = textBeforeBullets.split(/\n\s*\n/)[0] ?? textBeforeBullets;
  return firstParagraph.replace(/\s+/g, ' ').trim();
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

// ── Role type label ───────────────────────────────────────────────────────────
const ROLE_TYPE_LABEL: Record<string, string> = {
  actor: 'Actor', tech: 'Tech', crew: 'Crew',
  dancer: 'Dancer', musician: 'Musician', other: 'Other',
};

// ── PostDetailModal ───────────────────────────────────────────────────────────
const PostDetailModal = ({
  post,
  posterHeadshotUrl,
  savedPostIds,
  onClose,
  onApply,
  onSaveToggled,
}: {
  post: Post | null;
  posterHeadshotUrl?: string;
  savedPostIds: string[];
  onClose: () => void;
  onApply: (post: Post) => void;
  onSaveToggled?: (postId: string, nowSaved: boolean) => void;
}) => {
  const [savingRole, setSavingRole] = useState<number | null>(null);

  if (!post) return null;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const start    = new Date(post.shootingTimeline.startDate);
  const end      = new Date(post.shootingTimeline.endDate);
  const deadline = new Date(post.recruitmentDeadline);
  const filmingStr  = `Filming ${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
  const deadlineStr = `Apply by ${months[deadline.getMonth()]} ${deadline.getDate()}, ${deadline.getFullYear()}`;
  const handle = '@' + post.postedBy.name.toLowerCase().replace(/\s+/g, '');
  const posterRole = post.director.includes(post.postedBy.name) ? 'Director' : 'Producer';
  const isSaved = savedPostIds.includes(post.id);

  const handleSave = async (roleIdx: number) => {
    setSavingRole(roleIdx);
    try {
      await toggleSavePost(CURRENT_USER_ID, post.id, isSaved);
      onSaveToggled?.(post.id, !isSaved);
    } catch {
      Alert.alert('Error', 'Could not save post. Please try again.');
    } finally {
      setSavingRole(null);
    }
  };

  const leftPhotos  = post.media.images.filter((_, i) => i % 2 === 0);
  const rightPhotos = post.media.images.filter((_, i) => i % 2 === 1);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.root}>
        {/* ── Header ── */}
        <View style={detailStyles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={detailStyles.backBtn}>
            <Text style={detailStyles.backText}>{'←'}</Text>
          </Pressable>
          <Image source={CUE_LOGO} style={detailStyles.logo} resizeMode="contain" />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={detailStyles.scroll}
          contentContainerStyle={detailStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Poster card ── */}
          <View style={detailStyles.posterCard}>
            {posterHeadshotUrl
              ? <Image source={{ uri: posterHeadshotUrl }} style={detailStyles.avatar} resizeMode="cover" />
              : <View style={detailStyles.avatar} />
            }
            <View style={detailStyles.posterInfo}>
              <Text style={detailStyles.posterName}>{post.postedBy.name}</Text>
              <Text style={detailStyles.posterHandle}>{handle}</Text>
              <Text style={detailStyles.posterRole}>
                {posterRole}{post.postedBy.school ? ` @ ${post.postedBy.school}` : ''}
              </Text>
            </View>
          </View>

          {/* ── Film title + bullets card ── */}
          <View style={detailStyles.contentCard}>
            <Text style={detailStyles.filmTitle}>{post.filmName}</Text>
            {post.description ? (
              <Text style={detailStyles.shortDesc}>{post.description}</Text>
            ) : null}
            {post.roles.length > 0 && (
              <View style={detailStyles.bulletList}>
                {post.roles.map((r, i) => (
                  <Text key={i} style={detailStyles.bullet}>{'• '}{r.description}</Text>
                ))}
              </View>
            )}
            <Text style={detailStyles.moreInfo}>more info in application</Text>
          </View>

          {/* ── About the project card ── */}
          {post.description ? (
            <View style={detailStyles.contentCard}>
              <Text style={detailStyles.aboutLabel}>About the project</Text>
              <Text style={detailStyles.aboutText}>{post.description}</Text>
            </View>
          ) : null}

          {/* ── Meta card ── */}
          <View style={detailStyles.metaCard}>
            <View style={detailStyles.metaRow}>
              <SvgXml xml={META_PIN_SVG} width={14} height={16} />
              <Text style={detailStyles.metaText}>{post.shootingLocation.city}, {post.shootingLocation.state}</Text>
            </View>
            <View style={detailStyles.metaRow}>
              <SvgXml xml={META_CAL_SVG} width={15} height={15} />
              <Text style={detailStyles.metaText}>{filmingStr}</Text>
            </View>
            <View style={detailStyles.metaRow}>
              <SvgXml xml={META_CLOCK_SVG} width={15} height={15} />
              <Text style={detailStyles.metaText}>{deadlineStr}</Text>
            </View>
          </View>

          {/* ── Roles ── */}
          <Text style={detailStyles.sectionTitle}>Roles</Text>
          {post.roles.map((role, i) => (
            <View key={i} style={detailStyles.roleCard}>
              <Text style={detailStyles.roleTitle}>{role.title}</Text>
              <View style={detailStyles.roleBadgeRow}>
                <View style={detailStyles.roleBadge}>
                  <Text style={detailStyles.roleBadgeText}>{ROLE_TYPE_LABEL[role.type] ?? role.type}</Text>
                </View>
                <View style={detailStyles.roleBadge}>
                  <View style={detailStyles.dollarCircle}>
                    <Text style={detailStyles.dollarSign}>$</Text>
                  </View>
                  <Text style={detailStyles.roleBadgeText}>Unpaid</Text>
                </View>
              </View>
              <Text style={detailStyles.roleDesc}>{role.description}</Text>
              <View style={detailStyles.roleButtonRow}>
                <TouchableOpacity
                  style={[detailStyles.saveBtn, isSaved && detailStyles.saveBtnActive]}
                  onPress={() => handleSave(i)}
                  activeOpacity={0.8}
                >
                  {savingRole === i
                    ? <ActivityIndicator size="small" color="#333333" />
                    : <Text style={[detailStyles.saveBtnText, isSaved && detailStyles.saveBtnTextActive]}>
                        {isSaved ? 'Saved ✓' : 'Save'}
                      </Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={detailStyles.applyNowBtn}
                  onPress={() => { onApply(post); onClose(); }}
                  activeOpacity={0.85}
                >
                  <Text style={detailStyles.applyNowText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* ── Photos grid ── */}
          {post.media.images.length > 0 && (
            <>
              <Text style={detailStyles.sectionTitle}>Photos</Text>
              <View style={detailStyles.photoGrid}>
                <View style={detailStyles.photoCol}>
                  {leftPhotos.map(img => (
                    <Image key={img.id} source={{ uri: img.url }} style={detailStyles.photoItem} resizeMode="cover" />
                  ))}
                </View>
                <View style={detailStyles.photoCol}>
                  {rightPhotos.map(img => (
                    <Image key={img.id} source={{ uri: img.url }} style={detailStyles.photoItem} resizeMode="cover" />
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

/** Post card matching the Figma design */
const PostCard = ({
  post,
  posterHeadshotUrl,
  isSaved,
  onApply,
  onPress,
  onSaveToggle,
}: {
  post: Post;
  posterHeadshotUrl?: string;
  isSaved: boolean;
  onApply: (post: Post) => void;
  onPress: (post: Post) => void;
  onSaveToggle: (post: Post) => void;
}) => {
  const description = post.description
    ? getFirstParagraph(post.description)
    : `We're working on "${post.filmName}" and need some help!`;

  const hasImages = post.media.images.length > 0;
  const postedLabel = formatPostedDate(post.createdAt);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(post)} style={styles.card}>
      {/* Header: avatar + poster name + date */}
      <View style={styles.cardHeader}>
        {posterHeadshotUrl ? (
          <Image source={{ uri: posterHeadshotUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.cardHeaderText}>
          <Text style={styles.posterName}>{post.postedBy.name}</Text>
          {postedLabel ? <Text style={styles.postedDate}>{postedLabel}</Text> : null}
        </View>
        <TouchableOpacity
          hitSlop={12}
          onPress={(e) => { e.stopPropagation?.(); onSaveToggle(post); }}
          activeOpacity={0.7}
        >
          <SvgXml xml={BOOKMARK_ICON(isSaved)} width={18} height={22} />
        </TouchableOpacity>
      </View>

      {/* Main description */}
      <Text style={styles.cardDescription}>{description}</Text>

      {/* Roles bullet list */}
      {post.roles.length > 0 && (
        <View style={styles.rolesSection}>
          <Text style={styles.lookingForLabel}>looking for:</Text>
          {post.roles.map((role, i) => (
            <Text key={i} style={styles.bulletItem}>{'• '}{role.title}</Text>
          ))}
        </View>
      )}

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

function availabilityDotColor(availability: string): string {
  if (availability === 'available') return '#4CAF50';
  if (availability === 'open to offers') return '#FF9800';
  return '#E5674E'; // unavailable → red
}

/** Person card matching the Figma design */
const PeopleCard = ({
  person,
  onPress,
}: {
  person: UserProfile;
  onPress: (person: UserProfile) => void;
}) => {
  const role = person.roleInfo.specialties[0] ?? person.roleInfo.primaryRole;
  const school = person.basicInfo.school ?? `${person.basicInfo.location.city}, ${person.basicInfo.location.state}`;
  const dotColor = availabilityDotColor(person.roleInfo.availability);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(person)} style={styles.peopleCard}>
      <View style={styles.peopleAvatarWrapper}>
        {person.basicInfo.headshotUrl ? (
          <Image source={{ uri: person.basicInfo.headshotUrl }} style={styles.peopleAvatar} />
        ) : (
          <View style={styles.peopleAvatar} />
        )}
        <View style={[styles.availabilityDot, { backgroundColor: dotColor }]} />
      </View>
      <View style={styles.peopleCardText}>
        <Text style={styles.peopleCardName}>{person.basicInfo.name}</Text>
        <Text style={styles.peopleCardSub}>{role} @ {school}</Text>
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
              {detecting ? 'Detecting…' : 'Use my current location'}
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

/** Role labels shown on pills */
const ROLE_LABELS: Record<RoleType, string> = {
  actor: 'Actor',
  tech: 'Tech',
  crew: 'Crew',
  dancer: 'Dancer',
  musician: 'Musician',
  other: 'Other',
};

/** Bottom-sheet modal for picking one or more role types */
const RoleFilterModal = ({
  visible,
  selected,
  onToggle,
  onClear,
  onClose,
}: {
  visible: boolean;
  selected: RoleType[];
  onToggle: (r: RoleType) => void;
  onClear: () => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalCard} onPress={() => {}}>
        <Text style={styles.modalTitle}>Filter by Role</Text>
        <Text style={styles.modalSubtitle}>Select one or more roles</Text>

        <View style={styles.roleGrid}>
          {ALL_ROLE_TYPES.map((role) => {
            const active = selected.includes(role);
            return (
              <Pressable
                key={role}
                style={[styles.rolePill, active && styles.rolePillActive]}
                onPress={() => onToggle(role)}
              >
                <Text style={[styles.rolePillText, active && styles.rolePillTextActive]}>
                  {ROLE_LABELS[role]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.modalActions}>
          <Pressable style={styles.modalClearBtn} onPress={() => { onClear(); onClose(); }}>
            <Text style={styles.modalClearText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.modalApplyBtn} onPress={onClose}>
            <Text style={styles.modalApplyText}>Done</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Main screen ───────────────────────────────────────────────────────────────

export const SearchScreen = () => {
  const { top } = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<UserProfile | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // @ts-ignore
    const isConfigured = !!(process.env.EXPO_PUBLIC_FIREBASE_API_KEY && process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
    if (!isConfigured) return;

    // Load all users for people tab
    firestore()
      .collection(Collections.USERS)
      .get()
      .then(snap => {
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
        if (users.length > 0) setFirestoreUsers(users);
      })
      .catch(() => {});

    // Listen to current user's saved posts
    const unsub = firestore()
      .collection(Collections.USERS)
      .doc(CURRENT_USER_ID)
      .onSnapshot(snap => {
        const raw = snap.data()?.savedPostId;
        if (Array.isArray(raw)) setSavedPostIds(raw.filter((x): x is string => typeof x === 'string'));
      }, () => {});
    return unsub;
  }, []);

  const {
    results,
    isLoading,
    error,
    query,
    roleTypes,
    city,
    state,
    school,
    setQuery,
    setCity,
    setState,
    setSchool,
    toggleRoleType,
    clearFilters,
  } = usePostSearch();

  // Default to UT Austin on first load (matches schoolLower stored in Firestore)
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
    : school || null;

  const hasLocation = !!(city || state || school);

  const roleLabel =
    roleTypes.length === 0 ? 'Role'
    : roleTypes.length === 1 ? ROLE_LABELS[roleTypes[0]]
    : `Role (${roleTypes.length})`;
  const hasRoleFilter = roleTypes.length > 0;

  const allPeople = (firestoreUsers.length > 0 ? firestoreUsers : MOCK_PEOPLE)
    .filter(p => p.id !== 'user_001');

  const getPosterHeadshotUrl = (post: Post): string | undefined => {
    const byId = allPeople.find(person => person.id === post.postedBy.userId);
    if (byId?.basicInfo.headshotUrl) return byId.basicInfo.headshotUrl;

    const postName = post.postedBy.name.trim().toLowerCase();
    const byName = allPeople.find(
      person => person.basicInfo.name.trim().toLowerCase() === postName
    );
    return byName?.basicInfo.headshotUrl;
  };

  // Filter people client-side by selected role types
  const filteredPeople = hasRoleFilter
    ? allPeople.filter(p =>
        roleTypes.includes(p.roleInfo.primaryRole) ||
        (p.roleInfo.secondaryRoles as RoleType[]).some(r => roleTypes.includes(r))
      )
    : allPeople;

  const showSuggestions = isFocused && query.length > 0 && suggestions.length > 0;
  const showResults = !isFocused || query.length === 0;

  function handleSuggestionPress(suggestion: string) {
    setQuery(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  }

  async function handleSaveToggle(post: Post) {
    const isSaved = savedPostIds.includes(post.id);
    // Optimistic update
    setSavedPostIds(prev =>
      isSaved ? prev.filter(id => id !== post.id) : [...prev, post.id]
    );
    try {
      await toggleSavePost(CURRENT_USER_ID, post.id, isSaved);
    } catch {
      // Revert on failure
      setSavedPostIds(prev =>
        isSaved ? [...prev, post.id] : prev.filter(id => id !== post.id)
      );
      Alert.alert('Error', 'Could not save post. Please try again.');
    }
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
      posterHeadshotUrl={getPosterHeadshotUrl(item)}
      isSaved={savedPostIds.includes(item.id)}
      onApply={handleApply}
      onPress={(post) => setSelectedPost(post)}
      onSaveToggle={handleSaveToggle}
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
      {/* ── Logo (hidden while keyboard is open) ── */}
      {!isFocused && (
        <View style={[styles.logoRow, { marginTop: top + 8 }]}>
          <Image source={CUE_LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
      )}

      {/* ── Search bar ── */}
      <View style={[styles.searchBarWrapper, { paddingTop: isFocused ? top + 16 : 8 }]}>
        <View style={styles.searchBar}>
          <SvgXml xml={SEARCH_ICON} width={18} height={18} style={styles.searchIcon} />
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
              <SvgXml xml={CLEAR_ICON} width={14} height={14} />
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
          {/* Filter pill row */}
          <View style={styles.filterPillRow}>
            {/* Location pill */}
            <Pressable
              style={[styles.filterPill, hasLocation && styles.filterPillActive]}
              onPress={() => setShowLocationModal(true)}
            >
              <SvgXml xml={PIN_ICON} width={12} height={15} />
              <Text style={styles.filterPillText} numberOfLines={1}>
                {locationLabel ?? 'Location'}
              </Text>
              {hasLocation && (
                <Pressable
                  hitSlop={8}
                  onPress={() => { setCity(''); setState(''); setSchool(''); }}
                >
                  <SvgXml xml={CLEAR_ICON} width={10} height={10} />
                </Pressable>
              )}
            </Pressable>

            {/* Role pill */}
            <Pressable
              style={[styles.filterPill, hasRoleFilter && styles.filterPillActive]}
              onPress={() => setShowRoleModal(true)}
            >
              <Text style={styles.filterPillText}>{roleLabel}</Text>
              {hasRoleFilter ? (
                <Pressable hitSlop={8} onPress={() => { roleTypes.forEach(r => toggleRoleType(r)); }}>
                  <SvgXml xml={CLEAR_ICON} width={10} height={10} />
                </Pressable>
              ) : (
                <SvgXml xml={CHEVRON_DOWN} width={11} height={7} />
              )}
            </Pressable>
          </View>

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
              data={filteredPeople}
              keyExtractor={(item) => item.id}
              renderItem={renderPeopleCard}
              contentContainerStyle={styles.peopleListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No people found</Text>
                  <Text style={styles.emptySubtext}>Try a different role filter</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* ── Location/school filters modal ── */}
      <FiltersModal
        visible={showLocationModal}
        initialCity={city}
        initialState={state}
        initialSchool={school}
        onApply={handleFiltersApply}
        onClose={() => setShowLocationModal(false)}
      />

      {/* ── Role filter modal ── */}
      <RoleFilterModal
        visible={showRoleModal}
        selected={roleTypes}
        onToggle={toggleRoleType}
        onClear={() => roleTypes.slice().forEach(r => toggleRoleType(r))}
        onClose={() => setShowRoleModal(false)}
      />

      {/* ── Post detail modal ── */}
      <PostDetailModal
        post={selectedPost}
        posterHeadshotUrl={selectedPost ? getPosterHeadshotUrl(selectedPost) : undefined}
        savedPostIds={savedPostIds}
        onClose={() => setSelectedPost(null)}
        onApply={handleApply}
        onSaveToggled={(postId, nowSaved) =>
          setSavedPostIds(prev => nowSaved ? [...prev, postId] : prev.filter(id => id !== postId))
        }
      />

      {/* ── Apply screen ── */}
      <ApplyScreen
        post={applyPost}
        visible={applyPost !== null}
        onClose={() => setApplyPost(null)}
      />

      {/* ── Person profile modal ── */}
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
          <ProfileView profile={selectedPerson} topPadding={16} />
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

  // Logo
  logoRow: {
    alignItems: 'center',
    marginBottom: 2,
  },
  logoImage: {
    width: 80,
    height: 44,
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

  // Filter pill row
  filterPillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    maxWidth: 130,
  },
  filterPillClear: {
    fontSize: 11,
    color: '#FFFFFF',
    marginLeft: 2,
    opacity: 0.7,
  },

  // Role grid inside modal
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    marginTop: 4,
  },
  rolePill: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rolePillActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  rolePillText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },

  // Location row (kept for reference — replaced by pill row above)
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
  cardHeaderText: {
    flex: 1,
    gap: 2,
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
  postedDate: {
    fontSize: 12,
    color: '#888888',
  },
  cardDescription: {
    fontSize: 14,
    color: '#222222',
    marginBottom: 8,
    lineHeight: 20,
  },
  rolesSection: {
    marginBottom: 8,
    gap: 2,
  },
  lookingForLabel: {
    fontSize: 13,
    color: '#444444',
    fontWeight: '500',
    marginBottom: 2,
  },
  bulletItem: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
    paddingLeft: 4,
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
  peopleAvatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    flexShrink: 0,
  },
  peopleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8A95A3',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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

  // (detail modal now uses detailStyles below)

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

// ── Post Detail Styles ────────────────────────────────────────────────────────

const DETAIL_PHOTO_W = (SCREEN_WIDTH - 32 - 8) / 2;

const detailStyles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#1C1C1E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#1C1C1E',
  },
  backBtn:  { padding: 4 },
  backText: { color: '#FFFFFF', fontSize: 22, fontWeight: '300' },
  logo:     { width: 60, height: 30 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 48 },

  // ── Poster card ─────────────────────────────────────────────────────────────
  posterCard: {
    backgroundColor: '#2C2C2E', borderRadius: 14,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 20,
  },
  avatar:       { width: 50, height: 50, borderRadius: 25, backgroundColor: '#555558' },
  posterInfo:   { flex: 1, gap: 3 },
  posterName:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  posterHandle: { color: '#8E8E93', fontSize: 13 },
  posterRole:   { color: '#8E8E93', fontSize: 13 },

  // ── Generic content card ────────────────────────────────────────────────────
  contentCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  // ── Film title ───────────────────────────────────────────────────────────────
  filmTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', marginBottom: 12, lineHeight: 30 },

  // ── Short description + bullets ──────────────────────────────────────────────
  shortDesc:  { color: '#C7C7CC', fontSize: 14, lineHeight: 21, marginBottom: 10 },
  bulletList: { gap: 5, marginBottom: 6 },
  bullet:     { color: '#C7C7CC', fontSize: 14, lineHeight: 21 },
  moreInfo:   { color: '#636366', fontSize: 13, fontStyle: 'italic', marginTop: 6 },

  // ── About section ────────────────────────────────────────────────────────────
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  aboutLabel:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  aboutText:    { color: '#C7C7CC', fontSize: 14, lineHeight: 22 },

  // ── Meta card (location / filming / deadline) ────────────────────────────────
  metaCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText:  { color: '#8E8E93', fontSize: 13 },

  // ── Role cards — dark grey matching Figma ────────────────────────────────────
  roleCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  roleTitle:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  roleBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#3A3A3C',
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  roleBadgeText: { color: '#AEAEB2', fontSize: 12, fontWeight: '500' },

  // Dollar circle inside "Unpaid" badge
  dollarCircle: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#636366',
    alignItems: 'center', justifyContent: 'center',
  },
  dollarSign: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', lineHeight: 14 },

  roleDesc: { color: '#8E8E93', fontSize: 13, lineHeight: 20, marginBottom: 16 },

  // ── Save / Apply Now buttons ─────────────────────────────────────────────────
  roleButtonRow: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flex: 1,
    borderWidth: 1.5, borderColor: '#555558',
    borderRadius: 10, paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveBtnActive:     { borderColor: '#FFFFFF', backgroundColor: '#3A3A3C' },
  saveBtnText:       { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  saveBtnTextActive: { color: '#FFFFFF' },
  applyNowBtn: {
    flex: 1,
    backgroundColor: ACCENT,
    borderRadius: 10, paddingVertical: 13,
    alignItems: 'center',
  },
  applyNowText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // ── Photos ───────────────────────────────────────────────────────────────────
  photoGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  photoCol:  { flex: 1, gap: 8 },
  photoItem: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#3A3A3C' },
});
