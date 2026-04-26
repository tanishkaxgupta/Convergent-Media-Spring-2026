export type RoleType = 'actor' | 'tech' | 'crew' | 'dancer' | 'musician' | 'other';
export type ExperienceLevel = 'beginner' | 'mid' | 'experienced';
export type Availability = 'available' | 'unavailable' | 'open to offers';

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface GalleryVideo {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface GalleryRecording {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface Credit {
  id: string;
  title: string;
  role: string;
  type: 'short film' | 'feature' | 'commercial' | 'stage' | 'other';
  year: number;
  director: string;
}

export interface UserProfile {
  id: string;
  createdAt: string;
  basicInfo: {
    name: string;
    pronouns: string;
    headshotUrl: string;
    bio: string;
    school?: string;
    email?: string;
    phone?: string;
    location: {
      city: string;
      state: string;
      willingToRelocate: boolean;
    };
  };
  roleInfo: {
    primaryRole: RoleType;
    secondaryRoles: RoleType[];
    specialties: string[];
    experienceLevel: ExperienceLevel;
    yearsOfExperience: number;
    availability: Availability;
  };
  attributes: {
    skills: string[];
    languages: string[];
    instruments: string[];
    danceStyles: string[];
    specialSkills: string[];
  };
  gallery: {
    photos: GalleryPhoto[];
    videos: GalleryVideo[];
    recordings: GalleryRecording[];
  };
  credits: Credit[];
  socialLinks: {
    imdb?: string;
    tiktok?: string;
    instagram?: string;
    website?: string;
    youtube?: string;
  };
  myPostings: string[];
  myApplications: string[];
  /** Firestore post IDs the user bookmarked (Saves tab). */
  savedPostId?: string[];
}