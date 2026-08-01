"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportRows, type Column } from "@/lib/export";

interface ExportMenuProps<T> {
    /** Rows to export — pass the filtered list so the export matches what's on screen. */
    rows: T[];
    columns: Column<T>[];
    /** Base filename, without extension or date stamp. */
    filename: string;
    sheetName?: string;
    currency?: string;
    className?: string;
}

export default function ExportMenu<T>({
    rows,
    columns,
    filename,
    sheetName,
    currency,
    className,
}: ExportMenuProps<T>) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const isEmpty = rows.length === 0;

    const handle = (format: "csv" | "xls") => {
        setOpen(false);
        exportRows(format, rows, columns, { filename, sheetName, currency });
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={isEmpty}
                title={isEmpty ? "Nothing to export" : undefined}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={16} />
                Export
                <ChevronDown
                    size={13}
                    className={cn("transition-transform", open && "rotate-180")}
                />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 w-60 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Export {rows.length} row{rows.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <div className="pb-2">
                            <button
                                type="button"
                                onClick={() => handle("xls")}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                            >
                                <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-zinc-800">
                                        Excel
                                    </span>
                                    <span className="block text-xs text-zinc-400">
                                        Formatted, typed columns
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handle("csv")}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                            >
                                <FileText size={16} className="text-zinc-500 shrink-0" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-zinc-800">
                                        CSV
                                    </span>
                                    <span className="block text-xs text-zinc-400">
                                        Plain text, universal
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
