import type { Reminder } from '../types';
import { combineDateTime, fromDateKey, toDateKey } from './dateUtils';

export type NotificationPermissionState = 'unsupported' | 'granted' | 'denied' | 'default';

export function getNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!getNotificationSupport()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!getNotificationSupport()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

export function showBrowserNotification(title: string, body?: string): void {
  if (!getNotificationSupport() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // Some contexts (no active document focus, disabled OS permission, etc.) can throw here.
  }
}

function isReminderScheduledOn(reminder: Reminder, dateKey: string): boolean {
  if (dateKey < reminder.date) return false;
  if (!reminder.repeat) return dateKey === reminder.date;

  const anchor = fromDateKey(reminder.date);
  const target = fromDateKey(dateKey);
  const interval = Math.max(1, reminder.repeat.interval);

  switch (reminder.repeat.frequency) {
    case 'daily': {
      const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000);
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case 'weekly': {
      if (anchor.getDay() !== target.getDay()) return false;
      const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000);
      const diffWeeks = diffDays / 7;
      return diffWeeks >= 0 && Number.isInteger(diffWeeks) && diffWeeks % interval === 0;
    }
    case 'monthly': {
      if (anchor.getDate() !== target.getDate()) return false;
      const diffMonths =
        (target.getFullYear() - anchor.getFullYear()) * 12 + (target.getMonth() - anchor.getMonth());
      return diffMonths >= 0 && diffMonths % interval === 0;
    }
    default:
      return false;
  }
}

/**
 * Reminders whose scheduled moment has arrived and haven't already fired
 * today. Reminders only fire while the app is open in a browser tab — there
 * is no service worker here, so this is checked on an interval while the
 * app is mounted, not delivered in the background. See the README.
 */
export function getDueReminders(reminders: Reminder[], now: Date = new Date()): Reminder[] {
  const nowKey = toDateKey(now);
  return reminders.filter((reminder) => {
    if (reminder.lastTriggeredDate === nowKey) return false;
    if (!isReminderScheduledOn(reminder, nowKey)) return false;
    const scheduledToday = combineDateTime(nowKey, reminder.time);
    return scheduledToday.getTime() <= now.getTime();
  });
}

