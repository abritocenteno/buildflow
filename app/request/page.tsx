"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Building2, CheckCircle } from "lucide-react";

export default function RequestPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        projectTitle: "",
        description: "",
        siteAddress: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const inputCls = "w-full px-3 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // In production this would call a Convex action that creates a project with fromIntake: true
        // and sends a notification to the owner
        await new Promise((res) => setTimeout(res, 1000));
        setSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-10 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle size={28} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900">Request Received!</h2>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Thank you for reaching out. We&apos;ll review your request and get back to you shortly.
                    </p>
                    <Link href="/" className="inline-block mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium">← Back to home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                            <span className="font-black text-white text-base">B</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Build<span className="text-orange-500">Flow</span></span>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Request a Quote</h1>
                    <p className="text-sm text-zinc-500 mt-2">Tell us about your project and we&apos;ll get back to you.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Full Name *</label>
                            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="John Smith" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email *</label>
                            <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="john@example.com" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone</label>
                            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+353 87 123 4567" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Project / Job Type *</label>
                            <input className={inputCls} value={form.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} required placeholder="e.g. Kitchen extension, new build, renovation…" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Site Address</label>
                            <input className={inputCls} value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} placeholder="123 Main Street, Dublin" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Project Description</label>
                            <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the work you need done, timeline requirements, any specific materials or preferences…" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                        {submitting ? "Sending…" : "Submit Request"}
                    </button>
                </form>
            </div>
        </div>
    );
}
