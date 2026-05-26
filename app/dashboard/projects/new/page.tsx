"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function NewProjectPage() {
    const router = useRouter();
    const clients = useQuery(api.clients.list) ?? [];
    const createProject = useMutation(api.projects.create);

    const [form, setForm] = useState({
        clientId: "" as string,
        title: "",
        description: "",
        status: "planning",
        siteAddress: "",
        siteCity: "",
        sitePostcode: "",
        startDate: "",
        endDate: "",
        estimatedBudget: "",
        internalNotes: "",
    });
    const [saving, setSaving] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.title) return;
        setSaving(true);
        try {
            const id = await createProject({
                clientId: form.clientId as Id<"clients">,
                title: form.title,
                description: form.description || undefined,
                status: form.status,
                siteAddress: form.siteAddress || undefined,
                siteCity: form.siteCity || undefined,
                sitePostcode: form.sitePostcode || undefined,
                startDate: form.startDate ? new Date(form.startDate).getTime() : undefined,
                endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
                estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
                internalNotes: form.internalNotes || undefined,
            });
            router.push(`/dashboard/projects/${id}`);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";
    const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/projects" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">New Project</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Create a new construction project</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 text-sm">Project Details</h2>

                    <div>
                        <label className={labelCls}>Client *</label>
                        <select className={inputCls} value={form.clientId} onChange={(e) => set("clientId", e.target.value)} required>
                            <option value="">Select a client…</option>
                            {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Project Title *</label>
                        <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Kitchen Extension — Smith Residence" required />
                    </div>

                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Scope of work, project overview…" />
                    </div>

                    <div>
                        <label className={labelCls}>Status</label>
                        <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                            <option value="planning">Planning</option>
                            <option value="permitting">Permitting</option>
                            <option value="in_progress">In Progress</option>
                            <option value="punch_list">Punch List</option>
                            <option value="completed">Completed</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 text-sm">Site Location</h2>
                    <div>
                        <label className={labelCls}>Site Address</label>
                        <input className={inputCls} value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} placeholder="Street address" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>City</label>
                            <input className={inputCls} value={form.siteCity} onChange={(e) => set("siteCity", e.target.value)} placeholder="City" />
                        </div>
                        <div>
                            <label className={labelCls}>Postcode</label>
                            <input className={inputCls} value={form.sitePostcode} onChange={(e) => set("sitePostcode", e.target.value)} placeholder="Postcode" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 text-sm">Schedule & Budget</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>End Date</label>
                            <input type="date" className={inputCls} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Estimated Budget (€)</label>
                        <input type="number" step="0.01" className={inputCls} value={form.estimatedBudget} onChange={(e) => set("estimatedBudget", e.target.value)} placeholder="0.00" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <label className={labelCls}>Internal Notes</label>
                    <textarea className={inputCls} rows={3} value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} placeholder="Private notes, not visible to the client…" />
                </div>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/projects" className="px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Save size={16} />
                        {saving ? "Creating…" : "Create Project"}
                    </button>
                </div>
            </form>
        </div>
    );
}
