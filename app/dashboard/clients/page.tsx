"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ExportMenu from "@/components/ExportMenu";
import { clientColumns } from "@/lib/export-columns";

export default function ClientsPage() {
    const clients = useQuery(api.clients.list) ?? [];
    const [search, setSearch] = useState("");

    const filtered = clients.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Clients</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{clients.length} clients</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportMenu rows={filtered} columns={clientColumns} filename="clients" sheetName="Clients" />
                    <Link href="/dashboard/clients/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Plus size={16} /> New Client
                    </Link>
                </div>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clients…"
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                {filtered.length === 0 && (
                    <div className="py-12 text-center">
                        <Users size={32} className="mx-auto text-zinc-300 mb-3" />
                        <p className="text-sm text-zinc-400">{search ? "No clients match your search" : "No clients yet"}</p>
                    </div>
                )}
                {filtered.map((client: any) => (
                    <Link
                        key={client._id}
                        href={`/dashboard/clients/${client._id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-sky-600">{client.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900">{client.name}</p>
                            <p className="text-xs text-zinc-500">{client.email}{client.city ? ` · ${client.city}` : ""}</p>
                        </div>
                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", client.type === "business" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600")}>
                            {client.type}
                        </span>
                        <ChevronRight size={18} className="text-zinc-400 flex-shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
