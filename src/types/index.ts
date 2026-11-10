// ─── Yuan's World Type Definitions ─────────────────────────────────────────

// ─── User Types ───────────────────────────────────────────────────────────
export type UserRole = 'PARENT' | 'CHILD';

export interface ParentUser {
  id: string;
  name: string;
  email: string;
  role: 'PARENT';
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  childId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  parentId: string;
  createdAt: string;
}

// ─── Activity Types ──────────────────────────────────────────────────────
export type ActivityCategory =
  | 'STUDYING'
  | 'READING'
  | 'OUTDOOR'
  | 'CHORES'
  | 'CLEANLINESS'
  | 'OTHER';

export const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; icon: string; color: string }
> = {
  STUDYING: { label: 'Studying', icon: '📚', color: '#9B7FE6' },
  READING: { label: 'Reading', icon: '📖', color: '#64B5F6' },
  OUTDOOR: { label: 'Outdoor Games', icon: '⚽', color: '#81C784' },
  CHORES: { label: 'Household Chores', icon: '🏠', color: '#FFD54F' },
  CLEANLINESS: { label: 'Cleanliness', icon: '✨', color: '#FF8A80' },
  OTHER: { label: 'Other', icon: '🌟', color: '#B0BEC5' },
};

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  icon: string;
  pointValue: number;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: string;
}

// ─── Schedule Types ──────────────────────────────────────────────────────
export type Frequency = 'DAILY' | 'EVERY_2_DAYS' | 'EVERY_3_DAYS' | 'EVERY_4_DAYS';

export interface ActivitySchedule {
  id: string;
  activityId: string;
  childId: string;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

// ─── Submission Types ────────────────────────────────────────────────────
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ActivitySubmission {
  id: string;
  activityId: string;
  childId: string;
  scheduleId: string;
  description: string;
  photoPath: string | null;
  status: SubmissionStatus;
  submittedDate: string;
  pointsAwarded: number;
  createdAt: string;
  activity?: Activity;
  child?: ChildProfile;
}

// ─── Approval Types ──────────────────────────────────────────────────────
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface Approval {
  id: string;
  submissionId: string;
  parentId: string;
  decision: ApprovalDecision;
  feedback: string;
  decidedAt: string;
}

// ─── Achievement Types ───────────────────────────────────────────────────
export interface Achievement {
  id: string;
  childId: string;
  badgeName: string;
  badgeIcon: string;
  description: string;
  pointsAwarded: number;
  earnedAt: string;
}

// ─── Rule Types ──────────────────────────────────────────────────────────
export interface Rule {
  id: string;
  title: string;
  description: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  createdById: string;
}

// ─── Notification Types ──────────────────────────────────────────────────
export type NotificationType = 'REMINDER' | 'ACHIEVEMENT' | 'APPROVAL' | 'SYSTEM';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────
export interface ChildDashboardData {
  child: ChildProfile;
  todayActivities: DueActivityData[];
  completedToday: number;
  totalToday: number;
  recentAchievements: Achievement[];
  notifications: Notification[];
}

export interface ParentDashboardData {
  children: ChildProfile[];
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  awaitingApproval: number;
  recentSubmissions: ActivitySubmission[];
}

export interface DueActivityData {
  scheduleId: string;
  activityId: string;
  activityName: string;
  activityDescription: string;
  activityCategory: string;
  activityIcon: string;
  pointValue: number;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  frequency: Frequency;
  isSubmitted: boolean;
  submissionStatus: string | null;
  submissionId: string | null;
}

// ─── Reward Config Types ─────────────────────────────────────────────────
export interface RewardConfigData {
  pointsPerActivity: number;
  bonusStreak3Days: number;
  bonusStreak7Days: number;
  bonusStreak30Days: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  level4Threshold: number;
  level5Threshold: number;
}

// ─── API Response Types ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
