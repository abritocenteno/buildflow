"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Edit2, Plus, Trash2,
    X, ShoppingBag, ChevronRight, Loader2, User, Pencil,
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    cancelled: "bg-zinc-100 text-zinc-500",
};

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supplierId = id as Id<"suppliers">;
    const router = useRouter();

    const supplier = useQuery(api.suppliers.get, { id: supplierId });
    const orders = useQuery(api.orders.listBySupplier, { supplierId });
    const contacts = useQuery(api.contacts.listBySupplier, { supplierId });
    const settings = useQuery(api.settings.get);

    const updateSupplier = useMutation(api.suppliers.update);
    const removeSupplier = useMutation(api.suppliers.remove);
    const createContact = useMutation(api.contacts.create);
    const updateContact = useMutation(api.contacts.update);
    const removeContact = useMutation(api.contacts.remove);

    // Edit supplier
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDraft, setEditDraft] = useState({ name: "", email: "", phone: "", type: "regular", website: "", street: "", postcode: "", city: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Add contact
    const [isAddContact, setIsAddContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", role: "" });
    const [isAddingContact, setIsAddingContact] = useState(false);

    // Edit contact
    const [editContact, setEditContact] = useState<any>(null);
    const [editContactDraft, setEditContactDraft] = useState({ name: "", email: "", phone: "", role: "" });
    const [isSavingContact, setIsSavingContact] = useState(false);

    const openEdit = () => {
        if (!supplier) return;
        setEditDraft({ name: supplier.name, email: supplier.email, phone: supplier.phone ?? "", type: supplier.type, website: supplier.website ?? "", street: supplier.street ?? "", postcode: supplier.postcode ?? "", city: supplier.city ?? "" });
        setIsEditOpen(true);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSupplier({ id: supplierId, ...editDraft, phone: editDraft.phone || undefined, website: editDraft.website || undefined, street: editDraft.street || undefined, postcode: editDraft.postcode || undefined, city: editDraft.city || undefined });
            setIsEditOpen(false);
        } catch (err) { console.error(err); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete ${supplier?.name}? This cannot be undone.`)) return;
        await removeSupplier({ id: supplierId });
        router.push("/dashboard/suppliers");
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingContact(true);
        try {
            await createContact({ supplierId, name: newContact.name, email: newContact.email || undefined, phone: newContact.phone || undefined, role: newContact.role || undefined });
            setNewContact({ name: "", email: "", phone: "", role: "" });
            setIsAddContact(false);
        } catch (err) { console.error(err); }
        finally { setIsAddingContact(false); }
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editContact) return;
        setIsSavingContact(true);
        try {
            await updateContact({ id: editContact._id, name: editContactDraft.name, email: editContactDraft.email || undefined, phone: editContactDraft.phone || undefined, role: editContactDraft.role || undefined });
            setEditContact(null);
        } catch (err) { console.error(err); }
        finally { setIsSavingContact(false); }
    };

    if (supplier === undefined) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    if (supplier === null) return <div className="text-center py-32"><p className="text-zinc-500">Supplier not found.</p><button onClick={() => router.back()} className="mt-4 text-sm text-orange-500 hover:underline">Go back</button></div>;

    const totalSpend = orders?.reduce((s: number, o: any) => s + o.amount, 0) ?? 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Suppliers
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                            <Building2 size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-zinc-900">{supplier.name}</h1>
                                <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", supplier.type === "distributor" ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-600")}>
                                    {supplier.type}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500">{supplier.email}{supplier.city ? ` · ${supplier.city}` : ""}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openEdit} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
                            <Edit2 size={15} /> Edit
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="space-y-5">
                    {/* Contact info */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contact Info</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={15} className="text-zinc-400 shrink-0" />
                                <span className="text-zinc-700">{supplier.email}</span>
                            </div>
                            {supplier.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone size={15} className="text-zinc-400 shrink-0" />
                                    <span className="text-zinc-700">{supplier.phone}</span>
                                </div>
                            )}
                            {supplier.website && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Globe size={15} className="text-zinc-400 shrink-0" />
                                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline truncate">{supplier.website.replace(/^https?:\/\//, "")}</a>
                                </div>
                            )}
                            {(supplier.street || supplier.city) && (
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                                    <div>
                                        {supplier.street && <p className="text-zinc-700">{supplier.street}</p>}
                                        {(supplier.postcode || supplier.city) && (
                                            <p className="text-zinc-500">{[supplier.postcode, supplier.city].filter(Boolean).join(" ")}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stats</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total orders</span>
                                <span className="font-semibold text-zinc-900">{orders?.length ?? "—"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total spend</span>
                                <span className="font-semibold text-zinc-900">{formatCurrency(totalSpend, settings?.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacts</h3>
                            <button onClick={() => setIsAddContact(true)} className="p-1 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        {contacts?.length === 0 && <p className="text-xs text-zinc-400 text-center py-3">No contacts yet</p>}
                        {contacts?.map((c: any) => (
                            <div key={c._id} className="group relative bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditContact(c); setEditContactDraft({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", role: c.role ?? "" }); }}
                                        className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-white rounded-lg transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => removeContact({ id: c._id })} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
                                        {c.role && <p className="text-xs text-zinc-400">{c.role}</p>}
                                    </div>
                                </div>
                                {(c.email || c.phone) && (
                                    <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1">
                                        {c.email && <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Mail size={11} className="text-zinc-300" />{c.email}</p>}
                                        {c.phone && <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Phone size={11} className="text-zinc-300" />{c.phone}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column — Orders */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-zinc-900">Purchase Orders</h2>
                        <Link href={`/dashboard/orders/new?supplierId=${supplierId}`}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">
                            <Plus size={15} /> New Order
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        {orders === undefined && (
                            <div className="py-12 text-center"><Loader2 className="animate-spin text-zinc-300 mx-auto" size={24} /></div>
                        )}
                        {orders?.length === 0 && (
                            <div className="py-12 text-center space-y-2">
                                <ShoppingBag size={28} className="text-zinc-300 mx-auto" />
                                <p className="text-sm text-zinc-400">No orders yet</p>
                            </div>
                        )}
                        {orders && orders.length > 0 && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Order</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                                        <th className="w-10" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {orders.map((o: any) => (
                                        <tr key={o._id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-zinc-900">{o.orderNumber}</p>
                                                {o.project && <p className="text-xs text-zinc-400 mt-0.5">{o.project.title}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell">{formatDate(o.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full capitalize", STATUS_BADGE[o.status] ?? "bg-zinc-100 text-zinc-500")}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-zinc-900">{formatCurrency(o.amount, settings?.currency)}</td>
                                            <td className="px-4 py-4">
                                                <Link href={`/dashboard/orders/${o._id}`} className="text-zinc-300 hover:text-orange-500 transition-colors">
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Supplier Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-bold text-zinc-900">Edit Supplier</h3>
                            <button onClick={() => setIsEditOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-700 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveSupplier} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Company Name *</label>
                                    <input required value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Email *</label>
                                    <input required type="email" value={editDraft.email} onChange={(e) => setEditDraft((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input value={editDraft.phone} onChange={(e) => setEditDraft((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Website</label>
                                    <input value={editDraft.website} onChange={(e) => setEditDraft((p) => ({ ...p, website: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["regular", "distributor"].map((t) => (
                                            <button key={t} type="button" onClick={() => setEditDraft((p) => ({ ...p, type: t }))}
                                                className={cn("py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all", editDraft.type === t ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-500 border-zinc-200")}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Street</label>
                                    <input value={editDraft.street} onChange={(e) => setEditDraft((p) => ({ ...p, street: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Postcode</label>
                                    <input value={editDraft.postcode} onChange={(e) => setEditDraft((p) => ({ ...p, postcode: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">City</label>
                                    <input value={editDraft.city} onChange={(e) => setEditDraft((p) => ({ ...p, city: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50">
                                    {isSaving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Add Contact Modal */}
            {isAddContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddContact(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900">Add Contact</h3>
                            <button onClick={() => setIsAddContact(false)} className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddContact} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500">Name *</label>
                                <input required value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Email</label>
                                    <input type="email" value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} placeholder="+353…" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500">Role</label>
                                <input value={newContact.role} onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))} placeholder="Account Manager" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setIsAddContact(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600">Cancel</button>
                                <button type="submit" disabled={isAddingContact} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                                    {isAddingContact ? "Adding…" : "Add Contact"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Contact Modal */}
            {editContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditContact(null)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900">Edit Contact</h3>
                            <button onClick={() => setEditContact(null)} className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveContact} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500">Name *</label>
                                <input required value={editContactDraft.name} onChange={(e) => setEditContactDraft((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Email</label>
                                    <input type="email" value={editContactDraft.email} onChange={(e) => setEditContactDraft((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input value={editContactDraft.phone} onChange={(e) => setEditContactDraft((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500">Role</label>
                                <input value={editContactDraft.role} onChange={(e) => setEditContactDraft((p) => ({ ...p, role: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setEditContact(null)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600">Cancel</button>
                                <button type="submit" disabled={isSavingContact} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                                    {isSavingContact ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
