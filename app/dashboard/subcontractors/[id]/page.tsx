"use client";

import { use, Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft, HardHat, Loader2, AlertCircle, AlertTriangle,
    Mail, Phone, Globe, MapPin, FileText, Shield, FolderKanban,
    Pencil, Trash2, Plus, X, ChevronRight, User, CheckCircle2,
    Calendar,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const TRADES = ["electrical", "plumbing", "hvac", "carpentry", "masonry", "roofing", "painting", "tiling", "other"];

const TRADE_COLORS: Record<string, string> = {
    electrical: "bg-yellow-50 text-yellow-700 border-yellow-200",
    plumbing: "bg-blue-50 text-blue-700 border-blue-200",
    hvac: "bg-cyan-50 text-cyan-700 border-cyan-200",
    carpentry: "bg-amber-50 text-amber-700 border-amber-200",
    masonry: "bg-stone-100 text-stone-700 border-stone-200",
    roofing: "bg-slate-100 text-slate-700 border-slate-200",
    painting: "bg-purple-50 text-purple-700 border-purple-200",
    tiling: "bg-teal-50 text-teal-700 border-teal-200",
    other: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
    planning: "bg-blue-50 text-blue-700",
    active: "bg-emerald-50 text-emerald-700",
    "on-hold": "bg-amber-50 text-amber-700",
    completed: "bg-zinc-100 text-zinc-500",
};

function insuranceStatus(ts?: number): "ok" | "expiring" | "expired" | "none" {
    if (!ts) return "none";
    const now = Date.now();
    const diff = ts - now;
    if (diff < 0) return "expired";
    if (diff < 30 * 24 * 60 * 60 * 1000) return "expiring";
    return "ok";
}

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all";

function SubcontractorDetail({ id }: { id: Id<"subcontractors"> }) {
    const router = useRouter();
    const sub = useQuery(api.subcontractors.get, { id });
    const contacts = useQuery(api.contacts.listBySubcontractor, { subcontractorId: id }) ?? [];
    const projects = useQuery(api.projects.listBySubcontractor, { subcontractorId: id }) ?? [];

    const updateSub = useMutation(api.subcontractors.update);
    const removeSub = useMutation(api.subcontractors.remove);
    const createContact = useMutation(api.contacts.create);
    const updateContact = useMutation(api.contacts.update);
    const removeContact = useMutation(api.contacts.remove);

    const [showEdit, setShowEdit] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [editContact, setEditContact] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState<any>(null);
    const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", role: "" });

    const openEdit = () => {
        if (!sub) return;
        setEditForm({
            name: sub.name, trade: sub.trade, email: sub.email,
            phone: sub.phone ?? "", website: (sub as any).website ?? "",
            street: sub.street ?? "", postcode: sub.postcode ?? "", city: sub.city ?? "",
            licenseNumber: sub.licenseNumber ?? "",
            insuranceExpiry: sub.insuranceExpiry ? new Date(sub.insuranceExpiry).toISOString().split("T")[0] : "",
            notes: sub.notes ?? "",
        });
        setShowEdit(true);
    };

    const handleUpdateSub = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSub({
                id,
                name: editForm.name, trade: editForm.trade, email: editForm.email,
                phone: editForm.phone || undefined, website: editForm.website || undefined,
                street: editForm.street || undefined, postcode: editForm.postcode || undefined,
                city: editForm.city || undefined,
                licenseNumber: editForm.licenseNumber || undefined,
                insuranceExpiry: editForm.insuranceExpiry ? new Date(editForm.insuranceExpiry).getTime() : undefined,
                notes: editForm.notes || undefined,
            });
            setShowEdit(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createContact({ subcontractorId: id, name: contactForm.name, email: contactForm.email || undefined, phone: contactForm.phone || undefined, role: contactForm.role || undefined });
            setContactForm({ name: "", email: "", phone: "", role: "" });
            setShowAddContact(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateContact({ id: editContact._id, name: editContact.name, email: editContact.email || undefined, phone: editContact.phone || undefined, role: editContact.role || undefined });
            setEditContact(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this subcontractor? This cannot be undone.")) return;
        await removeSub({ id });
        router.push("/dashboard/subcontractors");
    };

    if (sub === undefined) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    if (sub === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Subcontractor not found</h2>
            <button onClick={() => router.back()} className="text-sm text-orange-500 hover:underline">Go back</button>
        </div>
    );

    const insStatus = insuranceStatus(sub.insuranceExpiry);
    const address = [sub.street, sub.city, sub.postcode].filter(Boolean).join(", ");

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Subcontractors
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                            <HardHat size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">{sub.name}</h1>
                            <span className={cn("inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize mt-1", TRADE_COLORS[sub.trade] ?? TRADE_COLORS.other)}>
                                {sub.trade}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openEdit} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
                            <Pencil size={14} /> Edit
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Insurance warning banner */}
            {insStatus === "expired" && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">Insurance expired</p>
                        <p className="text-xs text-red-600">Expired on {formatDate(sub.insuranceExpiry!)}. Do not assign to active projects until renewed.</p>
                    </div>
                </div>
            )}
            {insStatus === "expiring" && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-700">Insurance expiring soon</p>
                        <p className="text-xs text-amber-600">Expires on {formatDate(sub.insuranceExpiry!)}. Request renewal before it lapses.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contact Info</h2>
                        <div className="space-y-3">
                            <a href={`mailto:${sub.email}`} className="flex items-center gap-3 text-sm text-zinc-700 hover:text-orange-500 transition-colors">
                                <Mail size={15} className="text-zinc-400 shrink-0" /> {sub.email}
                            </a>
                            {sub.phone && (
                                <a href={`tel:${sub.phone}`} className="flex items-center gap-3 text-sm text-zinc-700 hover:text-orange-500 transition-colors">
                                    <Phone size={15} className="text-zinc-400 shrink-0" /> {sub.phone}
                                </a>
                            )}
                            {(sub as any).website && (
                                <a href={(sub as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-orange-500 transition-colors">
                                    <Globe size={15} className="text-zinc-400 shrink-0" /> {(sub as any).website}
                                </a>
                            )}
                            {address && (
                                <div className="flex items-center gap-3 text-sm text-zinc-700">
                                    <MapPin size={15} className="text-zinc-400 shrink-0" /> {address}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Credentials</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-zinc-400 mb-1">License Number</p>
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-zinc-400" />
                                    <p className="text-sm font-semibold text-zinc-800">{sub.licenseNumber || <span className="text-zinc-400 font-normal">—</span>}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 mb-1">Insurance Expiry</p>
                                <div className={cn("flex items-center gap-2", insStatus === "expired" ? "text-red-600" : insStatus === "expiring" ? "text-amber-600" : "text-zinc-800")}>
                                    <Shield size={14} className={insStatus === "ok" ? "text-emerald-500" : insStatus === "none" ? "text-zinc-400" : "inherit"} />
                                    <p className="text-sm font-semibold">
                                        {sub.insuranceExpiry ? formatDate(sub.insuranceExpiry) : <span className="text-zinc-400 font-normal">Not set</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {sub.notes && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Notes</h2>
                            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{sub.notes}</p>
                        </div>
                    )}

                    {/* Projects */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assigned Projects</h2>
                            <span className="text-xs text-zinc-400">{projects.length}</span>
                        </div>
                        {projects.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-zinc-400">Not assigned to any projects</div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {projects.map((p: any) => (
                                    <Link key={p._id} href={`/dashboard/projects/${p._id}`} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <FolderKanban size={15} className="text-orange-400 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-900 group-hover:text-orange-500 transition-colors">{p.title}</p>
                                                {p.client && <p className="text-xs text-zinc-400">{p.client.name}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", PROJECT_STATUS_BADGE[p.status] ?? "bg-zinc-100 text-zinc-500")}>{p.status}</span>
                                            <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contacts sidebar */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacts</h2>
                            <button onClick={() => { setContactForm({ name: "", email: "", phone: "", role: "" }); setShowAddContact(true); }} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                                <Plus size={15} />
                            </button>
                        </div>
                        {contacts.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-zinc-400">No contacts yet</div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {contacts.map((c: any) => (
                                    <div key={c._id} className="px-4 py-3 group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                                                    <User size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
                                                    {c.role && <p className="text-xs text-zinc-400 truncate">{c.role}</p>}
                                                    {c.email && <p className="text-xs text-zinc-500 truncate">{c.email}</p>}
                                                    {c.phone && <p className="text-xs text-zinc-500">{c.phone}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button onClick={() => setEditContact({ ...c })} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700">
                                                    <Pencil size={12} />
                                                </button>
                                                <button onClick={() => removeContact({ id: c._id })} className="p-1 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Subcontractor Modal */}
            <AnimatePresence>
                {showEdit && editForm && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-bold text-zinc-900">Edit Subcontractor</h3>
                                <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleUpdateSub} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Name *</label>
                                    <input required value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Trade *</label>
                                        <select value={editForm.trade} onChange={(e) => setEditForm((f: any) => ({ ...f, trade: e.target.value }))} className={inputCls}>
                                            {TRADES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Email *</label>
                                        <input required type="email" value={editForm.email} onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Phone</label>
                                        <input value={editForm.phone} onChange={(e) => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Website</label>
                                        <input value={editForm.website} onChange={(e) => setEditForm((f: any) => ({ ...f, website: e.target.value }))} className={inputCls} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Street</label>
                                    <input value={editForm.street} onChange={(e) => setEditForm((f: any) => ({ ...f, street: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">City</label>
                                        <input value={editForm.city} onChange={(e) => setEditForm((f: any) => ({ ...f, city: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Postcode</label>
                                        <input value={editForm.postcode} onChange={(e) => setEditForm((f: any) => ({ ...f, postcode: e.target.value }))} className={inputCls} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">License Number</label>
                                        <input value={editForm.licenseNumber} onChange={(e) => setEditForm((f: any) => ({ ...f, licenseNumber: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 flex items-center gap-1.5"><Calendar size={11} /> Insurance Expiry</label>
                                        <input type="date" value={editForm.insuranceExpiry} onChange={(e) => setEditForm((f: any) => ({ ...f, insuranceExpiry: e.target.value }))} className={inputCls} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Notes</label>
                                    <textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} className={cn(inputCls, "resize-none")} />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setShowEdit(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                        {isSaving ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Contact Modal */}
            <AnimatePresence>
                {showAddContact && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddContact(false)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-bold text-zinc-900">Add Contact</h3>
                                <button onClick={() => setShowAddContact(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAddContact} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Name *</label>
                                    <input required value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. John Smith" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Role</label>
                                    <input value={contactForm.role} onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))} className={inputCls} placeholder="e.g. Site Foreman" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Email</label>
                                    <input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddContact(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                        Add Contact
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Contact Modal */}
            <AnimatePresence>
                {editContact && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditContact(null)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-bold text-zinc-900">Edit Contact</h3>
                                <button onClick={() => setEditContact(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleUpdateContact} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Name *</label>
                                    <input required value={editContact.name} onChange={(e) => setEditContact((c: any) => ({ ...c, name: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Role</label>
                                    <input value={editContact.role ?? ""} onChange={(e) => setEditContact((c: any) => ({ ...c, role: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Email</label>
                                    <input type="email" value={editContact.email ?? ""} onChange={(e) => setEditContact((c: any) => ({ ...c, email: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input value={editContact.phone ?? ""} onChange={(e) => setEditContact((c: any) => ({ ...c, phone: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setEditContact(null)} className="px-5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                        Save
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

export default function SubcontractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <SubcontractorDetail id={id as Id<"subcontractors">} />
        </Suspense>
    );
}
