"use client";

import { use, Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft, Package, Loader2, AlertCircle, AlertTriangle,
    Pencil, Trash2, X, CheckCircle2, FolderKanban, ChevronDown,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const UNITS = ["pcs", "m", "m²", "m³", "kg", "t", "L", "bag", "roll", "sheet", "box"];
const CATEGORIES = ["Concrete & Masonry", "Steel & Metalwork", "Timber & Wood", "Electrical", "Plumbing", "Insulation", "Roofing", "Finishing", "Tools", "Safety", "Other"];

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all";

function MaterialDetail({ id }: { id: Id<"materials"> }) {
    const router = useRouter();
    const material = useQuery(api.materials.get, { id });
    const settings = useQuery(api.settings.get);
    const projects = useQuery(api.projects.list) ?? [];
    const updateMaterial = useMutation(api.materials.update);
    const removeMaterial = useMutation(api.materials.remove);

    const [showEdit, setShowEdit] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [adjustQty, setAdjustQty] = useState("");
    const [adjustMode, setAdjustMode] = useState<"set" | "add" | "sub">("add");
    const [editForm, setEditForm] = useState<any>(null);

    const openEdit = () => {
        if (!material) return;
        setEditForm({
            name: material.name,
            description: (material as any).description ?? "",
            sku: (material as any).sku ?? "",
            category: (material as any).category ?? "",
            quantity: String(material.quantity),
            unit: (material as any).unit ?? "pcs",
            unitCost: (material as any).unitCost ? String((material as any).unitCost) : "",
            reorderThreshold: (material as any).reorderThreshold ? String((material as any).reorderThreshold) : "",
            supplier: (material as any).supplier ?? "",
            projectId: (material as any).projectId ?? "",
        });
        setShowEdit(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateMaterial({
                id,
                name: editForm.name,
                description: editForm.description || undefined,
                sku: editForm.sku || undefined,
                category: editForm.category || undefined,
                quantity: parseFloat(editForm.quantity) || 0,
                unit: editForm.unit || undefined,
                unitCost: editForm.unitCost ? parseFloat(editForm.unitCost) : undefined,
                reorderThreshold: editForm.reorderThreshold ? parseFloat(editForm.reorderThreshold) : undefined,
                supplier: editForm.supplier || undefined,
                projectId: editForm.projectId ? (editForm.projectId as Id<"projects">) : undefined,
            });
            setShowEdit(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdjust = async () => {
        if (!material || !adjustQty) return;
        const val = parseFloat(adjustQty);
        if (isNaN(val)) return;
        let newQty = val;
        if (adjustMode === "add") newQty = material.quantity + val;
        if (adjustMode === "sub") newQty = Math.max(0, material.quantity - val);
        await updateMaterial({ id, quantity: newQty });
        setAdjustQty("");
    };

    const handleDelete = async () => {
        if (!confirm("Delete this material? This cannot be undone.")) return;
        await removeMaterial({ id });
        router.push("/dashboard/materials");
    };

    if (material === undefined) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    if (material === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Material not found</h2>
            <button onClick={() => router.back()} className="text-sm text-sky-500 hover:underline">Go back</button>
        </div>
    );

    const m = material as any;
    const isLow = m.reorderThreshold && m.quantity <= m.reorderThreshold;
    const stockPct = m.reorderThreshold && m.reorderThreshold > 0
        ? Math.min(100, (m.quantity / (m.reorderThreshold * 2)) * 100)
        : 100;
    const linkedProject = m.projectId ? projects.find((p: any) => p._id === m.projectId) : null;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Materials
                </button>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <Package size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">{m.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {m.category && <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{m.category}</span>}
                                {m.sku && <span className="text-xs font-mono text-zinc-400">{m.sku}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={openEdit} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
                            <Pencil size={14} /> Edit
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </header>

            {isLow && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">Stock below reorder threshold ({m.reorderThreshold} {m.unit ?? "pcs"})</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stock Level</h2>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-zinc-900">{m.quantity}</span>
                        <span className="text-lg font-medium text-zinc-400 mb-1">{m.unit ?? "pcs"}</span>
                    </div>
                    {m.reorderThreshold && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Reorder at {m.reorderThreshold} {m.unit ?? "pcs"}</span>
                                <span className={cn(isLow ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold")}>
                                    {isLow ? "Low stock" : "In stock"}
                                </span>
                            </div>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div className={cn("h-2 rounded-full transition-all", isLow ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${stockPct}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-zinc-100 space-y-2">
                        <p className="text-xs font-medium text-zinc-400">Adjust Quantity</p>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as any)}
                                    className="px-3 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                                    <option value="add">Add</option>
                                    <option value="sub">Remove</option>
                                    <option value="set">Set to</option>
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                            <input type="number" min="0" step="0.01" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                                placeholder="0" className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                            <button onClick={handleAdjust} disabled={!adjustQty}
                                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors disabled:opacity-40">
                                Update
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pricing</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">Unit Cost</p>
                            <p className="text-3xl font-black text-zinc-900">
                                {m.unitCost ? formatCurrency(m.unitCost, settings?.currency) : <span className="text-zinc-300 font-light text-xl">Not set</span>}
                            </p>
                        </div>
                        {m.unitCost && (
                            <div>
                                <p className="text-xs text-zinc-400 mb-1">Total Value (stock × cost)</p>
                                <p className="text-xl font-bold text-zinc-700">{formatCurrency(m.unitCost * m.quantity, settings?.currency)}</p>
                            </div>
                        )}
                        {m.supplier && (
                            <div className="pt-3 border-t border-zinc-100">
                                <p className="text-xs text-zinc-400 mb-1">Supplier</p>
                                <p className="text-sm font-semibold text-zinc-700">{m.supplier}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(m.description || linkedProject) && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Details</h2>
                    {m.description && <p className="text-sm text-zinc-700 leading-relaxed">{m.description}</p>}
                    {linkedProject && (
                        <div>
                            <p className="text-xs text-zinc-400 mb-1.5">Linked Project</p>
                            <Link href={`/dashboard/projects/${linkedProject._id}`}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-sky-500 transition-colors">
                                <FolderKanban size={14} className="text-sky-400" />
                                {linkedProject.title}
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {showEdit && editForm && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-bold text-zinc-900">Edit Material</h3>
                                <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Name *</label>
                                    <input required value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Description</label>
                                    <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm((f: any) => ({ ...f, description: e.target.value }))} className={cn(inputCls, "resize-none")} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Category</label>
                                        <div className="relative">
                                            <select value={editForm.category} onChange={(e) => setEditForm((f: any) => ({ ...f, category: e.target.value }))} className={cn(inputCls, "appearance-none pr-8")}>
                                                <option value="">No category</option>
                                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">SKU</label>
                                        <input value={editForm.sku} onChange={(e) => setEditForm((f: any) => ({ ...f, sku: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Quantity *</label>
                                        <input type="number" min="0" step="0.01" required value={editForm.quantity} onChange={(e) => setEditForm((f: any) => ({ ...f, quantity: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Unit</label>
                                        <div className="relative">
                                            <select value={editForm.unit} onChange={(e) => setEditForm((f: any) => ({ ...f, unit: e.target.value }))} className={cn(inputCls, "appearance-none pr-8")}>
                                                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Unit Cost</label>
                                        <input type="number" min="0" step="0.01" value={editForm.unitCost} onChange={(e) => setEditForm((f: any) => ({ ...f, unitCost: e.target.value }))} className={inputCls} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Reorder Threshold</label>
                                        <input type="number" min="0" step="0.01" value={editForm.reorderThreshold} onChange={(e) => setEditForm((f: any) => ({ ...f, reorderThreshold: e.target.value }))} className={inputCls} placeholder="e.g. 50" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Supplier</label>
                                    <input value={editForm.supplier} onChange={(e) => setEditForm((f: any) => ({ ...f, supplier: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Project (optional)</label>
                                    <div className="relative">
                                        <select value={editForm.projectId} onChange={(e) => setEditForm((f: any) => ({ ...f, projectId: e.target.value }))} className={cn(inputCls, "appearance-none pr-8")}>
                                            <option value="">No project</option>
                                            {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                                        </select>
                                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setShowEdit(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                        {isSaving ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <MaterialDetail id={id as Id<"materials">} />
        </Suspense>
    );
}
