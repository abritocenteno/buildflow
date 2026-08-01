"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Plus, ChevronRight, FileText, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import ExportMenu from "@/components/ExportMenu";
import { InvoicePdfButton, BulkInvoicePdfMenu } from "@/components/InvoicePdfDownload";
import { invoiceColumns } from "@/lib/export-columns";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
    const invoices = useQuery(api.invoices.list) ?? [];
    const settings = useQuery(api.settings.get);
    const deleteInvoice = useMutation(api.invoices.remove);
    const [filter, setFilter] = useState("all");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        await deleteInvoice({ id: id as Id<"invoices"> });
        setConfirmDeleteId(null);
    }

    const filtered = filter === "all" ? invoices : invoices.filter((i: any) => i.status === filter);

    const totals = {
        paid: invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0),
        pending: invoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.amount, 0),
        overdue: invoices.filter((i: any) => i.status === "overdue").reduce((s: number, i: any) => s + i.amount, 0),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Invoices</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{invoices.length} invoices</p>
                </div>
                <div className="flex items-center gap-2">
                    <BulkInvoicePdfMenu invoices={filtered} settings={settings} />
                    <ExportMenu
                        rows={filtered}
                        columns={invoiceColumns}
                        filename="invoices"
                        sheetName="Invoices"
                        currency={settings?.currency}
                    />
                    <Link
                        href="/dashboard/invoices/new"
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        New Invoice
                    </Link>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Paid", value: totals.paid, color: "text-emerald-600" },
                    { label: "Pending", value: totals.pending, color: "text-amber-600" },
                    { label: "Overdue", value: totals.overdue, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-zinc-200 p-4">
                        <p className="text-xs text-zinc-500 mb-1">{label}</p>
                        <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {["all", "pending", "paid", "overdue"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize", filter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice #</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Due</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText size={32} className="text-zinc-300" />
                                        <p className="text-sm text-zinc-400">No invoices found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filtered.map((inv: any) => (
                            <tr key={inv._id} className="hover:bg-zinc-50 transition-colors group">
                                <td className="px-6 py-4 font-mono font-semibold text-zinc-900">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 text-zinc-600 hidden sm:table-cell">{inv.client?.name}</td>
                                <td className="px-6 py-4 text-zinc-500 text-xs hidden md:table-cell">{inv.project?.title ?? "—"}</td>
                                <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">{formatDate(inv.date)}</td>
                                <td className="px-6 py-4 text-zinc-500 hidden lg:table-cell">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[inv.status] ?? "bg-zinc-100 text-zinc-500")}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-zinc-900">{formatCurrency(inv.amount)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {confirmDeleteId === inv._id ? (
                                            <>
                                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
                                                <button onClick={() => handleDelete(inv._id)} className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors">Delete</button>
                                            </>
                                        ) : (
                                            <>
                                                <InvoicePdfButton invoice={inv} settings={settings} />
                                                <button
                                                    onClick={() => setConfirmDeleteId(inv._id)}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                                <Link href={`/dashboard/invoices/${inv._id}`} className="text-zinc-400 hover:text-sky-500">
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
