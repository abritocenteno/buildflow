"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft, Edit2, Building2, MapPin, Calendar, DollarSign,
    Plus, Trash2, CheckCircle, Clock, FileText, Package, AlertTriangle,
    ClipboardCheck, Send, Copy, Check,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { SignoffDetailModal } from "@/components/SignoffDetailModal";

const STATUSES = [
    { key: "planning", label: "Planning", color: "bg-zinc-100 text-zinc-600" },
    { key: "permitting", label: "Permitting", color: "bg-blue-100 text-blue-700" },
    { key: "in_progress", label: "In Progress", color: "bg-sky-100 text-sky-700" },
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

type Tab = "overview" | "change_orders" | "permits" | "invoices" | "time" | "materials" | "documents" | "sign_offs";

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
    const createSignoff = useMutation(api.signoffs.create);
    const sendSignoffEmail = useAction(api.resend.sendSignoffRequestEmail);
    const signoffs = useQuery(api.signoffs.listByProject, { projectId: id as Id<"projects"> });

    const [tab, setTab] = useState<Tab>("overview");
    const [showCOForm, setShowCOForm] = useState(false);
    const [showPermitForm, setShowPermitForm] = useState(false);
    const [editProgress, setEditProgress] = useState(false);
    const [progress, setProgress] = useState(0);
    const [coForm, setCOForm] = useState({ description: "", amount: "", notes: "" });
    const [permitForm, setPermitForm] = useState({ type: "building", permitNumber: "", notes: "" });
    const [saving, setSaving] = useState(false);
    const [showSignoffModal, setShowSignoffModal] = useState(false);
    const [signoffForm, setSignoffForm] = useState({ clientEmail: "", clientName: "", note: "" });
    const [signoffSending, setSignoffSending] = useState(false);
    const [signoffLink, setSignoffLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedSignoffId, setSelectedSignoffId] = useState<Id<"signoffs"> | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    if (project === undefined) {
        return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" /></div>;
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

    const handleSendSignoff = async () => {
        if (!signoffForm.clientEmail.trim() || !signoffForm.clientName.trim()) return;
        setSignoffSending(true);
        try {
            const { token } = await createSignoff({
                projectId: id as Id<"projects">,
                clientEmail: signoffForm.clientEmail.trim(),
                clientName: signoffForm.clientName.trim(),
            });
            const url = `${window.location.origin}/signoff/${token}`;
            setSignoffLink(url);
            await sendSignoffEmail({
                clientName: signoffForm.clientName.trim(),
                clientEmail: signoffForm.clientEmail.trim(),
                projectTitle: project.title,
                projectAddress: [project.siteAddress, project.siteCity].filter(Boolean).join(", ") || undefined,
                signoffUrl: url,
                note: signoffForm.note.trim() || undefined,
            });
        } finally {
            setSignoffSending(false);
        }
    };

    const copyLink = () => {
        if (!signoffLink) return;
        navigator.clipboard.writeText(signoffLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputCls = "w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all";

    const TABS: { key: Tab; label: string }[] = [
        { key: "overview", label: "Overview" },
        { key: "change_orders", label: `Change Orders (${project.changeOrders?.length ?? 0})` },
        { key: "permits", label: `Permits (${project.permits?.length ?? 0})` },
        { key: "invoices", label: `Invoices (${project.invoices?.length ?? 0})` },
        { key: "time", label: `Time (${project.timeEntries?.length ?? 0})` },
        { key: "materials", label: `Materials (${project.materials?.length ?? 0})` },
        { key: "documents", label: `Documents (${project.assets?.length ?? 0})` },
        { key: "sign_offs", label: `Sign-offs (${signoffs?.length ?? 0})` },
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
                        {(project as any).purchaseOrderNumber && (
                            <p className="text-xs text-zinc-400 mt-0.5">PO: <span className="font-mono font-medium text-zinc-600">{(project as any).purchaseOrderNumber}</span></p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSignoffForm({ clientEmail: project.client?.email ?? "", clientName: project.client?.name ?? "", note: "" });
                            setSignoffLink(null);
                            setShowSignoffModal(true);
                        }}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors"
                    >
                        <ClipboardCheck size={14} />
                        Send Sign-off
                    </button>
                    <select
                        value={project.status}
                        onChange={(e) => updateStatus({ id: id as Id<"projects">, status: e.target.value })}
                        className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                        {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <Link href={`/dashboard/projects/${id}/edit`} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
                        <Edit2 size={18} />
                    </Link>
                    {confirmingDelete ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-red-700 font-medium">Delete project?</span>
                            <button onClick={() => setConfirmingDelete(false)} className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
                            <button
                                onClick={async () => {
                                    await deleteProject({ id: id as Id<"projects"> });
                                    router.push("/dashboard/projects");
                                }}
                                className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmingDelete(true)} className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-500 transition-all">
                            <Trash2 size={18} />
                        </button>
                    )}
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
                        <button onClick={() => { setProgress(project.progress ?? 0); setEditProgress(true); }} className="text-xs text-sky-500 hover:text-sky-600">edit</button>
                    </div>
                    {editProgress ? (
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(parseInt(e.target.value))} className="w-16 px-2 py-1 text-sm border border-zinc-200 rounded-lg" />
                            <button onClick={handleProgressSave} className="text-xs text-sky-500 font-medium">Save</button>
                        </div>
                    ) : (
                        <>
                            <p className="font-bold text-zinc-900">{project.progress ?? 0}%</p>
                            <div className="mt-1.5 h-1.5 bg-zinc-100 rounded-full">
                                <div className="h-1.5 bg-sky-500 rounded-full" style={{ width: `${project.progress ?? 0}%` }} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Site address */}
            {project.siteAddress && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin size={14} className="text-sky-500" />
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
                                tab === t.key ? "border-sky-500 text-sky-600" : "border-transparent text-zinc-500 hover:text-zinc-900"
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
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
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
                                <button onClick={handleCreateCO} disabled={saving} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Save</button>
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
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
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
                                <button onClick={handleCreatePermit} disabled={saving} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Save</button>
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
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus size={15} /> Create Invoice
                        </Link>
                    </div>
                    {(project.invoices ?? []).length === 0 && <div className="text-center text-sm text-zinc-400 py-10">No invoices yet</div>}
                    {(project.invoices ?? []).map((inv: any) => (
                        <Link key={inv._id} href={`/dashboard/invoices/${inv._id}`} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between hover:border-sky-300 transition-colors">
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
                        <Link href={`/dashboard/timesheet?projectId=${id}`} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
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

            {tab === "sign_offs" && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setSignoffForm({ clientEmail: project.client?.email ?? "", clientName: project.client?.name ?? "", note: "" });
                                setSignoffLink(null);
                                setShowSignoffModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors"
                        >
                            <Send size={14} />
                            Send Sign-off Request
                        </button>
                    </div>
                    {(signoffs ?? []).length === 0 && (
                        <div className="text-center text-sm text-zinc-400 py-10">No sign-off requests sent yet</div>
                    )}
                    {(signoffs ?? []).map((s) => (
                        <button
                            key={s._id}
                            onClick={() => s.status === "completed" ? setSelectedSignoffId(s._id) : null}
                            className={`w-full bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between text-left transition-colors ${s.status === "completed" ? "hover:border-sky-200 hover:bg-sky-50/30 cursor-pointer" : "cursor-default"}`}
                        >
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium text-zinc-900">{s.clientName}</p>
                                <p className="text-xs text-zinc-500">{s.clientEmail}</p>
                                {s.completedAt && (
                                    <p className="text-xs text-zinc-400">Signed by {s.supervisorName} · {new Date(s.completedAt).toLocaleDateString()}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {s.status === "completed" ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                        <CheckCircle size={12} /> Signed
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Pending</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Sign-off Detail Modal */}
            {selectedSignoffId && (
                <SignoffDetailModal
                    signoffId={selectedSignoffId}
                    onClose={() => setSelectedSignoffId(null)}
                />
            )}

            {/* Send Sign-off Modal */}
            {showSignoffModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-zinc-900">Send sign-off request</h3>
                                <p className="text-sm text-zinc-500 mt-0.5">The client will receive an email with a link to review and sign off on the completed work.</p>
                            </div>

                            {!signoffLink ? (
                                <>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Client name</label>
                                            <input
                                                type="text"
                                                value={signoffForm.clientName}
                                                onChange={(e) => setSignoffForm(f => ({ ...f, clientName: e.target.value }))}
                                                placeholder="e.g. John Smith"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Client email</label>
                                            <input
                                                type="email"
                                                value={signoffForm.clientEmail}
                                                onChange={(e) => setSignoffForm(f => ({ ...f, clientEmail: e.target.value }))}
                                                placeholder="client@example.com"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Note <span className="font-normal text-zinc-400">(optional)</span></label>
                                            <textarea
                                                value={signoffForm.note}
                                                onChange={(e) => setSignoffForm(f => ({ ...f, note: e.target.value }))}
                                                rows={2}
                                                placeholder="Any additional context for the client..."
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setShowSignoffModal(false)}
                                            className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSendSignoff}
                                            disabled={signoffSending || !signoffForm.clientEmail.trim() || !signoffForm.clientName.trim()}
                                            className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Send size={14} />
                                            {signoffSending ? "Sending…" : "Send"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-800">Email sent to {signoffForm.clientEmail}</p>
                                            <p className="text-xs text-emerald-600 mt-0.5">You can also share the link directly:</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-200">
                                        <p className="text-xs text-zinc-600 flex-1 truncate">{signoffLink}</p>
                                        <button onClick={copyLink} className="flex items-center gap-1 text-xs font-medium text-sky-500 hover:text-sky-600 flex-shrink-0">
                                            {copied ? <Check size={13} /> : <Copy size={13} />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setShowSignoffModal(false); setSignoffLink(null); setTab("sign_offs"); }}
                                        className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
                                    >
                                        Done
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
