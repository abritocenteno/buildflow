"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const TRADES = ["electrical", "plumbing", "hvac", "carpentry", "masonry", "roofing", "painting", "tiling", "other"];

export default function NewSubcontractorPage() {
    const router = useRouter();
    const create = useMutation(api.subcontractors.create);
    const [form, setForm] = useState({ name: "", trade: "electrical", email: "", phone: "", street: "", city: "", postcode: "", licenseNumber: "", notes: "" });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const id = await create({ name: form.name, trade: form.trade, email: form.email, phone: form.phone || undefined, street: form.street || undefined, city: form.city || undefined, postcode: form.postcode || undefined, licenseNumber: form.licenseNumber || undefined, notes: form.notes || undefined });
        router.push(`/dashboard/subcontractors/${id}`);
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/subcontractors" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500"><ArrowLeft size={18} /></Link>
                <h1 className="text-2xl font-bold text-zinc-900">New Subcontractor</h1>
            </div>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Company / Person Name *</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Trade *</label><select className={inputCls} value={form.trade} onChange={(e) => set("trade", e.target.value)}>{TRADES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email *</label><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone</label><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">License No.</label><input className={inputCls} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">City</label><input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Postcode</label><input className={inputCls} value={form.postcode} onChange={(e) => set("postcode", e.target.value)} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Notes</label><textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/subcontractors" className="px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-xl">Cancel</Link>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"><Save size={16} />{saving ? "Saving…" : "Create"}</button>
                </div>
            </form>
        </div>
    );
}
