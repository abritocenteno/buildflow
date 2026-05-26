"use client";

import { Bell } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { formatDate } from "@/lib/utils";

export function NotificationBell() {
    const notifications = useQuery(api.notifications.list) ?? [];
    const markRead = useMutation(api.notifications.markRead);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const unread = notifications.filter((n) => !n.read);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
            >
                <Bell size={18} />
                {unread.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                        {unread.length > 0 && (
                            <button
                                onClick={() => unread.forEach((n) => markRead({ key: n.key }))}
                                className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                        {notifications.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-zinc-400">
                                No notifications
                            </div>
                        )}
                        {notifications.map((n) => (
                            <div
                                key={n.key}
                                className={`px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? "bg-orange-50" : ""}`}
                            >
                                <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                                <p className="text-xs text-zinc-400 mt-1">{formatDate(n.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
