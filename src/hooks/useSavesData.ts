import { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { firestore, Collections } from '../services/firebase';
import { Post } from '../types/post';
import { MOCK_POSTS } from '../data/mockPosts';

/** Matches ApplyScreen until Firebase Auth supplies a real applicant id. */
const APPLICANT_PLACEHOLDER_ID = 'current-user-placeholder';

/** Profile document id used by ProfileScreen. */
const DEFAULT_USER_DOC_ID = 'user_001';
const DEFAULT_REJECTION_REASON =
  'We really appreciate your interest in the project. While your portfolio is fantastic, we decided to move forward with a Director of Photography who has more specific experience shooting in low-light environments, which makes up the majority of our script.';

export type SavesApplication = {
  id: string;
  postId: string;
  status: string;
  appliedAt: firebase.firestore.Timestamp | null;
  rejectionReason?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Firestore may store post ids as strings, DocumentReferences, or (if mis-typed) plain objects.
 * `where(documentId(), 'in', …)` only accepts string ids or DocumentReferences — not arbitrary objects.
 */
function normalizePostId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (typeof (value as { id?: string }).id === 'string' && (value as { id: string }).id.trim() !== '') {
    return (value as { id: string }).id.trim();
  }
  const ref = value as { path?: string };
  if (typeof ref.path === 'string') {
    const segments = ref.path.split('/');
    const last = segments[segments.length - 1];
    if (last && last.trim() !== '') return last.trim();
  }
  return null;
}

function mergeMockPostsForIds(map: Record<string, Post>, ids: string[]) {
  for (const id of ids) {
    if (!map[id] && MOCK_POSTS_BY_ID[id]) {
      map[id] = MOCK_POSTS_BY_ID[id];
    }
  }
}

function normalizeSavedPostIdField(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  if (typeof raw === 'string' && raw.trim() !== '') return [raw.trim()];
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = normalizePostId(item);
    if (id) out.push(id);
  }
  return out;
}

const MOCK_POSTS_BY_ID: Record<string, Post> = Object.fromEntries(MOCK_POSTS.map(p => [p.id, p]));

/** Demo saved post IDs when Firestore has none yet. */
const FALLBACK_SAVED_IDS = ['mock-1', 'mock-2'];

/** Demo applications so Applied / Past are populated when Firestore has none yet. */
function buildFallbackApplications(): SavesApplication[] {
  const ts = (iso: string) => firebase.firestore.Timestamp.fromDate(new Date(iso));
  const rows: SavesApplication[] = [];
  const specs: { postId: string; status: string; appliedIso: string; rejectionReason?: string }[] = [
    { postId: 'mock-1', status: 'applied',       appliedIso: '2026-04-10T12:00:00Z' },
    { postId: 'mock-2', status: 'under review',   appliedIso: '2026-04-05T12:00:00Z' },
    { postId: 'mock-3', status: 'accepted',       appliedIso: '2026-03-20T12:00:00Z' },
    {
      postId: 'mock-4',
      status: 'rejected',
      appliedIso: '2026-03-15T12:00:00Z',
      rejectionReason: DEFAULT_REJECTION_REASON,
    },
  ];
  specs.forEach((s, i) => {
    if (!MOCK_POSTS_BY_ID[s.postId]) return;
    rows.push({
      id: `demo-application-${i}`,
      postId: s.postId,
      status: s.status,
      appliedAt: ts(s.appliedIso),
      rejectionReason: s.rejectionReason,
    });
  });
  return rows;
}

export function useSavesData() {
  const [savedPostId, setSavedPostId] = useState<string[]>([]);
  const [firestoreApplications, setFirestoreApplications] = useState<SavesApplication[]>([]);
  const [postsById, setPostsById] = useState<Record<string, Post>>({});
  const [loading, setLoading] = useState(true);

  /**
   * Prefer real applications, but always merge demo rows for mock post ids that Firestore
   * doesn't cover — otherwise a single bad/junk application doc disables the whole fallback
   * and Applied / Past stay empty.
   */
  const applications = useMemo(() => {
    const fallback = buildFallbackApplications();
    if (firestoreApplications.length === 0) return fallback;

    const covered = new Set(
      firestoreApplications.map(a => a.postId).filter((id): id is string => Boolean(id?.trim()))
    );
    const merged = [...firestoreApplications];
    for (const demo of fallback) {
      if (!covered.has(demo.postId)) merged.push(demo);
    }
    return merged;
  }, [firestoreApplications]);

  useEffect(() => {
    const unsub = firestore()
      .collection(Collections.USERS)
      .doc(DEFAULT_USER_DOC_ID)
      .onSnapshot(
        snap => {
          const raw = snap.data()?.savedPostId;
          const ids = normalizeSavedPostIdField(raw);
          // Fall back to demo saved IDs if Firestore returns nothing
          setSavedPostId(ids.length > 0 ? ids : FALLBACK_SAVED_IDS);
        },
        () => setSavedPostId(FALLBACK_SAVED_IDS)
      );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = firestore()
      .collection(Collections.APPLICATIONS)
      .where('applicantId', '==', APPLICANT_PLACEHOLDER_ID)
      .onSnapshot(
        snap => {
          setFirestoreApplications(
            snap.docs.map(d => {
              const data = d.data();
              const postId = normalizePostId(data.postId) ?? '';
              const normalizedStatus =
                String((data.status as string) ?? 'pending')
                  .toLowerCase()
                  .trim() || 'pending';
              const firestoreReason =
                typeof data.rejectionReason === 'string' && data.rejectionReason.trim().length > 0
                  ? data.rejectionReason.trim()
                  : undefined;
              return {
                id: d.id,
                postId,
                status: normalizedStatus,
                appliedAt: (data.appliedAt as firebase.firestore.Timestamp) ?? null,
                rejectionReason:
                  firestoreReason ?? (normalizedStatus === 'rejected' ? DEFAULT_REJECTION_REASON : undefined),
              };
            })
          );
        },
        err => {
          console.error('useSavesData applications:', err);
          setFirestoreApplications([]);
        }
      );
    return unsub;
  }, []);

  const postIdsKey = useMemo(() => {
    const ids = new Set<string>();
    for (const id of savedPostId) {
      if (id) ids.add(id);
    }
    for (const a of applications) {
      if (a.postId) ids.add(a.postId);
    }
    return JSON.stringify([...ids].sort());
  }, [savedPostId, applications]);

  useEffect(() => {
    const ids: string[] = JSON.parse(postIdsKey || '[]') as string[];
    if (ids.length === 0) {
      setPostsById({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const stringIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
      const map: Record<string, Post> = {};
      mergeMockPostsForIds(map, stringIds);

      const nonMockIds = stringIds.filter(id => !MOCK_POSTS_BY_ID[id]);

      try {
        for (const part of chunk(nonMockIds, 10)) {
          if (part.length === 0) continue;
          const snap = await firestore()
            .collection(Collections.POSTS)
            .where(firebase.firestore.FieldPath.documentId(), 'in', part)
            .get();
          snap.docs.forEach(doc => {
            map[doc.id] = { id: doc.id, ...doc.data() } as Post;
          });
        }
        mergeMockPostsForIds(map, stringIds);
        if (!cancelled) setPostsById(map);
      } catch (e) {
        console.error('useSavesData posts:', e);
        if (!cancelled) {
          const recovery: Record<string, Post> = {};
          mergeMockPostsForIds(recovery, stringIds);
          setPostsById(recovery);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postIdsKey]);

  return { savedPostId, applications, postsById, loading };
}
