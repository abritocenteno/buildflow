"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search, ChevronRight, HardHat, AlertTriangle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const TRADE_COLORS: Record<string, string> = {
    electrical: "bg-yellow-100 text-yellow-700",
    plumbing: "bg-blue-100 text-blue-700",
    hvac: "bg-cyan-100 text-cyan-700",
    carpentry: "bg-amber-100 text-amber-700",
    masonry: "bg-stone-100 text-stone-700",
    roofing: "bg-sky-100 text-sky-700",
    painting: "bg-purple-100 text-purple-700",
    tiling: "bg-emerald-100 text-emerald-700",
    other: "bg-zinc-100 text-zinc-600",
};

export default function SubcontractorsPage() {
    const subcontractors = useQuery(api.subcontractors.list) ?? [];
    const [search, setSearch] = useState("");

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const filtered = subcontractors.filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.trade.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Subcontractors</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{subcontractors.length} subcontractors</p>
                </div>
                <Link href="/dashboard/subcontractors/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Subcontractor
                </Link>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or trade…" className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                {filtered.length === 0 && (
                    <div className="py-12 text-center">
                        <HardHat size={32} className="mx-auto text-zinc-300 mb-3" />
                        <p className="text-sm text-zinc-400">{search ? "No subcontractors match your search" : "No subcontractors yet"}</p>
                    </div>
                )}
                {filtered.map((sub: any) => {
                    const insuranceExpiring = sub.insuranceExpiry && (sub.insuranceExpiry - now < thirtyDays);
                    return (
                        <Link
                            key={sub._id}
                            href={`/dashboard/subcontractors/${sub._id}`}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                                <HardHat size={18} className="text-sky-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-900">{sub.name}</p>
                                    {insuranceExpiring && <AlertTriangle size={14} className="text-amber-500" />}
                                </div>
                                <p className="text-xs text-zinc-500">{sub.email}{sub.city ? ` · ${sub.city}` : ""}</p>
                            </div>
                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full capitalize", TRADE_COLORS[sub.trade] ?? "bg-zinc-100 text-zinc-600")}>
                                {sub.trade}
                            </span>
                            {sub.insuranceExpiry && (
                                <span className={cn("text-xs px-2 py-1 rounded-lg hidden lg:block", insuranceExpiring ? "text-amber-600 bg-amber-50" : "text-zinc-400 bg-zinc-50")}>
                                    Ins. exp. {formatDate(sub.insuranceExpiry)}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-zinc-400 flex-shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
