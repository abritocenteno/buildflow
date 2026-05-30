"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, ChevronRight, ShoppingBag } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
    const orders = useQuery(api.orders.list) ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Purchase Orders</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{orders.length} orders</p>
                </div>
                <Link href="/dashboard/orders/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> New Order
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order #</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Supplier</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <ShoppingBag size={32} className="mx-auto text-zinc-300 mb-3" />
                                    <p className="text-sm text-zinc-400">No purchase orders yet</p>
                                </td>
                            </tr>
                        )}
                        {orders.map((order: any) => (
                            <tr key={order._id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-semibold text-zinc-900">{order.orderNumber}</td>
                                <td className="px-6 py-4 text-zinc-600 hidden sm:table-cell">{order.supplier?.name}</td>
                                <td className="px-6 py-4 text-zinc-500 text-xs hidden md:table-cell">{order.project?.title ?? "—"}</td>
                                <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">{formatDate(order.date)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[order.status] ?? "bg-zinc-100")}>{order.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-zinc-900">{formatCurrency(order.amount)}</td>
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/orders/${order._id}`} className="text-zinc-400 hover:text-sky-500">
                                        <ChevronRight size={18} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
