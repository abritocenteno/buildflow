"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Check, X, Clock, Users } from "lucide-react";

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPage() {
    const allSettings = useQuery(api.settings.getAllSettings);
    const pendingRequests = useQuery(api.settings.getPendingNameChangeRequests);
    const resolveRequest = useMutation(api.settings.resolveNameChangeRequest);
    const [resolving, setResolving] = useState<string | null>(null);

    // null = loaded but not authorized; undefined = still loading
    const loading = allSettings === undefined || pendingRequests === undefined;
    const unauthorized = !loading && (allSettings === null || pendingRequests === null);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                        <X size={28} className="text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900">Access Denied</h1>
                    <p className="text-sm text-zinc-500">This page is restricted to administrators.</p>
                </div>
            </div>
        );
    }

    const handleResolve = async (requestId: any, approve: boolean) => {
        setResolving(requestId);
        try {
            await resolveRequest({ requestId, approve });
        } finally {
            setResolving(null);
        }
    };

    const cardCls = "bg-white rounded-2xl border border-zinc-200 p-6";

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Admin Panel</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage companies and requests</p>
                </div>

                {/* Pending name change requests */}
                <div className={cardCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-amber-500" />
                        <h2 className="font-semibold text-zinc-900">Pending Name Change Requests</h2>
                        {(pendingRequests as any[]).length > 0 && (
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {(pendingRequests as any[]).length}
                            </span>
                        )}
                    </div>

                    {(pendingRequests as any[]).length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-6">No pending requests.</p>
                    ) : (
                        <div className="space-y-3">
                            {(pendingRequests as any[]).map((req) => (
                                <div key={req._id} className="flex items-center justify-between gap-4 bg-zinc-50 rounded-xl px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 truncate">
                                            <span className="text-zinc-400">{req.currentName}</span>
                                            <span className="mx-2 text-zinc-300">→</span>
                                            <span className="text-sky-600">{req.requestedName}</span>
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-0.5">{req.userEmail} · {formatDate(req.createdAt)}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleResolve(req._id, true)}
                                            disabled={resolving === req._id}
                                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            <Check size={13} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleResolve(req._id, false)}
                                            disabled={resolving === req._id}
                                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            <X size={13} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* All companies */}
                <div className={cardCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-sky-500" />
                        <h2 className="font-semibold text-zinc-900">All Companies</h2>
                        <span className="ml-auto text-xs text-zinc-400">{(allSettings as any[]).length} registered</span>
                    </div>

                    {(allSettings as any[]).length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-6">No companies yet.</p>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {(allSettings as any[]).map((s) => (
                                <div key={s._id} className="flex items-center justify-between py-3 gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                            {s.companyName?.[0] ?? "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900 truncate">{s.companyName}</p>
                                            <p className="text-xs text-zinc-400 truncate">{s.contactEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                                        <div>
                                            <p className="text-xs text-zinc-500">{s.phone || "—"}</p>
                                            <p className="text-xs text-zinc-400">{s.currency || "—"}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(s.companyNameChangeCount ?? 0) >= 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                            {s.companyNameChangeCount ?? 0} rename{(s.companyNameChangeCount ?? 0) !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
