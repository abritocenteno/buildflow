/**
 * Two kinds of dates live in the database:
 *
 * - Calendar days (invoice date, due date, project start/end, …) come from
 *   <input type="date"> and are stored as UTC midnight of that day. They must
 *   be read back in UTC, otherwise anyone west of UTC sees the previous day.
 * - Moments in time (paidAt, createdAt, completedAt, …) are ordinary
 *   timestamps, shown in the viewer's or the company's time zone.
 *
 * Shared by the app and Convex functions, so keep it free of browser APIs.
 */

export const DEFAULT_TIME_ZONE = "UTC";

/** True when the runtime recognises `tz` as an IANA zone, e.g. "America/Aruba". */
export function isValidTimeZone(tz: string | undefined | null): tz is string {
    if (!tz) return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/** The given zone if valid, otherwise UTC. */
export function resolveTimeZone(tz: string | undefined | null): string {
    return isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}

/** Zone of the current runtime — the browser's zone when called client-side. */
export function localTimeZone(): string {
    return resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/** "YYYY-MM-DD" for the instant `ts` as seen in `timeZone`. */
export function isoDayInZone(ts: number, timeZone: string): string {
    // en-CA formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: resolveTimeZone(timeZone),
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(ts);
}

/** Today's "YYYY-MM-DD", for prefilling date inputs. Defaults to the local zone. */
export function todayISO(timeZone: string = localTimeZone()): string {
    return isoDayInZone(Date.now(), timeZone);
}

/** "YYYY-MM-DD" → stored calendar-day timestamp (UTC midnight). */
export function isoToDay(iso: string): number {
    return Date.parse(`${iso}T00:00:00Z`);
}

/** Stored calendar-day timestamp → "YYYY-MM-DD", for date inputs. */
export function dayToISO(day: number): string {
    return new Date(day).toISOString().slice(0, 10);
}

/** Today in `timeZone` as a stored calendar-day timestamp. */
export function todayDay(timeZone: string): number {
    return isoToDay(todayISO(timeZone));
}

/** Formats a stored calendar day, e.g. "07 Oct 2026". */
export function formatDay(
    day: number,
    options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
    locale = "en-IE",
): string {
    return new Date(day).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}

/** Formats the date part of a moment in time, in `timeZone` (default: local). */
export function formatInstantDate(
    ts: number,
    timeZone?: string,
    options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
    locale = "en-IE",
): string {
    return new Date(ts).toLocaleDateString(locale, {
        ...options,
        ...(timeZone ? { timeZone: resolveTimeZone(timeZone) } : {}),
    });
}

/** Year and 0-based month of the instant `ts` in `timeZone`. */
export function yearMonthInZone(ts: number, timeZone: string): { year: number; month: number } {
    const [y, m] = isoDayInZone(ts, timeZone).split("-").map(Number);
    return { year: y, month: m - 1 };
}
