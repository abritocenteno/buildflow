import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDay, formatInstantDate } from "./dates";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EUR") {
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: currency,
    }).format(amount);
}

export function getCurrencySymbol(currency: string = "EUR") {
    return (0).toLocaleString("en-IE", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).replace(/\d/g, "").trim();
}

/** Formats a stored calendar day (invoice date, due date, …). See lib/dates.ts. */
export function formatDate(day: number): string {
    return formatDay(day);
}

export function formatDateShort(day: number): string {
    return formatDay(day, { day: "2-digit", month: "short" });
}

/** Formats the date of a moment in time (paidAt, createdAt, …) in the viewer's zone. */
export function formatTimestamp(timestamp: number): string {
    return formatInstantDate(timestamp);
}
