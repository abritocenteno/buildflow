"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Building2,
    FolderKanban,
    FileText,
    ClipboardList,
    HardHat,
    BarChart2,
    Receipt,
    PenLine,
    Clock,
    Check,
    ArrowRight,
    Menu,
    X,
} from "lucide-react";
import { SignInButton } from "@/components/clerk-compat";

const features = [
    { icon: FolderKanban, title: "Project Management", desc: "Track every job from kick-off to completion with kanban boards, milestones, and real-time progress." },
    { icon: ClipboardList, title: "Quotes & Estimates", desc: "Build professional quotes with labour, materials, and subcontractor line items in minutes." },
    { icon: FileText, title: "Invoicing", desc: "Progress billing, retainage tracking, purchase orders, and automated overdue reminders." },
    { icon: PenLine, title: "Client Sign-Off", desc: "Digital sign-off portal with photo upload and signature — clients approve work from their phone." },
    { icon: HardHat, title: "Subcontractors", desc: "Manage trades, track insurance expiry, and assign them directly to projects." },
    { icon: Clock, title: "Time & Materials", desc: "Log hours, track material usage, and import time entries straight into invoices." },
    { icon: Building2, title: "Permits & Change Orders", desc: "Track permits by status and manage change orders with a built-in approval workflow." },
    { icon: BarChart2, title: "Reports & Analytics", desc: "Revenue dashboards, project cost tracking, and monthly performance at a glance." },
    { icon: Receipt, title: "Purchase Orders", desc: "Upload PO documents and let AI extract the details — linked directly to projects and invoices." },
];

const Logo = () => (
    <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
            <span className="font-black text-base leading-none">B</span>
        </div>
        <span className="font-black text-xl tracking-tight text-zinc-900">
            Build<span className="text-sky-500">Flow</span>
        </span>
    </div>
);

export default function LandingPage() {
    const [annual, setAnnual] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const monthlyPrice = 79;
    const annualPrice = 790;
    const annualMonthly = Math.round(annualPrice / 12);

    return (
        <div className="min-h-screen bg-white text-zinc-900">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
                        <a href="#pricing" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <SignInButton mode="redirect">
                            <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-all">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignInButton mode="redirect">
                            <button className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-sky-500/20">
                                Get Started
                            </button>
                        </SignInButton>
                    </div>
                    <button className="md:hidden p-2 rounded-xl hover:bg-zinc-100 transition-all" onClick={() => setMobileMenuOpen(v => !v)}>
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-zinc-100 px-6 py-4 space-y-3 bg-white">
                        <a href="#features" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#pricing" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                        <SignInButton mode="redirect">
                            <button className="w-full bg-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold mt-2">Get Started</button>
                        </SignInButton>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
                <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-sky-100">
                    <Building2 size={13} />
                    Built for contractors &amp; construction businesses
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 leading-[1.05] mb-6">
                    Run your construction<br />
                    <span className="text-sky-500">business, end to end.</span>
                </h1>
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                    BuildFlow gives contractors everything they need to quote jobs, manage projects, handle subcontractors, and get paid — in one clean platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <SignInButton mode="redirect">
                        <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-colors shadow-xl shadow-sky-500/25 w-full sm:w-auto justify-center">
                            Get Started <ArrowRight size={18} />
                        </button>
                    </SignInButton>
                    <a href="#features" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                        See all features →
                    </a>
                </div>
            </section>

            {/* Trust strip */}
            <div className="border-y border-zinc-100 bg-zinc-50 py-5">
                <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-500 font-medium">
                    {["Digital sign-off workflow", "AI-powered PO extraction", "Professional PDF invoices", "No per-seat fees"].map(item => (
                        <span key={item} className="flex items-center gap-2">
                            <Check size={14} className="text-sky-500" /> {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Features */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-4">
                        Everything your business needs
                    </h2>
                    <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                        No more juggling spreadsheets, WhatsApp threads, and separate invoicing tools.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 hover:border-sky-100 hover:bg-sky-50/30 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 border border-zinc-200 shadow-sm group-hover:border-sky-200 group-hover:bg-sky-50 transition-all">
                                <Icon size={20} className="text-zinc-600 group-hover:text-sky-500 transition-colors" />
                            </div>
                            <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="bg-zinc-50 border-y border-zinc-100 py-24">
                <div className="max-w-2xl mx-auto px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-4">
                        Simple, honest pricing
                    </h2>
                    <p className="text-lg text-zinc-500 mb-10">
                        One plan. Full access. No hidden fees, no per-seat charges.
                    </p>

                    <div className="inline-flex items-center gap-1 bg-white border border-zinc-200 rounded-2xl p-1 mb-10">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!annual ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${annual ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                            Annual
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${annual ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                Save 17%
                            </span>
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl shadow-zinc-200/50 text-left">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">BuildFlow Pro</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black text-zinc-900">€{annual ? annualMonthly : monthlyPrice}</span>
                                    <span className="text-zinc-400 font-medium pb-1.5">/ month</span>
                                </div>
                                {annual && (
                                    <p className="text-sm text-emerald-600 font-semibold mt-1">
                                        Billed €{annualPrice}/year — save €{monthlyPrice * 12 - annualPrice}
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
                                <span className="font-black text-xl leading-none">B</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            {[
                                "Unlimited projects, clients & invoices",
                                "Quotes & estimates with PDF export",
                                "Purchase Order tracking with AI extraction",
                                "Client sign-off portal with digital signature",
                                "Subcontractor & supplier management",
                                "Time tracking & materials log",
                                "Permits & change order workflow",
                                "Reports & analytics dashboard",
                                "No per-seat fees — add your whole team",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={11} className="text-sky-500" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-zinc-700">{item}</span>
                                </div>
                            ))}
                        </div>

                        <SignInButton mode="redirect">
                            <button className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-2xl text-base font-bold transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2">
                                Get Started <ArrowRight size={18} />
                            </button>
                        </SignInButton>
                        <p className="text-center text-xs text-zinc-400 mt-4">Cancel anytime. No contracts.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-4">
                    Ready to bring order to your jobs?
                </h2>
                <p className="text-lg text-zinc-500 mb-8">
                    Join contractors who use BuildFlow to quote faster, bill smarter, and grow their business.
                </p>
                <SignInButton mode="redirect">
                    <button className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-colors shadow-xl shadow-sky-500/25">
                        Get Started Today <ArrowRight size={18} />
                    </button>
                </SignInButton>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-100 py-8">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Logo />
                    <p className="text-xs text-zinc-400">© {new Date().getFullYear()} BuildFlow. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-xs text-zinc-400">
                        <Link href="#" className="hover:text-zinc-700 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-zinc-700 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
