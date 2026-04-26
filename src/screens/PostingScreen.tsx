import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createPost } from '../services/posts';
import { Role, RoleType } from '../types/post';

// ── Pill icons (white, to sit on dark #1A1A1A pill background) ────────────────

const CALENDAR_PILL_SVG = `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.7" y="1.7" width="12.6" height="11.6" rx="1.8" stroke="white" stroke-width="1.3"/>
  <line x1="4" y1="0.5" x2="4" y2="3.2" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <line x1="10" y1="0.5" x2="10" y2="3.2" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <line x1="1" y1="5.8" x2="13" y2="5.8" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
</svg>`;

const PIN_PILL_SVG = `<svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 1C3.79 1 2 2.79 2 5C2 8.25 6 15 6 15C6 15 10 8.25 10 5C10 2.79 8.21 1 6 1Z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="6" cy="5" r="1.5" stroke="white" stroke-width="1.2"/>
</svg>`;

const HASH_PILL_SVG = `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="4" y1="1" x2="3" y2="13" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="10" y1="1" x2="9" y2="13" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="1.5" y1="5" x2="12.5" y2="5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="1.5" y1="9" x2="12.5" y2="9" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

// ── Constants ─────────────────────────────────────────────────────────────────

const BG = '#F2F2F2';
const CARD_BG = '#FFFFFF';
const PILL_BG = '#1A1A1A';

// ── Calendar helpers ──────────────────────────────────────────────────────────

const CAL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CAL_MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAL_DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function calDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function calFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${CAL_MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

// ── Role circle toggle ────────────────────────────────────────────────────────

const RoleCircle = ({ onRemove, canRemove }: { onRemove: () => void; canRemove: boolean }) => (
  <TouchableOpacity
    onPress={canRemove ? onRemove : undefined}
    hitSlop={10}
    activeOpacity={0.7}
    style={roleCircleStyles.outer}
  >
    {canRemove && <View style={roleCircleStyles.inner} />}
  </TouchableOpacity>
);

const roleCircleStyles = StyleSheet.create({
  outer: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#BBBBBB',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  inner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#1A1A1A',
  },
});

// ── Date picker calendar ──────────────────────────────────────────────────────

interface DatePickerCalendarProps {
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
}

function DatePickerCalendar({ selectedKey, onSelectDay }: DatePickerCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const numDays = calDaysInMonth(year, month);
  const offset = calFirstDayOffset(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={dpStyles.calContainer}>
      <View style={dpStyles.calHeader}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12} style={dpStyles.navBtn}>
          <Text style={dpStyles.calNavArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={dpStyles.calMonthText}>{CAL_MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12} style={dpStyles.navBtn}>
          <Text style={dpStyles.calNavArrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      <View style={dpStyles.calDayRow}>
        {CAL_DAY_LABELS.map(d => (
          <Text key={d} style={dpStyles.calDayLabel}>{d}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={dpStyles.calDayRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={dpStyles.calDayCell} />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = key === selectedKey;
            return (
              <TouchableOpacity
                key={col}
                style={[dpStyles.calDayCell, isSelected && dpStyles.calDayCellSelected]}
                onPress={() => onSelectDay(key)}
                activeOpacity={0.7}
              >
                <Text style={[dpStyles.calDayNum, isSelected && dpStyles.calDayNumSelected]}>
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoleRow {
  roleName: string;
  roleDescription: string;
  roleType: RoleType;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserSchool?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PostingScreen: React.FC<Props> = ({
  visible,
  onClose,
  currentUserId = 'CURRENT_USER_ID',
  currentUserName = 'Unknown',
  currentUserSchool = 'Unknown',
}) => {
  const insets = useSafeAreaInsets();

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([
    { roleName: '', roleDescription: '', roleType: 'crew' },
  ]);
  const [reqPortfolio, setReqPortfolio] = useState(false);
  const [reqCoverLetter, setReqCoverLetter] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const addRole = () => {
    setRoles(prev => [...prev, { roleName: '', roleDescription: '', roleType: 'crew' }]);
  };

  const updateRole = (index: number, field: keyof RoleRow, value: string) => {
    setRoles(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDateTime('');
    setSelectedDateKey(null);
    setLocation('');
    setDescription('');
    setTagInput('');
    setTags([]);
    setRoles([{ roleName: '', roleDescription: '', roleType: 'crew' }]);
    setReqPortfolio(false);
    setReqCoverLetter(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing field', 'Please add a title for your post.');
      return;
    }
    if (roles.some(r => !r.roleName.trim())) {
      Alert.alert('Missing field', 'Please fill in all role names.');
      return;
    }

    setLoading(true);
    try {
      const [city = '', state = ''] = location.split(',').map(s => s.trim());

      const builtRoles: Role[] = roles
        .filter(r => r.roleName.trim())
        .map(r => ({
          title: r.roleName.trim(),
          description: r.roleDescription.trim(),
          type: r.roleType,
        }));

      const deadline = dateTime || new Date().toISOString();

      await createPost({
        filmName: title.trim(),
        director: [currentUserName],
        recruitmentDeadline: deadline,
        shootingTimeline: {
          startDate: deadline,
          endDate: deadline,
        },
        roles: builtRoles,
        shootingLocation: { city, state, details: location },
        postedBy: {
          userId: currentUserId,
          name: currentUserName,
          school: currentUserSchool,
        },
        description: description.trim() || undefined,
        tags: tags.length ? tags : undefined,
        requirements: {
          portfolioWork: reqPortfolio,
          coverLetter: reqCoverLetter,
        },
      });

      Alert.alert('Posted!', 'Your post has been published.', [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.root, { paddingTop: insets.top || 16 }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>curating post</Text>
              <View style={{ width: 56 }} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 32 },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Title card ── */}
              <View style={styles.card}>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Add a title"
                  placeholderTextColor="#AAAAAA"
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.pillRow}>
                  <TouchableOpacity
                    style={styles.pill}
                    onPress={() => setShowCalendarModal(true)}
                    activeOpacity={0.8}
                  >
                    <SvgXml xml={CALENDAR_PILL_SVG} width={13} height={13} />
                    <Text style={[styles.pillText, !selectedDateKey && styles.pillPlaceholder]}>
                      {selectedDateKey ? formatDateKey(selectedDateKey) : 'Set date & time'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pill} activeOpacity={1}>
                    <SvgXml xml={PIN_PILL_SVG} width={11} height={14} />
                    <TextInput
                      style={styles.pillLocationInput}
                      placeholder="Location"
                      placeholderTextColor="#888888"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Add your project's information"
                  placeholderTextColor="#AAAAAA"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />

                {/* Existing tag pills */}
                {tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {tags.map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.tagPill}
                        onPress={() => removeTag(tag)}
                      >
                        <Text style={styles.tagPillText}>#{tag} ×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Tag input styled as pill */}
                <TouchableOpacity style={styles.tagInputPill} activeOpacity={1} onPress={() => {}}>
                  <SvgXml xml={HASH_PILL_SVG} width={12} height={12} />
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Add tags"
                    placeholderTextColor="#888888"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                  />
                </TouchableOpacity>
              </View>

              {/* ── Available roles card ── */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Available roles</Text>
                {roles.map((role, index) => (
                  <View key={index} style={styles.roleRow}>
                    <View style={styles.roleTextGroup}>
                      <TextInput
                        style={styles.roleNameInput}
                        placeholder="Add a role"
                        placeholderTextColor="#AAAAAA"
                        value={role.roleName}
                        onChangeText={v => updateRole(index, 'roleName', v)}
                      />
                      <TextInput
                        style={styles.roleDescInput}
                        placeholder="Add a role description"
                        placeholderTextColor="#CCCCCC"
                        value={role.roleDescription}
                        onChangeText={v => updateRole(index, 'roleDescription', v)}
                      />
                    </View>
                    <RoleCircle
                      canRemove={roles.length > 1}
                      onRemove={() => removeRole(index)}
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.addRoleBtn} onPress={addRole}>
                  <Text style={styles.addRoleBtnText}>+ Add a role</Text>
                </TouchableOpacity>
              </View>

              {/* ── Requirements card ── */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Requirements</Text>
                <TouchableOpacity
                  style={styles.requirementRow}
                  onPress={() => setReqPortfolio(p => !p)}
                >
                  <Text style={styles.requirementLabel}>Portfolio work</Text>
                  <View style={[styles.requirementCircle, reqPortfolio && styles.requirementCircleActive]} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.requirementRow}
                  onPress={() => setReqCoverLetter(p => !p)}
                >
                  <Text style={styles.requirementLabel}>Cover letter</Text>
                  <View style={[styles.requirementCircle, reqCoverLetter && styles.requirementCircleActive]} />
                </TouchableOpacity>
              </View>

              {/* ── Submit ── */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Post</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* ── Calendar overlay — absolutely positioned inside the sheet so it renders above the form ── */}
            {showCalendarModal && (
              <View style={dpStyles.overlay}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowCalendarModal(false)}
                  activeOpacity={1}
                />
                <View style={dpStyles.calCard}>
                  <Text style={dpStyles.calTitle}>Select Date</Text>
                  <DatePickerCalendar
                    selectedKey={selectedDateKey}
                    onSelectDay={(key) => {
                      setSelectedDateKey(key);
                      setDateTime(`${key}T00:00:00.000Z`);
                      setShowCalendarModal(false);
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cancelBtn: { fontSize: 16, color: '#1A1A1A' },
  headerTitle: { fontSize: 14, color: '#666666', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  titleInput: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 0, marginBottom: 4 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PILL_BG, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, gap: 6,
  },
  pillText: { color: '#FFFFFF', fontSize: 13, padding: 0 },
  pillPlaceholder: { color: '#888888' },
  /** Location pill uses a TextInput — needs tighter padding control */
  pillLocationInput: {
    color: '#FFFFFF', fontSize: 13,
    padding: 0, margin: 0,
    minWidth: 0, flexShrink: 1,
  },
  descriptionInput: {
    backgroundColor: '#F5F5F5', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1A1A1A', minHeight: 110,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  tagPill: { backgroundColor: '#1A1A1A', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tagPillText: { fontSize: 13, color: '#FFFFFF' },
  tagInputPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start', gap: 6,
  },
  tagInput: { fontSize: 13, color: '#FFFFFF', padding: 0, minWidth: 60 },
  roleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  roleTextGroup: { flex: 1, gap: 3 },
  roleNameInput: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', padding: 0 },
  roleDescInput: { fontSize: 12, color: '#AAAAAA', padding: 0 },
  addRoleBtn: { alignSelf: 'flex-start' },
  addRoleBtnText: { fontSize: 14, color: '#888888' },
  requirementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  requirementLabel: { fontSize: 14, color: '#1A1A1A' },
  requirementCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CCCCCC' },
  requirementCircleActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8' },
  submitBtn: { backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

// ── Date picker styles ────────────────────────────────────────────────────────

const dpStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  calCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  calTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  calContainer: { gap: 8 },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navBtn: { padding: 4 },
  calNavArrow: { fontSize: 24, color: '#1A1A1A', lineHeight: 28 },
  calMonthText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  calDayRow: { flexDirection: 'row' },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    paddingVertical: 4,
  },
  calDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    margin: 1,
  },
  calDayCellSelected: { backgroundColor: '#1A1A1A' },
  calDayNum: { fontSize: 14, color: '#1A1A1A' },
  calDayNumSelected: { color: '#FFFFFF', fontWeight: '600' },
});
