// ─── Activity Scheduling Engine ────────────────────────────────────────────
// Handles scheduling activities with various frequencies
// and determining which activities are due on any given day

import prisma from './prisma';

// ─── Frequency Types ──────────────────────────────────────────────────────
export type Frequency = 'DAILY' | 'EVERY_2_DAYS' | 'EVERY_3_DAYS' | 'EVERY_4_DAYS';

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: 'Every day',
  EVERY_2_DAYS: 'Once every 2 days',
  EVERY_3_DAYS: 'Once every 3 days',
  EVERY_4_DAYS: 'Once every 4 days',
};

export const FREQUENCY_DAYS: Record<Frequency, number> = {
  DAILY: 1,
  EVERY_2_DAYS: 2,
  EVERY_3_DAYS: 3,
  EVERY_4_DAYS: 4,
};

// ─── Check if Activity is Due on a Given Date ─────────────────────────────
export function isActivityDueOnDate(
  startDate: Date,
  frequency: Frequency,
  checkDate: Date
): boolean {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const check = new Date(checkDate);
  check.setHours(0, 0, 0, 0);

  // Activity can't be due before it started
  if (check < start) return false;

  const diffTime = check.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const interval = FREQUENCY_DAYS[frequency];

  return diffDays % interval === 0;
}

// ─── Get Activities Due for a Child on a Date ─────────────────────────────
export async function getActivitiesDueForChild(
  childId: string,
  date: Date
): Promise<DueActivity[]> {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // Get all active schedules for this child
  const schedules = await prisma.activitySchedule.findMany({
    where: {
      childId,
      isActive: true,
      startDate: { lte: checkDate },
      OR: [
        { endDate: null },
        { endDate: { gte: checkDate } },
      ],
    },
    include: {
      activity: true,
    },
  });

  const dueActivities: DueActivity[] = [];

  for (const schedule of schedules) {
    if (!schedule.activity.isActive) continue;

    const isDue = isActivityDueOnDate(
      schedule.startDate,
      schedule.frequency as Frequency,
      checkDate
    );

    if (!isDue) continue;

    // Check if already submitted for this date
    const existingSubmission = await prisma.activitySubmission.findFirst({
      where: {
        activityId: schedule.activityId,
        childId,
        submittedDate: checkDate,
      },
    });

    dueActivities.push({
      scheduleId: schedule.id,
      activityId: schedule.activityId,
      activityName: schedule.activity.name,
      activityDescription: schedule.activity.description,
      activityCategory: schedule.activity.category,
      activityIcon: schedule.activity.icon,
      pointValue: schedule.activity.pointValue,
      requiresPhoto: schedule.activity.requiresPhoto,
      requiresApproval: schedule.activity.requiresApproval,
      frequency: schedule.frequency as Frequency,
      isSubmitted: !!existingSubmission,
      submissionStatus: existingSubmission?.status || null,
      submissionId: existingSubmission?.id || null,
    });
  }

  return dueActivities;
}

// ─── Get Upcoming Activities for a Child ──────────────────────────────────
export async function getUpcomingActivities(
  childId: string,
  days: number = 7
): Promise<{ date: string; activities: DueActivity[] }[]> {
  const upcoming: { date: string; activities: DueActivity[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const activities = await getActivitiesDueForChild(childId, date);
    upcoming.push({
      date: date.toISOString().split('T')[0],
      activities,
    });
  }

  return upcoming;
}

// ─── Get Overdue Activities for a Child ───────────────────────────────────
export async function getOverdueActivities(
  childId: string,
  lookBackDays: number = 7
): Promise<DueActivity[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: DueActivity[] = [];

  for (let i = 1; i <= lookBackDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const activities = await getActivitiesDueForChild(childId, date);
    const overdueForDate = activities.filter((a) => !a.isSubmitted);
    overdue.push(...overdueForDate);
  }

  return overdue;
}

// ─── Create Activity Schedule ─────────────────────────────────────────────
export async function createActivitySchedule(
  activityId: string,
  childId: string,
  frequency: Frequency,
  startDate?: Date,
  endDate?: Date
) {
  const start = startDate || new Date();
  start.setHours(0, 0, 0, 0);

  return prisma.activitySchedule.create({
    data: {
      activityId,
      childId,
      frequency,
      startDate: start,
      endDate: endDate || null,
      isActive: true,
    },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────
export interface DueActivity {
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
