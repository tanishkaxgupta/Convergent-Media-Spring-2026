// src/types/notification.ts

export type NotificationType = 'application_status' | 'post_recommendation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string; // ISO 8601 string for easy sorting
  isRead: boolean;
  
  // Optional metadata to link to other parts of the app
  relatedId?: string; // e.g., the ID of the Post or Application
  targetUserId: string; 
}

// Helper to group notifications for the UI
export interface NotificationSection {
  title: string; // "Today", "This Month", etc.
  data: Notification[];
}