"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/utils";

type LineItem = {
    category: string;
    description: string;
    quantity: number;
    unitPrice: number;
    markup: number;
};

const CATEGORIES = ["labor", "materials", "subcontractor", "other"];

export default function NewQuotePage() {
    const router = useRouter();
    const clients = useQuery(api.clients.list) ?? [];
    const settings = useQuery(api.settings.get);
    const createQuote = useMutation(api.quotes.create);

    const [form, setForm] = useState({
        clientId: "",
        date: new Date().toISOString().split("T")[0],
        expiryDate: "",
        notes: "",
        internalNotes: "",
        taxRate: settings?.defaultTaxRate?.toString() ?? "0",
    });

    const [items, setItems] = useState<LineItem[]>([
        { category: "labor", description: "", quantity: 1, unitPrice: 0, markup: 0 },
    ]);
    const [saving, setSaving] = useState(false);

    const addItem = () => setItems([...items, { category: "materials", description: "", quantity: 1, unitPrice: 0, markup: 0 }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof LineItem, value: string | number) =>
        setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    const subtotal = items.reduce((sum, item) => {
        const line = item.quantity * item.unitPrice;
        const markup = item.markup ? line * (item.markup / 100) : 0;
        return sum + line + markup;
    }, 0);
    const taxRate = parseFloat(form.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId) return;
        setSaving(true);
        try {
            const id = await createQuote({
                clientId: form.clientId as Id<"clients">,
                date: new Date(form.date).getTime(),
                expiryDate: form.expiryDate ? new Date(form.expiryDate).getTime() : undefined,
                items: items.map((item) => ({
                    category: item.category,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    markup: item.markup || undefined,
                })),
                taxRate: taxRate || undefined,
                notes: form.notes || undefined,
                internalNotes: form.internalNotes || undefined,
            });
            router.push(`/dashboard/quotes/${id}`);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all";
    const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/quotes" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">New Quote</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Build a cost estimate for your client</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-zinc-900">Quote Details</h2>
                    <div>
                        <label className={labelCls}>Client *</label>
                        <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                            <option value="">Select a client…</option>
                            {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Date</label>
                            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelCls}>Expiry Date</label>
                            <input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-sm text-zinc-900">Line Items</h2>
                        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-sky-500 hover:text-sky-600 font-medium">
                            <Plus size={14} /> Add Item
                        </button>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
                        <div className="col-span-2">Category</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-1">Qty</div>
                        <div className="col-span-2">Unit Price</div>
                        <div className="col-span-2">Markup %</div>
                        <div className="col-span-1" />
                    </div>

                    {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2">
                                <select className={inputCls} value={item.category} onChange={(e) => updateItem(i, "category", e.target.value)}>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="col-span-4">
                                <input className={inputCls} placeholder="Description…" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                            </div>
                            <div className="col-span-1">
                                <input type="number" min={0} className={inputCls} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-2">
                                <input type="number" min={0} step="0.01" className={inputCls} placeholder="0.00" value={item.unitPrice || ""} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-2">
                                <input type="number" min={0} step="0.1" className={inputCls} placeholder="0" value={item.markup || ""} onChange={(e) => updateItem(i, "markup", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Totals */}
                    <div className="border-t border-zinc-100 pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="font-medium text-zinc-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">VAT / Tax</span>
                                <input type="number" min={0} max={100} className="w-16 px-2 py-1 text-xs rounded-lg border border-zinc-200 focus:outline-none" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                                <span className="text-zinc-400 text-xs">%</span>
                            </div>
                            <span className="font-medium text-zinc-900">{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex items-center justify-between text-base font-bold border-t border-zinc-100 pt-2 mt-2">
                            <span className="text-zinc-900">Total</span>
                            <span className="text-sky-600">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <div>
                        <label className={labelCls}>Notes for Client</label>
                        <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Scope clarifications, payment terms, validity period…" />
                    </div>
                    <div>
                        <label className={labelCls}>Internal Notes</label>
                        <textarea className={inputCls} rows={2} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} placeholder="Private notes not shown on the quote…" />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/quotes" className="px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">Cancel</Link>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Save size={16} />
                        {saving ? "Creating…" : "Create Quote"}
                    </button>
                </div>
            </form>
        </div>
    );
}
