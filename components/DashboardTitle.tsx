"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DashboardTitle() {
    const settings = useQuery(api.settings.get);

    useEffect(() => {
        if (settings?.companyName) {
            document.title = `${settings.companyName} — BuildFlow`;
        }
    }, [settings?.companyName]);

    return null;
}
