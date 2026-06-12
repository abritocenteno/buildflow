"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const appearance = {
    variables: {
        colorPrimary: "#0ea5e9",
        colorBackground: "#18181b",
        colorText: "#ffffff",
        colorTextSecondary: "#a1a1aa",
        colorInputBackground: "#09090b",
        colorInputText: "#ffffff",
        colorNeutral: "#52525b",
        borderRadius: "0.75rem",
        fontFamily: "inherit",
    },
    elements: {
        rootBox: "w-full",
        card: "bg-zinc-900 border border-white/10 shadow-2xl shadow-black/50",
        headerTitle: "text-white font-black",
        headerSubtitle: "text-zinc-400",
        socialButtonsBlockButton: "bg-zinc-800 border-white/10 text-white hover:bg-zinc-700 transition-colors",
        socialButtonsBlockButtonText: "text-white font-medium",
        formFieldInput: "bg-zinc-950 border-white/10 text-white placeholder:text-zinc-600 focus:border-sky-500/60 focus:ring-sky-500/20",
        formFieldLabel: "text-zinc-400 text-xs font-semibold",
        formButtonPrimary: "bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-lg shadow-sky-500/25",
        footerActionLink: "text-sky-400 hover:text-sky-300 font-semibold",
        footerActionText: "text-zinc-500",
        dividerLine: "bg-white/10",
        dividerText: "text-zinc-500 text-xs",
        identityPreviewText: "text-white",
        identityPreviewEditButton: "text-sky-400 hover:text-sky-300",
        alertText: "text-red-400",
        formResendCodeLink: "text-sky-400 hover:text-sky-300",
        otpCodeFieldInput: "bg-zinc-950 border-white/10 text-white",
        badge: "bg-sky-500/20 text-sky-300",
    },
};

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(14,165,233,0.18) 0%, transparent 65%)" }} />
            {/* Dot grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.3]"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            {/* Nav */}
            <div className="relative z-10 h-16 flex items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/40">
                        <span className="font-black text-base leading-none">B</span>
                    </div>
                    <span className="font-black text-xl tracking-tight text-white">
                        Build<span className="text-sky-400">Flow</span>
                    </span>
                </Link>
                <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                    <ArrowLeft size={14} />
                    Back to home
                </Link>
            </div>

            {/* Centered sign-in */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
                <SignIn appearance={appearance} />
            </div>
        </div>
    );
}
