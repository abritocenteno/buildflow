"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Building2, FolderKanban, FileText, ClipboardList, HardHat,
    BarChart2, Receipt, PenLine, Clock, Check, ArrowRight,
    Menu, X, Sparkles, ShieldCheck, Zap,
} from "lucide-react";
import { SignInButton } from "@/components/clerk-compat";

/* ─── data ─────────────────────────────────────────────────── */

const highlights = [
    {
        icon: Zap,
        title: "AI-Powered POs",
        desc: "Upload a purchase order PDF and let AI extract every detail automatically.",
        color: "sky",
    },
    {
        icon: PenLine,
        title: "Digital Sign-Off",
        desc: "Clients sign off completed work from any device with photo proof and signature.",
        color: "violet",
    },
    {
        icon: ShieldCheck,
        title: "Full Billing Suite",
        desc: "Progress invoicing, retainage, purchase orders — every billing scenario covered.",
        color: "emerald",
    },
];

const features = [
    { icon: FolderKanban, title: "Project Management", desc: "Kanban boards, milestones, and real-time progress for every job site.", accent: "sky" },
    { icon: ClipboardList, title: "Quotes & Estimates", desc: "Build professional quotes with labour, materials, and subcontractor line items.", accent: "blue" },
    { icon: FileText, title: "Invoicing", desc: "Progress billing, retainage tracking, and automated overdue reminders.", accent: "indigo" },
    { icon: HardHat, title: "Subcontractors", desc: "Manage trades, track insurance expiry, and assign them to projects.", accent: "orange" },
    { icon: Clock, title: "Time & Materials", desc: "Log hours, track material usage, and import entries straight into invoices.", accent: "amber" },
    { icon: Building2, title: "Permits & Changes", desc: "Track permits and manage change orders with a built-in approval workflow.", accent: "rose" },
    { icon: BarChart2, title: "Reports", desc: "Revenue dashboards, project cost tracking, and monthly performance.", accent: "emerald" },
    { icon: Receipt, title: "Purchase Orders", desc: "PO tracking linked directly to projects and invoices with AI extraction.", accent: "violet" },
    { icon: Sparkles, title: "Client Portal", desc: "A branded portal where clients review, approve, and sign off work.", accent: "sky" },
];

const accentMap: Record<string, { bg: string; icon: string; glow: string }> = {
    sky:     { bg: "bg-sky-500/10",     icon: "text-sky-400",    glow: "shadow-sky-500/20" },
    blue:    { bg: "bg-blue-500/10",    icon: "text-blue-400",   glow: "shadow-blue-500/20" },
    indigo:  { bg: "bg-indigo-500/10",  icon: "text-indigo-400", glow: "shadow-indigo-500/20" },
    orange:  { bg: "bg-orange-500/10",  icon: "text-orange-400", glow: "shadow-orange-500/20" },
    amber:   { bg: "bg-amber-500/10",   icon: "text-amber-400",  glow: "shadow-amber-500/20" },
    rose:    { bg: "bg-rose-500/10",    icon: "text-rose-400",   glow: "shadow-rose-500/20" },
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400",glow: "shadow-emerald-500/20" },
    violet:  { bg: "bg-violet-500/10",  icon: "text-violet-400", glow: "shadow-violet-500/20" },
};

const highlightAccent: Record<string, { ring: string; icon: string; badge: string }> = {
    sky:     { ring: "ring-sky-500/30",     icon: "text-sky-400",    badge: "bg-sky-500/15 text-sky-300" },
    violet:  { ring: "ring-violet-500/30",  icon: "text-violet-400", badge: "bg-violet-500/15 text-violet-300" },
    emerald: { ring: "ring-emerald-500/30", icon: "text-emerald-400",badge: "bg-emerald-500/15 text-emerald-300" },
};

/* ─── components ────────────────────────────────────────────── */

