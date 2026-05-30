"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Printer, Send, MapPin, Clock, FileText } from "lucide-react";
import { useState, useRef } from "react";

interface Props {
    signoffId: Id<"signoffs">;
    onClose: () => void;
}

export function SignoffDetailModal({ signoffId, onClose }: Props) {
    const data = useQuery(api.signoffs.getById, { id: signoffId });
    const sendEmail = useAction(api.resend.sendSignoffCompletionEmail);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent) return;
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sign-off — ${data?.project?.title ?? ""}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: sans-serif; color: #18181b; padding: 40px; }
                    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 4px; }
                    .value { font-size: 14px; color: #18181b; }
                    .section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e4e4e7; }
                    .section:last-child { border-bottom: none; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
                    .title { font-size: 22px; font-weight: 900; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .sig-box { border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; }
                    .sig-box img { max-width: 100%; height: auto; max-height: 120px; }
                    .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
                    .photos img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
                    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
                </style>
            </head>
            <body>${printContent}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    const handleResend = async () => {
        if (!data) return;
        setSending(true);
        try {
            await sendEmail({ signoffId });
            setSent(true);
            setTimeout(() => setSent(false), 3000);
        } finally {
            setSending(false);
        }
    };

    if (!data) {
        return (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8">
                    <div className="w-7 h-7 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const { project, client, photoUrls, ...signoff } = data;
    const address = [project?.siteAddress, project?.siteCity, project?.sitePostcode].filter(Boolean).join(", ");
    const signedAt = signoff.completedAt ? new Date(signoff.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
    const sentAt = signoff.sentAt ? new Date(signoff.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

    const printBody = `
        <div class="header">
            <div>
                <div class="title">Project Sign-off</div>
                <div style="font-size:13px;color:#71717a;margin-top:4px;">${project?.title ?? ""}</div>
            </div>
            <div style="text-align:right;">
                <div class="badge">Signed</div>
                ${signedAt ? `<div style="font-size:12px;color:#71717a;margin-top:6px;">${signedAt}</div>` : ""}
            </div>
        </div>

        <div class="section">
            <div class="grid">
                <div>
                    <div class="label">Client</div>
                    <div class="value">${client?.name ?? signoff.clientName}</div>
                    <div style="font-size:13px;color:#71717a;">${signoff.clientEmail}</div>
                </div>
                ${address ? `<div>
                    <div class="label">Site address</div>
                    <div class="value">${address}</div>
                </div>` : ""}
            </div>
        </div>

        ${signoff.workDescription ? `<div class="section">
            <div class="label">Work performed</div>
            <div class="value" style="margin-top:4px;line-height:1.6;">${signoff.workDescription}</div>
        </div>` : ""}

        ${(signoff.checkIn || signoff.checkOut) ? `<div class="section">
            <div class="grid">
                ${signoff.checkIn ? `<div><div class="label">Check-in</div><div class="value">${signoff.checkIn}</div></div>` : ""}
                ${signoff.checkOut ? `<div><div class="label">Check-out</div><div class="value">${signoff.checkOut}</div></div>` : ""}
            </div>
        </div>` : ""}

        ${photoUrls.length > 0 ? `<div class="section">
            <div class="label">Site photos</div>
            <div class="photos">${photoUrls.map(url => `<img src="${url}" />`).join("")}</div>
        </div>` : ""}

        <div class="section">
            <div class="label">Supervisor sign-off</div>
            <div style="margin-top:8px;">
                <div class="value" style="font-weight:700;margin-bottom:8px;">${signoff.supervisorName ?? ""}</div>
                ${signoff.signatureData ? `<div class="sig-box"><img src="${signoff.signatureData}" /></div>` : ""}
            </div>
        </div>

        <div style="font-size:11px;color:#a1a1aa;margin-top:32px;">
            Sent ${sentAt ?? ""}${signedAt ? ` · Signed ${signedAt}` : ""}
        </div>
    `;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <div>
                        <h3 className="font-bold text-zinc-900">Sign-off details</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{project?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResend}
                            disabled={sending}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        >
                            <Send size={13} />
                            {sending ? "Sending…" : sent ? "Sent!" : "Email PDF"}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                        >
                            <Printer size={13} />
                            Print / PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-6">
                    {/* Hidden print source */}
                    <div ref={printRef} dangerouslySetInnerHTML={{ __html: printBody }} className="hidden" />

                    <div className="space-y-5">
                        {/* Status + dates */}
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                ✓ Signed off
                            </span>
                            <div className="text-right text-xs text-zinc-400 space-y-0.5">
                                {sentAt && <p>Sent {sentAt}</p>}
                                {signedAt && <p className="font-medium text-zinc-600">Signed {signedAt}</p>}
                            </div>
                        </div>

                        {/* Client + address */}
                        <div className="bg-zinc-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Client</p>
                                <p className="text-sm font-medium text-zinc-900">{client?.name ?? signoff.clientName}</p>
                                <p className="text-xs text-zinc-500">{signoff.clientEmail}</p>
                            </div>
                            {address && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Site</p>
                                    <div className="flex items-start gap-1">
                                        <MapPin size={12} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-zinc-600">{address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Work description */}
                        {signoff.workDescription && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <FileText size={13} className="text-zinc-400" />
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Work performed</p>
                                </div>
                                <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 rounded-xl p-4">{signoff.workDescription}</p>
                            </div>
                        )}

                        {/* Times */}
                        {(signoff.checkIn || signoff.checkOut) && (
                            <div className="flex items-center gap-4">
                                <Clock size={13} className="text-zinc-400" />
                                {signoff.checkIn && <div><p className="text-xs text-zinc-400">Check-in</p><p className="text-sm font-medium">{signoff.checkIn}</p></div>}
                                {signoff.checkIn && signoff.checkOut && <div className="w-px h-8 bg-zinc-200" />}
                                {signoff.checkOut && <div><p className="text-xs text-zinc-400">Check-out</p><p className="text-sm font-medium">{signoff.checkOut}</p></div>}
                            </div>
                        )}

                        {/* Photos */}
                        {photoUrls.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Photos</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {photoUrls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden bg-zinc-100 block">
                                            <img src={url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Signature */}
                        <div>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Signature</p>
                            <div className="border border-zinc-200 rounded-2xl p-4 space-y-2 bg-white">
                                <p className="text-sm font-bold text-zinc-900">{signoff.supervisorName}</p>
                                {signoff.signatureData && (
                                    <img
                                        src={signoff.signatureData}
                                        alt="Signature"
                                        className="max-h-28 w-auto"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
