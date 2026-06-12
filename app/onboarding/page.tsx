"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Building2, MapPin, CreditCard, ChevronRight, ChevronLeft, Loader2, Upload, Check } from "lucide-react";

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white";
const labelCls = "block text-xs font-semibold text-zinc-500 mb-1.5";

const CURRENCIES = ["EUR", "USD", "AWG", "GBP", "ANG", "CAD", "AUD"];

const STEPS = [
    { label: "Company", icon: Building2 },
    { label: "Contact", icon: MapPin },
    { label: "Billing", icon: CreditCard },
];

export default function OnboardingPage() {
    const router = useRouter();
    const settings = useQuery(api.settings.get);
    const upsertSettings = useMutation(api.settings.upsert);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        addressLine1: "",
        addressLine2: "",
        contactEmail: "",
        phone: "",
        website: "",
        registrationNumber: "",
        vatNumber: "",
        currency: "EUR",
        bankAccounts: "",
    });

    // If settings already exist, skip onboarding
    if (settings !== undefined && settings !== null) {
        router.replace("/dashboard");
        return null;
    }

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setUploadingLogo(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!res.ok) throw new Error("Upload failed");
            const { storageId } = await res.json();
            setLogoStorageId(storageId);
        } catch {
            // logo upload failed, continue without it
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleFinish = async () => {
        if (!form.companyName || !form.contactEmail) return;
        setSaving(true);
        try {
            await upsertSettings({
                companyName: form.companyName,
                addressLine1: form.addressLine1,
                addressLine2: form.addressLine2,
                contactEmail: form.contactEmail,
                phone: form.phone || undefined,
                website: form.website || undefined,
                registrationNumber: form.registrationNumber || undefined,
                vatNumber: form.vatNumber || undefined,
                currency: form.currency,
                bankAccounts: form.bankAccounts || undefined,
                logoStorageId: logoStorageId ?? undefined,
            });
            router.push("/dashboard");
        } finally {
            setSaving(false);
        }
    };

    const canAdvance = () => {
        if (step === 0) return form.companyName.trim().length > 0;
        if (step === 1) return form.contactEmail.trim().length > 0 && form.addressLine1.trim().length > 0;
        return true;
    };

    return (
        <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-zinc-900 mb-1">Welcome to BuildFlow</h1>
                <p className="text-sm text-zinc-500">Let's set up your company profile — takes about 2 minutes.</p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = i < step;
                    const active = i === step;
                    return (
                        <div key={s.label} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? "bg-sky-500 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                                {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                                {s.label}
                            </div>
                            {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-emerald-300" : "bg-zinc-200"}`} />}
                        </div>
                    );
                })}
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">

                {/* Step 0: Company */}
                {step === 0 && (
                    <>
                        <div>
                            <h2 className="font-bold text-zinc-900 mb-0.5">Your Company</h2>
                            <p className="text-xs text-zinc-400">This will appear on your invoices and quotes.</p>
                        </div>

                        <div>
                            <label className={labelCls}>Company Name *</label>
                            <input
                                className={inputCls}
                                value={form.companyName}
                                onChange={e => set("companyName", e.target.value)}
                                placeholder="Acme Construction Ltd."
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Company Logo</label>
                            {logoPreview ? (
                                <div className="flex items-center gap-3">
                                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-contain border border-zinc-200 bg-zinc-50" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-700">{logoFile?.name}</p>
                                        {uploadingLogo && <p className="text-xs text-sky-500 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Uploading…</p>}
                                        {!uploadingLogo && logoStorageId && <p className="text-xs text-emerald-600 flex items-center gap-1"><Check size={11} /> Uploaded</p>}
                                        <button onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoStorageId(null); }} className="text-xs text-zinc-400 hover:text-red-500 transition-colors mt-1">Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl p-5 cursor-pointer hover:border-sky-300 hover:bg-sky-50/50 transition-all">
                                    <Upload size={18} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-500 font-medium">Click to upload logo</span>
                                    <span className="text-xs text-zinc-400">PNG, JPG, SVG</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                </label>
                            )}
                        </div>
                    </>
                )}

                {/* Step 1: Contact */}
                {step === 1 && (
                    <>
                        <div>
                            <h2 className="font-bold text-zinc-900 mb-0.5">Address & Contact</h2>
                            <p className="text-xs text-zinc-400">Used on invoices and for client communications.</p>
                        </div>

                        <div>
                            <label className={labelCls}>Address Line 1 *</label>
                            <input className={inputCls} value={form.addressLine1} onChange={e => set("addressLine1", e.target.value)} placeholder="123 Main Street" autoFocus />
                        </div>
                        <div>
                            <label className={labelCls}>Address Line 2</label>
                            <input className={inputCls} value={form.addressLine2} onChange={e => set("addressLine2", e.target.value)} placeholder="City, Country" />
                        </div>
                        <div>
                            <label className={labelCls}>Contact Email *</label>
                            <input type="email" className={inputCls} value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="hello@yourcompany.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input className={inputCls} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 234 567 890" />
                            </div>
                            <div>
                                <label className={labelCls}>Website</label>
                                <input className={inputCls} value={form.website} onChange={e => set("website", e.target.value)} placeholder="www.yourcompany.com" />
                            </div>
                        </div>
                    </>
                )}

                {/* Step 2: Billing */}
                {step === 2 && (
                    <>
                        <div>
                            <h2 className="font-bold text-zinc-900 mb-0.5">Currency & Banking</h2>
                            <p className="text-xs text-zinc-400">Payment details shown on your invoices.</p>
                        </div>

                        <div>
                            <label className={labelCls}>Currency</label>
                            <select className={inputCls} value={form.currency} onChange={e => set("currency", e.target.value)}>
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Registration Number</label>
                                <input className={inputCls} value={form.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} placeholder="Optional" />
                            </div>
                            <div>
                                <label className={labelCls}>VAT / Tax Number</label>
                                <input className={inputCls} value={form.vatNumber} onChange={e => set("vatNumber", e.target.value)} placeholder="Optional" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Bank Account Details</label>
                            <textarea
                                className={inputCls}
                                rows={4}
                                value={form.bankAccounts}
                                onChange={e => set("bankAccounts", e.target.value)}
                                placeholder={"Bank: First National Bank\nIBAN: XX00 0000 0000 0000\nBIC: FNBXXX"}
                            />
                            <p className="text-xs text-zinc-400 mt-1">This text appears in the payment section of your invoices.</p>
                        </div>
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
                {step > 0 ? (
                    <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                        <ChevronLeft size={16} /> Back
                    </button>
                ) : <div />}

                {step < STEPS.length - 1 ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canAdvance()}
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    >
                        Continue <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        disabled={saving || uploadingLogo}
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {saving ? "Setting up…" : "Go to Dashboard"}
                    </button>
                )}
            </div>

            <p className="text-center text-xs text-zinc-400 mt-4">You can change all of this later in Settings.</p>
        </div>
    );
}
