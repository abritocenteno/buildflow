"use client";

import { UserButton } from "@/components/clerk-compat";
import {
    Users,
    Truck,
    FileText,
    LayoutDashboard,
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    ShoppingBag,
    RefreshCw,
    BarChart2,
    Package,
    Search,
    Clock,
    FolderKanban,
    HardHat,
    ClipboardList,
    Receipt,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function SessionRecoveryButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
            <RefreshCw size={18} />
            Reconnect Session
        </button>
    );
}

const SidebarItem = ({
    icon: Icon,
    label,
    href,
    active,
    collapsed,
}: {
    icon: React.ElementType;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
}) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-xl group relative",
            active
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
        )}
    >
        <Icon size={20} className="flex-shrink-0 transition-transform group-hover:scale-110" />
        {!collapsed && <span className="truncate">{label}</span>}
        {collapsed && active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 rounded-r-full" />
        )}
    </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const settings = useQuery(api.settings.get);

    useEffect(() => {
        if (settings === null) {
            router.push("/onboarding");
        }
    }, [settings]);

    const navigation = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
        { label: "Quotes", icon: ClipboardList, href: "/dashboard/quotes" },
        { label: "Purchase Orders", icon: Receipt, href: "/dashboard/purchase-orders" },
        { label: "Clients", icon: Users, href: "/dashboard/clients" },
        { label: "Subcontractors", icon: HardHat, href: "/dashboard/subcontractors" },
        { label: "Suppliers", icon: Truck, href: "/dashboard/suppliers" },
        { label: "Invoices", icon: FileText, href: "/dashboard/invoices" },
        { label: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
        { label: "Materials", icon: Package, href: "/dashboard/materials" },
        { label: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
        { label: "Timesheet", icon: Clock, href: "/dashboard/timesheet" },
        { label: "Reports", icon: BarChart2, href: "/dashboard/reports" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    ];

    const Logo = () => (
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30 flex-shrink-0">
                <span className="font-black text-base leading-none">B</span>
            </div>
            {!collapsed && (
                <span className="font-black text-xl tracking-tight text-zinc-900">
                    Build<span className="text-sky-500">Flow</span>
                </span>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            <GlobalSearch />

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-200 transition-all duration-300 hidden lg:flex flex-col",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-100">
                    <Logo />
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                <div className="p-3 border-t border-zinc-100">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                    >
                        {collapsed ? (
                            <ChevronRight size={20} className="mx-auto" />
                        ) : (
                            <>
                                <ChevronLeft size={20} />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-transform duration-300 lg:hidden flex flex-col",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-100">
                    <Logo />
                    <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                        <X size={18} />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-3 space-y-1" onClick={() => setMobileOpen(false)}>
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                            collapsed={false}
                        />
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 min-h-screen relative flex flex-col",
                    "lg:ml-64",
                    collapsed && "lg:ml-20"
                )}
            >
                <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 flex items-center justify-between">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={() => {
                                const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                                window.dispatchEvent(e);
                            }}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 rounded-xl text-xs font-medium transition-all"
                        >
                            <Search size={14} />
                            <span>Search</span>
                            <kbd className="ml-1 px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold shadow-sm text-zinc-400">⌘K</kbd>
                        </button>
                        <ThemeToggle />
                        <Authenticated>
                            <NotificationBell />
                            <UserButton afterSignOutUrl="/" />
                        </Authenticated>
                    </div>
                </header>

                <div className="flex-1 p-6 lg:p-8">
                    <Authenticated>{children}</Authenticated>
                    <Unauthenticated>
                        <div className="h-full flex flex-col items-center justify-center space-y-6 py-24">
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                                <Users size={32} />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                                <p className="text-zinc-500 max-w-sm">Please sign in to access the Arcocen dashboard.</p>
                            </div>
                            <SessionRecoveryButton />
                        </div>
                    </Unauthenticated>
                    <AuthLoading>
                        <div className="h-full flex items-center justify-center py-24">
                            <div className="w-8 h-8 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
                        </div>
                    </AuthLoading>
                </div>
            </main>
        </div>
    );
}
