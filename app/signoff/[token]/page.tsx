"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import { SignaturePad } from "@/components/SignaturePad";
import { CheckCircle, Camera, X, MapPin, Building2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function SignoffPage() {
    const { token } = useParams<{ token: string }>();
    const data = useQuery(api.signoffs.getByToken, { token });
    const complete = useMutation(api.signoffs.complete);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [supervisorName, setSupervisorName] = useState("");
    const [workDescription, setWorkDescription] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [photoIds, setPhotoIds] = useState<Id<"_storage">[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (data === undefined) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (data === null) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                    <p className="text-lg font-bold text-zinc-900">Link not found</p>
                    <p className="text-sm text-zinc-500">This sign-off link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    const { signoff, project, client } = data;

    if (submitted || signoff.status === "completed") {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-bold text-zinc-900">Signed off</p>
                        <p className="text-sm text-zinc-500">
                            {signoff.status === "completed" && !submitted
                                ? "This project has already been signed off."
                                : `Thank you, ${supervisorName || signoff.supervisorName}. The sign-off has been recorded.`}
                        </p>
                    </div>
                    <p className="text-xs text-zinc-400">{project.title}</p>
                </div>
            </div>
        );
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        for (const file of files) {
            const uploadUrl = await generateUploadUrl({});
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await response.json();
            setPhotoIds((prev) => [...prev, storageId as Id<"_storage">]);
            setPhotoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
        }
        e.target.value = "";
    };

    const removePhoto = (index: number) => {
        setPhotoIds((prev) => prev.filter((_, i) => i !== index));
        setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!supervisorName.trim()) { setError("Please enter your name before signing"); return; }
        if (!signatureData) { setError("Please sign in the box before submitting"); return; }
        setError("");
        setSubmitting(true);
        try {
            await complete({
                token,
                supervisorName: supervisorName.trim(),
                workDescription: workDescription.trim() || undefined,
                checkIn: checkIn || undefined,
                checkOut: checkOut || undefined,
                signatureData,
                photoIds: photoIds.length > 0 ? photoIds : undefined,
            });
            setSubmitted(true);
        } catch (e: any) {
            setError(e.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const address = [project.siteAddress, project.siteCity, project.sitePostcode].filter(Boolean).join(", ");

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-5 py-4 flex items-center gap-3">
                <Image src="/arcocen-logo.png" alt="Arcocen" width={32} height={32} className="rounded-lg flex-shrink-0" />
                <div>
                    <p className="font-bold text-sm text-zinc-900">Arco<span className="text-sky-500">cen</span></p>
                    <p className="text-xs text-zinc-400">Project sign-off</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
                {/* Project card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 size={18} className="text-sky-500" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900">{project.title}</p>
                            {client && <p className="text-sm text-zinc-500">{client.name}</p>}
                            {address && (
                                <div className="flex items-center gap-1 mt-1">
                                    <MapPin size={12} className="text-zinc-400" />
                                    <p className="text-xs text-zinc-400">{address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {project.description && (
                        <p className="text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">{project.description}</p>
                    )}
                </div>

                {/* Work details */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
                    <p className="text-sm font-semibold text-zinc-700">Work details</p>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Work performed</label>
                        <textarea
                            value={workDescription}
                            onChange={(e) => setWorkDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe the work that was completed..."
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Check-in time</label>
                            <input
                                type="time"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Check-out time</label>
                            <input
                                type="time"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                    <p className="text-sm font-semibold text-zinc-700">Photos <span className="font-normal text-zinc-400">(optional)</span></p>

                    {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {photoPreviews.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                                    >
                                        <X size={10} className="text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-xl text-sm text-zinc-500 hover:border-sky-300 hover:text-sky-500 transition-colors"
                    >
                        <Camera size={16} />
                        Take photo or upload
                    </button>
                </div>

                {/* Signature section */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-zinc-700 mb-1">Supervisor sign-off</p>
                        <p className="text-xs text-zinc-400">By signing below, you confirm the work described above has been completed to your satisfaction.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Full name <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Signature <span className="text-red-400">*</span></label>
                        <SignaturePad onChange={setSignatureData} />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors text-base"
                >
                    {submitting ? "Submitting…" : "Sign & Submit"}
                </button>

                <p className="text-center text-xs text-zinc-400 pb-4">
                    Your signature is recorded digitally and stored securely.
                </p>
            </div>
        </div>
    );
}
