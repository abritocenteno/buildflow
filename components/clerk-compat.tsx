"use client";

import dynamic from "next/dynamic";

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

const DynamicSignInButton = !isPreview
    ? dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignInButton })))
    : null;

const DynamicUserButton = !isPreview
    ? dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.UserButton })))
    : null;

export function SignInButton({ children, mode }: { children: React.ReactNode; mode?: "modal" | "redirect" }) {
    if (isPreview || !DynamicSignInButton) return <>{children}</>;
    return <DynamicSignInButton mode={mode} forceRedirectUrl="/dashboard">{children as any}</DynamicSignInButton>;
}

export function UserButton(props: Record<string, unknown>) {
    if (isPreview || !DynamicUserButton) return null;
    return <DynamicUserButton {...props} />;
}
