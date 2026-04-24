import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserPosts } from '../hooks/useUserPosts';
import { UserProfile, RoleType } from '../types/user';
import { Post } from '../types/post';
import { firestore, storage, Collections } from '../services/firebase';
import { ApplyScreen } from './ApplyScreen';

const { width } = Dimensions.get('window');
const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';
const INPUT_BG = '#3A3A3A';
const GALLERY_COL_W = (width - 40 - 8) / 2; // 20px side padding each + 8px gap

const EDIT_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.2929 1.29289C13.6834 0.902369 14.3166 0.902369 14.7071 1.29289L18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L7.70711 17.7071C7.51957 17.8946 7.26522 18 7 18H3C2.44772 18 2 17.5523 2 17V13C2 12.7348 2.10536 12.4804 2.29289 12.2929L13.2929 1.29289ZM4 13.4142V16H6.58579L16.5858 6L14 3.41421L4 13.4142Z" fill="#F8F8F7"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M2 22C2 21.4477 2.44772 21 3 21H21C21.5523 21 22 21.4477 22 22C22 22.5523 21.5523 23 21 23H3C2.44772 23 2 22.5523 2 22Z" fill="#F8F8F7"/>
</svg>`;

const ALL_ROLES: RoleType[] = ['actor', 'tech', 'crew', 'dancer', 'musician', 'other'];
const ROLE_LABELS: Record<RoleType, string> = {
  actor: 'Actor', tech: 'Tech', crew: 'Crew',
  dancer: 'Dancer', musician: 'Musician', other: 'Other',
};

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

function getPostPreviewText(post: Post): string {
  const firstRoleDescription = post.roles[0]?.description?.trim();
  if (firstRoleDescription) return firstRoleDescription;
  if (post.description?.trim()) return post.description.trim();
  return `Casting for ${post.filmName}`;
}

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
          <View style={styles.detailPosterRow}>
            <View style={styles.detailAvatar} />
            <View>
              <Text style={styles.detailPosterName}>{post.postedBy.name}</Text>
              {post.postedBy.school ? (
                <Text style={styles.detailPosterSchool}>{post.postedBy.school}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.detailFilmName}>{post.filmName}</Text>
          {post.director.length > 0 && (
            <Text style={styles.detailDirector}>directed by {post.director.join(', ')}</Text>
          )}

          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaItem}>
              {post.shootingLocation.city}, {post.shootingLocation.state}
            </Text>
            <Text style={styles.detailMetaItem}>{dateRange}</Text>
            <Text style={styles.detailMetaItem}>Apply by {deadlineStr}</Text>
          </View>

          {post.shootingLocation.details ? (
            <Text style={styles.detailLocationDetails}>{post.shootingLocation.details}</Text>
          ) : null}

          <Text style={styles.detailSectionTitle}>Roles</Text>
          {post.roles.map((role, i) => (
            <View key={i} style={styles.detailRoleCard}>
              <Text style={styles.detailRoleTitle}>{role.title}</Text>
              <Text style={styles.detailRoleType}>{role.type}</Text>
              <Text style={styles.detailRoleDesc}>{role.description}</Text>
            </View>
          ))}

          {post.media.images.length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Photos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.detailImageScroll}
                contentContainerStyle={styles.detailImageScrollContent}
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

          <Pressable
            style={styles.applyButton}
            onPress={() => {
              onApply(post);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Gallery Modal ─────────────────────────────────────────────────────────────

const PLUS_ICON = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1" y="1" width="30" height="30" rx="7" stroke="white" stroke-width="1.8"/>
<path d="M16 9V23M9 16H23" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

type GalleryPhoto = UserProfile['gallery']['photos'][number];

const GalleryModal = ({
  photos: initialPhotos,
  isOwner = false,
  profileId,
  onClose,
}: {
  photos: GalleryPhoto[];
  isOwner?: boolean;
  profileId?: string;
  onClose: () => void;
}) => {
  const { top } = useSafeAreaInsets();
  const [localPhotos, setLocalPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const heights = [200, 150, 230, 170, 210, 140];
  const getH = (idx: number, offset: number) => heights[(idx + offset) % heights.length];

  // Owner's "+" card sits at left col slot 0, so real photos shift by one.
  const leftPhotos = localPhotos.filter((_, i) => (isOwner ? i % 2 !== 0 : i % 2 === 0));
  const rightPhotos = localPhotos.filter((_, i) => (isOwner ? i % 2 === 0 : i % 2 === 1));

  const savePhotos = async (updated: GalleryPhoto[]) => {
    if (!profileId) return;
    await firestore()
      .collection(Collections.USERS)
      .doc(profileId)
      .update({ 'gallery.photos': updated });
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const localUri = result.assets[0].uri;
      const filename = `gallery/${profileId}/${Date.now()}.jpg`;
      const ref = storage().ref(filename);

      // Upload via fetch → blob (works with compat SDK on RN)
      const response = await fetch(localUri);
      const blob = await response.blob();
      await ref.put(blob);
      const downloadUrl = await ref.getDownloadURL();

      const photo: GalleryPhoto = {
        id: `photo_${Date.now()}`,
        url: downloadUrl,
        caption: '',
      };
      const updated = [...localPhotos, photo];
      setLocalPhotos(updated);
      await savePhotos(updated);
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = localPhotos.filter(p => p.id !== id);
    setLocalPhotos(updated);
    await savePhotos(updated);
  };

  const renderPhoto = (photo: GalleryPhoto, idx: number, colOffset: number) => (
    <View key={photo.id} style={[galleryStyles.photoWrapper, { height: getH(idx, colOffset) }]}>
      <Image source={{ uri: photo.url }} style={galleryStyles.photo} resizeMode="cover" />
      {isOwner && (
        <TouchableOpacity
          style={galleryStyles.deleteBtn}
          onPress={() => handleDelete(photo.id)}
          hitSlop={8}
        >
          <Text style={galleryStyles.deleteBtnText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[galleryStyles.container, { paddingTop: top }]}>
        {/* Header */}
        <View style={galleryStyles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={galleryStyles.backBtn}>
            <Text style={galleryStyles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={galleryStyles.title}>Portfolio</Text>
          <View style={galleryStyles.backBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={galleryStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={galleryStyles.grid}>
            {/* Left column */}
            <View style={galleryStyles.column}>
              {/* Add card always first in left col for owner */}
              {isOwner && (
                <TouchableOpacity
                  style={[galleryStyles.photoWrapper, galleryStyles.addCard, { height: 170 }]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  {uploading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <SvgXml xml={PLUS_ICON} width={40} height={40} />
                  }
                </TouchableOpacity>
              )}
              {leftPhotos.map((p, i) => renderPhoto(p, i, 0))}
            </View>
            {/* Right column */}
            <View style={galleryStyles.column}>
              {rightPhotos.map((p, i) => renderPhoto(p, i, 2))}
            </View>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
};

const galleryStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  backBtn: { width: 60 },
  backText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, gap: 8 },
  photoWrapper: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#D0DAE8' },
  photo: { width: '100%', height: '100%' },
  addCard: {
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#555',
  },
  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '600' },
});

// ── Edit Profile Modal ────────────────────────────────────────────────────────

const EditProfileModal = ({
  profile,
  onClose,
}: {
  profile: UserProfile;
  onClose: () => void;
}) => {
  const { top } = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile.basicInfo.name);
  const [pronouns, setPronouns] = useState(profile.basicInfo.pronouns);
  const [bio, setBio] = useState(profile.basicInfo.bio);
  const [city, setCity] = useState(profile.basicInfo.location.city);
  const [state, setState] = useState(profile.basicInfo.location.state);
  const [primaryRole, setPrimaryRole] = useState<RoleType>(profile.roleInfo.primaryRole);
  const [specialties, setSpecialties] = useState(profile.roleInfo.specialties.join(', '));
  const [skills, setSkills] = useState(profile.attributes.skills.join(', '));
  const [instagram, setInstagram] = useState(profile.socialLinks.instagram ?? '');
  const [tiktok, setTiktok] = useState(profile.socialLinks.tiktok ?? '');
  const [website, setWebsite] = useState(profile.socialLinks.website ?? '');
  const [youtube, setYoutube] = useState(profile.socialLinks.youtube ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await firestore()
        .collection(Collections.USERS)
        .doc(profile.id)
        .update({
          'basicInfo.name': name.trim(),
          'basicInfo.pronouns': pronouns.trim(),
          'basicInfo.bio': bio.trim(),
          'basicInfo.location.city': city.trim(),
          'basicInfo.location.state': state.trim(),
          'roleInfo.primaryRole': primaryRole,
          'roleInfo.specialties': specialties.split(',').map(s => s.trim()).filter(Boolean),
          'attributes.skills': skills.split(',').map(s => s.trim()).filter(Boolean),
          'socialLinks.instagram': instagram.trim(),
          'socialLinks.tiktok': tiktok.trim(),
          'socialLinks.website': website.trim(),
          'socialLinks.youtube': youtube.trim(),
        });
      onClose();
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[editStyles.container, { paddingTop: top }]}>
        {/* Header */}
        <View style={editStyles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={editStyles.headerSide}>
            <Text style={editStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={editStyles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={editStyles.headerSide}
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={editStyles.saveText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={editStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar row */}
          <View style={editStyles.avatarRow}>
            {profile.basicInfo.headshotUrl ? (
              <Image
                source={{ uri: profile.basicInfo.headshotUrl }}
                style={editStyles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={editStyles.avatar} />
            )}
          </View>

          {/* ── Basic Info ── */}
          <Text style={editStyles.sectionLabel}>BASIC INFO</Text>

          <Text style={editStyles.fieldLabel}>Name</Text>
          <TextInput
            style={editStyles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
            placeholder="Your name"
          />

          <Text style={editStyles.fieldLabel}>Pronouns</Text>
          <TextInput
            style={editStyles.input}
            value={pronouns}
            onChangeText={setPronouns}
            placeholderTextColor="#888"
            placeholder="e.g. she/her"
          />

          <Text style={editStyles.fieldLabel}>Bio</Text>
          <TextInput
            style={[editStyles.input, editStyles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholderTextColor="#888"
            placeholder="Tell the world about yourself"
            multiline
            numberOfLines={4}
          />

          {/* ── Location ── */}
          <Text style={editStyles.sectionLabel}>LOCATION</Text>

          <Text style={editStyles.fieldLabel}>City</Text>
          <TextInput
            style={editStyles.input}
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#888"
            placeholder="City"
          />

          <Text style={editStyles.fieldLabel}>State</Text>
          <TextInput
            style={editStyles.input}
            value={state}
            onChangeText={setState}
            placeholderTextColor="#888"
            placeholder="TX"
            autoCapitalize="characters"
            maxLength={2}
          />

          {/* ── Role ── */}
          <Text style={editStyles.sectionLabel}>ROLE</Text>

          <Text style={editStyles.fieldLabel}>Primary Role</Text>
          <View style={editStyles.roleGrid}>
            {ALL_ROLES.map(r => (
              <Pressable
                key={r}
                onPress={() => setPrimaryRole(r)}
                style={[editStyles.rolePill, primaryRole === r && editStyles.rolePillActive]}
              >
                <Text style={[editStyles.rolePillText, primaryRole === r && editStyles.rolePillTextActive]}>
                  {ROLE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={editStyles.fieldLabel}>Specialties <Text style={editStyles.hint}>(comma-separated)</Text></Text>
          <TextInput
            style={editStyles.input}
            value={specialties}
            onChangeText={setSpecialties}
            placeholderTextColor="#888"
            placeholder="e.g. Cinematography, Color Grading"
          />

          <Text style={editStyles.fieldLabel}>Skills <Text style={editStyles.hint}>(comma-separated)</Text></Text>
          <TextInput
            style={editStyles.input}
            value={skills}
            onChangeText={setSkills}
            placeholderTextColor="#888"
            placeholder="e.g. Arri Alexa, DaVinci Resolve"
          />

          {/* ── Social Links ── */}
          <Text style={editStyles.sectionLabel}>SOCIAL LINKS</Text>

          <Text style={editStyles.fieldLabel}>Instagram</Text>
          <TextInput
            style={editStyles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholderTextColor="#888"
            placeholder="@handle"
            autoCapitalize="none"
          />

          <Text style={editStyles.fieldLabel}>TikTok</Text>
          <TextInput
            style={editStyles.input}
            value={tiktok}
            onChangeText={setTiktok}
            placeholderTextColor="#888"
            placeholder="@handle"
            autoCapitalize="none"
          />

          <Text style={editStyles.fieldLabel}>Website</Text>
          <TextInput
            style={editStyles.input}
            value={website}
            onChangeText={setWebsite}
            placeholderTextColor="#888"
            placeholder="https://yoursite.com"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={editStyles.fieldLabel}>YouTube</Text>
          <TextInput
            style={editStyles.input}
            value={youtube}
            onChangeText={setYoutube}
            placeholderTextColor="#888"
            placeholder="https://youtube.com/@handle"
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const editStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3D3D3D',
  },
  headerSide: { width: 60 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  cancelText: { color: '#AAAAAA', fontSize: 16 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'right' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  avatarRow: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#555', marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#888888',
    letterSpacing: 0.8, marginTop: 24, marginBottom: 12,
  },
  fieldLabel: { color: '#CCCCCC', fontSize: 14, marginBottom: 6 },
  hint: { color: '#666666', fontSize: 12 },
  input: {
    backgroundColor: INPUT_BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    color: '#FFFFFF', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top', paddingTop: 13 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  rolePill: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: '#4A4A4A',
  },
  rolePillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  rolePillText: { color: '#AAAAAA', fontSize: 14, fontWeight: '500' },
  rolePillTextActive: { color: '#1A1A1A' },
});

// ── Profile View ──────────────────────────────────────────────────────────────

export const ProfileView = ({
  profile,
  topPadding = 0,
  isOwner = false,
}: {
  profile: UserProfile | null;
  topPadding?: number;
  isOwner?: boolean;
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showGallery, setShowGallery] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  //const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);

  const { posts, loading: postsLoading } = useUserPosts(
    profile?.id ?? '',
    profile?.basicInfo?.name,
  );

  if (!profile) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Loading…</Text>
      </View>
    );
  }

  const { basicInfo, roleInfo, attributes, gallery } = profile;
  const tags = [
    roleInfo.primaryRole,
    ...roleInfo.specialties,
    ...attributes.skills.slice(0, 5),
  ].map(t => '#' + t.toLowerCase().replace(/\s+/g, ''));

  // function handleApply(post: Post) {
  //   setSelectedPost(null);
  //   setApplyPost(post);
  // }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {basicInfo.headshotUrl ? (
            <Image
              source={{ uri: basicInfo.headshotUrl }}
              style={styles.headshot}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.headshot} />
          )}
          <View style={styles.headerRight}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{basicInfo.name}</Text>
              {isOwner && (
                <TouchableOpacity hitSlop={10} onPress={() => setShowEdit(true)}>
                  <SvgXml xml={EDIT_ICON} width={20} height={20} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.bio}>{basicInfo.bio}</Text>
          </View>
        </View>

        {/* ── Tags as bubbles ── */}
        <View style={styles.tagsRow}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tagBubble}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* ── Portfolio ── */}
        {gallery.photos.length > 0 && (
          <>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowGallery(true)}
              style={styles.sectionTitleRow}
            >
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Text style={styles.sectionArrow}>›</Text>
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.portfolioScroll}
              contentContainerStyle={styles.portfolioScrollContent}
            >
              {gallery.photos.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={styles.portfolioCard}
                  onPress={() => setShowGallery(true)}
                >
                  {item.url ? (
                    <Image source={{ uri: item.url }} style={styles.portfolioImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.portfolioPlaceholder} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Posts ── */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {postsLoading ? (
            <ActivityIndicator color="#FFFFFF" style={styles.postsLoading} />
          ) : posts.length === 0 ? (
            <Text style={styles.postsEmptyText}>No posts yet.</Text>
          ) : (
            posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              >
                <Text style={styles.postTitle}>{post.filmName}</Text>
                <Text style={styles.postDescription} numberOfLines={3}>
                  {getPostPreviewText(post)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Gallery modal ── */}
      {showGallery && (
        <GalleryModal
          photos={gallery.photos}
          isOwner={isOwner}
          profileId={profile.id}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* ── Edit profile modal ── */}
      {isOwner && showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onApply={handleApply}
      /> */}

      <ApplyScreen
        post={applyPost}
        visible={applyPost !== null}
        onClose={() => setApplyPost(null)}
      />
    </>
  );
};

export const ProfileScreen = () => {
  const { top } = useSafeAreaInsets();
  const { profile } = useUserProfile('user_001');
  return <ProfileView profile={profile} topPadding={top + 16} isOwner />;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'flex-start',
  },
  headshot: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#888888',
  },
  headerRight: { flex: 1 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  bio: { color: '#FFFFFF', fontSize: 13, lineHeight: 19 },

  // Tag bubbles
  tagsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28,
  },
  tagBubble: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#4D4D4D',
  },
  tagText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },

  // Section header
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  sectionArrow: { color: '#AAAAAA', fontSize: 26, fontWeight: '300' },

  // Portfolio horizontal scroll
  portfolioScroll: { marginHorizontal: -20, marginBottom: 28 },
  portfolioScrollContent: { paddingHorizontal: 20, gap: 12 },
  portfolioCard: {
    width: width * 0.72,
    height: width * 0.72 * 0.65,
    borderRadius: 16, overflow: 'hidden', backgroundColor: '#D0DAE8',
  },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioPlaceholder: { width: '100%', height: '100%', backgroundColor: '#D0DAE8' },

  // Posts
  postsSection: {
    marginTop: 4,
    marginBottom: 8,
    gap: 10,
  },
  postsLoading: {
    paddingVertical: 12,
  },
  postsEmptyText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  postDescription: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },

  // Post detail modal
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
  detailImageScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  detailImage: {
    width: 260,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#D8E4F0',
  },

  // Apply button in detail modal
  applyButton: {
    backgroundColor: '#1A1A1A',
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
});
