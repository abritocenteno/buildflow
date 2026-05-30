"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft, ShoppingBag, Loader2, CheckCircle2, ChevronDown,
    Plus, Trash2, Truck, FolderKanban,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";

function NewOrderForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSupplierId = searchParams.get("supplierId") as Id<"suppliers"> | null;

    const suppliers = useQuery(api.suppliers.list) ?? [];
    const projects = useQuery(api.projects.list) ?? [];
    const settings = useQuery(api.settings.get);
    const createOrder = useMutation(api.orders.create);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        supplierId: (initialSupplierId || "") as Id<"suppliers"> | "",
        projectId: "" as Id<"projects"> | "",
        date: new Date().toISOString().split("T")[0],
        items: [] as { name: string; description: string; remark: string; amount: number; unitPrice: number }[],
    });

    const sym = getCurrencySymbol(settings?.currency);
    const total = form.items.reduce((s, i) => s + i.amount * i.unitPrice, 0);

    const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { name: "", description: "", remark: "", amount: 1, unitPrice: 0 }] }));
    const removeItem = (i: number) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
    const updateItem = (i: number, k: string, v: string | number) => setForm((p) => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.supplierId) { alert("Please select a supplier"); return; }
        setIsSubmitting(true);
        try {
            const id = await createOrder({
                supplierId: form.supplierId as Id<"suppliers">,
                projectId: form.projectId ? (form.projectId as Id<"projects">) : undefined,
                date: new Date(form.date).getTime(),
                amount: total,
                items: form.items,
            });
            router.push(`/dashboard/orders/${id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create order.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Orders
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">New Purchase Order</h1>
                        <p className="text-sm text-zinc-500">Create a new order from a supplier</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Supplier *</label>
                            <div className="relative">
                                <Truck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select required value={form.supplierId}
                                    onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value as Id<"suppliers"> }))}
                                    className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none">
                                    <option value="" disabled>Select supplier…</option>
                                    {suppliers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Project (optional)</label>
                            <div className="relative">
                                <FolderKanban size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select value={form.projectId}
                                    onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value as Id<"projects"> }))}
                                    className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none">
                                    <option value="">No project</option>
                                    {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Order Date *</label>
                            <input type="date" required value={form.date}
                                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Line Items</h2>
                        <button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors">
                            <Plus size={13} /> Add Item
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[30%]">Item</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[28%]">Description</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[12%]">Remark</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[8%]">Qty</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[12%]">Unit Price</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%]">Total</th>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {form.items.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-zinc-400">No items yet — click "Add Item"</td></tr>
                                )}
                                {form.items.map((item, i) => (
                                    <tr key={i} className="group hover:bg-zinc-50/50">
                                        <td className="px-6 py-3">
                                            <input required placeholder="e.g. Concrete blocks" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)}
                                                className="w-full bg-transparent text-sm font-medium placeholder:text-zinc-300 focus:outline-none" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input placeholder="Detail…" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                                                className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input placeholder="Note…" value={item.remark} onChange={(e) => updateItem(i, "remark", e.target.value)}
                                                className="w-full bg-transparent text-xs text-zinc-400 italic placeholder:text-zinc-200 focus:outline-none" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="number" min="1" value={item.amount} onChange={(e) => updateItem(i, "amount", parseInt(e.target.value) || 1)}
                                                className="w-14 mx-auto block bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-center py-1 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-xs text-zinc-400">{sym}</span>
                                                <input type="number" step="0.01" min="0" value={item.unitPrice || ""} placeholder="0.00" onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                                                    className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-right py-1 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-zinc-900">{formatCurrency(item.amount * item.unitPrice, settings?.currency)}</span>
                                        </td>
                                        <td className="px-2 py-3">
                                            <button type="button" onClick={() => removeItem(i)} className="p-1 text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {form.items.length > 0 && (
                                <tfoot className="border-t border-zinc-100">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</td>
                                        <td className="px-4 py-3 text-right text-lg font-black text-zinc-900">{formatCurrency(total, settings?.currency)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/20 disabled:opacity-50">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isSubmitting ? "Creating…" : "Create Order"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <NewOrderForm />
        </Suspense>
    );
}
