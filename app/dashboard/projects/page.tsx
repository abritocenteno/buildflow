"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus, LayoutGrid, List, MapPin, Calendar, DollarSign, ChevronRight, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import ExportMenu from "@/components/ExportMenu";
import { projectColumns } from "@/lib/export-columns";

const STATUSES = [
    { key: "planning", label: "Planning", color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
    { key: "permitting", label: "Permitting", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "in_progress", label: "In Progress", color: "bg-sky-100 text-sky-700 border-sky-200" },
    { key: "punch_list", label: "Punch List", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { key: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "closed", label: "Closed", color: "bg-zinc-200 text-zinc-500 border-zinc-300" },
];

function ProjectCard({ project, onDelete }: { project: any; onDelete?: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const status = STATUSES.find((s) => s.key === project.status);
    return (
        <div className="relative group">
            <Link
                href={`/dashboard/projects/${project._id}`}
                className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-sky-300 hover:shadow-md transition-all group block"
            >
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-zinc-900 text-sm group-hover:text-sky-600 transition-colors leading-snug">{project.title}</h3>
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0", status?.color ?? "bg-zinc-100 text-zinc-500 border-zinc-200")}>
                        {status?.label ?? project.status}
                    </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{project.client?.name}</p>
                {project.siteAddress && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                        <MapPin size={12} />
                        <span className="truncate">{project.siteAddress}</span>
                    </div>
                )}
                {project.progress !== undefined && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-400">Progress</span>
                            <span className="text-xs font-medium text-zinc-600">{project.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full">
                            <div
                                className="h-1.5 bg-sky-500 rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-400">
                    {project.estimatedBudget ? (
                        <span className="flex items-center gap-1"><DollarSign size={11} />{formatCurrency(project.estimatedBudget)}</span>
                    ) : <span />}
                    {project.endDate && (
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(project.endDate)}</span>
                    )}
                </div>
            </Link>
            {onDelete && (
                confirming ? (
                    <div className="absolute inset-0 bg-white/95 rounded-2xl border border-red-200 flex flex-col items-center justify-center gap-2 p-4">
                        <p className="text-sm font-semibold text-zinc-800">Delete project?</p>
                        <p className="text-xs text-zinc-500 text-center">This cannot be undone.</p>
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => setConfirming(false)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">Cancel</button>
                            <button onClick={onDelete} className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.preventDefault(); setConfirming(true); }}
                        className="absolute bottom-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                )
            )}
        </div>
    );
}

export default function ProjectsPage() {
    const projects = useQuery(api.projects.list) ?? [];
    const settings = useQuery(api.settings.get);
    const updateStatus = useMutation(api.projects.updateStatus);
    const deleteProject = useMutation(api.projects.remove);
    const router = useRouter();
    const [view, setView] = useState<"kanban" | "list">("kanban");
    const [filter, setFilter] = useState("all");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        await deleteProject({ id: id as Id<"projects"> });
        setConfirmDeleteId(null);
    }

    const filtered = filter === "all" ? projects : projects.filter((p: any) => p.status === filter);

    const kanbanStatuses = STATUSES.filter((s) => s.key !== "closed");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{projects.length} total · {projects.filter((p: any) => !["completed", "closed"].includes(p.status)).length} active</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 rounded-xl p-1">
                        <button
                            onClick={() => setView("kanban")}
                            className={cn("p-2 rounded-lg transition-all", view === "kanban" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <ExportMenu rows={filtered} columns={projectColumns} filename="projects" sheetName="Projects" currency={settings?.currency} />
                    <Link
                        href="/dashboard/projects/new"
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-sky-500/20"
                    >
                        <Plus size={16} />
                        New Project
                    </Link>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setFilter("all")}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all", filter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
                >
                    All ({projects.length})
                </button>
                {STATUSES.map((s) => {
                    const count = projects.filter((p: any) => p.status === s.key).length;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setFilter(s.key)}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all", filter === s.key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
                        >
                            {s.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Kanban View */}
            {view === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
                    {kanbanStatuses.map((status) => {
                        const cols = projects.filter((p: any) => p.status === status.key);
                        return (
                            <div key={status.key} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", status.color)}>
                                        {status.label}
                                    </span>
                                    <span className="text-xs text-zinc-400 font-medium">{cols.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {cols.map((project: any) => (
                                        <ProjectCard key={project._id} project={project} onDelete={() => handleDelete(project._id)} />
                                    ))}
                                    {cols.length === 0 && (
                                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center text-xs text-zinc-400">
                                            No projects
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {view === "list" && (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Project</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Budget</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">End Date</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-zinc-400 text-sm">No projects found</td>
                                </tr>
                            )}
                            {filtered.map((project: any) => {
                                const status = STATUSES.find((s) => s.key === project.status);
                                return (
                                    <tr key={project._id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/projects/${project._id}`} className="font-medium text-zinc-900 hover:text-sky-600">
                                                {project.title}
                                            </Link>
                                            {project.siteAddress && <p className="text-xs text-zinc-400 mt-0.5">{project.siteAddress}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 hidden sm:table-cell">{project.client?.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", status?.color ?? "bg-zinc-100 text-zinc-500 border-zinc-200")}>
                                                {status?.label ?? project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 hidden lg:table-cell">
                                            {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 hidden lg:table-cell">
                                            {project.endDate ? formatDate(project.endDate) : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {confirmDeleteId === project._id ? (
                                                    <>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
                                                        <button onClick={() => handleDelete(project._id)} className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors">Delete</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(project._id)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                        <Link href={`/dashboard/projects/${project._id}`} className="text-zinc-400 hover:text-sky-500 transition-colors">
                                                            <ChevronRight size={18} />
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
