"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Calendar, Trash2, List, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const EVENT_TYPES = ["appointment", "milestone", "supplier_order", "inspection"];
const TYPE_COLORS: Record<string, string> = {
    appointment: "bg-blue-100 text-blue-700",
    milestone: "bg-orange-100 text-orange-700",
    supplier_order: "bg-purple-100 text-purple-700",
    inspection: "bg-emerald-100 text-emerald-700",
};
const TYPE_DOT: Record<string, string> = {
    appointment: "bg-blue-500",
    milestone: "bg-orange-500",
    supplier_order: "bg-purple-500",
    inspection: "bg-emerald-500",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePage() {
    const events = useQuery(api.events.list) ?? [];
    const projects = useQuery(api.projects.list) ?? [];
    const createEvent = useMutation(api.events.create);
    const deleteEvent = useMutation(api.events.remove);

    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [calDate, setCalDate] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", type: "appointment", start: "", end: "", description: "", projectId: "" });
    const [saving, setSaving] = useState(false);

    const calYear = calDate.getFullYear();
    const calMonth = calDate.getMonth();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon=0
    const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    const today = new Date();
    const isToday = (day: number) => today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;

    const eventsOnDay = (day: number) => (events as any[]).filter((e) => {
        const d = new Date(e.start);
        return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
    });

    const upcoming = [...events as any[]].sort((a, b) => a.start - b.start).filter((e) => e.start >= Date.now());
    const past = [...events as any[]].sort((a, b) => b.start - a.start).filter((e) => e.start < Date.now());

    const handleCreate = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!form.title || !form.start) return;
        setSaving(true);
        await createEvent({
            title: form.title, type: form.type,
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
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group">
            <div className="text-center min-w-[3rem]">
                <p className="text-sm font-bold text-zinc-900">{new Date(event.start).getDate()}</p>
                <p className="text-xs text-zinc-400">{new Date(event.start).toLocaleString("default", { month: "short" })}</p>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{event.title}</p>
                {event.description && <p className="text-xs text-zinc-500 truncate">{event.description}</p>}
                <p className="text-xs text-zinc-400">{new Date(event.start).toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0", TYPE_COLORS[event.type] ?? "bg-zinc-100 text-zinc-600")}>
                {event.type.replace("_", " ")}
            </span>
            <button onClick={() => deleteEvent({ id: event._id })}
                className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
            </button>
        </div>
    );

    const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Schedule</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{upcoming.length} upcoming event{upcoming.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 rounded-xl p-1">
                        <button onClick={() => setView("calendar")}
                            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                                view === "calendar" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
                            <Calendar size={14} /> Calendar
                        </button>
                        <button onClick={() => setView("list")}
                            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                                view === "list" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
                            <List size={14} /> List
                        </button>
                    </div>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Plus size={16} /> Add Event
                    </button>
                </div>
            </div>

            {/* Add event form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-sm text-zinc-900">New Event</h2>
                        <button type="button" onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={15} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <input className={inputCls} placeholder="Event title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                        <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                            <option value="">No project</option>
                            {(projects as any[]).map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                        <input type="datetime-local" className={inputCls} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
                        <input type="datetime-local" className={inputCls} placeholder="End (optional)" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                        <div className="col-span-2">
                            <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saving ? "Saving…" : "Add Event"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
                    </div>
                </form>
            )}

            {/* Calendar view */}
            {view === "calendar" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button onClick={() => { setCalDate(new Date(calYear, calMonth - 1)); setSelectedDay(null); }}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500 hover:text-zinc-900">
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-base font-bold text-zinc-900">
                            {calDate.toLocaleString("default", { month: "long", year: "numeric" })}
                        </h2>
                        <button onClick={() => { setCalDate(new Date(calYear, calMonth + 1)); setSelectedDay(null); }}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500 hover:text-zinc-900">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className={cn("grid gap-4", selectedDay ? "md:grid-cols-[1fr,280px]" : "")}>
                        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
                                {WEEKDAYS.map((d) => (
                                    <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-400">{d}</div>
                                ))}
                            </div>
                            {/* Day cells */}
                            <div className="grid grid-cols-7 divide-x divide-zinc-100">
                                {cells.map((day, i) => {
                                    const dayEvents = day ? eventsOnDay(day) : [];
                                    const isSelected = day === selectedDay;
                                    const rowEnd = (i + 1) % 7 === 0;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => day && setSelectedDay(isSelected ? null : day)}
                                            className={cn(
                                                "min-h-[88px] p-2 border-b border-zinc-100 transition-colors",
                                                day ? "cursor-pointer" : "bg-zinc-50/40",
                                                day && !isSelected && "hover:bg-zinc-50",
                                                isSelected && "bg-orange-50/60",
                                                rowEnd && "border-r-0",
                                            )}
                                        >
                                            {day && (
                                                <>
                                                    <div className={cn(
                                                        "w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full mb-1 transition-colors",
                                                        isToday(day) ? "bg-orange-500 text-white" : "text-zinc-700",
                                                        isSelected && !isToday(day) && "bg-orange-100 text-orange-700",
                                                    )}>
                                                        {day}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {dayEvents.slice(0, 2).map((e: any) => (
                                                            <div key={e._id} className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight", TYPE_COLORS[e.type] ?? "bg-zinc-100 text-zinc-600")}>
                                                                {e.title}
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (
                                                            <p className="text-[10px] text-zinc-400 pl-1">+{dayEvents.length - 2} more</p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected day panel */}
                        {selectedDay && (
                            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden self-start">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                                    <h3 className="text-sm font-bold text-zinc-900">
                                        {calDate.toLocaleString("default", { month: "short" })} {selectedDay}
                                    </h3>
                                    <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600">
                                        <X size={14} />
                                    </button>
                                </div>
                                {selectedDayEvents.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-xs text-zinc-400">No events this day</div>
                                ) : (
                                    <div className="divide-y divide-zinc-100">
                                        {selectedDayEvents.map((e: any) => (
                                            <div key={e._id} className="px-4 py-3 group">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2.5 min-w-0">
                                                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", TYPE_DOT[e.type] ?? "bg-zinc-400")} />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900 truncate">{e.title}</p>
                                                            <p className="text-xs text-zinc-400">{new Date(e.start).toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })}</p>
                                                            {e.description && <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>}
                                                            <span className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 capitalize", TYPE_COLORS[e.type] ?? "bg-zinc-100 text-zinc-600")}>
                                                                {e.type.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteEvent({ id: e._id })}
                                                        className="p-1 hover:bg-red-50 rounded-lg text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {EVENT_TYPES.map((t) => (
                            <div key={t} className="flex items-center gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full", TYPE_DOT[t])} />
                                <span className="text-xs text-zinc-500 capitalize">{t.replace(/_/g, " ")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List view */}
            {view === "list" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-zinc-200">
                        <div className="px-6 py-4 border-b border-zinc-100">
                            <h2 className="font-semibold text-zinc-900">Upcoming</h2>
                        </div>
                        {upcoming.length === 0 ? (
                            <div className="py-12 text-center">
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
            )}
        </div>
    );
}
