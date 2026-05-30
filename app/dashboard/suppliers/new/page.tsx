"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = ["regular", "distributor"] as const;

export default function NewSupplierPage() {
    const router = useRouter();
    const createSupplier = useMutation(api.suppliers.create);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", type: "regular" as string,
        phone: "", website: "", street: "", postcode: "", city: "",
    });

    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const id = await createSupplier({
                name: form.name, email: form.email, type: form.type,
                phone: form.phone || undefined, website: form.website || undefined,
                street: form.street || undefined, postcode: form.postcode || undefined,
                city: form.city || undefined,
            });
            router.push(`/dashboard/suppliers/${id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create supplier.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Suppliers
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Add Supplier</h1>
                        <p className="text-sm text-zinc-500">Create a new supplier record</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Company Info</h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Company Name *</label>
                        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                            placeholder="e.g. ABC Building Supplies"
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Email *</label>
                        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                            placeholder="orders@supplier.com"
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Phone</label>
                            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                                placeholder="+353 1 000 0000"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Website</label>
                            <input value={form.website} onChange={(e) => set("website", e.target.value)}
                                placeholder="https://supplier.com"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TYPES.map((t) => (
                                <button key={t} type="button" onClick={() => set("type", t)}
                                    className={cn("py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all",
                                        form.type === t ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300")}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Address</h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Street</label>
                        <input value={form.street} onChange={(e) => set("street", e.target.value)}
                            placeholder="Unit 4, Industrial Estate"
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Postcode</label>
                            <input value={form.postcode} onChange={(e) => set("postcode", e.target.value)}
                                placeholder="D01 F5P2"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">City</label>
                            <input value={form.city} onChange={(e) => set("city", e.target.value)}
                                placeholder="Dublin"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => router.back()}
                        className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/20 disabled:opacity-50">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isSubmitting ? "Saving…" : "Add Supplier"}
                    </button>
                </div>
            </form>
        </div>
    );
}
