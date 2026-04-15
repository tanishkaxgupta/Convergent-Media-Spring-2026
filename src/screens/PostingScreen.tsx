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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createPost } from '../services/posts';
import { Role, RoleType } from '../types/post';

// ── Constants ─────────────────────────────────────────────────────────────────

const BG = '#F2F2F2';
const CARD_BG = '#FFFFFF';
const PILL_BG = '#1A1A1A';

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

      await createPost({
        filmName: title.trim(),
        director: [currentUserName],
        recruitmentDeadline: dateTime || new Date().toISOString(),
        shootingTimeline: {
          startDate: dateTime || new Date().toISOString(),
          endDate: dateTime || new Date().toISOString(),
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
                <View style={styles.pill}>
                  <Text style={styles.pillIcon}>📅</Text>
                  <TextInput
                    style={styles.pillText}
                    placeholder="Set date & time"
                    placeholderTextColor="#AAAAAA"
                    value={dateTime}
                    onChangeText={setDateTime}
                  />
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillIcon}>📍</Text>
                  <TextInput
                    style={styles.pillText}
                    placeholder="Location"
                    placeholderTextColor="#AAAAAA"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
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

              <View style={styles.tagRow}>
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagPill}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagPillText}>{tag} ×</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.tagInput}
                  placeholder="+ Add tags"
                  placeholderTextColor="#888888"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
              </View>
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
                  <TouchableOpacity
                    style={styles.roleCircle}
                    onPress={() => removeRole(index)}
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
  titleInput: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', padding: 0 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PILL_BG, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
  },
  pillIcon: { fontSize: 12 },
  pillText: { color: '#FFFFFF', fontSize: 13, minWidth: 80, padding: 0 },
  descriptionInput: {
    backgroundColor: '#F5F5F5', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1A1A1A', minHeight: 80,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tagPill: { backgroundColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagPillText: { fontSize: 13, color: '#333333' },
  tagInput: { fontSize: 13, color: '#333333', minWidth: 80, padding: 0 },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  roleTextGroup: { flex: 1, gap: 2 },
  roleNameInput: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', padding: 0 },
  roleDescInput: { fontSize: 12, color: '#AAAAAA', padding: 0 },
  roleCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CCCCCC', marginLeft: 12 },
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
