export type RoleType = 'actor' | 'tech' | 'crew' | 'dancer' | 'musician' | 'other';
 
export const ALL_ROLE_TYPES: RoleType[] = ['actor', 'tech', 'crew', 'dancer', 'musician', 'other'];
 
export interface Role {
  title: string;
  description: string;
  type: RoleType;
}
 
export interface ShootingTimeline {
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}
 
export interface ShootingLocation {
  city: string;
  state: string;
  details: string;
}
 
export interface PostedBy {
  userId: string;
  name: string;
  school: string;
}
 
export interface VideoMedia {
  id: string;
  url: string;
  title: string;
  description: string;
}
 
export interface ImageMedia {
  id: string;
  url: string;
  caption: string;
}
 
export interface PostMedia {
  script?: string;
  videos: VideoMedia[];
  images: ImageMedia[];
}
 
export interface Post {
  id: string;
  filmName: string;
  director: string[];
  recruitmentDeadline: string; // ISO 8601
  shootingTimeline: ShootingTimeline;
  roles: Role[];
  shootingLocation: ShootingLocation;
  postedBy: PostedBy;
  media: PostMedia;
 
  // ── Firestore denormalized fields ──────────────────────────────────────
  // These are generated at write-time by buildPostForFirestore() to enable
  // efficient server-side queries.
 
  /** Lowercased keyword tokens for array-contains text search */
  searchKeywords: string[];
 
  /** Deduplicated role types present in this post, e.g. ['actor', 'tech'] */
  roleTypesList: RoleType[];
 
  /** Lowercased state for exact-match queries, e.g. "tx" */
  shootingStateLower: string;
 
  /** Lowercased city for exact-match queries, e.g. "austin" */
  shootingCityLower: string;
 
  /** Lowercased school for exact-match queries, e.g. "ut austin" */
  schoolLower: string;
}