import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Post, RoleType } from '../types/post';
import { PostSearchFilters, PostSearchResult, SortField, SortOrder } from '../types/search';
import { searchPosts, resetPaginationCursors } from '../services/search-service';

const EMPTY_RESULT: PostSearchResult = {
  posts: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

/**
 * Hook that manages search state and queries Firestore.
 *
 * Usage:
 * ```tsx
 * const { results, isLoading, error, setQuery, toggleRoleType, ... } = usePostSearch();
 * ```
 */
export function usePostSearch(pageSize = 10) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [query, setQueryRaw] = useState('');
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [city, setCityRaw] = useState('');
  const [state, setStateRaw] = useState('');
  const [school, setSchoolRaw] = useState('');
  const [deadlineAfter, setDeadlineAfter] = useState('');
  const [shootingAfter, setShootingAfter] = useState('');
  const [shootingBefore, setShootingBefore] = useState('');

  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('recruitmentDeadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // ── Pagination state ──────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Async state ───────────────────────────────────────────────────────────
  const [results, setResults] = useState<PostSearchResult>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest request so we can discard stale responses
  const requestId = useRef(0);

  // ── Build filters object ──────────────────────────────────────────────────
  const filters: PostSearchFilters = useMemo(
    () => ({
      query: query || undefined,
      roleTypes: roleTypes.length > 0 ? roleTypes : undefined,
      city: city || undefined,
      state: state || undefined,
      school: school || undefined,
      deadlineAfter: deadlineAfter || undefined,
      shootingAfter: shootingAfter || undefined,
      shootingBefore: shootingBefore || undefined,
    }),
    [query, roleTypes, city, state, school, deadlineAfter, shootingAfter, shootingBefore],
  );

  // ── Execute the Firestore search whenever inputs change ───────────────────
  useEffect(() => {
    const id = ++requestId.current;

    async function execute() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await searchPosts({
          filters,
          sort: { field: sortField, order: sortOrder },
          page,
          pageSize,
        });
        // Only apply if this is still the latest request
        if (id === requestId.current) {
          setResults(result);
        }
      } catch (err: any) {
        if (id === requestId.current) {
          setError(err?.message ?? 'Search failed');
          setResults(EMPTY_RESULT);
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
        }
      }
    }

    execute();
  }, [filters, sortField, sortOrder, page, pageSize]);

  // ── Reset pagination cursors when filters or sort change ──────────────────
  useEffect(() => {
    resetPaginationCursors();
  }, [filters, sortField, sortOrder]);

  // ── Convenience helpers ───────────────────────────────────────────────────

  /** Toggle a single role type in the active filter set */
  const toggleRoleType = useCallback((type: RoleType) => {
    setRoleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
    setPage(1);
  }, []);

  /** Clear every filter and reset to page 1 */
  const clearFilters = useCallback(() => {
    setQueryRaw('');
    setRoleTypes([]);
    setCityRaw('');
    setStateRaw('');
    setSchoolRaw('');
    setDeadlineAfter('');
    setShootingAfter('');
    setShootingBefore('');
    setPage(1);
  }, []);

  /** Update query and reset page */
  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    setPage(1);
  }, []);

  /** Update city filter and reset page */
  const setCity = useCallback((c: string) => {
    setCityRaw(c);
    setPage(1);
  }, []);

  /** Update state filter and reset page */
  const setState = useCallback((s: string) => {
    setStateRaw(s);
    setPage(1);
  }, []);

  /** Update school filter and reset page */
  const setSchool = useCallback((s: string) => {
    setSchoolRaw(s);
    setPage(1);
  }, []);

  return {
    // Results
    results,
    isLoading,
    error,

    // Filter values (for binding to inputs)
    query,
    roleTypes,
    city,
    state,
    school,
    deadlineAfter,
    shootingAfter,
    shootingBefore,

    // Sort
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,

    // Pagination
    page,
    setPage,

    // Actions
    setQuery,
    setCity,
    setState,
    setSchool,
    setDeadlineAfter,
    setShootingAfter,
    setShootingBefore,
    toggleRoleType,
    clearFilters,
  };
}