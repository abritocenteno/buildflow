"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, CheckCircle2, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
    { key: "planning", label: "Planning" },
    { key: "permitting", label: "Permitting" },
    { key: "in_progress", label: "In Progress" },
    { key: "punch_list", label: "Punch List" },
    { key: "completed", label: "Completed" },
    { key: "closed", label: "Closed" },
];

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all";

export default function EditProjectPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const project = useQuery(api.projects.get, { id: id as Id<"projects"> });
    const subcontractors = useQuery(api.subcontractors.list) ?? [];
    const updateProject = useMutation(api.projects.update);

    const [initialized, setInitialized] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        title: "", description: "", status: "planning",
        siteAddress: "", siteCity: "", sitePostcode: "",
        startDate: "", endDate: "",
        estimatedBudget: "", purchaseOrderNumber: "", internalNotes: "",
    });
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

    useEffect(() => {
        if (project && !initialized) {
            const p = project as any;
            setForm({
                title: p.title,
                description: p.description ?? "",
                status: p.status,
                siteAddress: p.siteAddress ?? "",
                siteCity: p.siteCity ?? "",
                sitePostcode: p.sitePostcode ?? "",
                startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
                endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
                estimatedBudget: p.estimatedBudget ? String(p.estimatedBudget) : "",
                purchaseOrderNumber: p.purchaseOrderNumber ?? "",
                internalNotes: p.internalNotes ?? "",
            });
            setSelectedSubIds(p.subcontractorIds ?? []);
            setInitialized(true);
        }
    }, [project, initialized]);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const toggleSub = (subId: string) => {
        setSelectedSubIds((prev) =>
            prev.includes(subId) ? prev.filter((s) => s !== subId) : [...prev, subId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProject({
                id: id as Id<"projects">,
                title: form.title,
                description: form.description || undefined,
                status: form.status,
                siteAddress: form.siteAddress || undefined,
                siteCity: form.siteCity || undefined,
                sitePostcode: form.sitePostcode || undefined,
                startDate: form.startDate ? new Date(form.startDate).getTime() : undefined,
                endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
                estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
                purchaseOrderNumber: form.purchaseOrderNumber || undefined,
                internalNotes: form.internalNotes || undefined,
                subcontractorIds: selectedSubIds as Id<"subcontractors">[],
            });
            router.push(`/dashboard/projects/${id}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!project) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-zinc-300" size={32} />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <Link href={`/dashboard/projects/${id}`} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Project
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit Project</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{(project as any).title}</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Details */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Project Details</h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Project Title *</label>
                        <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Description</label>
                        <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={cn(inputCls, "resize-none")} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Status</label>
                            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Estimated Budget (€)</label>
                            <input type="number" min="0" step="0.01" value={form.estimatedBudget} onChange={(e) => set("estimatedBudget", e.target.value)} placeholder="0.00" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Start Date</label>
                            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">End Date</label>
                            <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Purchase Order Number</label>
                        <input value={form.purchaseOrderNumber} onChange={(e) => set("purchaseOrderNumber", e.target.value)} placeholder="e.g. PO-2024-001 (optional)" className={inputCls} />
                    </div>
                </div>

                {/* Site Address */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Site Address</h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Street Address</label>
                        <input value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} placeholder="e.g. 14 Elm Drive" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">City</label>
                            <input value={form.siteCity} onChange={(e) => set("siteCity", e.target.value)} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Postcode</label>
                            <input value={form.sitePostcode} onChange={(e) => set("sitePostcode", e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Subcontractors */}
                {subcontractors.length > 0 && (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                        <div>
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assigned Subcontractors</h2>
                            <p className="text-xs text-zinc-400 mt-1">Select which subcontractors are working on this project</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {subcontractors.map((sub: any) => {
                                const selected = selectedSubIds.includes(sub._id);
                                return (
                                    <button
                                        key={sub._id}
                                        type="button"
                                        onClick={() => toggleSub(sub._id)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all",
                                            selected
                                                ? "bg-sky-50 border-sky-300 text-sky-700"
                                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100"
                                        )}
                                    >
                                        <HardHat size={14} className={selected ? "text-sky-500" : "text-zinc-400"} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate text-xs">{sub.name}</p>
                                            <p className="text-[10px] capitalize opacity-60">{sub.trade}</p>
                                        </div>
                                        {selected && <CheckCircle2 size={14} className="text-sky-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Internal Notes */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Internal Notes</h2>
                    <textarea rows={4} value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)}
                        placeholder="Notes visible only to your team…"
                        className={cn(inputCls, "resize-none")} />
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Link href={`/dashboard/projects/${id}`} className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                        Cancel
                    </Link>
                    <button type="submit" disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/20 disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
