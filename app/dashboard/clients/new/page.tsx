"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewClientPage() {
    const router = useRouter();
    const createClient = useMutation(api.clients.create);
    const [form, setForm] = useState({ name: "", email: "", type: "individual", phone: "", website: "", street: "", postcode: "", city: "" });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const id = await createClient({ name: form.name, email: form.email, type: form.type, phone: form.phone || undefined, website: form.website || undefined, street: form.street || undefined, postcode: form.postcode || undefined, city: form.city || undefined });
        router.push(`/dashboard/clients/${id}`);
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/clients" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500"><ArrowLeft size={18} /></Link>
                <h1 className="text-2xl font-bold text-zinc-900">New Client</h1>
            </div>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Name *</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email *</label><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
                <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Type</label><select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}><option value="individual">Individual</option><option value="business">Business</option></select></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone</label><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Website</label><input className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Street</label><input className={inputCls} value={form.street} onChange={(e) => set("street", e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-zinc-600 mb-1.5">City</label><input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-xs font-semibold text-zinc-600 mb-1.5">Postcode</label><input className={inputCls} value={form.postcode} onChange={(e) => set("postcode", e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/dashboard/clients" className="px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-xl">Cancel</Link>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"><Save size={16} />{saving ? "Saving…" : "Create Client"}</button>
                </div>
            </form>
        </div>
    );
}
