import firebase from 'firebase/compat/app';
  import { firestore, Collections } from './firebase';
  import { Post } from '../types/post';
  import { PostSearchOptions, PostSearchResult } from '../types/search';
  import { MOCK_POSTS } from '../data/mockPosts';

  // ── Mock data helpers ─────────────────────────────────────────────────────────

  function filterMockPosts(options: PostSearchOptions): PostSearchResult {
    const { filters, sort = { field: 'recruitmentDeadline', order: 'asc' }, page = 1, pageSize = 10 } = options;

    let posts = [...MOCK_POSTS];

    if (filters.query) {
      const token = filters.query.toLowerCase().trim();
      posts = posts.filter(p => p.searchKeywords.some(k => k.includes(token)));
    }
    if (filters.roleTypes && filters.roleTypes.length > 0) {
      posts = posts.filter(p => filters.roleTypes!.some(rt => p.roleTypesList.includes(rt)));
    }
    if (filters.city) {
      posts = posts.filter(p => p.shootingCityLower.includes(filters.city!.toLowerCase()));
    }
    if (filters.state) {
      posts = posts.filter(p => p.shootingStateLower === filters.state!.toLowerCase());
    }
    if (filters.school) {
      posts = posts.filter(p => p.schoolLower.includes(filters.school!.toLowerCase()));
    }

    posts.sort((a, b) => {
      const aVal = sort.field === 'filmName' ? a.filmName : sort.field === 'shootingStart' ? a.shootingTimeline.startDate : a.recruitmentDeadline;
      const bVal = sort.field === 'filmName' ? b.filmName : sort.field === 'shootingStart' ? b.shootingTimeline.startDate : b.recruitmentDeadline;
      return sort.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const start = (page - 1) * pageSize;
    const paginated = posts.slice(start, start + pageSize);

    return { posts: paginated, total: posts.length, page, pageSize, totalPages: Math.ceil(posts.length / pageSize) };
  }
  
  type DocumentSnapshot = firebase.firestore.QueryDocumentSnapshot;
  
  // Pagination cursors keyed by page number
  const cursors = new Map<number, DocumentSnapshot>();
  
  export const resetPaginationCursors = () => {
    cursors.clear();
  };
  
  export const searchPosts = async (
    options: PostSearchOptions
  ): Promise<PostSearchResult> => {
    const {
      filters,
      sort = { field: 'recruitmentDeadline', order: 'asc' },
      page = 1,
      pageSize = 10,
    } = options;
  
    let query: firebase.firestore.Query = firestore().collection(Collections.POSTS);
  
    // ── Filters ──────────────────────────────────────────────────
  
    // Free-text: match against searchKeywords array
    if (filters.query) {
      const token = filters.query.toLowerCase().trim();
      query = query.where('searchKeywords', 'array-contains', token);
    }
  
    // Role types: match against roleTypesList array
    // Firestore only supports array-contains OR array-contains-any, not both
    // If query is active we already used array-contains, so skip multi-role filter
    if (filters.roleTypes && filters.roleTypes.length > 0 && !filters.query) {
      if (filters.roleTypes.length === 1) {
        query = query.where('roleTypesList', 'array-contains', filters.roleTypes[0]);
      } else {
        query = query.where('roleTypesList', 'array-contains-any', filters.roleTypes);
      }
    }
  
    // Location filters
    if (filters.state) {
      query = query.where('shootingStateLower', '==', filters.state.toLowerCase());
    }
  
    if (filters.city) {
      query = query.where('shootingCityLower', '==', filters.city.toLowerCase());
    }
  
    // School filter
    if (filters.school) {
      query = query.where('schoolLower', '==', filters.school.toLowerCase());
    }
  
    // Date filters
    if (filters.deadlineAfter) {
      query = query.where('recruitmentDeadline', '>=', filters.deadlineAfter);
    }
  
    if (filters.shootingAfter) {
      query = query.where('shootingTimeline.startDate', '>=', filters.shootingAfter);
    }
  
    if (filters.shootingBefore) {
      query = query.where('shootingTimeline.endDate', '<=', filters.shootingBefore);
    }
  
    // ── Sort ─────────────────────────────────────────────────────
    const sortFieldMap: Record<string, string> = {
      recruitmentDeadline: 'recruitmentDeadline',
      shootingStart: 'shootingTimeline.startDate',
      filmName: 'filmName',
    };
  
    query = query.orderBy(sortFieldMap[sort.field], sort.order);
  
    // ── Pagination ────────────────────────────────────────────────
    if (page > 1 && cursors.has(page - 1)) {
      query = query.startAfter(cursors.get(page - 1));
    }
  
    query = query.limit(pageSize);
  
    // ── Execute ───────────────────────────────────────────────────
    // Skip Firestore entirely when Firebase isn't configured (local dev without env vars)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – process.env is available at runtime in Expo/Metro
    const isFirebaseConfigured = !!(process.env.EXPO_PUBLIC_FIREBASE_API_KEY && process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID); // @ts-ignore
    if (!isFirebaseConfigured) {
      return filterMockPosts(options);
    }

    let snap: firebase.firestore.QuerySnapshot;
    try {
      // Race against a 4 s timeout so we fall back to mock data quickly
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 4000)
      );
      snap = await Promise.race([query.get(), timeout]);
    } catch {
      // Firebase not reachable (no network, not configured, or timeout) — use mock data
      return filterMockPosts(options);
    }
  
    // Store the last doc as cursor for next page
    if (snap.docs.length > 0) {
      cursors.set(page, snap.docs[snap.docs.length - 1]);
    }
  
    const posts = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Firestore doesn't give total count cheaply — estimate from current page
    const hasMore = snap.docs.length === pageSize;
    const total = hasMore ? page * pageSize + 1 : (page - 1) * pageSize + snap.docs.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      posts,
      total,
      page,
      pageSize,
      totalPages,
    };
  };