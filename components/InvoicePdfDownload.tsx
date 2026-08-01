"use client";

import { useEffect, useState } from "react";
import { subMonths } from "date-fns";
import { Download, FileArchive, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadBlob, dateStamp } from "@/lib/export";
import { createZip, safeFileName, uniqueName, type ZipEntry } from "@/lib/zip";
import {
    buildInvoicePdf,
    invoiceFileName,
    pdfToBytes,
    type InvoicePdfSettings,
} from "@/lib/pdf/invoice";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/* Single invoice                                                      */
/* ------------------------------------------------------------------ */

export function InvoicePdfButton({
    invoice,
    settings,
    className,
}: {
    invoice: any;
    settings?: InvoicePdfSettings | null;
    className?: string;
}) {
    const [busy, setBusy] = useState(false);

    const handle = async () => {
        setBusy(true);
        try {
            // Yield once so the spinner paints before the synchronous build.
            await new Promise((r) => setTimeout(r, 0));
            const pdf = buildInvoicePdf(invoice, settings);
            pdf.save(invoiceFileName(invoice));
        } catch (err: any) {
            alert(`PDF failed: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handle}
            disabled={busy}
            title={`Download ${invoice.invoiceNumber} as PDF`}
            aria-label={`Download ${invoice.invoiceNumber} as PDF`}
            className={cn(
                "p-1.5 rounded-lg text-zinc-300 hover:bg-sky-50 hover:text-sky-500 transition-all disabled:opacity-60",
                className
            )}
        >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Bulk by period                                                      */
/* ------------------------------------------------------------------ */

type PeriodKey = "1m" | "3m" | "6m" | "1y" | "all";

const PERIODS: { key: PeriodKey; label: string; months: number | null }[] = [
    { key: "1m", label: "Last month", months: 1 },
    { key: "3m", label: "Last 3 months", months: 3 },
    { key: "6m", label: "Last 6 months", months: 6 },
    { key: "1y", label: "Last year", months: 12 },
    { key: "all", label: "All time", months: null },
];

function inPeriod(invoices: any[], months: number | null): any[] {
    if (months === null) return invoices;
    const cutoff = subMonths(new Date(), months).getTime();
    return invoices.filter((inv) => (inv.date ?? 0) >= cutoff);
}

export function BulkInvoicePdfMenu({
    invoices,
    settings,
    className,
}: {
    invoices: any[];
    settings?: InvoicePdfSettings | null;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const handle = async (period: (typeof PERIODS)[number]) => {
        const batch = inPeriod(invoices, period.months);
        if (!batch.length) return;

        setOpen(false);
        setBusy(true);
        setProgress({ done: 0, total: batch.length });

        try {
            const taken = new Set<string>();
            const entries: ZipEntry[] = [];

            for (let i = 0; i < batch.length; i++) {
                const invoice = batch[i];
                const pdf = buildInvoicePdf(invoice, settings);
                entries.push({
                    name: uniqueName(safeFileName(invoiceFileName(invoice)), taken),
                    data: pdfToBytes(pdf),
                });
                setProgress({ done: i + 1, total: batch.length });
                // Yield periodically so the progress label repaints on long runs.
                if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
            }

            downloadBlob(createZip(entries), `invoices-${period.key}-${dateStamp()}.zip`);
        } catch (err: any) {
            alert(`Bulk download failed: ${err.message}`);
        } finally {
            setBusy(false);
            setProgress({ done: 0, total: 0 });
        }
    };

    const isEmpty = invoices.length === 0;

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={isEmpty || busy}
                title={isEmpty ? "No invoices to download" : undefined}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <FileArchive size={16} />
                )}
                {busy ? `${progress.done}/${progress.total}` : "PDFs"}
                {!busy && (
                    <ChevronDown
                        size={13}
                        className={cn("transition-transform", open && "rotate-180")}
                    />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Download as ZIP
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">One PDF per invoice</p>
                        </div>
                        <div className="pb-2">
                            {PERIODS.map((period) => {
                                const count = inPeriod(invoices, period.months).length;
                                return (
                                    <button
                                        key={period.key}
                                        type="button"
                                        onClick={() => handle(period)}
                                        disabled={count === 0}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                    >
                                        <span className="flex-1 text-sm font-medium text-zinc-800">
                                            {period.label}
                                        </span>
                                        <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
