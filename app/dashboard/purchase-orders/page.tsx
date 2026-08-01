"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Receipt,
    Plus,
    Trash2,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useState } from "react";
import ExportMenu from "@/components/ExportMenu";
import { purchaseOrderColumns } from "@/lib/export-columns";

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

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const pos = useQuery(api.purchaseOrders.list) ?? [];
    const settings = useQuery(api.settings.get);
    const deletePo = useMutation(api.purchaseOrders.remove);

    const [filter, setFilter] = useState("all");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const filtered = filter === "all" ? pos : pos.filter((p: any) => p.status === filter);

    const totalValue   = pos.reduce((s: number, p: any) => s + p.amount, 0);
    const totalBilled  = pos.reduce((s: number, p: any) => s + p.billedAmount, 0);
    const totalRemain  = totalValue - totalBilled;

    const handleDelete = async (id: Id<"purchaseOrders">) => {
        await deletePo({ id });
        setConfirmDeleteId(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Purchase Orders</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{pos.length} order{pos.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportMenu rows={filtered} columns={purchaseOrderColumns} filename="purchase-orders" sheetName="Purchase Orders" currency={settings?.currency} />
                    <Link
                        href="/dashboard/purchase-orders/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/20"
                    >
                        <Plus size={16} />
                        New PO
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Total PO Value",  value: formatCurrency(totalValue),  color: "text-zinc-900" },
                    { label: "Total Billed",     value: formatCurrency(totalBilled), color: "text-emerald-600" },
                    { label: "Remaining",        value: formatCurrency(totalRemain), color: totalRemain > 0 ? "text-amber-600" : "text-zinc-400" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
                {["all", "received", "active", "fully_billed", "closed"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                            filter === s
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                        )}
                    >
                        {s === "all" ? "All" : STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* Table */}
            {pos === undefined ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={28} /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-16 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <Receipt size={26} />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-zinc-700">No purchase orders yet</p>
                        <p className="text-sm text-zinc-400 mt-1">Create your first PO to start tracking client orders.</p>
                    </div>
                    <Link href="/dashboard/purchase-orders/new" className="mt-2 flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors">
                        <Plus size={15} /> New PO
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-100">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">PO Number</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Project</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Billed</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filtered.map((po: any) => (
                                <tr key={po._id} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-bold text-sm text-zinc-900 font-mono">{po.poNumber}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {new Date(po.receivedAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-zinc-700">{po.client?.name ?? "—"}</td>
                                    <td className="px-5 py-3.5 text-sm text-zinc-500 hidden md:table-cell">
                                        {po.project?.title ?? <span className="text-zinc-300 italic">Not linked</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-sm text-zinc-900">
                                        {formatCurrency(po.amount)}
                                    </td>
                                    <td className="px-5 py-3.5 hidden lg:table-cell">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", po.billedPercent >= 100 ? "bg-emerald-500" : "bg-sky-500")}
                                                    style={{ width: `${po.billedPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-400 w-8 text-right">{Math.round(po.billedPercent)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", STATUS_STYLES[po.status] ?? "bg-zinc-100 text-zinc-500")}>
                                            {STATUS_LABELS[po.status] ?? po.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            {confirmDeleteId === po._id ? (
                                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                                                    <span className="text-xs text-red-700 font-medium">Delete?</span>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-500 hover:text-zinc-700">Cancel</button>
                                                    <button onClick={() => handleDelete(po._id)} className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg">Delete</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(po._id); }}
                                                        className="p-1.5 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/dashboard/purchase-orders/${po._id}`)}
                                                        className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
