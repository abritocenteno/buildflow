"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Check, X, Clock, Users, FolderKanban, FileText, Building2, Mail, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Icon size={12} className="text-zinc-400" />
            <span className="font-semibold text-zinc-700">{value}</span>
            <span>{label}</span>
        </div>
    );
}

export default function AdminPage() {
    const allSettings = useQuery(api.settings.getAllSettings);
    const pendingRequests = useQuery(api.settings.getPendingNameChangeRequests);
    const companyStats = useQuery(api.settings.getCompanyStats);
    const allowedEmails = useQuery(api.settings.getAllowedEmails);
    const resolveRequest = useMutation(api.settings.resolveNameChangeRequest);
    const addAllowedEmail = useMutation(api.settings.addAllowedEmail);
    const removeAllowedEmail = useMutation(api.settings.removeAllowedEmail);
    const [resolving, setResolving] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState("");
    const [addingEmail, setAddingEmail] = useState(false);

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

    const companies = allSettings as any[];
    const requests = pendingRequests as any[];
    const stats = companyStats as Record<string, { projects: number; invoices: number; clients: number }> | null;

    const totalProjects = Object.values(stats ?? {}).reduce((s, c) => s + c.projects, 0);
    const totalInvoices = Object.values(stats ?? {}).reduce((s, c) => s + c.invoices, 0);
    const totalClients = Object.values(stats ?? {}).reduce((s, c) => s + c.clients, 0);

    const cardCls = "bg-white rounded-2xl border border-zinc-200 p-6";

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-3">
                        <ArrowLeft size={14} /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Admin Panel</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage companies and requests</p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Companies", value: companies.length, icon: Building2, color: "text-sky-500", bg: "bg-sky-50" },
                        { label: "Projects", value: totalProjects, icon: FolderKanban, color: "text-violet-500", bg: "bg-violet-50" },
                        { label: "Invoices", value: totalInvoices, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { label: "Clients", value: totalClients, icon: Users, color: "text-amber-500", bg: "bg-amber-50" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={18} className={color} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-900 leading-none">{value}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending name change requests */}
                <div className={cardCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-amber-500" />
                        <h2 className="font-semibold text-zinc-900">Pending Name Change Requests</h2>
                        {requests.length > 0 && (
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {requests.length}
                            </span>
                        )}
                    </div>

                    {requests.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-6">No pending requests.</p>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req: any) => (
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

                {/* Allowed emails */}
                <div className={cardCls}>
                    <div className="flex items-center gap-2 mb-1">
                        <Mail size={18} className="text-sky-500" />
                        <h2 className="font-semibold text-zinc-900">Allowed Emails</h2>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4">
                        {allowedEmails?.length === 0
                            ? "List is empty — anyone with a valid account can sign up."
                            : "Only these emails can create an account."}
                    </p>

                    {/* Add email */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            onKeyDown={async e => {
                                if (e.key === "Enter" && newEmail.trim()) {
                                    setAddingEmail(true);
                                    await addAllowedEmail({ email: newEmail.trim() });
                                    setNewEmail("");
                                    setAddingEmail(false);
                                }
                            }}
                            placeholder="name@example.com"
                            className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                        />
                        <button
                            disabled={!newEmail.trim() || addingEmail}
                            onClick={async () => {
                                if (!newEmail.trim()) return;
                                setAddingEmail(true);
                                await addAllowedEmail({ email: newEmail.trim() });
                                setNewEmail("");
                                setAddingEmail(false);
                            }}
                            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {allowedEmails === undefined ? (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
                        </div>
                    ) : (allowedEmails as any[]).length === 0 ? (
                        <p className="text-sm text-zinc-300 text-center py-4 border border-dashed border-zinc-200 rounded-xl">No restrictions set</p>
                    ) : (
                        <div className="space-y-1">
                            {(allowedEmails as any[]).map((entry: any) => (
                                <div key={entry._id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl">
                                    <span className="text-sm text-zinc-700">{entry.email}</span>
                                    <button
                                        onClick={() => removeAllowedEmail({ id: entry._id })}
                                        className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
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
                        <span className="ml-auto text-xs text-zinc-400">{companies.length} registered</span>
                    </div>

                    {companies.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-6">No companies yet.</p>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {companies.map((s: any) => {
                                const s_stats = stats?.[s.userId] ?? { projects: 0, invoices: 0, clients: 0 };
                                return (
                                    <div key={s._id} className="py-4 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                                {s.companyName?.[0] ?? "?"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 truncate">{s.companyName}</p>
                                                <p className="text-xs text-zinc-400 truncate">{s.contactEmail}</p>
                                                <p className="text-xs text-zinc-300 mt-0.5">Joined {formatDate(s._creationTime)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(s.companyNameChangeCount ?? 0) >= 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                {s.companyNameChangeCount ?? 0} rename{(s.companyNameChangeCount ?? 0) !== 1 ? "s" : ""}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <StatPill icon={FolderKanban} value={s_stats.projects} label="projects" />
                                                <StatPill icon={FileText} value={s_stats.invoices} label="invoices" />
                                                <StatPill icon={Users} value={s_stats.clients} label="clients" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
