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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { firestore, Collections } from '../services/firebase';
import { UserProfile } from '../types/user';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Applicant'>;
type Route = RouteProp<RootStackParamList, 'Applicant'>;

const BG = '#2C2C2C';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  useEffect(() => {
    const unsub = firestore()
      .collection(Collections.USERS)
      .doc(applicantId)
      .onSnapshot(snap => {
        if (snap.exists) {
          setProfile({ id: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      });
    return unsub;
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

      // Update application status
      await firestore()
        .collection(Collections.APPLICATIONS)
        .doc(applicationId)
        .update({ status: newStatus });

      // Send notification to applicant
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
        `Feedback sent to applicant.`,
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

      {/* Applicant info row */}
      <View style={styles.applicantRow}>
        {basicInfo.headshotUrl ? (
          <Image source={{ uri: basicInfo.headshotUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View>
          <Text style={styles.applicantName}>{basicInfo.name}</Text>
          {basicInfo.pronouns ? (
            <Text style={styles.applicantHandle}>@{basicInfo.name.toLowerCase().replace(' ', '')}</Text>
          ) : null}
          <Text style={styles.applicantMeta}>
            {roleInfo.primaryRole} @ {basicInfo.location.city}
          </Text>
        </View>
        <View style={styles.availabilityBadge}>
          <Text style={styles.availabilityText}>
            {roleInfo.availability === 'available' ? '🟢' : '🔴'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Profile' && (
          <>
            {/* Meta pills */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>🏫 HMUA Application</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>💵 {roleInfo.experienceLevel}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Primary Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {basicInfo.location.city}, {basicInfo.location.state}
              </Text>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>{basicInfo.bio}</Text>
            </View>

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
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {gallery.photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {gallery.photos.map(photo => (
                  <TouchableOpacity key={photo.id} onPress={() => setSelectedImage(photo.url)}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photoItem}
                  />
                </TouchableOpacity>
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
        <View style={styles.modalOverlay}>
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
        </View>
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

  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#888888',
  },
  applicantName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  applicantHandle: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  applicantMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  availabilityBadge: { marginLeft: 'auto' },
  availabilityText: { fontSize: 16 },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
    marginBottom: 4,
  },
  tabItem: { paddingVertical: 10, marginRight: 20 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#FFFFFF' },
  tabText: { fontSize: 14, color: '#AAAAAA' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 12, color: '#FFFFFF' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    marginBottom: 16,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: '#1A1A1A', marginBottom: 8 },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillText: { fontSize: 12, color: '#FFFFFF' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 10,
    backgroundColor: '#3A3A3A',
  },

  emptyText: { color: '#AAAAAA', fontSize: 14, textAlign: 'center', marginTop: 40 },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#E8453C',
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

  // Feedback modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#AAAAAA', lineHeight: 18, marginBottom: 16 },
  feedbackInput: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 120,
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