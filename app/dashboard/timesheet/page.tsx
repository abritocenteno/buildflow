"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate, cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Clock, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function TimesheetPage() {
    const entries = useQuery(api.timeEntries.list) ?? [];
    const projects = useQuery(api.projects.list) ?? [];
    const createEntry = useMutation(api.timeEntries.create);
    const deleteEntry = useMutation(api.timeEntries.remove);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        projectId: "",
        date: new Date().toISOString().split("T")[0],
        hours: "",
        minutes: "",
        description: "",
        billable: true,
        hourlyRate: "",
        workerName: "",
    });
    const [saving, setSaving] = useState(false);

    const totalHours = entries.reduce((sum: number, e: any) => sum + e.durationMinutes, 0);

    const handleCreate = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!form.projectId) return;
        setSaving(true);
        try {
            const duration = (parseInt(form.hours) || 0) * 60 + (parseInt(form.minutes) || 0);
            await createEntry({
                projectId: form.projectId as Id<"projects">,
                date: new Date(form.date).getTime(),
                durationMinutes: duration,
                description: form.description || undefined,
                billable: form.billable,
                hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
                workerName: form.workerName || undefined,
            });
            setForm({ projectId: "", date: new Date().toISOString().split("T")[0], hours: "", minutes: "", description: "", billable: true, hourlyRate: "", workerName: "" });
            setShowForm(false);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Timesheet</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {Math.floor(totalHours / 60)}h {totalHours % 60}m total logged
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> Log Time
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-zinc-900">New Time Entry</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Project *</label>
                            <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                                <option value="">Select a project…</option>
                                {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Date</label>
                            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Worker</label>
                            <input className={inputCls} placeholder="Name (optional)" value={form.workerName} onChange={(e) => setForm({ ...form, workerName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Hours</label>
                            <input type="number" min={0} className={inputCls} placeholder="0" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Minutes</label>
                            <input type="number" min={0} max={59} className={inputCls} placeholder="0" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Hourly Rate (€)</label>
                            <input type="number" min={0} step="0.01" className={inputCls} placeholder="0.00" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-3 pt-5">
                            <input type="checkbox" id="billable" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                            <label htmlFor="billable" className="text-sm text-zinc-700 font-medium">Billable</label>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Description</label>
                            <input className={inputCls} placeholder="What was done…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                            {saving ? "Saving…" : "Log Time"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Project</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Worker</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Duration</th>
                            <th className="text-center px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Billable</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Clock size={32} className="mx-auto text-zinc-300 mb-3" />
                                    <p className="text-sm text-zinc-400">No time entries yet</p>
                                </td>
                            </tr>
                        )}
                        {entries.map((entry: any) => (
                            <tr key={entry._id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 text-zinc-600">{formatDate(entry.date)}</td>
                                <td className="px-6 py-4 text-zinc-900 font-medium hidden sm:table-cell">{entry.project?.title ?? "—"}</td>
                                <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">{entry.description ?? "—"}</td>
                                <td className="px-6 py-4 text-zinc-500 hidden lg:table-cell">{entry.workerName ?? "—"}</td>
                                <td className="px-6 py-4 text-right font-semibold text-zinc-900">
                                    {Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m
                                </td>
                                <td className="px-6 py-4 text-center hidden md:table-cell">
                                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", entry.billable ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                                        {entry.billable ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => deleteEntry({ id: entry._id })}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
