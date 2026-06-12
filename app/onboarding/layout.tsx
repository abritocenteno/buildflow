export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <div className="h-16 bg-white border-b border-zinc-100 flex items-center px-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                        <span className="font-black text-base leading-none">B</span>
                    </div>
                    <span className="font-black text-xl tracking-tight text-zinc-900">
                        Build<span className="text-sky-500">Flow</span>
                    </span>
                </div>
            </div>
            <div className="flex-1 flex items-start justify-center pt-12 px-4 pb-12">
                {children}
            </div>
        </div>
    );
}
