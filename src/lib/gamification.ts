// ─── Gamification Engine ───────────────────────────────────────────────────
// Handles points, levels, badges, streaks, and achievements
// Points are ONLY awarded after parent approval

import prisma from './prisma';

// ─── Level Definitions ────────────────────────────────────────────────────
export const LEVELS = [
  { level: 1, name: 'Beginner Explorer', icon: '🌱', minPoints: 0 },
  { level: 2, name: 'Smart Learner', icon: '📖', minPoints: 100 },
  { level: 3, name: 'Outdoor Champion', icon: '🏆', minPoints: 300 },
  { level: 4, name: 'Cleanliness Hero', icon: '🦸', minPoints: 600 },
  { level: 5, name: "Yuan's World Champion", icon: '👑', minPoints: 1000 },
];

// ─── Badge Definitions ────────────────────────────────────────────────────
export const BADGES = [
  {
    id: 'first_activity',
    name: 'First Steps',
    icon: '🎯',
    description: 'Completed your very first activity!',
    check: (stats: ChildStats) => stats.totalApproved >= 1,
  },
  {
    id: 'five_activities',
    name: 'Getting Started',
    icon: '⭐',
    description: 'Completed 5 activities!',
    check: (stats: ChildStats) => stats.totalApproved >= 5,
  },
  {
    id: 'ten_activities',
    name: 'Activity Star',
    icon: '🌟',
    description: 'Completed 10 activities!',
    check: (stats: ChildStats) => stats.totalApproved >= 10,
  },
  {
    id: 'twenty_five_activities',
    name: 'Super Achiever',
    icon: '💫',
    description: 'Completed 25 activities!',
    check: (stats: ChildStats) => stats.totalApproved >= 25,
  },
  {
    id: 'fifty_activities',
    name: 'Activity Master',
    icon: '🏅',
    description: 'Completed 50 activities!',
    check: (stats: ChildStats) => stats.totalApproved >= 50,
  },
  {
    id: 'streak_3',
    name: 'Consistent Worker',
    icon: '🔥',
    description: '3-day activity streak!',
    check: (stats: ChildStats) => stats.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    icon: '💪',
    description: '7-day activity streak!',
    check: (stats: ChildStats) => stats.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    icon: '🏆',
    description: '30-day activity streak!',
    check: (stats: ChildStats) => stats.longestStreak >= 30,
  },
  {
    id: 'reader',
    name: 'Bookworm',
    icon: '📚',
    description: 'Completed 5 reading activities!',
    check: (stats: ChildStats) => stats.categoryCount.READING >= 5,
  },
  {
    id: 'outdoor',
    name: 'Nature Explorer',
    icon: '🌳',
    description: 'Completed 5 outdoor activities!',
    check: (stats: ChildStats) => stats.categoryCount.OUTDOOR >= 5,
  },
  {
    id: 'cleaner',
    name: 'Cleanliness Star',
    icon: '✨',
    description: 'Completed 5 cleanliness activities!',
    check: (stats: ChildStats) => stats.categoryCount.CLEANLINESS >= 5,
  },
  {
    id: 'helper',
    name: 'Helpful Heart',
    icon: '❤️',
    description: 'Completed 5 household chores!',
    check: (stats: ChildStats) => stats.categoryCount.CHORES >= 5,
  },
  {
    id: 'studious',
    name: 'Study Champion',
    icon: '🎓',
    description: 'Completed 10 studying activities!',
    check: (stats: ChildStats) => stats.categoryCount.STUDYING >= 10,
  },
  {
    id: 'level_2',
    name: 'Level Up!',
    icon: '📖',
    description: 'Reached Level 2 - Smart Learner!',
    check: (stats: ChildStats) => stats.level >= 2,
  },
  {
    id: 'level_3',
    name: 'Champion Status',
    icon: '🏆',
    description: 'Reached Level 3 - Outdoor Champion!',
    check: (stats: ChildStats) => stats.level >= 3,
  },
  {
    id: 'level_4',
    name: 'Hero Status',
    icon: '🦸',
    description: 'Reached Level 4 - Cleanliness Hero!',
    check: (stats: ChildStats) => stats.level >= 4,
  },
  {
    id: 'level_5',
    name: 'World Champion',
    icon: '👑',
    description: "Reached Level 5 - Yuan's World Champion!",
    check: (stats: ChildStats) => stats.level >= 5,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────
interface ChildStats {
  totalApproved: number;
  longestStreak: number;
  currentStreak: number;
  level: number;
  points: number;
  categoryCount: Record<string, number>;
}

interface RewardConfigData {
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

// ─── Calculate Level from Points ──────────────────────────────────────────
export function calculateLevel(points: number, config?: RewardConfigData | null): number {
  const thresholds = config
    ? [
        config.level1Threshold,
        config.level2Threshold,
        config.level3Threshold,
        config.level4Threshold,
        config.level5Threshold,
      ]
    : LEVELS.map((l) => l.minPoints);

  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

// ─── Get Level Info ───────────────────────────────────────────────────────
export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) || LEVELS[0];
}

// ─── Get Next Level Info ──────────────────────────────────────────────────
export function getNextLevelInfo(currentLevel: number, config?: RewardConfigData | null) {
  const nextLevel = currentLevel + 1;
  if (nextLevel > 5) return null;

  const levelInfo = LEVELS.find((l) => l.level === nextLevel);
  if (!levelInfo) return null;

  const threshold = config
    ? [
        config.level1Threshold,
        config.level2Threshold,
        config.level3Threshold,
        config.level4Threshold,
        config.level5Threshold,
      ][nextLevel - 1]
    : levelInfo.minPoints;

  return { ...levelInfo, minPoints: threshold };
}

// ─── Award Points After Approval ──────────────────────────────────────────
export async function awardPoints(
  childId: string,
  submissionId: string,
  activityPointValue: number,
  parentId: string
): Promise<{ pointsAwarded: number; newLevel: number; badges: string[] }> {
  // Get the submission to check if points were already awarded
  const submission = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  // PREVENT DUPLICATE POINTS: Check if points were already awarded
  if (submission.pointsAwarded > 0) {
    throw new Error('Points already awarded for this submission');
  }

  // Get the child's current data
  const child = await prisma.child.findUnique({
    where: { id: childId },
  });

  if (!child) {
    throw new Error('Child not found');
  }

  // Get parent's reward configuration
  const rewardConfig = await prisma.rewardConfig.findUnique({
    where: { parentId },
  });

  const basePoints = rewardConfig?.pointsPerActivity ?? activityPointValue;
  let bonusPoints = 0;

  // Calculate streak bonuses
  const streak = child.currentStreak;
  if (rewardConfig) {
    if (streak >= 30) bonusPoints += rewardConfig.bonusStreak30Days;
    else if (streak >= 7) bonusPoints += rewardConfig.bonusStreak7Days;
    else if (streak >= 3) bonusPoints += rewardConfig.bonusStreak3Days;
  } else {
    if (streak >= 30) bonusPoints += 50;
    else if (streak >= 7) bonusPoints += 15;
    else if (streak >= 3) bonusPoints += 5;
  }

  const totalPoints = basePoints + bonusPoints;
  const newTotalPoints = child.points + totalPoints;
  const newLevel = calculateLevel(newTotalPoints, rewardConfig);

  // Update submission with points awarded (atomic - prevents double award)
  await prisma.activitySubmission.update({
    where: { id: submissionId },
    data: { pointsAwarded: totalPoints },
  });

  // Update child's points and level
  await prisma.child.update({
    where: { id: childId },
    data: {
      points: newTotalPoints,
      level: newLevel,
    },
  });

  // Check and award new badges
  const newBadges = await checkAndAwardBadges(childId);

  return {
    pointsAwarded: totalPoints,
    newLevel,
    badges: newBadges,
  };
}

// ─── Update Streak ────────────────────────────────────────────────────────
export async function updateStreak(childId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if there's a streak record for today
  const todayStreak = await prisma.dailyStreak.findUnique({
    where: {
      childId_date: {
        childId,
        date: today,
      },
    },
  });

  if (todayStreak && todayStreak.completed) {
    return; // Already tracked for today
  }

  // Check if there's a completed streak for yesterday
  const yesterdayStreak = await prisma.dailyStreak.findUnique({
    where: {
      childId_date: {
        childId,
        date: yesterday,
      },
    },
  });

  const child = await prisma.child.findUnique({
    where: { id: childId },
  });

  if (!child) return;

  const newStreak = yesterdayStreak?.completed ? child.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, child.longestStreak);

  // Update or create today's streak record
  await prisma.dailyStreak.upsert({
    where: {
      childId_date: {
        childId,
        date: today,
      },
    },
    create: {
      childId,
      date: today,
      completed: true,
      activitiesCompleted: 1,
      activitiesTotal: 1,
    },
    update: {
      completed: true,
      activitiesCompleted: { increment: 1 },
    },
  });

  // Update child's streak
  await prisma.child.update({
    where: { id: childId },
    data: {
      currentStreak: newStreak,
      longestStreak,
    },
  });
}

// ─── Check and Award Badges ──────────────────────────────────────────────
export async function checkAndAwardBadges(childId: string): Promise<string[]> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      achievements: true,
      submissions: {
        where: { status: 'APPROVED' },
        include: { activity: true },
      },
    },
  });

  if (!child) return [];

  // Build stats
  const categoryCount: Record<string, number> = {};
  for (const sub of child.submissions) {
    const cat = sub.activity.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  const stats: ChildStats = {
    totalApproved: child.submissions.length,
    longestStreak: child.longestStreak,
    currentStreak: child.currentStreak,
    level: child.level,
    points: child.points,
    categoryCount,
  };

  // Check each badge
  const existingBadgeIds = new Set(child.achievements.map((a) => a.badgeName));
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (!existingBadgeIds.has(badge.id) && badge.check(stats)) {
      await prisma.achievement.create({
        data: {
          childId,
          badgeName: badge.id,
          badgeIcon: badge.icon,
          description: badge.description,
          pointsAwarded: 0,
        },
      });

      // Create notification for the child
      await prisma.childNotification.create({
        data: {
          childId,
          title: 'New Badge Earned! 🎉',
          message: `You earned the "${badge.name}" badge: ${badge.description}`,
          type: 'ACHIEVEMENT',
        },
      });

      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

// ─── Get Child Stats ──────────────────────────────────────────────────────
export async function getChildStats(childId: string): Promise<ChildStats | null> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      submissions: {
        where: { status: 'APPROVED' },
        include: { activity: true },
      },
    },
  });

  if (!child) return null;

  const categoryCount: Record<string, number> = {};
  for (const sub of child.submissions) {
    const cat = sub.activity.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  return {
    totalApproved: child.submissions.length,
    longestStreak: child.longestStreak,
    currentStreak: child.currentStreak,
    level: child.level,
    points: child.points,
    categoryCount,
  };
}
