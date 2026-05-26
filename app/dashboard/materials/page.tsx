"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, Package, AlertTriangle } from "lucide-react";

export default function MaterialsPage() {
    const materials = useQuery(api.materials.list) ?? [];

    const lowStock = materials.filter((m: any) => m.reorderThreshold && m.quantity <= m.reorderThreshold);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Materials</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{materials.length} items{lowStock.length > 0 ? ` · ${lowStock.length} low stock` : ""}</p>
                </div>
                <Link href="/dashboard/materials/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Material
                </Link>
            </div>

            {lowStock.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-800">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} below reorder threshold: {lowStock.map((m: any) => m.name).join(", ")}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">SKU</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Qty</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Unit Cost</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {materials.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Package size={32} className="mx-auto text-zinc-300 mb-3" />
                                    <p className="text-sm text-zinc-400">No materials tracked yet</p>
                                </td>
                            </tr>
                        )}
                        {materials.map((m: any) => {
                            const isLow = m.reorderThreshold && m.quantity <= m.reorderThreshold;
                            return (
                                <tr key={m._id} className={cn("hover:bg-zinc-50 transition-colors cursor-pointer", isLow && "bg-amber-50/50")}
                                    onClick={() => window.location.href = `/dashboard/materials/${m._id}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isLow && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />}
                                            <span className="font-medium text-zinc-900">{m.name}</span>
                                        </div>
                                        {m.description && <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell capitalize">{m.category ?? "—"}</td>
                                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs hidden md:table-cell">{m.sku ?? "—"}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-zinc-900">{m.quantity} {m.unit ?? "pcs"}</td>
                                    <td className="px-6 py-4 text-right text-zinc-600 hidden lg:table-cell">{m.unitCost ? formatCurrency(m.unitCost) : "—"}</td>
                                    <td className="px-6 py-4 text-right text-zinc-600 hidden lg:table-cell">
                                        {m.unitCost ? formatCurrency(m.unitCost * m.quantity) : "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
