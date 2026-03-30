import firestore, {
    FirebaseFirestoreTypes,
  } from '@react-native-firebase/firestore';
  import { Collections } from './firebase';
  import { Post } from '../types/post';
  import { PostSearchOptions, PostSearchResult } from '../types/search';
  
  type DocumentSnapshot = FirebaseFirestoreTypes.QueryDocumentSnapshot;
  
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
  
    let query: FirebaseFirestoreTypes.Query = firestore().collection(Collections.POSTS);
  
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
    const snap = await query.get();
  
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