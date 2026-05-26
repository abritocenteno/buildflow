"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft,
    FileText,
    User,
    Calendar,
    CreditCard,
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    ChevronDown,
    FolderKanban,
    Percent,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";

const INVOICE_TYPES = ["progress", "final", "deposit"] as const;
const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Card", "Cheque", "Other"];

function CreateInvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialClientId = searchParams.get("clientId") as Id<"clients"> | null;
    const initialProjectId = searchParams.get("projectId") as Id<"projects"> | null;

    const clients = useQuery(api.clients.list) ?? [];
    const projects = useQuery(api.projects.list) ?? [];
    const settings = useQuery(api.settings.get);
    const createInvoice = useMutation(api.invoices.create);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        clientId: (initialClientId || "") as Id<"clients"> | "",
        projectId: (initialProjectId || "") as Id<"projects"> | "",
        invoiceType: "progress" as string,
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        paymentMethod: "",
        taxRate: 0,
        retainagePercent: 0,
        items: [] as { name: string; description: string; remark: string; amount: number; unitPrice: number }[],
        credits: [] as { description: string; amount: number }[],
        status: "pending",
    });

    useEffect(() => {
        if (settings?.defaultTaxRate !== undefined) {
            setFormData((p) => ({ ...p, taxRate: settings.defaultTaxRate ?? 0 }));
        }
    }, [settings]);

    const filteredProjects = formData.clientId
        ? projects.filter((p: any) => p.clientId === formData.clientId)
        : projects;

    const subtotal = formData.items.reduce((s, i) => s + i.amount * i.unitPrice, 0);
    const tax = subtotal * (formData.taxRate / 100);
    const creditsTotal = formData.credits.reduce((s, c) => s + c.amount, 0);
    const grossTotal = subtotal + tax - creditsTotal;
    const retainageAmount = grossTotal * (formData.retainagePercent / 100);
    const netTotal = grossTotal - retainageAmount;

    const addItem = () =>
        setFormData((p) => ({ ...p, items: [...p.items, { name: "", description: "", remark: "", amount: 1, unitPrice: 0 }] }));

    const removeItem = (i: number) =>
        setFormData((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

    const updateItem = (i: number, field: string, value: string | number) =>
        setFormData((p) => {
            const items = [...p.items];
            items[i] = { ...items[i], [field]: value };
            return { ...p, items };
        });

    const addCredit = () =>
        setFormData((p) => ({ ...p, credits: [...p.credits, { description: "", amount: 0 }] }));

    const removeCredit = (i: number) =>
        setFormData((p) => ({ ...p, credits: p.credits.filter((_, idx) => idx !== i) }));

    const updateCredit = (i: number, field: string, value: string | number) =>
        setFormData((p) => {
            const credits = [...p.credits];
            credits[i] = { ...credits[i], [field]: value };
            return { ...p, credits };
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) { alert("Please select a client"); return; }
        setIsSubmitting(true);
        try {
            const id = await createInvoice({
                clientId: formData.clientId as Id<"clients">,
                projectId: formData.projectId ? (formData.projectId as Id<"projects">) : undefined,
                date: new Date(formData.date).getTime(),
                dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
                amount: netTotal,
                invoiceType: formData.invoiceType,
                paymentMethod: formData.paymentMethod || undefined,
                taxRate: formData.taxRate,
                retainagePercent: formData.retainagePercent || undefined,
                retainageAmount: formData.retainagePercent ? retainageAmount : undefined,
                items: formData.items,
                credits: formData.credits.length ? formData.credits : undefined,
            });
            router.push(`/dashboard/invoices/${id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create invoice. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sym = getCurrencySymbol(settings?.currency);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Invoices
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">New Invoice</h1>
                        <p className="text-sm text-zinc-500">Create a new billing record</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Client */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Client *</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value as Id<"clients">, projectId: "" }))}
                                    className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 appearance-none"
                                >
                                    <option value="" disabled>Select client…</option>
                                    {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Project */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Project (optional)</label>
                            <div className="relative">
                                <FolderKanban size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData((p) => ({ ...p, projectId: e.target.value as Id<"projects"> }))}
                                    className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 appearance-none"
                                >
                                    <option value="">No project</option>
                                    {filteredProjects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Invoice Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Invoice Type</label>
                            <div className="flex gap-2">
                                {INVOICE_TYPES.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData((p) => ({ ...p, invoiceType: t }))}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-xs font-semibold border capitalize transition-all",
                                            formData.invoiceType === t
                                                ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                                                : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Payment Method</label>
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                                    className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 appearance-none"
                                >
                                    <option value="">Select method (optional)</option>
                                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Invoice Date *</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
                                />
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Due Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Line Items</h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                            <Plus size={13} />
                            Add Item
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[30%]">Item</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[25%]">Description</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[15%]">Remark</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[8%]">Qty</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[12%]">Unit Price</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%]">Total</th>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {formData.items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-zinc-400">
                                            No items yet — click "Add Item" to start
                                        </td>
                                    </tr>
                                )}
                                {formData.items.map((item, i) => (
                                    <tr key={i} className="group hover:bg-zinc-50/50">
                                        <td className="px-6 py-3">
                                            <input
                                                required
                                                placeholder="e.g. Foundation work"
                                                className="w-full bg-transparent text-sm font-medium placeholder:text-zinc-300 focus:outline-none"
                                                value={item.name}
                                                onChange={(e) => updateItem(i, "name", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                placeholder="Detail…"
                                                className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none"
                                                value={item.description}
                                                onChange={(e) => updateItem(i, "description", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                placeholder="Note…"
                                                className="w-full bg-transparent text-xs text-zinc-400 italic placeholder:text-zinc-200 focus:outline-none"
                                                value={item.remark}
                                                onChange={(e) => updateItem(i, "remark", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-14 mx-auto block bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-center py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                value={item.amount}
                                                onChange={(e) => updateItem(i, "amount", parseInt(e.target.value) || 1)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-xs text-zinc-400">{sym}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-right py-1 px-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    value={item.unitPrice || ""}
                                                    placeholder="0.00"
                                                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-zinc-900">
                                                {formatCurrency(item.amount * item.unitPrice, settings?.currency)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(i)}
                                                className="p-1 text-zinc-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-zinc-100">
                                <tr>
                                    <td colSpan={5} className="px-6 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subtotal</td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">{formatCurrency(subtotal, settings?.currency)}</td>
                                    <td />
                                </tr>
                                <tr>
                                    <td colSpan={5} className="px-6 py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.taxRate > 0}
                                                    onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.checked ? (settings?.defaultTaxRate ?? 21) : 0 }))}
                                                    className="rounded border-zinc-300 text-orange-500"
                                                />
                                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">VAT</span>
                                            </label>
                                            {formData.taxRate > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number" min={0} max={100} step={0.1}
                                                        value={formData.taxRate}
                                                        onChange={(e) => setFormData((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                                                        className="w-14 px-2 py-1 text-xs border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                    <span className="text-xs text-zinc-400 font-semibold">%</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-700">{formatCurrency(tax, settings?.currency)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Credits */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Credits & Discounts</h2>
                        <button type="button" onClick={addCredit} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors">
                            <Plus size={13} />
                            Add Credit
                        </button>
                    </div>
                    {formData.credits.length === 0 ? (
                        <p className="px-6 py-6 text-sm text-zinc-400 text-center">No credits — click "Add Credit" to apply a deduction</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-zinc-100">
                                {formData.credits.map((c, i) => (
                                    <tr key={i} className="group hover:bg-zinc-50/50">
                                        <td className="px-6 py-3">
                                            <input
                                                required
                                                placeholder="e.g. Previous deposit, discount…"
                                                className="w-full bg-transparent text-sm font-medium placeholder:text-zinc-300 focus:outline-none"
                                                value={c.description}
                                                onChange={(e) => updateCredit(i, "description", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-3 w-40">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-xs text-zinc-400">{sym}</span>
                                                <input
                                                    type="number" step="0.01" min="0" required
                                                    className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-right py-1 px-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    value={c.amount || ""}
                                                    placeholder="0.00"
                                                    onChange={(e) => updateCredit(i, "amount", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 w-10">
                                            <button type="button" onClick={() => removeCredit(i)} className="p-1 text-zinc-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Retainage + Total */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Retainage & Total</h2>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.retainagePercent > 0}
                                onChange={(e) => setFormData((p) => ({ ...p, retainagePercent: e.target.checked ? 10 : 0 }))}
                                className="rounded border-zinc-300 text-orange-500"
                            />
                            <span className="text-sm font-medium text-zinc-700">Apply retainage</span>
                        </label>
                        {formData.retainagePercent > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Percent size={14} className="text-zinc-400" />
                                <input
                                    type="number" min={0} max={100} step={0.5}
                                    value={formData.retainagePercent}
                                    onChange={(e) => setFormData((p) => ({ ...p, retainagePercent: parseFloat(e.target.value) || 0 }))}
                                    className="w-16 px-2 py-1 text-sm border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                                <span className="text-sm text-zinc-500">%</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-100 pt-4 space-y-2">
                        {creditsTotal > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600 font-medium">Credits</span>
                                <span className="font-semibold text-amber-700">− {formatCurrency(creditsTotal, settings?.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 font-medium">Gross Total</span>
                            <span className="font-semibold text-zinc-700">{formatCurrency(grossTotal, settings?.currency)}</span>
                        </div>
                        {formData.retainagePercent > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-medium">Retainage held ({formData.retainagePercent}%)</span>
                                <span className="font-semibold text-zinc-500">− {formatCurrency(retainageAmount, settings?.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                            <span className="text-sm font-semibold text-zinc-900">Invoice Total</span>
                            <span className="text-2xl font-black text-zinc-900">{formatCurrency(netTotal, settings?.currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isSubmitting ? "Creating…" : "Create Invoice"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <CreateInvoiceForm />
        </Suspense>
    );
}
