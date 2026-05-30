"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Package, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

const UNITS = ["pcs", "m", "m²", "m³", "kg", "t", "L", "bag", "roll", "sheet", "box"];
const CATEGORIES = ["Concrete & Masonry", "Steel & Metalwork", "Timber & Wood", "Electrical", "Plumbing", "Insulation", "Roofing", "Finishing", "Tools", "Safety", "Other"];

export default function NewMaterialPage() {
    const router = useRouter();
    const projects = useQuery(api.projects.list) ?? [];
    const createMaterial = useMutation(api.materials.create);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "", description: "", sku: "",
        category: "", quantity: "1", unit: "pcs",
        unitCost: "", reorderThreshold: "", supplier: "",
        projectId: "" as Id<"projects"> | "",
    });

    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createMaterial({
                name: form.name,
                description: form.description || undefined,
                sku: form.sku || undefined,
                category: form.category || undefined,
                quantity: parseFloat(form.quantity) || 0,
                unit: form.unit || undefined,
                unitCost: form.unitCost ? parseFloat(form.unitCost) : undefined,
                reorderThreshold: form.reorderThreshold ? parseFloat(form.reorderThreshold) : undefined,
                supplier: form.supplier || undefined,
                projectId: form.projectId ? (form.projectId as Id<"projects">) : undefined,
            });
            router.push("/dashboard/materials");
        } catch (err) {
            console.error(err);
            alert("Failed to add material.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Materials
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                        <Package size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Add Material</h1>
                        <p className="text-sm text-zinc-500">Add a new item to your materials inventory</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item Details</h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Name *</label>
                        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                            placeholder="e.g. Concrete blocks 20x20x40cm"
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Description</label>
                        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                            placeholder="Additional details…" rows={2}
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Category</label>
                            <div className="relative">
                                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                                    className="w-full px-4 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none">
                                    <option value="">No category</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">SKU / Code</label>
                            <input value={form.sku} onChange={(e) => set("sku", e.target.value)}
                                placeholder="e.g. CBL-20-40"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Supplier</label>
                        <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)}
                            placeholder="e.g. ABC Building Supplies"
                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Project (optional)</label>
                        <div className="relative">
                            <select value={form.projectId} onChange={(e) => set("projectId", e.target.value)}
                                className="w-full px-4 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none">
                                <option value="">No project</option>
                                {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock & Pricing</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Quantity *</label>
                            <input type="number" min="0" step="0.01" required value={form.quantity}
                                onChange={(e) => set("quantity", e.target.value)}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Unit</label>
                            <div className="relative">
                                <select value={form.unit} onChange={(e) => set("unit", e.target.value)}
                                    className="w-full px-4 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none">
                                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Unit Cost</label>
                            <input type="number" min="0" step="0.01" value={form.unitCost}
                                onChange={(e) => set("unitCost", e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Reorder Threshold</label>
                            <input type="number" min="0" step="0.01" value={form.reorderThreshold}
                                onChange={(e) => set("reorderThreshold", e.target.value)}
                                placeholder="e.g. 50"
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
                        {isSubmitting ? "Saving…" : "Add Material"}
                    </button>
                </div>
            </form>
        </div>
    );
}
