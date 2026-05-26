import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatDateShort(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
    });
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(","),
        ...rows.map((r) =>
            headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
        ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
