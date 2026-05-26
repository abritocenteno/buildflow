"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft, Edit2, Building2, MapPin, Calendar, DollarSign,
    Plus, Trash2, CheckCircle, Clock, FileText, Package, AlertTriangle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const STATUSES = [
    { key: "planning", label: "Planning", color: "bg-zinc-100 text-zinc-600" },
    { key: "permitting", label: "Permitting", color: "bg-blue-100 text-blue-700" },
    { key: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-700" },
    { key: "punch_list", label: "Punch List", color: "bg-amber-100 text-amber-700" },
    { key: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
    { key: "closed", label: "Closed", color: "bg-zinc-200 text-zinc-500" },
];

const PERMIT_TYPES = ["building", "electrical", "plumbing", "mechanical", "zoning", "other"];
const PERMIT_STATUS_COLORS: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-600",
    applied: "bg-blue-100 text-blue-700",
    issued: "bg-emerald-100 text-emerald-700",
    inspected: "bg-amber-100 text-amber-700",
    closed: "bg-zinc-200 text-zinc-500",
};

const CO_STATUS_COLORS: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    submitted: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
};

type Tab = "overview" | "change_orders" | "permits" | "invoices" | "time" | "materials" | "documents";

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const project = useQuery(api.projects.get, { id: id as Id<"projects"> });
    const updateStatus = useMutation(api.projects.updateStatus);
    const updateProject = useMutation(api.projects.update);
    const deleteProject = useMutation(api.projects.remove);
    const createCO = useMutation(api.changeOrders.create);
    const updateCO = useMutation(api.changeOrders.update);
    const createPermit = useMutation(api.permits.create);
    const updatePermit = useMutation(api.permits.update);

    const [tab, setTab] = useState<Tab>("overview");
    const [showCOForm, setShowCOForm] = useState(false);
    const [showPermitForm, setShowPermitForm] = useState(false);
    const [editProgress, setEditProgress] = useState(false);
    const [progress, setProgress] = useState(0);
    const [coForm, setCOForm] = useState({ description: "", amount: "", notes: "" });
    const [permitForm, setPermitForm] = useState({ type: "building", permitNumber: "", notes: "" });
    const [saving, setSaving] = useState(false);

    if (project === undefined) {
        return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" /></div>;
    }
    if (project === null) {
        return <div className="text-center py-24 text-zinc-500">Project not found</div>;
    }

    const status = STATUSES.find((s) => s.key === project.status);

    const handleCreateCO = async () => {
        if (!coForm.description || !coForm.amount) return;
        setSaving(true);
        await createCO({
            projectId: id as Id<"projects">,
            description: coForm.description,
            amount: parseFloat(coForm.amount),
            notes: coForm.notes || undefined,
        });
        setCOForm({ description: "", amount: "", notes: "" });
        setShowCOForm(false);
        setSaving(false);
    };

    const handleCreatePermit = async () => {
        setSaving(true);
        await createPermit({
            projectId: id as Id<"projects">,
            type: permitForm.type,
            permitNumber: permitForm.permitNumber || undefined,
            notes: permitForm.notes || undefined,
        });
        setPermitForm({ type: "building", permitNumber: "", notes: "" });
        setShowPermitForm(false);
        setSaving(false);
    };

    const handleProgressSave = async () => {
        await updateProject({ id: id as Id<"projects">, progress });
        setEditProgress(false);
    };

    const inputCls = "w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    const TABS: { key: Tab; label: string }[] = [
        { key: "overview", label: "Overview" },
        { key: "change_orders", label: `Change Orders (${project.changeOrders?.length ?? 0})` },
        { key: "permits", label: `Permits (${project.permits?.length ?? 0})` },
        { key: "invoices", label: `Invoices (${project.invoices?.length ?? 0})` },
        { key: "time", label: `Time (${project.timeEntries?.length ?? 0})` },
        { key: "materials", label: `Materials (${project.materials?.length ?? 0})` },
        { key: "documents", label: `Documents (${project.assets?.length ?? 0})` },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Link href="/dashboard/projects" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all mt-0.5">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-zinc-900">{project.title}</h1>
                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", status?.color ?? "bg-zinc-100 text-zinc-500")}>
                                {status?.label}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">{project.client?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={project.status}
                        onChange={(e) => updateStatus({ id: id as Id<"projects">, status: e.target.value })}
                        className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                        {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <Link href={`/dashboard/projects/${id}/edit`} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
                        <Edit2 size={18} />
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs text-zinc-500 mb-1">Budget</p>
                    <p className="font-bold text-zinc-900">{project.estimatedBudget ? formatCurrency(project.estimatedBudget) : "—"}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs text-zinc-500 mb-1">Actual Cost</p>
                    <p className="font-bold text-zinc-900">{project.actualCost ? formatCurrency(project.actualCost) : "—"}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs text-zinc-500 mb-1">End Date</p>
                    <p className="font-bold text-zinc-900">{project.endDate ? formatDate(project.endDate) : "—"}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-zinc-500">Progress</p>
                        <button onClick={() => { setProgress(project.progress ?? 0); setEditProgress(true); }} className="text-xs text-orange-500 hover:text-orange-600">edit</button>
                    </div>
                    {editProgress ? (
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(parseInt(e.target.value))} className="w-16 px-2 py-1 text-sm border border-zinc-200 rounded-lg" />
                            <button onClick={handleProgressSave} className="text-xs text-orange-500 font-medium">Save</button>
                        </div>
                    ) : (
                        <>
                            <p className="font-bold text-zinc-900">{project.progress ?? 0}%</p>
                            <div className="mt-1.5 h-1.5 bg-zinc-100 rounded-full">
                                <div className="h-1.5 bg-orange-500 rounded-full" style={{ width: `${project.progress ?? 0}%` }} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Site address */}
            {project.siteAddress && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin size={14} className="text-orange-500" />
                    {project.siteAddress}{project.siteCity ? `, ${project.siteCity}` : ""}{project.sitePostcode ? ` ${project.sitePostcode}` : ""}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-zinc-200">
                <div className="flex gap-1 overflow-x-auto pb-0">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px",
                                tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {tab === "overview" && (
                <div className="space-y-4">
                    {project.description && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Description</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed">{project.description}</p>
                        </div>
                    )}
                    {project.internalNotes && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                            <h3 className="text-sm font-semibold text-amber-800 mb-2">Internal Notes</h3>
                            <p className="text-sm text-amber-700 leading-relaxed">{project.internalNotes}</p>
                        </div>
                    )}
                </div>
            )}

            {tab === "change_orders" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowCOForm(true)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus size={15} /> Add Change Order
                        </button>
                    </div>
                    {showCOForm && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                            <h3 className="font-semibold text-sm text-zinc-900">New Change Order</h3>
                            <input className={inputCls} placeholder="Description of change" value={coForm.description} onChange={(e) => setCOForm({ ...coForm, description: e.target.value })} />
                            <input type="number" className={inputCls} placeholder="Amount (€, use − for credits)" value={coForm.amount} onChange={(e) => setCOForm({ ...coForm, amount: e.target.value })} />
                            <textarea className={inputCls} rows={2} placeholder="Notes (optional)" value={coForm.notes} onChange={(e) => setCOForm({ ...coForm, notes: e.target.value })} />
                            <div className="flex gap-2">
                                <button onClick={handleCreateCO} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Save</button>
                                <button onClick={() => setShowCOForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        {(project.changeOrders ?? []).length === 0 && (
                            <div className="text-center text-sm text-zinc-400 py-10">No change orders yet</div>
                        )}
                        {(project.changeOrders ?? []).map((co: any) => (
                            <div key={co._id} className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-semibold text-zinc-500">{co.coNumber}</span>
                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", CO_STATUS_COLORS[co.status] ?? "bg-zinc-100 text-zinc-500")}>{co.status}</span>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900">{co.description}</p>
                                    {co.notes && <p className="text-xs text-zinc-500 mt-1">{co.notes}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={cn("font-bold text-sm", co.amount >= 0 ? "text-red-600" : "text-emerald-600")}>
                                        {co.amount >= 0 ? "+" : ""}{formatCurrency(co.amount)}
                                    </p>
                                    <select
                                        value={co.status}
                                        onChange={(e) => updateCO({ id: co._id, status: e.target.value })}
                                        className="mt-1 text-xs px-2 py-1 rounded-lg border border-zinc-200 bg-white focus:outline-none"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "permits" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowPermitForm(true)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus size={15} /> Add Permit
                        </button>
                    </div>
                    {showPermitForm && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                            <h3 className="font-semibold text-sm text-zinc-900">New Permit</h3>
                            <select className={inputCls} value={permitForm.type} onChange={(e) => setPermitForm({ ...permitForm, type: e.target.value })}>
                                {PERMIT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                            <input className={inputCls} placeholder="Permit number (optional)" value={permitForm.permitNumber} onChange={(e) => setPermitForm({ ...permitForm, permitNumber: e.target.value })} />
                            <textarea className={inputCls} rows={2} placeholder="Notes" value={permitForm.notes} onChange={(e) => setPermitForm({ ...permitForm, notes: e.target.value })} />
                            <div className="flex gap-2">
                                <button onClick={handleCreatePermit} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Save</button>
                                <button onClick={() => setShowPermitForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        {(project.permits ?? []).length === 0 && (
                            <div className="text-center text-sm text-zinc-400 py-10">No permits yet</div>
                        )}
                        {(project.permits ?? []).map((permit: any) => (
                            <div key={permit._id} className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-zinc-900 capitalize">{permit.type} Permit</span>
                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", PERMIT_STATUS_COLORS[permit.status] ?? "bg-zinc-100 text-zinc-500")}>{permit.status}</span>
                                    </div>
                                    {permit.permitNumber && <p className="text-xs font-mono text-zinc-500">#{permit.permitNumber}</p>}
                                    {permit.notes && <p className="text-xs text-zinc-500 mt-1">{permit.notes}</p>}
                                </div>
                                <select
                                    value={permit.status}
                                    onChange={(e) => updatePermit({ id: permit._id, status: e.target.value })}
                                    className="text-xs px-2 py-1 rounded-lg border border-zinc-200 bg-white focus:outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="applied">Applied</option>
                                    <option value="issued">Issued</option>
                                    <option value="inspected">Inspected</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "invoices" && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <Link
                            href={`/dashboard/invoices/new?projectId=${id}`}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus size={15} /> Create Invoice
                        </Link>
                    </div>
                    {(project.invoices ?? []).length === 0 && <div className="text-center text-sm text-zinc-400 py-10">No invoices yet</div>}
                    {(project.invoices ?? []).map((inv: any) => (
                        <Link key={inv._id} href={`/dashboard/invoices/${inv._id}`} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between hover:border-orange-300 transition-colors">
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">{inv.invoiceNumber}</p>
                                <p className="text-xs text-zinc-500">{formatDate(inv.date)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-zinc-900">{formatCurrency(inv.amount)}</p>
                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{inv.status}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {tab === "time" && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <Link href={`/dashboard/timesheet?projectId=${id}`} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            <Plus size={15} /> Log Time
                        </Link>
                    </div>
                    {(project.timeEntries ?? []).length === 0 && <div className="text-center text-sm text-zinc-400 py-10">No time entries yet</div>}
                    {(project.timeEntries ?? []).map((entry: any) => (
                        <div key={entry._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-900">{entry.description || "Time entry"}</p>
                                <p className="text-xs text-zinc-500">{formatDate(entry.date)}{entry.workerName ? ` · ${entry.workerName}` : ""}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-zinc-900">{Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m</p>
                                <span className={cn("text-xs", entry.billable ? "text-emerald-600" : "text-zinc-400")}>{entry.billable ? "Billable" : "Non-billable"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "materials" && (
                <div className="space-y-3">
                    {(project.materials ?? []).length === 0 && <div className="text-center text-sm text-zinc-400 py-10">No materials tracked for this project</div>}
                    {(project.materials ?? []).map((m: any) => (
                        <div key={m._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-900">{m.name}</p>
                                <p className="text-xs text-zinc-500">{m.category}{m.sku ? ` · ${m.sku}` : ""}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-zinc-900">{m.quantity} {m.unit ?? "pcs"}</p>
                                {m.unitCost && <p className="text-xs text-zinc-400">{formatCurrency(m.unitCost)} each</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "documents" && (
                <div className="space-y-3">
                    {(project.assets ?? []).length === 0 && <div className="text-center text-sm text-zinc-400 py-10">No documents attached</div>}
                    {(project.assets ?? []).map((a: any) => (
                        <div key={a._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-900">{a.name}</p>
                                <p className="text-xs text-zinc-500 capitalize">{a.category} · {a.fileName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
