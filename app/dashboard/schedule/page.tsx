"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate, cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const EVENT_TYPES = ["appointment", "milestone", "supplier_order", "inspection"];
const TYPE_COLORS: Record<string, string> = {
    appointment: "bg-blue-100 text-blue-700",
    milestone: "bg-orange-100 text-orange-700",
    supplier_order: "bg-purple-100 text-purple-700",
    inspection: "bg-emerald-100 text-emerald-700",
};

export default function SchedulePage() {
    const events = useQuery(api.events.list) ?? [];
    const projects = useQuery(api.projects.list) ?? [];
    const createEvent = useMutation(api.events.create);
    const deleteEvent = useMutation(api.events.remove);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", type: "appointment", start: "", end: "", description: "", projectId: "" });
    const [saving, setSaving] = useState(false);

    const upcoming = [...events].sort((a, b) => a.start - b.start).filter((e: any) => e.start >= Date.now());
    const past = [...events].sort((a, b) => b.start - a.start).filter((e: any) => e.start < Date.now());

    const handleCreate = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!form.title || !form.start) return;
        setSaving(true);
        await createEvent({
            title: form.title,
            type: form.type,
            start: new Date(form.start).getTime(),
            end: form.end ? new Date(form.end).getTime() : undefined,
            description: form.description || undefined,
            projectId: form.projectId ? form.projectId as Id<"projects"> : undefined,
        });
        setForm({ title: "", type: "appointment", start: "", end: "", description: "", projectId: "" });
        setShowForm(false);
        setSaving(false);
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";

    const EventRow = ({ event }: { event: any }) => (
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
            <div className="text-center min-w-[3rem]">
                <p className="text-xs font-bold text-zinc-900">{new Date(event.start).getDate()}</p>
                <p className="text-xs text-zinc-400">{new Date(event.start).toLocaleString("default", { month: "short" })}</p>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{event.title}</p>
                {event.description && <p className="text-xs text-zinc-500 truncate">{event.description}</p>}
            </div>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0", TYPE_COLORS[event.type] ?? "bg-zinc-100 text-zinc-600")}>
                {event.type.replace("_", " ")}
            </span>
            <button onClick={() => deleteEvent({ id: event._id })} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <Trash2 size={14} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Schedule</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{upcoming.length} upcoming events</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Event
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-zinc-900">New Event</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <input className={inputCls} placeholder="Event title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                            </select>
                        </div>
                        <div>
                            <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                                <option value="">No project</option>
                                {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <input type="datetime-local" className={inputCls} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
                        </div>
                        <div>
                            <input type="datetime-local" className={inputCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                            {saving ? "Saving…" : "Add Event"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-2xl border border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-100">
                    <h2 className="font-semibold text-zinc-900">Upcoming</h2>
                </div>
                {upcoming.length === 0 ? (
                    <div className="py-10 text-center">
                        <Calendar size={28} className="mx-auto text-zinc-300 mb-3" />
                        <p className="text-sm text-zinc-400">No upcoming events</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {upcoming.map((e: any) => <EventRow key={e._id} event={e} />)}
                    </div>
                )}
            </div>

            {past.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200">
                    <div className="px-6 py-4 border-b border-zinc-100">
                        <h2 className="font-semibold text-zinc-500">Past Events</h2>
                    </div>
                    <div className="divide-y divide-zinc-100 opacity-60">
                        {past.slice(0, 10).map((e: any) => <EventRow key={e._id} event={e} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
