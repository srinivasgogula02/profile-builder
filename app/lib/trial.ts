/**
 * Trial utility — shared between client and server.
 *
 * The trial end date is stored in:
 *   TRIAL_END_DATE              (server-side, used in API routes)
 *   NEXT_PUBLIC_TRIAL_END_DATE  (client-side, used in components)
 *
 * Security: The server always re-validates the trial date before
 * behaving as if the user is premium. Client-side is UI-only.
 */

/** ISO string of when the trial ends. Falls back to epoch (always expired). */
const TRIAL_END_ISO =
    process.env.NEXT_PUBLIC_TRIAL_END_DATE ||   // client
    process.env.TRIAL_END_DATE ||               // server
    '1970-01-01T00:00:00.000Z';

/** Timestamp (ms) of trial end. */
export const TRIAL_END_MS = new Date(TRIAL_END_ISO).getTime();

/** Returns true if the free trial is currently active. */
export function isTrialActive(): boolean {
    return Date.now() < TRIAL_END_MS;
}

/** Returns ms remaining in the trial, or 0 if expired. */
export function trialMsRemaining(): number {
    return Math.max(0, TRIAL_END_MS - Date.now());
}

export interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number; // ms
}

/** Breaks ms into days/hours/minutes/seconds. */
export function msToTimeLeft(ms: number): TimeLeft {
    const total = Math.max(0, ms);
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    const days = Math.floor(total / 1000 / 60 / 60 / 24);
    return { days, hours, minutes, seconds, total };
}
