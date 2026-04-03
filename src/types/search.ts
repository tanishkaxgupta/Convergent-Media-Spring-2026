import { RoleType } from './post';

/**
 * Filters a user can apply when searching for posts.
 * All fields are optional — omitted fields mean "no filter".
 */
export interface PostSearchFilters {
  /** Free-text query matched against filmName, director names, role titles, and school */
  query?: string;

  /** Only show posts that have at least one role matching these types */
  roleTypes?: RoleType[];

  /** Only show posts shooting in this city (case-insensitive partial match) */
  city?: string;

  /** Only show posts shooting in this state (case-insensitive exact match, e.g. "TX") */
  state?: string;

  /** Only show posts whose recruitment deadline is on or after this date */
  deadlineAfter?: string; // ISO 8601

  /** Only show posts whose shooting starts on or after this date */
  shootingAfter?: string; // ISO 8601

  /** Only show posts whose shooting ends on or before this date */
  shootingBefore?: string; // ISO 8601

  /** Only show posts from a specific school (case-insensitive partial match) */
  school?: string;
}

export type SortField =
  | 'recruitmentDeadline'
  | 'shootingStart'
  | 'filmName';

export type SortOrder = 'asc' | 'desc';

export interface PostSearchOptions {
  filters: PostSearchFilters;
  sort?: {
    field: SortField;
    order: SortOrder;
  };
  /** 1-indexed page number */
  page?: number;
  /** Results per page (default 10) */
  pageSize?: number;
}

export interface PostSearchResult {
  posts: import('./post').Post[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}