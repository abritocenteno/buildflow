"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Globe, MapPin, FolderKanban, FileText } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const client = useQuery(api.clients.get, { id: id as Id<"clients"> });
    const projects = useQuery(api.projects.list) ?? [];
    const invoices = useQuery(api.invoices.list) ?? [];

    const clientProjects = projects.filter((p: any) => p.clientId === id);
    const clientInvoices = invoices.filter((i: any) => i.clientId === id);

    if (!client) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/clients" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">{client.name}</h1>
                    <p className="text-sm text-zinc-500 capitalize">{client.type}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3">
                {client.email && <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-zinc-400" /><a href={`mailto:${client.email}`} className="text-orange-500 hover:underline">{client.email}</a></div>}
                {client.phone && <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-zinc-400" /><span className="text-zinc-700">{client.phone}</span></div>}
                {client.website && <div className="flex items-center gap-3 text-sm"><Globe size={16} className="text-zinc-400" /><a href={client.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">{client.website}</a></div>}
                {(client.street || client.city) && <div className="flex items-center gap-3 text-sm"><MapPin size={16} className="text-zinc-400" /><span className="text-zinc-700">{[client.street, client.city, client.postcode].filter(Boolean).join(", ")}</span></div>}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-100"><h2 className="font-semibold text-zinc-900 flex items-center gap-2"><FolderKanban size={16} className="text-orange-500" />Projects ({clientProjects.length})</h2></div>
                {clientProjects.length === 0 ? <div className="py-8 text-center text-sm text-zinc-400">No projects yet</div> : (
                    <div className="divide-y divide-zinc-100">
                        {clientProjects.map((p: any) => (
                            <Link key={p._id} href={`/dashboard/projects/${p._id}`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                                <p className="text-sm font-medium text-zinc-900">{p.title}</p>
                                <span className="text-xs text-zinc-500 capitalize">{p.status.replace("_", " ")}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-100"><h2 className="font-semibold text-zinc-900 flex items-center gap-2"><FileText size={16} className="text-zinc-400" />Invoices ({clientInvoices.length})</h2></div>
                {clientInvoices.length === 0 ? <div className="py-8 text-center text-sm text-zinc-400">No invoices yet</div> : (
                    <div className="divide-y divide-zinc-100">
                        {clientInvoices.map((inv: any) => (
                            <Link key={inv._id} href={`/dashboard/invoices/${inv._id}`} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                                <div><p className="text-sm font-semibold font-mono text-zinc-900">{inv.invoiceNumber}</p><p className="text-xs text-zinc-500">{formatDate(inv.date)}</p></div>
                                <p className="text-sm font-bold text-zinc-900">{formatCurrency(inv.amount)}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
