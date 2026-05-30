"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Save, Building2 } from "lucide-react";

export default function SettingsPage() {
    const settings = useQuery(api.settings.get);
    const upsertSettings = useMutation(api.settings.upsert);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        addressLine1: "",
        addressLine2: "",
        contactEmail: "",
        phone: "",
        website: "",
        registrationNumber: "",
        vatNumber: "",
        defaultTaxRate: "",
        bankAccounts: "",
        currency: "EUR",
        emailSenderName: "",
        invoiceEmailSubject: "",
        invoiceEmailIntro: "",
        quoteEmailSubject: "",
        quoteEmailIntro: "",
        overdueEmailSubject: "",
        overdueEmailIntro: "",
    });

    useEffect(() => {
        if (settings) {
            setForm({
                companyName: settings.companyName ?? "",
                addressLine1: settings.addressLine1 ?? "",
                addressLine2: settings.addressLine2 ?? "",
                contactEmail: settings.contactEmail ?? "",
                phone: settings.phone ?? "",
                website: settings.website ?? "",
                registrationNumber: settings.registrationNumber ?? "",
                vatNumber: settings.vatNumber ?? "",
                defaultTaxRate: settings.defaultTaxRate?.toString() ?? "",
                bankAccounts: settings.bankAccounts ?? "",
                currency: settings.currency ?? "EUR",
                emailSenderName: settings.emailSenderName ?? "",
                invoiceEmailSubject: settings.invoiceEmailSubject ?? "",
                invoiceEmailIntro: settings.invoiceEmailIntro ?? "",
                quoteEmailSubject: settings.quoteEmailSubject ?? "",
                quoteEmailIntro: settings.quoteEmailIntro ?? "",
                overdueEmailSubject: settings.overdueEmailSubject ?? "",
                overdueEmailIntro: settings.overdueEmailIntro ?? "",
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await upsertSettings({
            companyName: form.companyName,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            contactEmail: form.contactEmail,
            phone: form.phone || undefined,
            website: form.website || undefined,
            registrationNumber: form.registrationNumber || undefined,
            vatNumber: form.vatNumber || undefined,
            defaultTaxRate: form.defaultTaxRate ? parseFloat(form.defaultTaxRate) : undefined,
            bankAccounts: form.bankAccounts || undefined,
            currency: form.currency || undefined,
            emailSenderName: form.emailSenderName || undefined,
            invoiceEmailSubject: form.invoiceEmailSubject || undefined,
            invoiceEmailIntro: form.invoiceEmailIntro || undefined,
            quoteEmailSubject: form.quoteEmailSubject || undefined,
            quoteEmailIntro: form.quoteEmailIntro || undefined,
            overdueEmailSubject: form.overdueEmailSubject || undefined,
            overdueEmailIntro: form.overdueEmailIntro || undefined,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all";
    const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Company and email configuration</p>
                </div>
                {saved && <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 size={18} className="text-sky-500" />
                        <h2 className="font-semibold text-sm text-zinc-900">Company Information</h2>
                    </div>
                    <div>
                        <label className={labelCls}>Company Name *</label>
                        <input className={inputCls} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
                    </div>
                    <div>
                        <label className={labelCls}>Address Line 1</label>
                        <input className={inputCls} value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
                    </div>
                    <div>
                        <label className={labelCls}>Address Line 2</label>
                        <input className={inputCls} value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Contact Email *</label>
                            <input type="email" className={inputCls} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} required />
                        </div>
                        <div>
                            <label className={labelCls}>Phone</label>
                            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Website</label>
                            <input className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Currency</label>
                            <select className={inputCls} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Registration Number</label>
                            <input className={inputCls} value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>VAT Number</label>
                            <input className={inputCls} value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Default Tax Rate (%)</label>
                            <input type="number" min={0} max={100} step="0.1" className={inputCls} value={form.defaultTaxRate} onChange={(e) => set("defaultTaxRate", e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Bank Account Details</label>
                        <textarea rows={3} className={inputCls} value={form.bankAccounts} onChange={(e) => set("bankAccounts", e.target.value)} placeholder="IBAN, BIC, account name…" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-zinc-900">Email Templates</h2>
                    <div>
                        <label className={labelCls}>Sender Name</label>
                        <input className={inputCls} value={form.emailSenderName} onChange={(e) => set("emailSenderName", e.target.value)} placeholder="e.g. Arcocen Construction" />
                    </div>
                    {[
                        { key: "invoice", label: "Invoice Email" },
                        { key: "quote", label: "Quote Email" },
                        { key: "overdue", label: "Overdue Reminder" },
                    ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
                            <input className={inputCls} placeholder="Subject line" value={(form as any)[`${key}EmailSubject`]} onChange={(e) => set(`${key}EmailSubject`, e.target.value)} />
                            <textarea rows={2} className={inputCls} placeholder="Email intro text" value={(form as any)[`${key}EmailIntro`]} onChange={(e) => set(`${key}EmailIntro`, e.target.value)} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Save size={16} />
                        {saving ? "Saving…" : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}
