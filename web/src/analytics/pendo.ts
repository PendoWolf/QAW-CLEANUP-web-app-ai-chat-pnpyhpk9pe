import type { Trip } from "../api/trips";

/** A Pendo Track Event property value. */
export type TrackEventValue = string | number | boolean;

export type TrackEventProperties = Record<string, TrackEventValue>;

interface PendoAgent {
  track: (eventName: string, properties?: TrackEventProperties) => void;
}

declare global {
  interface Window {
    /** The Pendo agent, present only when the Pendo snippet is installed on the page. */
    pendo?: PendoAgent;
  }
}

/**
 * Sends a Pendo Track Event. The Pendo agent links the event to the current visitor and
 * account on its own. Tracking must never break the app, so a missing agent or an agent
 * error is ignored.
 */
export function trackEvent(eventName: string, properties: TrackEventProperties = {}): void {
  try {
    window.pendo?.track(eventName, properties);
  } catch {
    // Tracking is best effort.
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days since the epoch for a `YYYY-MM-DD` date, or NaN when it can't be parsed. */
function dayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function todayDayNumber(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/** Trip length in days, counting both the start and end dates, or -1 when the dates can't be read. */
export function tripLengthDays(trip: Pick<Trip, "startDate" | "endDate">): number {
  const length = dayNumber(trip.endDate) - dayNumber(trip.startDate) + 1;
  return Number.isFinite(length) ? length : -1;
}

/** Days from today until the trip starts (negative once it has started), or NaN when the date can't be read. */
export function daysUntilStart(trip: Pick<Trip, "startDate">): number {
  return dayNumber(trip.startDate) - todayDayNumber();
}
