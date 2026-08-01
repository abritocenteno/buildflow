"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, ChevronRight, FileText } from "lucide-react";
import ExportMenu from "@/components/ExportMenu";
import { quoteColumns } from "@/lib/export-columns";

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    sent: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    converted: "bg-purple-100 text-purple-700",
};

export default function QuotesPage() {
    const quotes = useQuery(api.quotes.list) ?? [];
    const settings = useQuery(api.settings.get);

    const totalValue = quotes.reduce((sum: number, q: any) => {
        const items = q.items ?? [];
        return sum + items.reduce((s: number, item: any) => {
            const line = item.quantity * item.unitPrice;
            const markup = item.markup ? line * (item.markup / 100) : 0;
            return s + line + markup;
        }, 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Quotes</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{quotes.length} quotes · {formatCurrency(totalValue)} total value</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportMenu rows={quotes} columns={quoteColumns} filename="quotes" sheetName="Quotes" currency={settings?.currency} />
                    <Link
                        href="/dashboard/quotes/new"
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        New Quote
                    </Link>
                </div>
            </div>

            {/* Status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {["draft", "sent", "approved", "rejected", "converted"].map((status) => {
                    const count = quotes.filter((q: any) => q.status === status).length;
                    return (
                        <div key={status} className="bg-white rounded-xl border border-zinc-200 p-4">
                            <p className="text-xs text-zinc-500 capitalize mb-1">{status}</p>
                            <p className="text-2xl font-bold text-zinc-900">{count}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quote #</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Expiry</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Value</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {quotes.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText size={32} className="text-zinc-300" />
                                        <p className="text-sm text-zinc-400">No quotes yet. Create your first one.</p>
                                        <Link href="/dashboard/quotes/new" className="text-sm text-sky-500 font-medium hover:text-sky-600">Create quote →</Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {quotes.map((quote: any) => {
                            const items = quote.items ?? [];
                            const subtotal = items.reduce((s: number, item: any) => {
                                const line = item.quantity * item.unitPrice;
                                const markup = item.markup ? line * (item.markup / 100) : 0;
                                return s + line + markup;
                            }, 0);
                            const tax = quote.taxRate ? subtotal * (quote.taxRate / 100) : 0;
                            const total = subtotal + tax;

                            return (
                                <tr key={quote._id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-semibold text-zinc-900">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 text-zinc-600 hidden sm:table-cell">{quote.client?.name}</td>
                                    <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">{formatDate(quote.date)}</td>
                                    <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">
                                        {quote.expiryDate ? formatDate(quote.expiryDate) : "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[quote.status] ?? "bg-zinc-100 text-zinc-500")}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-zinc-900">{formatCurrency(total)}</td>
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/quotes/${quote._id}`} className="text-zinc-400 hover:text-sky-500">
                                            <ChevronRight size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
