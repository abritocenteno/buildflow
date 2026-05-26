"use client";

import { use, Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft, ShoppingBag, Loader2, AlertCircle, CheckCircle2,
    Truck, FolderKanban, ChevronDown, Trash2, ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_OPTS = ["pending", "paid", "cancelled"] as const;
const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    cancelled: "bg-zinc-100 text-zinc-500",
};

function OrderDetail({ id }: { id: Id<"orders"> }) {
    const router = useRouter();
    const order = useQuery(api.orders.get, { id });
    const settings = useQuery(api.settings.get);
    const updateOrder = useMutation(api.orders.update);
    const removeOrder = useMutation(api.orders.remove);

    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (status: string) => {
        setIsUpdating(true);
        try { await updateOrder({ id, status }); }
        finally { setIsUpdating(false); setShowStatusMenu(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this order? This cannot be undone.")) return;
        await removeOrder({ id });
        router.push("/dashboard/orders");
    };

    if (order === undefined) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    if (order === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Order not found</h2>
            <button onClick={() => router.back()} className="text-sm text-orange-500 hover:underline">Go back</button>
        </div>
    );

    const items = (order as any).items ?? [];
    const supplier = (order as any).supplier;
    const project = (order as any).project;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Orders
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">{order.orderNumber}</h1>
                            <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", STATUS_BADGE[order.status] ?? "bg-zinc-100 text-zinc-500")}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button onClick={() => setShowStatusMenu((v) => !v)} disabled={isUpdating}
                                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50">
                                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Status
                                <ChevronDown size={13} className={cn("transition-transform", showStatusMenu && "rotate-180")} />
                            </button>
                            {showStatusMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 z-20 w-44 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                                        {STATUS_OPTS.map((s) => (
                                            <button key={s} onClick={() => handleStatusChange(s)}
                                                className={cn("w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors capitalize flex items-center gap-2",
                                                    order.status === s && "text-orange-500 bg-orange-50/50")}>
                                                {order.status === s && <CheckCircle2 size={13} />}
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={handleDelete} className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Order info */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Order #</p>
                        <p className="text-sm font-bold text-zinc-900">{order.orderNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-bold text-zinc-900">{formatDate(order.date)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Supplier</p>
                        {supplier ? (
                            <Link href={`/dashboard/suppliers/${supplier._id}`} className="text-sm font-bold text-orange-500 hover:underline flex items-center gap-1">
                                <Truck size={13} />{supplier.name}
                            </Link>
                        ) : <p className="text-sm text-zinc-400">—</p>}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-lg font-black text-zinc-900">{formatCurrency(order.amount, settings?.currency)}</p>
                    </div>
                </div>
                {project && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Project</p>
                        <Link href={`/dashboard/projects/${project._id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-orange-500 transition-colors">
                            <FolderKanban size={14} className="text-orange-400" />
                            {project.title}
                            <ChevronRight size={13} className="text-zinc-300" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Line items */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Line Items</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[45%]">Item</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%]">Qty</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[22%]">Unit Price</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[23%]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">No line items</td></tr>
                        )}
                        {items.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-zinc-50/50">
                                <td className="px-6 py-3">
                                    <p className="font-semibold text-zinc-900">{item.name}</p>
                                    {item.description && <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>}
                                    {item.remark && <p className="text-xs text-zinc-400 italic mt-0.5">{item.remark}</p>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded-lg">{item.amount}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-zinc-700">{formatCurrency(item.unitPrice, settings?.currency)}</td>
                                <td className="px-6 py-3 text-right font-bold text-zinc-900">{formatCurrency(item.amount * item.unitPrice, settings?.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                    {items.length > 0 && (
                        <tfoot className="border-t border-zinc-100 bg-zinc-50/50">
                            <tr>
                                <td colSpan={3} className="px-6 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</td>
                                <td className="px-6 py-3 text-right text-xl font-black text-zinc-900">{formatCurrency(order.amount, settings?.currency)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <OrderDetail id={id as Id<"orders">} />
        </Suspense>
    );
}
