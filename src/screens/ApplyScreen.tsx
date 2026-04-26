import React, { useState, useCallback, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post } from '../types/post';
import { GalleryPhoto } from '../types/user';
import { applyToPost } from '../services/posts';
import { firestore, Collections } from '../services/firebase';

// ── Constants ────────────────────────────────────────────────────────────────

const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';
const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the ISO weekday index (0=Mon … 6=Sun) for the 1st of the month */
function firstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Calendar component ───────────────────────────────────────────────────────

/** Expand all days between start and end (inclusive) into a Set of "YYYY-MM-DD" keys */
function expandRange(start: string, end: string): Set<string> {
  const result = new Set<string>();
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    result.add(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

interface CalendarProps {
  rangeStart: string | null; // "YYYY-MM-DD"
  rangeEnd: string | null;
  onSelectDay: (key: string) => void;
}

function Calendar({ rangeStart, rangeEnd, onSelectDay }: CalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const numDays = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Build filled range set for rendering
  const filledRange: Set<string> =
    rangeStart && rangeEnd ? expandRange(rangeStart, rangeEnd) : new Set();

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={calStyles.container}>
      {/* Month navigation */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>{'‹'}</Text>
        </TouchableOpacity>

        <View style={calStyles.monthPill}>
          <Text style={calStyles.calIcon}>📅</Text>
          <Text style={calStyles.monthText}>{MONTHS[month]}</Text>
          <Text style={calStyles.monthCaret}>{' ⌄'}</Text>
        </View>

        <TouchableOpacity onPress={nextMonth} hitSlop={12} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={calStyles.dayRow}>
        {DAY_LABELS.map(d => (
          <Text key={d} style={calStyles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Date grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={calStyles.dayRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={calStyles.dayCell} />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isEndpoint = key === rangeStart || key === rangeEnd;
            const isInRange = filledRange.has(key);
            return (
              <TouchableOpacity
                key={col}
                style={[
                  calStyles.dayCell,
                  isInRange && calStyles.dayCellInRange,
                  isEndpoint && calStyles.dayCellEndpoint,
                ]}
                onPress={() => onSelectDay(key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  calStyles.dayNum,
                  isInRange && calStyles.dayNumInRange,
                  isEndpoint && calStyles.dayNumEndpoint,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 18,
    color: '#444',
    lineHeight: 20,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  calIcon: { fontSize: 13, marginRight: 5 },
  monthText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  monthCaret: { fontSize: 12, color: '#888', marginLeft: 2 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayLabel: {
    width: (SCREEN_WIDTH - 32 - 32 - 32) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 32 - 32 - 32) / 7,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  dayCellInRange: {
    backgroundColor: '#E0E0E0',
  },
  dayCellEndpoint: {
    backgroundColor: '#1A1A1A',
  },
  dayNum: {
    fontSize: 13,
    color: '#333333',
  },
  dayNumInRange: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  dayNumEndpoint: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

// ── Portfolio stack preview ───────────────────────────────────────────────────

const PORTFOLIO_CARD_W = Math.round(SCREEN_WIDTH * 0.80);
const PORTFOLIO_CARD_H = Math.round(PORTFOLIO_CARD_W * 0.6);
const BACK_OFFSET_X = 30;
const BACK_OFFSET_Y = 12;
const PORTFOLIO_STACK_W = PORTFOLIO_CARD_W + BACK_OFFSET_X + 10;
const PORTFOLIO_STACK_H = PORTFOLIO_CARD_H + BACK_OFFSET_Y + 4;

function PortfolioStack({ selectedCount, onPress }: { selectedCount: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[portfolioStyles.container, { width: PORTFOLIO_STACK_W, height: PORTFOLIO_STACK_H }]}
    >
      <View style={[portfolioStyles.card, portfolioStyles.cardBack, {
        width: PORTFOLIO_CARD_W, height: PORTFOLIO_CARD_H,
        top: 0, left: BACK_OFFSET_X, transform: [{ rotate: '5deg' }],
      }]} />
      <View style={[portfolioStyles.card, portfolioStyles.cardFront, {
        width: PORTFOLIO_CARD_W, height: PORTFOLIO_CARD_H,
        bottom: 0, left: 0,
        borderWidth: selectedCount > 0 ? 2.5 : 0,
        borderColor: selectedCount > 0 ? '#1A1A1A' : 'transparent',
      }]}>
        {selectedCount > 0 && (
          <View style={portfolioStyles.checkBadge}>
            <Text style={portfolioStyles.checkMark}>{selectedCount}</Text>
          </View>
        )}
        <Text style={portfolioStyles.tapHint}>
          {selectedCount > 0 ? `${selectedCount} selected — tap to change` : 'Tap to select portfolio items'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const portfolioStyles = StyleSheet.create({
  container: { position: 'relative' },
  card: { position: 'absolute', borderRadius: 16 },
  cardBack: { backgroundColor: '#B8C2CE' },
  cardFront: { backgroundColor: '#E4EAF2', alignItems: 'center', justifyContent: 'center' },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tapHint: { fontSize: 13, color: '#888888', textAlign: 'center', paddingHorizontal: 16 },
});

// ── Portfolio Gallery Modal ────────────────────────────────────────────────────

const COL_W = (SCREEN_WIDTH - 32 - 8) / 2; // two columns with 8px gap

function PortfolioGalleryModal({
  visible,
  userId,
  selectedIds,
  onDone,
  onClose,
}: {
  visible: boolean;
  userId: string;
  selectedIds: string[];
  onDone: (ids: string[]) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  // Fetch gallery photos from Firestore when modal opens
  useEffect(() => {
    if (!visible) return;
    setSelected(new Set(selectedIds));
    setLoading(true);

    firestore()
      .collection(Collections.USERS)
      .doc(userId)
      .get()
      .then(doc => {
        const data = doc.data();
        setPhotos(data?.gallery?.photos ?? []);
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const leftCol = photos.filter((_, i) => i % 2 === 0);
  const rightCol = photos.filter((_, i) => i % 2 === 1);

  const renderPhoto = (photo: GalleryPhoto) => {
    const isSelected = selected.has(photo.id);
    return (
      <TouchableOpacity
        key={photo.id}
        onPress={() => toggle(photo.id)}
        activeOpacity={0.85}
        style={[galleryStyles.photoWrapper, isSelected && galleryStyles.photoWrapperSelected]}
      >
        <Image source={{ uri: photo.url }} style={galleryStyles.photo} resizeMode="cover" />
        {isSelected && (
          <View style={galleryStyles.checkOverlay}>
            <Text style={galleryStyles.checkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[galleryStyles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={galleryStyles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={galleryStyles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={galleryStyles.title}>Portfolio</Text>
          <TouchableOpacity onPress={() => onDone(Array.from(selected))} hitSlop={12}>
            <Text style={galleryStyles.doneText}>Done ({selected.size})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#FFFFFF" style={{ marginTop: 60 }} />
        ) : photos.length === 0 ? (
          <View style={galleryStyles.emptyState}>
            <Text style={galleryStyles.emptyText}>No portfolio photos yet.</Text>
            <Text style={galleryStyles.emptySubText}>Add photos to your profile first.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={galleryStyles.grid} showsVerticalScrollIndicator={false}>
            <View style={galleryStyles.col}>{leftCol.map(renderPhoto)}</View>
            <View style={galleryStyles.col}>{rightCol.map(renderPhoto)}</View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const galleryStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2C2C2C' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backText: { fontSize: 16, color: '#FFFFFF' },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  doneText: { fontSize: 16, color: '#E5674E', fontWeight: '600' },
  grid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
  col: { flex: 1, gap: 8 },
  photoWrapper: { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  photoWrapperSelected: { borderWidth: 3, borderColor: '#FFFFFF' },
  photo: { width: '100%', height: '100%' },
  checkOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#888888', fontSize: 14 },
});

// ── ApplyScreen ───────────────────────────────────────────────────────────────

interface ApplyScreenProps {
  post: Post | null;
  visible: boolean;
  onClose: () => void;
}

export function ApplyScreen({ post, visible, onClose }: ApplyScreenProps) {
  const insets = useSafeAreaInsets();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<{ name: string; uri: string } | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectDay = useCallback((key: string) => {
    setRangeStart(prev => {
      if (!prev) {
        // No start yet — set start
        setRangeEnd(null);
        return key;
      }
      if (!rangeEnd) {
        // Have start, no end yet — set end (enforce order)
        if (key < prev) {
          setRangeEnd(prev);
          return key;
        }
        setRangeEnd(key);
        return prev;
      }
      // Range already complete — reset and start fresh
      setRangeEnd(null);
      return key;
    });
  }, [rangeEnd]);

  async function pickResume() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setResumeFile({ name: asset.name, uri: asset.uri });
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!post) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      // Use first role as the applied role (can be extended to role picker later)
      const roleTitle = post.roles[0]?.title ?? 'Crew';
      await applyToPost(post.id, 'current-user-placeholder', {
        roleTitle,
        message: notes.trim(),
        coverLetter: coverLetter.trim(),
        phone: phone.trim(),
        email: email.trim(),
        availabilityStart: rangeStart ?? undefined,
        availabilityEnd: rangeEnd ?? undefined,
        portfolioItemIds: selectedPortfolioIds,
      });
      Alert.alert('Application Submitted', `You've applied to "${post.filmName}". Good luck!`, [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    // Reset form on close
    setFullName('');
    setEmail('');
    setPhone('');
    setSelectedPortfolioIds([]);
    setShowGallery(false);
    setCoverLetter('');
    setResumeFile(null);
    setRangeStart(null);
    setRangeEnd(null);
    setNotes('');
    setSubmitting(false);
    onClose();
  }

  if (!post) return null;

  const deadline = formatDate(post.recruitmentDeadline);
  const overviewPay = '$15/hr'; // placeholder — extend Post type when pay is added

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Text style={styles.backArrow}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Primary Information ── */}
          <Text style={styles.sectionTitle}>Primary Information</Text>

          <Text style={styles.fieldLabel}>Full name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder=""
            placeholderTextColor="#AAAAAA"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Email*</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder=""
            placeholderTextColor="#AAAAAA"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Phone number*</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder=""
            placeholderTextColor="#AAAAAA"
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          {/* ── Overview ── */}
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIconRow}>
              <View style={styles.overviewIcon}>
                <Text style={styles.overviewIconText}>💼</Text>
              </View>
              <View>
                <Text style={styles.overviewFilmName}>{post.filmName} Application</Text>
                <Text style={styles.overviewDirector}>{post.postedBy.name}</Text>
              </View>
            </View>
            <View style={styles.overviewMetaRow}>
              <Text style={styles.overviewMetaIcon}>📍</Text>
              <Text style={styles.overviewMetaText}>
                {post.postedBy.school || `${post.shootingLocation.city}, ${post.shootingLocation.state}`}
              </Text>
            </View>
            <View style={styles.overviewMetaRow}>
              <Text style={styles.overviewMetaIcon}>📅</Text>
              <Text style={styles.overviewMetaText}>{deadline}</Text>
            </View>
            <View style={styles.overviewMetaRow}>
              <Text style={styles.overviewMetaIcon}>💵</Text>
              <Text style={styles.overviewMetaText}>{overviewPay}</Text>
            </View>
          </View>

          {/* ── Select Portfolio Items ── */}
          <Text style={styles.sectionTitle}>Select Portfolio Items</Text>

          <View style={{ height: 16 }} />
          <PortfolioStack
            selectedCount={selectedPortfolioIds.length}
            onPress={() => setShowGallery(true)}
          />
          <PortfolioGalleryModal
            visible={showGallery}
            userId="current-user-placeholder"
            selectedIds={selectedPortfolioIds}
            onDone={(ids) => { setSelectedPortfolioIds(ids); setShowGallery(false); }}
            onClose={() => setShowGallery(false)}
          />

          {/* ── Cover Letter / Resume ── */}
          <Text style={styles.sectionTitle}>Cover Letter/Resume</Text>

          <TouchableOpacity
            style={[styles.uploadBox, resumeFile != null && styles.uploadBoxDone]}
            onPress={pickResume}
            activeOpacity={0.8}
          >
            {resumeFile != null ? (
              <>
                <Text style={styles.uploadIcon}>📄</Text>
                <Text style={styles.uploadText} numberOfLines={1} ellipsizeMode="middle">
                  {resumeFile.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setResumeFile(null)}
                  hitSlop={12}
                  style={styles.removeFileBtn}
                >
                  <Text style={styles.removeFileText}>Remove</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.uploadIcon}>⊕</Text>
                <Text style={styles.uploadText}>Add files here</Text>
                <Text style={styles.uploadSubText}>PDF or Word doc</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.notesBox, { marginTop: 12 }]}>
            <TextInput
              style={styles.notesInput}
              value={coverLetter}
              onChangeText={t => setCoverLetter(t.slice(0, 1000))}
              placeholder="Tell us why you're a great fit for this role..."
              placeholderTextColor="#AAAAAA"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.notesCounter}>{coverLetter.length}/1000 characters</Text>
          </View>

          {/* ── Availability ── */}
          <Text style={styles.sectionTitle}>Availability</Text>

          <Calendar
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onSelectDay={handleSelectDay}
          />

          {/* ── Additional Notes ── */}
          <Text style={styles.sectionTitle}>Additional Notes</Text>

          <View style={styles.notesBox}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={t => setNotes(t.slice(0, 500))}
              placeholder="Any additional information you'd like to share..."
              placeholderTextColor="#AAAAAA"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.notesCounter}>{notes.length}/500 characters</Text>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 30,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },

  // Form fields
  fieldLabel: {
    fontSize: 13,
    color: '#CCCCCC',
    marginBottom: 6,
  },
  input: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // Overview card
  overviewCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  overviewIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  overviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewIconText: { fontSize: 18 },
  overviewFilmName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  overviewDirector: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  overviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overviewMetaIcon: { fontSize: 13 },
  overviewMetaText: {
    fontSize: 13,
    color: '#444444',
  },

  // Upload box
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#555555',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  uploadBoxDone: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  uploadIcon: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  uploadText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    maxWidth: '80%',
    textAlign: 'center',
  },
  uploadSubText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  removeFileBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888888',
  },
  removeFileText: {
    fontSize: 12,
    color: '#CCCCCC',
  },

  // Notes
  notesBox: {
    backgroundColor: '#3A3A3A',
    borderRadius: 14,
    padding: 14,
  },
  notesInput: {
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 100,
  },
  notesCounter: {
    fontSize: 11,
    color: '#888888',
    marginTop: 8,
  },

  // Submit
  submitBtn: {
    backgroundColor: '#E5674E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
