"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft,
    Receipt,
    FolderKanban,
    FileText,
    Plus,
    Trash2,
    ChevronRight,
    Loader2,
    AlertCircle,
    ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
    received:     "bg-blue-50 text-blue-700 border border-blue-100",
    active:       "bg-amber-50 text-amber-700 border border-amber-100",
    fully_billed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    closed:       "bg-zinc-100 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
    received:     "Received",
    active:       "Active",
    fully_billed: "Fully Billed",
    closed:       "Closed",
};

const INV_STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    paid:    "bg-emerald-50 text-emerald-700 border border-emerald-100",
    overdue: "bg-red-50 text-red-700 border border-red-100",
};

function PurchaseOrderDetail({ id }: { id: Id<"purchaseOrders"> }) {
    const router = useRouter();
    const po = useQuery(api.purchaseOrders.get, { id });
    const allProjects = useQuery(api.projects.list) ?? [];
    const markStatus = useMutation(api.purchaseOrders.markStatus);
    const linkToProject = useMutation(api.purchaseOrders.linkToProject);
    const deletePo = useMutation(api.purchaseOrders.remove);

    const [tab, setTab] = useState<"overview" | "invoices">("overview");
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [linkProjectId, setLinkProjectId] = useState("");
    const [isLinking, setIsLinking] = useState(false);

    if (po === undefined) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-zinc-300" size={32} />
        </div>
    );

    if (po === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Purchase order not found</h2>
            <button onClick={() => router.back()} className="text-sm text-sky-500 font-medium hover:underline">Go back</button>
        </div>
    );

    const client = (po as any).client;
    const project = (po as any).project;
    const invoices = (po as any).invoices ?? [];
    const billedAmount: number = (po as any).billedAmount ?? 0;
    const billedPercent: number = (po as any).billedPercent ?? 0;
    const remaining = po.amount - billedAmount;

    // Projects of the same client that don't yet have a PO linked
    const linkableProjects = allProjects.filter(
        (p: any) => p.clientId === po.clientId && !p.purchaseOrderId
    );

    const handleLinkProject = async () => {
        if (!linkProjectId) return;
        setIsLinking(true);
        try {
            await linkToProject({ id, projectId: linkProjectId as Id<"projects"> });
            setLinkProjectId("");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <button onClick={() => router.push("/dashboard/purchase-orders")} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Purchase Orders
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 font-mono">{po.poNumber}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", STATUS_STYLES[po.status] ?? "bg-zinc-100 text-zinc-500")}>
                                    {STATUS_LABELS[po.status] ?? po.status}
                                </span>
                                <span className="text-xs text-zinc-400">{client?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-start">
                    {/* Status dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusMenu((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all"
                        >
                            {STATUS_LABELS[po.status] ?? po.status}
                            <ChevronDown size={13} className={cn("transition-transform", showStatusMenu && "rotate-180")} />
                        </button>
                        {showStatusMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 z-20 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={async () => { await markStatus({ id, status: key }); setShowStatusMenu(false); }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors",
                                                po.status === key ? "font-semibold text-sky-600" : "text-zinc-700"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Delete */}
                    {confirmingDelete ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-red-700 font-medium">Delete PO?</span>
                            <button onClick={() => setConfirmingDelete(false)} className="text-xs text-zinc-500 hover:text-zinc-700">Cancel</button>
                            <button
                                onClick={async () => { await deletePo({ id }); router.push("/dashboard/purchase-orders"); }}
                                className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmingDelete(true)} className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </header>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "PO Amount",    value: formatCurrency(po.amount),    color: "text-zinc-900" },
                    { label: "Total Billed", value: formatCurrency(billedAmount), color: "text-emerald-600" },
                    { label: "Remaining",    value: formatCurrency(remaining),    color: remaining > 0 ? "text-amber-600" : "text-zinc-400" },
                    { label: "Received",     value: formatDate(po.receivedAt),    color: "text-zinc-700" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-4">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Billing progress bar */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Billing Progress</span>
                    <span className="text-sm font-bold text-zinc-700">{Math.round(billedPercent)}%</span>
                </div>
                <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", billedPercent >= 100 ? "bg-emerald-500" : "bg-sky-500")}
                        style={{ width: `${billedPercent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                    <span>{formatCurrency(billedAmount)} billed</span>
                    <span>{formatCurrency(remaining)} remaining</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
                {(["overview", "invoices"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                            tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        {t === "invoices" ? `Invoices (${invoices.length})` : "Overview"}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {tab === "overview" && (
                <div className="space-y-4">
                    {/* Description + notes */}
                    {(po.description || po.notes || po.internalNotes) && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                            {po.description && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Description</p>
                                    <p className="text-sm text-zinc-700">{po.description}</p>
                                </div>
                            )}
                            {po.notes && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
                                    <p className="text-sm text-zinc-700">{po.notes}</p>
                                </div>
                            )}
                            {po.internalNotes && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Internal Notes</p>
                                    <p className="text-sm text-amber-800">{po.internalNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Linked project */}
                    {project ? (
                        <Link href={`/dashboard/projects/${project._id}`} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3 group hover:border-sky-200 transition-colors block">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                                <FolderKanban size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Linked Project</p>
                                <p className="text-sm font-semibold text-zinc-900 group-hover:text-sky-500 transition-colors truncate">{project.title}</p>
                            </div>
                            <ChevronRight size={16} className="text-zinc-300 group-hover:text-sky-400 transition-colors" />
                        </Link>
                    ) : (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                            <p className="text-sm font-semibold text-zinc-700">Link to a Project</p>
                            <p className="text-xs text-zinc-400">This PO isn't linked to a project yet. Select one below to link them.</p>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                                    value={linkProjectId}
                                    onChange={(e) => setLinkProjectId(e.target.value)}
                                >
                                    <option value="">Select a project…</option>
                                    {linkableProjects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                                <button
                                    onClick={handleLinkProject}
                                    disabled={!linkProjectId || isLinking}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                                >
                                    {isLinking ? <Loader2 size={14} className="animate-spin" /> : null}
                                    Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Invoices tab */}
            {tab === "invoices" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} against this PO</p>
                        <Link
                            href={`/dashboard/invoices/new${project ? `?projectId=${project._id}` : ""}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus size={14} /> Create Invoice
                        </Link>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                                <FileText size={22} />
                            </div>
                            <p className="font-semibold text-zinc-700">No invoices yet</p>
                            <p className="text-sm text-zinc-400">Invoices linked to this PO will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-100">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoice</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {invoices.map((inv: any) => (
                                        <tr key={inv._id} className="hover:bg-zinc-50 transition-colors group">
                                            <td className="px-5 py-3.5 font-mono font-bold text-sm text-zinc-900">{inv.invoiceNumber}</td>
                                            <td className="px-5 py-3.5 text-sm text-zinc-500 hidden md:table-cell">{formatDate(inv.date)}</td>
                                            <td className="px-5 py-3.5 text-right font-bold text-sm text-zinc-900">{formatCurrency(inv.amount)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", INV_STATUS_BADGE[inv.status] ?? "bg-zinc-100 text-zinc-500")}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link href={`/dashboard/invoices/${inv._id}`} className="p-1.5 text-zinc-300 hover:text-zinc-700 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-zinc-100 transition-all inline-block">
                                                    <ChevronRight size={15} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t-2 border-zinc-100">
                                    <tr>
                                        <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Total Billed</td>
                                        <td className="px-5 py-3 text-right font-black text-zinc-900">{formatCurrency(billedAmount)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <PurchaseOrderDetail id={id as Id<"purchaseOrders">} />;
}
