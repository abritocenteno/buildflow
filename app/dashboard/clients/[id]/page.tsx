"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft, Building2, Loader2, AlertCircle, Mail, Phone, Globe,
    MapPin, FolderKanban, FileText, Pencil, Trash2, Plus, X,
    CheckCircle2, User, ChevronRight, TrendingUp, Clock,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const CLIENT_TYPES = ["individual", "business", "developer", "contractor"] as const;

const INV_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-zinc-100 text-zinc-500",
};

const PROJ_BADGE: Record<string, string> = {
    planning: "bg-zinc-100 text-zinc-600",
    permitting: "bg-blue-100 text-blue-700",
    in_progress: "bg-sky-100 text-sky-700",
    punch_list: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    closed: "bg-zinc-200 text-zinc-500",
};

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all";

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const client = useQuery(api.clients.get, { id: id as Id<"clients"> });
    const contacts = useQuery(api.contacts.listByClient, { clientId: id as Id<"clients"> }) ?? [];
    const settings = useQuery(api.settings.get);
    const projects = useQuery(api.projects.list) ?? [];
    const invoices = useQuery(api.invoices.list) ?? [];

    const updateClient = useMutation(api.clients.update);
    const removeClient = useMutation(api.clients.remove);
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
        if (!client) return;
        setEditForm({
            name: client.name, email: client.email, type: (client as any).type ?? "business",
            phone: (client as any).phone ?? "", website: (client as any).website ?? "",
            street: (client as any).street ?? "", city: (client as any).city ?? "", postcode: (client as any).postcode ?? "",
        });
        setShowEdit(true);
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateClient({
                id: id as Id<"clients">,
                name: editForm.name, email: editForm.email, type: editForm.type,
                phone: editForm.phone || undefined, website: editForm.website || undefined,
                street: editForm.street || undefined, city: editForm.city || undefined, postcode: editForm.postcode || undefined,
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
            await createContact({ clientId: id as Id<"clients">, name: contactForm.name, email: contactForm.email || undefined, phone: contactForm.phone || undefined, role: contactForm.role || undefined });
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
        if (!confirm("Delete this client? This cannot be undone.")) return;
        await removeClient({ id: id as Id<"clients"> });
        router.push("/dashboard/clients");
    };

    if (client === undefined) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    if (client === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Client not found</h2>
            <button onClick={() => router.back()} className="text-sm text-sky-500 hover:underline">Go back</button>
        </div>
    );

    const clientProjects = projects.filter((p: any) => p.clientId === id);
    const clientInvoices = invoices.filter((i: any) => i.clientId === id);
    const totalRevenue = clientInvoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
    const outstanding = clientInvoices.filter((i: any) => ["pending", "overdue"].includes(i.status)).reduce((s: number, i: any) => s + i.amount, 0);
    const activeProjects = clientProjects.filter((p: any) => !["completed", "closed"].includes(p.status)).length;
    const address = [(client as any).street, (client as any).city, (client as any).postcode].filter(Boolean).join(", ");

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Clients
                </button>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                            <Building2 size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">{client.name}</h1>
                            <span className="inline-block text-xs font-semibold bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full capitalize mt-1">
                                {(client as any).type ?? "client"}
                            </span>
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total Revenue", value: formatCurrency(totalRevenue, settings?.currency), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Outstanding", value: formatCurrency(outstanding, settings?.currency), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Active Projects", value: String(activeProjects), icon: FolderKanban, color: "text-sky-600", bg: "bg-sky-50" },
                    { label: "Total Projects", value: String(clientProjects.length), icon: FolderKanban, color: "text-zinc-600", bg: "bg-zinc-100" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
                            <Icon size={15} className={color} />
                        </div>
                        <p className="text-lg font-bold text-zinc-900">{value}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Contact info */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3">
                        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contact Info</h2>
                        {client.email && (
                            <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm text-zinc-700 hover:text-sky-500 transition-colors">
                                <Mail size={15} className="text-zinc-400 shrink-0" /> {client.email}
                            </a>
                        )}
                        {(client as any).phone && (
                            <a href={`tel:${(client as any).phone}`} className="flex items-center gap-3 text-sm text-zinc-700 hover:text-sky-500 transition-colors">
                                <Phone size={15} className="text-zinc-400 shrink-0" /> {(client as any).phone}
                            </a>
                        )}
                        {(client as any).website && (
                            <a href={(client as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-sky-500 transition-colors">
                                <Globe size={15} className="text-zinc-400 shrink-0" /> {(client as any).website}
                            </a>
                        )}
                        {address && (
                            <div className="flex items-center gap-3 text-sm text-zinc-700">
                                <MapPin size={15} className="text-zinc-400 shrink-0" /> {address}
                            </div>
                        )}
                    </div>

                    {/* Projects */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Projects</h2>
                            <Link href={`/dashboard/projects/new?clientId=${id}`}
                                className="flex items-center gap-1 text-xs font-medium text-sky-500 hover:text-sky-600 transition-colors">
                                <Plus size={13} /> New
                            </Link>
                        </div>
                        {clientProjects.length === 0 ? (
                            <div className="py-8 text-center text-sm text-zinc-400">No projects yet</div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {clientProjects.map((p: any) => (
                                    <Link key={p._id} href={`/dashboard/projects/${p._id}`}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FolderKanban size={14} className="text-sky-400 shrink-0" />
                                            <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-sky-500 transition-colors">{p.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", PROJ_BADGE[p.status] ?? "bg-zinc-100 text-zinc-500")}>
                                                {p.status.replace("_", " ")}
                                            </span>
                                            <ChevronRight size={13} className="text-zinc-300" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Invoices */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoices</h2>
                            <Link href={`/dashboard/invoices/new?clientId=${id}`}
                                className="flex items-center gap-1 text-xs font-medium text-sky-500 hover:text-sky-600 transition-colors">
                                <Plus size={13} /> New
                            </Link>
                        </div>
                        {clientInvoices.length === 0 ? (
                            <div className="py-8 text-center text-sm text-zinc-400">No invoices yet</div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {clientInvoices.map((inv: any) => (
                                    <Link key={inv._id} href={`/dashboard/invoices/${inv._id}`}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText size={14} className="text-zinc-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold font-mono text-zinc-900 group-hover:text-sky-500 transition-colors">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-zinc-400">{formatDate(inv.date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", INV_BADGE[inv.status] ?? "bg-zinc-100 text-zinc-500")}>
                                                {inv.status}
                                            </span>
                                            <p className="text-sm font-bold text-zinc-900">{formatCurrency(inv.amount, settings?.currency)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contacts sidebar */}
                <div>
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacts</h2>
                            <button onClick={() => { setContactForm({ name: "", email: "", phone: "", role: "" }); setShowAddContact(true); }}
                                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
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
                                                    {c.role && <p className="text-xs text-zinc-400">{c.role}</p>}
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

            {/* Edit Client Modal */}
            <AnimatePresence>
                {showEdit && editForm && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
                        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-bold text-zinc-900">Edit Client</h3>
                                <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Name *</label>
                                    <input required value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Email *</label>
                                        <input required type="email" value={editForm.email} onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Type</label>
                                        <select value={editForm.type} onChange={(e) => setEditForm((f: any) => ({ ...f, type: e.target.value }))} className={inputCls}>
                                            {CLIENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
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
                                    <input required value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Jane Murphy" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Role</label>
                                    <input value={contactForm.role} onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))} className={inputCls} placeholder="e.g. Procurement Manager" />
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
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
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
