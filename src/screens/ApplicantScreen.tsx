import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { firestore, Collections } from '../services/firebase';
import { UserProfile } from '../types/user';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NavigationProp<RootStackParamList, 'Applicant'>;
type Route = RouteProp<RootStackParamList, 'Applicant'>;

const BG = '#2C2C2C';
const SURFACE = '#3A3A3A';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 52) / 2;

type TabType = 'Profile' | 'Portfolio' | 'Documents' | 'Availability';
const TABS: TabType[] = ['Profile', 'Portfolio', 'Documents', 'Availability'];

export const ApplicantScreen = () => {
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { applicantId, postId, applicationId } = route.params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Profile');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'accept' | 'decline'>('decline');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    firestore()
      .collection(Collections.USERS)
      .doc(applicantId)
      .get()
      .then(snap => {
        if (snap.exists) {
          setProfile({ id: snap.id, ...snap.data() } as UserProfile);
        }
      })
      .catch(err => console.error('Failed to load applicant:', err))
      .finally(() => setLoading(false));
  }, [applicantId]);

  const handleDecline = () => {
    setFeedbackAction('decline');
    setShowFeedback(true);
  };

  const handleAccept = () => {
    setFeedbackAction('accept');
    setShowFeedback(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Please enter feedback before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const newStatus = feedbackAction === 'accept' ? 'accepted' : 'rejected';
      await firestore()
        .collection(Collections.APPLICATIONS)
        .doc(applicationId)
        .update({ status: newStatus });
      await firestore()
        .collection('notifications')
        .add({
          userId: applicantId,
          type: feedbackAction,
          message: feedbackText.trim(),
          postId,
          applicationId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      setShowFeedback(false);
      setFeedbackText('');
      Alert.alert(
        feedbackAction === 'accept' ? 'Accepted!' : 'Declined',
        'Feedback sent to applicant.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: BG }]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const { basicInfo, roleInfo, attributes, gallery } = profile;
  const handle = basicInfo.name.toLowerCase().replace(/\s+/g, '');

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applicant</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Applicant info card */}
      <View style={styles.applicantCard}>
        <View style={styles.avatarWrap}>
          {basicInfo.headshotUrl ? (
            <Image source={{ uri: basicInfo.headshotUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={[
            styles.statusDot,
            { backgroundColor: roleInfo.availability === 'available' ? '#4CAF50' : '#E53935' },
          ]} />
        </View>
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>{basicInfo.name}</Text>
          {basicInfo.pronouns ? (
            <Text style={styles.applicantHandle}>@{handle}</Text>
          ) : null}
          <Text style={styles.applicantMeta}>
            {roleInfo.primaryRole} @ {basicInfo.location.city}
          </Text>
        </View>
      </View>

      {/* Pill tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Role/pay pills — always visible below tabs */}
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}> {roleInfo.primaryRole} Application</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}> $ {roleInfo.experienceLevel}</Text>
        </View>
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Profile' && (
          <>
            <Text style={styles.sectionTitle}>Primary Information</Text>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {basicInfo.location.city}, {basicInfo.location.state}
              </Text>
            </View>
            {basicInfo.email ? (
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{basicInfo.email}</Text>
              </View>
            ) : null}
            {basicInfo.phone ? (
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Phone number</Text>
                <Text style={styles.infoValue}>{basicInfo.phone}</Text>
              </View>
            ) : null}
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{basicInfo.bio}</Text>
            <View style={styles.divider} />

            {attributes.skills.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsRow}>
                  {attributes.skills.map(s => (
                    <View key={s} style={styles.skillPill}>
                      <Text style={styles.skillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {activeTab === 'Portfolio' && (
          <>
            {gallery.photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {gallery.photos.map(photo => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.url }}
                    style={styles.photoItem}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No portfolio items yet.</Text>
            )}
          </>
        )}

        {activeTab === 'Documents' && (
          <Text style={styles.emptyText}>No documents uploaded.</Text>
        )}

        {activeTab === 'Availability' && (
          <Text style={styles.emptyText}>Availability not set.</Text>
        )}
      </ScrollView>

      {/* Accept / Decline buttons */}
      <View style={[styles.actionRow, { paddingBottom: bottom + 16 }]}>
        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedback}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedback(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFeedback(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Applicant Feedback</Text>
              <Text style={styles.modalSubtitle}>
                {feedbackAction === 'decline'
                  ? `You are about to decline ${basicInfo.name}'s application. Please provide feedback to explain your decision.`
                  : `You are about to accept ${basicInfo.name}'s application. Add a message for them.`}
              </Text>
              <TextInput
                style={styles.feedbackInput}
                value={feedbackText}
                onChangeText={t => setFeedbackText(t.slice(0, 500))}
                placeholder="Provide feedback for the applicant."
                placeholderTextColor="#AAAAAA"
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.feedbackCounter}>{feedbackText.length}/500 characters</Text>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                onPress={handleSubmitFeedback}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backArrow: { fontSize: 28, color: '#FFFFFF', lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },

  // ── Applicant card ──
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#888888',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: SURFACE,
  },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  applicantHandle: { fontSize: 13, color: '#AAAAAA', marginBottom: 3 },
  applicantMeta: { fontSize: 13, color: '#AAAAAA' },

  // ── Pill tab bar ──
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabPillActive: { backgroundColor: CARD_BG, borderColor: CARD_BG },
  tabText: { fontSize: 12, color: '#AAAAAA', fontWeight: '500' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '700' },

  // ── Role pills ──
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { fontSize: 12, color: '#FFFFFF' },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // ── Profile tab ──
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 4,
  },
  infoField: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 2,
  },
  infoValue: { fontSize: 14, color: '#FFFFFF' },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: SURFACE,
    marginVertical: 20,
  },
  bioText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 21,
    marginBottom: 20,
  },

  // ── Skills ──
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  skillText: { fontSize: 13, color: '#FFFFFF' },

  // ── Portfolio ──
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.2,
    borderRadius: 10,
    backgroundColor: SURFACE,
  },

  emptyText: { color: '#AAAAAA', fontSize: 14, textAlign: 'center', marginTop: 40 },

  // ── Action row ──
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: SURFACE,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#FB7257',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  declineBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  acceptBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },

  // ── Feedback modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#AAAAAA', lineHeight: 18, marginBottom: 16 },
  feedbackInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 140,
  },
  feedbackCounter: { fontSize: 11, color: '#888888', marginTop: 6, marginBottom: 16 },
  submitBtn: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
});
