import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { firestore, Collections } from '../services/firebase';
import { Post, RoleType } from '../types/post';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;
type Route = RouteProp<RootStackParamList, 'PostDetail'>;

const BG = '#2C2C2C';
const CARD_BG = '#FFFFFF';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
}

interface Application {
  id: string;
  applicantId: string;
  roleAppliedFor: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  applicantName?: string;
  applicantSchool?: string;
  skills?: string[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3CD', text: '#856404' },
  accepted: { bg: '#D4EDDA', text: '#155724' },
  rejected: { bg: '#F8D7DA', text: '#721C24' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export const PostDetailScreen = () => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch post
    const unsubPost = firestore()
      .collection(Collections.POSTS)
      .doc(postId)
      .onSnapshot(snap => {
        if (snap.exists) {
          setPost({ id: snap.id, ...snap.data() } as Post);
        }
        setLoading(false);
        },
        err => {
        console.error('Post listener error:', err);
        setLoading(false);
        }
    );

    // Fetch applications for this post
//     const unsubApps = firestore()
//       .collection(Collections.APPLICATIONS)
//       .where('postId', '==', postId)
//       .onSnapshot(
//         async snap => {
//         const apps = await Promise.all(
//           snap.docs.map(async doc => {
//             const data = doc.data();
//             // Fetch applicant name from users collection
//             const userSnap = await firestore()
//               .collection(Collections.USERS)
//               .doc(data.applicantId)
//               .get();
//             const userData = userSnap.exists ? userSnap.data() : null;
//             return {
//               id: doc.id,
//               ...data,
//               applicantName: userData?.basicInfo?.name ?? 'Unknown',
//               applicantSchool: userData?.basicInfo?.location?.city
//                 ? `${userData.basicInfo.location.city} @ UT Austin`
//                 : userData?.roleInfo?.primaryRole ?? '',
//               skills: userData?.attributes?.skills?.slice(0, 2) ?? [],
//             } as Application;
//           })
//         );
//         setApplications(apps);
//       });

//     return () => {
//       unsubPost();
//       unsubApps();
//     };
//   }, [postId]);

const unsubApps = firestore()
.collection(Collections.APPLICATIONS)
.where('postId', '==', postId)
.onSnapshot(
  async snap => {
    try {
      const apps: Application[] = [];

      for (const doc of snap.docs) {
        const data = doc.data();

        let userData = null;

        try {
          const userSnap = await firestore()
            .collection(Collections.USERS)
            .doc(data.applicantId)
            .get();

          userData = userSnap.exists ? userSnap.data() : null;
        } catch (e) {
          console.warn('User fetch failed:', e);
        }

        apps.push({
          id: doc.id,
          ...data,
          applicantName: userData?.basicInfo?.name ?? 'Unknown',
          applicantSchool:
            userData?.basicInfo?.location?.city
              ? `${userData.basicInfo.location.city} @ UT Austin`
              : userData?.roleInfo?.primaryRole ?? '',
          skills: userData?.attributes?.skills?.slice(0, 2) ?? [],
        } as Application);
      }

      setApplications(apps);
    } catch (err) {
      console.error('Applications processing error:', err);
    }
  },
  err => {
    console.error('Applications listener error:', err);
  }
);

return () => {
unsubPost();
unsubApps();
};
}, [postId]);

  const toggleHide = (role: string) => {
    setHiddenRoles(prev => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  };

  if (loading || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: BG }]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  // Group applications by role
  const byRole: Record<string, Application[]> = {};
  applications.forEach(app => {
    const role = app.roleAppliedFor ?? 'Other';
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(app);
  });

  const dateRange = formatDateRange(
    post.shootingTimeline.startDate,
    post.shootingTimeline.endDate,
  );
  const deadline = formatDate(post.recruitmentDeadline);
  const totalApplicants = applications.length;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Post info */}
        <Text style={styles.filmName}>{post.filmName}</Text>
        <Text style={styles.description}>
          {post.roles[0]?.description ?? ''}
        </Text>

        {/* Meta */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>
              {post.shootingLocation.city} at {post.postedBy.school}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🎬</Text>
            <Text style={styles.metaText}>Filming {dateRange}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>⏰</Text>
            <Text style={styles.metaText}>Apply by {deadline}</Text>
          </View>
        </View>

        {/* Applicants header */}
        <View style={styles.applicantsHeader}>
          <Text style={styles.applicantsTitle}>Applicants</Text>
          <View style={styles.applicantsBadge}>
            <Text style={styles.applicantsBadgeText}>👥 {totalApplicants}</Text>
          </View>
        </View>

        {/* Grouped by role */}
        {Object.entries(byRole).map(([role, apps]) => (
          <View key={role} style={styles.roleSection}>
            <View style={styles.roleHeader}>
              <Text style={styles.roleTitle}>{role}</Text>
              <TouchableOpacity onPress={() => toggleHide(role)}>
                <Text style={styles.hideBtn}>
                  {hiddenRoles.has(role) ? '∨ show' : '∧ hide'}
                </Text>
              </TouchableOpacity>
            </View>

            {!hiddenRoles.has(role) && apps.map(app => {
              const statusColor = STATUS_COLORS[app.status] ?? STATUS_COLORS.pending;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.applicantCard}
                  onPress={() => navigation.navigate('Applicant', {
                    applicantId: app.applicantId,
                    postId,
                    applicationId: app.id,
                  })}
                >
                  <View style={styles.applicantCardLeft}>
                    <View style={styles.applicantAvatar} />
                    <View>
                      <Text style={styles.applicantName}>{app.applicantName}</Text>
                      <Text style={styles.applicantSchool}>{app.applicantSchool}</Text>
                      <View style={styles.skillsRow}>
                        {app.skills?.map(s => (
                          <View key={s} style={styles.skillPill}>
                            <Text style={styles.skillText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {STATUS_LABELS[app.status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {applications.length === 0 && (
          <Text style={styles.emptyText}>No applications yet.</Text>
        )}
      </ScrollView>
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
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  filmName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  description: { fontSize: 14, color: '#AAAAAA', lineHeight: 20, marginBottom: 16 },
  metaCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 13, color: '#333333' },
  applicantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  applicantsTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  applicantsBadge: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applicantsBadgeText: { color: '#FFFFFF', fontSize: 13 },
  roleSection: { marginBottom: 20 },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  hideBtn: { fontSize: 13, color: '#AAAAAA' },
  applicantCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  applicantCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C0C4CC',
  },
  applicantName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  applicantSchool: { fontSize: 12, color: '#666666', marginTop: 1 },
  skillsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  skillPill: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skillText: { fontSize: 11, color: '#444444' },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#AAAAAA', fontSize: 14, textAlign: 'center', marginTop: 40 },
});