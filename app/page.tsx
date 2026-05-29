import Link from "next/link";
import { Building2, FolderKanban, FileText, ClipboardList, HardHat, BarChart2 } from "lucide-react";
import { SignInButton } from "@/components/clerk-compat";

const features = [
    { icon: FolderKanban, title: "Project Management", desc: "Kanban boards, milestones, and real-time progress tracking for every job site." },
    { icon: ClipboardList, title: "Quotes & Estimates", desc: "Professional cost estimates with labour, materials, and subcontractor line items." },
    { icon: FileText, title: "Invoicing", desc: "Progress billing, retainage tracking, and automated overdue reminders." },
    { icon: HardHat, title: "Subcontractors", desc: "Manage trades, track insurance expiry, and assign them to projects." },
    { icon: Building2, title: "Permits & Change Orders", desc: "Track permits by status and manage change orders with client approval workflow." },
    { icon: BarChart2, title: "Reports & Analytics", desc: "Revenue dashboards, project cost tracking, and monthly performance charts." },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="border-b border-zinc-100 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                        <span className="font-black text-white text-base">B</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Build<span className="text-orange-500">Flow</span></span>
                </div>
                <SignInButton mode="redirect">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        Open Dashboard
                    </button>
                </SignInButton>
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                    <Building2 size={13} />
                    Built for contractors
                </div>
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-tight mb-6">
                    Manage your construction<br />
                    <span className="text-orange-500">business, end to end.</span>
                </h1>
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10">
                    BuildFlow gives contractors the tools to quote jobs, track projects, manage subcontractors, and invoice clients — all in one place.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <SignInButton mode="redirect">
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-colors shadow-lg shadow-orange-500/25">
                            Go to Dashboard
                        </button>
                    </SignInButton>
                    <Link
                        href="/request"
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-8 py-4 rounded-2xl text-base font-bold transition-colors"
                    >
                        Request a Quote
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                <Icon size={20} className="text-orange-600" />
                            </div>
                            <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
                BuildFlow — Construction Management Platform
            </footer>
        </div>
    );
}
