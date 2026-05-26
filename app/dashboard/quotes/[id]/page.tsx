"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Send, CheckCircle, XCircle, FolderKanban, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    sent: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    converted: "bg-purple-100 text-purple-700",
};

const CATEGORY_COLORS: Record<string, string> = {
    labor: "bg-blue-50 text-blue-700",
    materials: "bg-emerald-50 text-emerald-700",
    subcontractor: "bg-amber-50 text-amber-700",
    other: "bg-zinc-100 text-zinc-600",
};

export default function QuoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const quote = useQuery(api.quotes.get, { id: id as Id<"quotes"> });
    const updateQuote = useMutation(api.quotes.update);
    const deleteQuote = useMutation(api.quotes.remove);
    const convertToProject = useMutation(api.quotes.convertToProject);

    const [showConvert, setShowConvert] = useState(false);
    const [convertForm, setConvertForm] = useState({ title: "", siteAddress: "", startDate: "", endDate: "" });
    const [saving, setSaving] = useState(false);

    if (quote === undefined) {
        return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" /></div>;
    }
    if (quote === null) {
        return <div className="text-center py-24 text-zinc-500">Quote not found</div>;
    }

    const items = quote.items ?? [];
    const subtotal = items.reduce((sum: number, item: any) => {
        const line = item.quantity * item.unitPrice;
        const markup = item.markup ? line * (item.markup / 100) : 0;
        return sum + line + markup;
    }, 0);
    const tax = quote.taxRate ? subtotal * (quote.taxRate / 100) : 0;
    const total = subtotal + tax;

    const handleConvert = async () => {
        if (!convertForm.title) return;
        setSaving(true);
        try {
            const projectId = await convertToProject({
                id: id as Id<"quotes">,
                title: convertForm.title,
                siteAddress: convertForm.siteAddress || undefined,
                startDate: convertForm.startDate ? new Date(convertForm.startDate).getTime() : undefined,
                endDate: convertForm.endDate ? new Date(convertForm.endDate).getTime() : undefined,
            });
            router.push(`/dashboard/projects/${projectId}`);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Link href="/dashboard/quotes" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-all mt-0.5">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-zinc-900 font-mono">{quote.quoteNumber}</h1>
                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[quote.status] ?? "bg-zinc-100 text-zinc-500")}>
                                {quote.status}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">{quote.client?.name} · {formatDate(quote.date)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {quote.status === "draft" && (
                        <button
                            onClick={() => updateQuote({ id: id as Id<"quotes">, status: "sent", sentAt: Date.now() })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <Send size={14} /> Send
                        </button>
                    )}
                    {["draft", "sent"].includes(quote.status) && (
                        <>
                            <button
                                onClick={() => updateQuote({ id: id as Id<"quotes">, status: "approved", approvedAt: Date.now() })}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                <CheckCircle size={14} /> Approve
                            </button>
                            <button
                                onClick={() => updateQuote({ id: id as Id<"quotes">, status: "rejected" })}
                                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl text-sm font-medium transition-colors"
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        </>
                    )}
                    {quote.status === "approved" && !quote.convertedToProjectId && (
                        <button
                            onClick={() => { setConvertForm({ title: quote.client?.name ? `${quote.client.name} Project` : "", siteAddress: "", startDate: "", endDate: "" }); setShowConvert(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <FolderKanban size={14} /> Convert to Project
                        </button>
                    )}
                    {quote.convertedToProjectId && (
                        <Link
                            href={`/dashboard/projects/${quote.convertedToProjectId}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-medium transition-colors"
                        >
                            <FolderKanban size={14} /> View Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Convert to Project modal */}
            {showConvert && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
                    <h3 className="font-semibold text-zinc-900 text-sm">Convert to Project</h3>
                    <input className={inputCls} placeholder="Project title" value={convertForm.title} onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })} />
                    <input className={inputCls} placeholder="Site address (optional)" value={convertForm.siteAddress} onChange={(e) => setConvertForm({ ...convertForm, siteAddress: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className={inputCls} value={convertForm.startDate} onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })} />
                        <input type="date" className={inputCls} value={convertForm.endDate} onChange={(e) => setConvertForm({ ...convertForm, endDate: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleConvert} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                            {saving ? "Creating…" : "Create Project"}
                        </button>
                        <button onClick={() => setShowConvert(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                    </div>
                </div>
            )}

            {/* Quote body */}
            <div className="bg-white rounded-2xl border border-zinc-200">
                <div className="p-6 border-b border-zinc-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Client</p>
                            <p className="font-semibold text-zinc-900">{quote.client?.name}</p>
                            <p className="text-sm text-zinc-500">{quote.client?.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Valid Until</p>
                            <p className="font-semibold text-zinc-900">{quote.expiryDate ? formatDate(quote.expiryDate) : "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Line items */}
                <div className="p-6 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-700">Line Items</h3>
                    {items.length === 0 && <p className="text-sm text-zinc-400">No line items</p>}
                    {items.map((item: any, i: number) => {
                        const line = item.quantity * item.unitPrice;
                        const markup = item.markup ? line * (item.markup / 100) : 0;
                        const lineTotal = line + markup;
                        return (
                            <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-50">
                                <div className="flex items-start gap-3">
                                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-0.5", CATEGORY_COLORS[item.category] ?? "bg-zinc-100 text-zinc-500")}>
                                        {item.category}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">{item.description}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {item.quantity} × {formatCurrency(item.unitPrice)}
                                            {item.markup ? ` + ${item.markup}% markup` : ""}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">{formatCurrency(lineTotal)}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Totals */}
                <div className="px-6 pb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {quote.taxRate && (
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Tax ({quote.taxRate}%)</span>
                            <span className="font-medium">{formatCurrency(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-zinc-100 pt-3 mt-2">
                        <span>Total</span>
                        <span className="text-orange-600">{formatCurrency(total)}</span>
                    </div>
                </div>

                {quote.notes && (
                    <div className="px-6 pb-6">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{quote.notes}</p>
                    </div>
                )}
            </div>

            {quote.internalNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Internal Notes</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{quote.internalNotes}</p>
                </div>
            )}
        </div>
    );
}