const Logo = ({ dark = false }: { dark?: boolean }) => (
    <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/40 flex-shrink-0">
            <span className="font-black text-base leading-none">B</span>
        </div>
        <span className={`font-black text-xl tracking-tight ${dark ? "text-white" : "text-zinc-900"}`}>
            Build<span className="text-sky-400">Flow</span>
        </span>
    </div>
);

/* ─── page ──────────────────────────────────────────────────── */

export default function LandingPage() {
    const [annual, setAnnual] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const monthlyPrice = 79;
    const annualPrice  = 790;
    const annualMonthly = Math.round(annualPrice / 12);

    return (
        <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">

            {/* ── NAV ───────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo dark />

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</a>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <SignInButton mode="redirect">
                            <button className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignInButton mode="redirect">
                            <button className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-500/25">
                                Get Started
                            </button>
                        </SignInButton>
                    </div>

                    <button className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all" onClick={() => setMobileMenuOpen(v => !v)}>
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/5 px-6 py-4 space-y-3 bg-zinc-950">
                        <a href="#features" className="block text-sm font-medium text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#pricing"  className="block text-sm font-medium text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                        <SignInButton mode="redirect">
                            <button className="w-full bg-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold mt-2">Get Started</button>
                        </SignInButton>
                    </div>
                )}
            </nav>

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative bg-zinc-950 pt-40 pb-0 overflow-hidden">
                {/* radial sky glow */}
                <div className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(14,165,233,0.22) 0%, transparent 65%)" }} />
                {/* dot grid */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
                    style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                {/* bottom fade to white */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
                    style={{ background: "linear-gradient(to bottom, transparent, #09090b)" }} />

                <div className="relative max-w-5xl mx-auto px-6 text-center">
                    {/* badge */}
                    <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-wide">
                        <Building2 size={12} />
                        BUILT FOR CONTRACTORS
                    </div>

                    {/* headline */}
                    <h1 className="text-6xl sm:text-7xl lg:text-[88px] font-black tracking-tight leading-[0.93] mb-7">
                        <span className="text-white">The smarter way</span><br />
                        <span className="text-white">to run your </span>
                        <span
                            className="bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #7c3aed 100%)" }}
                        >
                            construction
                        </span><br />
                        <span className="text-white">business.</span>
                    </h1>

                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        Quote jobs, track projects, manage subcontractors, and get paid — in one platform built end-to-end for contractors.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <SignInButton mode="redirect">
                            <button className="flex items-center gap-2.5 bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-2xl shadow-sky-500/30 w-full sm:w-auto justify-center">
                                Get Started <ArrowRight size={18} />
                            </button>
                        </SignInButton>
                        <a href="#features" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-4">
                            See all features →
                        </a>
                    </div>
                </div>

                {/* Highlight cards — sit on the hero/white boundary */}
                <div className="relative max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 translate-y-12">
                        {highlights.map(({ icon: Icon, title, desc, color }) => {
                            const a = highlightAccent[color];
                            return (
                                <div key={title}
                                    className={`bg-zinc-900 border border-white/8 rounded-2xl p-6 ring-1 ${a.ring} backdrop-blur-sm`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accentMap[color]?.bg}`}>
                                        <Icon size={18} className={a.icon} />
                                    </div>
                                    <p className="font-bold text-white text-sm mb-1.5">{title}</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── SPACER (for cards overhang) ───────────────── */}
            <div className="bg-white h-20" />

            {/* ── TRUST STRIP ───────────────────────────────── */}
            <div className="bg-white border-y border-zinc-100 py-5">
                <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
                    {["Digital sign-off workflow", "AI-powered PO extraction", "Professional PDF invoices", "No per-seat fees"].map(item => (
                        <span key={item} className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                            <Check size={13} className="text-sky-500" strokeWidth={2.5} /> {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── FEATURES ──────────────────────────────────── */}
            <section id="features" className="bg-white py-28">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-black text-sky-500 uppercase tracking-widest mb-3">Everything you need</p>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4">
                            One platform.<br className="sm:hidden" /> Every workflow.
                        </h2>
                        <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                            No more juggling spreadsheets, WhatsApp threads, and separate invoicing tools.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map(({ icon: Icon, title, desc, accent }) => {
                            const a = accentMap[accent] ?? accentMap["sky"];
                            return (
                                <div key={title}
                                    className="group relative bg-white rounded-2xl p-6 border border-zinc-100 hover:border-zinc-200 hover:shadow-lg transition-all duration-300 cursor-default"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${a.bg} transition-all group-hover:scale-110 duration-300`}>
                                        <Icon size={20} className={a.icon} />
                                    </div>
                                    <h3 className="font-bold text-zinc-900 mb-2 text-sm">{title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── PRICING ───────────────────────────────────── */}
            <section id="pricing" className="py-28 bg-zinc-950 relative overflow-hidden">
                {/* subtle glow */}
                <div className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(14,165,233,0.1) 0%, transparent 70%)" }} />
                {/* dot grid */}
                <div className="pointer-events-none absolute inset-0 opacity-20"
                    style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

                <div className="relative max-w-xl mx-auto px-6 text-center">
                    <p className="text-xs font-black text-sky-400 uppercase tracking-widest mb-3">Pricing</p>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
                        Simple, honest pricing.
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10">
                        One plan. Full access. No hidden fees, no per-seat charges.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-2xl p-1 mb-10">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!annual ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${annual ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        >
                            Annual
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${annual ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>
                                Save 17%
                            </span>
                        </button>
                    </div>

                    {/* Card */}
                    <div className="relative">
                        {/* gradient ring */}
                        <div className="absolute -inset-[1px] rounded-3xl"
                            style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.6) 0%, rgba(124,58,237,0.4) 50%, rgba(14,165,233,0.2) 100%)" }} />
                        <div className="relative bg-zinc-900 rounded-3xl p-8 text-left">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">BuildFlow Pro</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-6xl font-black text-white">€{annual ? annualMonthly : monthlyPrice}</span>
                                        <span className="text-zinc-500 font-medium pb-2">/ month</span>
                                    </div>
                                    {annual ? (
                                        <p className="text-sm text-emerald-400 font-semibold mt-1">
                                            Billed €{annualPrice}/year · save €{monthlyPrice * 12 - annualPrice}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-zinc-500 mt-1">Billed monthly · cancel anytime</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 shrink-0">
                                    <span className="font-black text-xl leading-none">B</span>
                                </div>
                            </div>

                            <div className="space-y-2.5 mb-8">
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
                                ].map(item => (
                                    <div key={item} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={11} className="text-sky-400" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-zinc-300">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <SignInButton mode="redirect">
                                <button className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl text-base font-bold transition-all shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2">
                                    Get Started <ArrowRight size={18} />
                                </button>
                            </SignInButton>
                            <p className="text-center text-xs text-zinc-600 mt-4">Cancel anytime. No contracts.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────── */}
            <section className="bg-white py-28">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 border border-sky-100 tracking-wide">
                        <Sparkles size={12} />
                        JOIN THE WAITLIST
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4">
                        Ready to bring order<br />to your jobs?
                    </h2>
                    <p className="text-xl text-zinc-500 mb-10">
                        Join contractors who use BuildFlow to quote faster,<br className="hidden sm:block" /> bill smarter, and grow their business.
                    </p>
                    <SignInButton mode="redirect">
                        <button className="inline-flex items-center gap-2.5 bg-sky-500 hover:bg-sky-600 text-white px-10 py-4 rounded-2xl text-base font-bold transition-all shadow-2xl shadow-sky-500/25">
                            Get Started Today <ArrowRight size={18} />
                        </button>
                    </SignInButton>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────── */}
            <footer className="bg-zinc-950 border-t border-white/5 py-10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <Logo dark />
                    <p className="text-xs text-zinc-600">© {new Date().getFullYear()} BuildFlow. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-xs text-zinc-600">
                        <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
