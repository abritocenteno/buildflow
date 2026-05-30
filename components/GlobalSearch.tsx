"use client";

import { Search, X, FolderKanban, Users, FileText, HardHat } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const results = useQuery(
        api.search.globalSearch,
        query.length >= 2 ? { query } : "skip"
    ) ?? { projects: [], clients: [], quotes: [], invoices: [] };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    if (!open) return null;

    const hasResults =
        results.projects.length > 0 ||
        results.clients.length > 0 ||
        results.quotes.length > 0 ||
        results.invoices.length > 0;

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
                    <Search size={18} className="text-zinc-400 flex-shrink-0" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search projects, clients, quotes…"
                        className="flex-1 text-sm outline-none bg-transparent text-zinc-900 placeholder:text-zinc-400"
                    />
                    <button onClick={() => setOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                        <X size={16} className="text-zinc-400" />
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                    {query.length < 2 && (
                        <p className="text-xs text-zinc-400 text-center py-6">Type at least 2 characters to search</p>
                    )}
                    {query.length >= 2 && !hasResults && (
                        <p className="text-xs text-zinc-400 text-center py-6">No results found</p>
                    )}

                    {results.projects.length > 0 && (
                        <div>
                            <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Projects</p>
                            {results.projects.map((p) => (
                                <Link
                                    key={p._id}
                                    href={`/dashboard/projects/${p._id}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    <FolderKanban size={16} className="text-sky-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">{p.title}</p>
                                        <p className="text-xs text-zinc-500">{p.siteAddress}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.clients.length > 0 && (
                        <div>
                            <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clients</p>
                            {results.clients.map((c) => (
                                <Link
                                    key={c._id}
                                    href={`/dashboard/clients/${c._id}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    <Users size={16} className="text-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                                        <p className="text-xs text-zinc-500">{c.email}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.quotes.length > 0 && (
                        <div>
                            <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quotes</p>
                            {results.quotes.map((q) => (
                                <Link
                                    key={q._id}
                                    href={`/dashboard/quotes/${q._id}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    <FileText size={16} className="text-emerald-500 flex-shrink-0" />
                                    <p className="text-sm font-medium text-zinc-900">{q.quoteNumber}</p>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.invoices.length > 0 && (
                        <div>
                            <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoices</p>
                            {results.invoices.map((i) => (
                                <Link
                                    key={i._id}
                                    href={`/dashboard/invoices/${i._id}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    <FileText size={16} className="text-zinc-400 flex-shrink-0" />
                                    <p className="text-sm font-medium text-zinc-900">{i.invoiceNumber}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
