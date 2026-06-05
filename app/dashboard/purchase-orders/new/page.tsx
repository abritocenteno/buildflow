"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Save, Hash, Receipt } from "lucide-react";

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-zinc-50";
const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";

export default function NewPurchaseOrderPage() {
    const router = useRouter();
    const clients = useQuery(api.clients.list) ?? [];
    const allProjects = useQuery(api.projects.list) ?? [];
    const createPo = useMutation(api.purchaseOrders.create);

    const [form, setForm] = useState({
        clientId: "",
        projectId: "",
        poNumber: "",
        description: "",
        amount: "",
        receivedAt: new Date().toISOString().split("T")[0],
        expiresAt: "",
        notes: "",
        internalNotes: "",
    });
    const [saving, setSaving] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    // Filter projects by selected client
    const clientProjects = allProjects.filter((p: any) => p.clientId === form.clientId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.amount) return;
        setSaving(true);
        try {
            const id = await createPo({
                clientId: form.clientId as Id<"clients">,
                projectId: form.projectId ? form.projectId as Id<"projects"> : undefined,
                poNumber: form.poNumber || undefined,
                description: form.description || undefined,
                amount: parseFloat(form.amount),
                receivedAt: new Date(form.receivedAt).getTime(),
                expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
                notes: form.notes || undefined,
                internalNotes: form.internalNotes || undefined,
            });
            router.push(`/dashboard/purchase-orders/${id}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/purchase-orders" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">New Purchase Order</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Record a PO received from a client</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* PO Details */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
                        <Receipt size={15} className="text-sky-500" /> PO Details
                    </h2>

                    <div>
                        <label className={labelCls}>Client *</label>
                        <select
                            className={inputCls}
                            value={form.clientId}
                            onChange={(e) => { set("clientId", e.target.value); set("projectId", ""); }}
                            required
                        >
                            <option value="">Select a client…</option>
                            {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>PO Number</label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    className={inputCls + " pl-8"}
                                    value={form.poNumber}
                                    onChange={(e) => set("poNumber", e.target.value)}
                                    placeholder="Auto-generated if blank"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Amount *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                className={inputCls}
                                value={form.amount}
                                onChange={(e) => set("amount", e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Date Received *</label>
                            <input type="date" required className={inputCls} value={form.receivedAt} onChange={(e) => set("receivedAt", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Expiry Date</label>
                            <input type="date" className={inputCls} value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea
                            className={inputCls}
                            rows={3}
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Scope of work, job reference…"
                        />
                    </div>
                </div>

                {/* Link to Project */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <div>
                        <h2 className="font-semibold text-zinc-900 text-sm">Link to Project</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Optional — you can also link it later from the project.</p>
                    </div>
                    <div>
                        <label className={labelCls}>Project</label>
                        <select
                            className={inputCls}
                            value={form.projectId}
                            onChange={(e) => set("projectId", e.target.value)}
                            disabled={!form.clientId}
                        >
                            <option value="">{form.clientId ? "Select a project…" : "Select a client first"}</option>
                            {clientProjects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 text-sm">Notes</h2>
                    <div>
                        <label className={labelCls}>Client-facing Notes</label>
                        <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes about this PO…" />
                    </div>
                    <div>
                        <label className={labelCls}>Internal Notes</label>
                        <textarea className={inputCls + " bg-amber-50 border-amber-100"} rows={2} value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} placeholder="Private notes, not visible to the client…" />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/purchase-orders" className="px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Save size={16} />
                        {saving ? "Creating…" : "Create PO"}
                    </button>
                </div>
            </form>
        </div>
    );
}
