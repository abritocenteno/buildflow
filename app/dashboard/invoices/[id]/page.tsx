"use client";

import { use, Suspense, useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ArrowLeft,
    FileText,
    Download,
    Mail,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Banknote,
    ChevronDown,
    RotateCcw,
    FolderKanban,
    Timer,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    overdue: "bg-red-50 text-red-700 border border-red-100",
};

const TYPE_BADGE: Record<string, string> = {
    progress: "bg-blue-50 text-blue-700 border border-blue-100",
    final: "bg-zinc-100 text-zinc-700",
    deposit: "bg-purple-50 text-purple-700 border border-purple-100",
};

async function buildPdf(el: HTMLElement, compress = false): Promise<jsPDF> {
    const A4W = 210, A4H = 297;
    const dataUrl = await toPng(el, {
        quality: compress ? 0.8 : 1.0,
        pixelRatio: compress ? 1.5 : 2,
        backgroundColor: "#ffffff",
        style: { transform: "scale(1)", transformOrigin: "top left", width: "900px", margin: "0" },
    });

    const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx2d = canvas.getContext("2d")!;
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    ctx2d.drawImage(img, 0, 0);

    const totalHMm = (img.height / img.width) * A4W;
    const pageHPx = Math.round((A4H / totalHMm) * img.height);

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress });
    const slice = document.createElement("canvas");
    slice.width = img.width;

    let pos = 0;
    while (pos < img.height) {
        const h = Math.min(pageHPx, img.height - pos);
        const hMm = (h / img.width) * A4W;
        slice.height = h;
        const sc = slice.getContext("2d")!;
        sc.fillStyle = "#ffffff";
        sc.fillRect(0, 0, img.width, h);
        sc.drawImage(canvas, 0, pos, img.width, h, 0, 0, img.width, h);
        if (pos > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, A4W, hMm, undefined, compress ? "FAST" : "NONE");
        pos += h;
    }

    return pdf;
}

const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Card", "Cheque", "Other"];

function InvoiceDetail({ id }: { id: Id<"invoices"> }) {
    const router = useRouter();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const invoice = useQuery(api.invoices.get, { id });
    const settings = useQuery(api.settings.get);

    const unbilledEntries = useQuery(
        api.timeEntries.listUnbilledByProject,
        invoice?.projectId ? { projectId: invoice.projectId as Id<"projects"> } : "skip"
    );

    const markPaid = useMutation(api.invoices.markPaid);
    const updateInvoice = useMutation(api.invoices.update);
    const importTimeEntries = useMutation(api.timeEntries.importToInvoice);
    const sendEmailAction = useAction(api.resend.sendInvoiceEmail);
    const sendReminderAction = useAction(api.resend.sendOverdueReminderEmail);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderSent, setReminderSent] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [payMethod, setPayMethod] = useState("Bank Transfer");
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [isImportingTime, setIsImportingTime] = useState(false);

    const handleMarkPaid = async () => {
        if (!invoice) return;
        setIsMarkingPaid(true);
        try {
            await markPaid({ id: invoice._id, paymentMethod: payMethod });
            setShowPayModal(false);
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const handleMarkUnpaid = async () => {
        if (!invoice || !confirm("Revert to unpaid?")) return;
        await updateInvoice({ id: invoice._id, status: "pending", paidAt: undefined });
    };

    const handleDownload = async () => {
        if (!invoiceRef.current || !invoice) return;
        setIsDownloading(true);
        try {
            const pdf = await buildPdf(invoiceRef.current);
            pdf.save(`${invoice.invoiceNumber}.pdf`);
        } catch (err: any) {
            alert(`PDF failed: ${err.message}`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!invoiceRef.current || !invoice) return;
        const client = (invoice as any).client;
        if (!client?.email) { alert("Client has no email address."); return; }

        setIsSending(true);
        try {
            const pdf = await buildPdf(invoiceRef.current, true);
            const base64 = pdf.output("datauristring").split(",")[1];

            await sendEmailAction({
                invoiceNumber: invoice.invoiceNumber,
                clientName: client.name,
                clientEmail: client.email,
                replyToEmail: settings?.contactEmail || "",
                companyName: settings?.companyName,
                amount: invoice.amount,
                projectTitle: (invoice as any).project?.title,
                pdfBase64: base64,
            });

            setSendSuccess(true);
            setTimeout(() => setSendSuccess(false), 3000);
        } catch (err: any) {
            alert(`Email failed: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendReminder = async () => {
        if (!invoice) return;
        setIsSendingReminder(true);
        try {
            await sendReminderAction({ invoiceId: invoice._id });
            setReminderSent(true);
            setTimeout(() => setReminderSent(false), 4000);
        } catch (err: any) {
            alert(`Reminder failed: ${err.message}`);
        } finally {
            setIsSendingReminder(false);
        }
    };

    const handleImportTime = async () => {
        if (!invoice || !unbilledEntries?.length) return;
        const totalMins = unbilledEntries.reduce((s: number, e: any) => s + e.durationMinutes, 0);
        const h = Math.floor(totalMins / 60), m = totalMins % 60;
        if (!confirm(`Import ${unbilledEntries.length} time entr${unbilledEntries.length === 1 ? "y" : "ies"} (${h}h ${m}m) as line items?`)) return;
        setIsImportingTime(true);
        try {
            await importTimeEntries({ invoiceId: invoice._id, entryIds: unbilledEntries.map((e: any) => e._id) });
        } catch (err: any) {
            alert(`Import failed: ${err.message}`);
        } finally {
            setIsImportingTime(false);
        }
    };

    if (invoice === undefined) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-zinc-300" size={32} />
        </div>
    );

    if (invoice === null) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertCircle className="text-red-400" size={40} />
            <h2 className="text-xl font-bold">Invoice not found</h2>
            <button onClick={() => router.back()} className="text-sm text-sky-500 font-medium hover:underline">Go back</button>
        </div>
    );

    const client = (invoice as any).client;
    const project = (invoice as any).project;
    const items = (invoice as any).items ?? [];
    const credits = (invoice as any).credits ?? [];
    const taxRate: number = (invoice as any).taxRate ?? 0;
    const retainagePercent: number = (invoice as any).retainagePercent ?? 0;
    const retainageReleased: boolean = (invoice as any).retainageReleased ?? false;
    const itemsSubtotal = items.reduce((s: number, i: any) => s + i.amount * i.unitPrice, 0);
    const taxAmount = itemsSubtotal * (taxRate / 100);
    const creditsTotal = credits.reduce((s: number, c: any) => s + c.amount, 0);
    const grossTotal = itemsSubtotal + taxAmount - creditsTotal;
    const retainageAmount = (invoice as any).retainageAmount ?? (grossTotal * retainagePercent / 100);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Page header */}
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <button onClick={() => router.push("/dashboard/invoices")} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Invoices
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">{invoice.invoiceNumber}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", STATUS_BADGE[invoice.status] ?? "bg-zinc-100 text-zinc-600")}>
                                    {invoice.status}
                                </span>
                                {(invoice as any).invoiceType && (
                                    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", TYPE_BADGE[(invoice as any).invoiceType] ?? "bg-zinc-100 text-zinc-600")}>
                                        {(invoice as any).invoiceType}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {invoice.status !== "paid" && unbilledEntries && unbilledEntries.length > 0 && (
                        <button onClick={handleImportTime} disabled={isImportingTime} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all disabled:opacity-50">
                            {isImportingTime ? <Loader2 size={15} className="animate-spin" /> : <Timer size={15} />}
                            Import {unbilledEntries.length} time {unbilledEntries.length === 1 ? "entry" : "entries"}
                        </button>
                    )}

                    <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all disabled:opacity-50">
                        {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        PDF
                    </button>

                    <button
                        onClick={handleSendEmail}
                        disabled={isSending || sendSuccess}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50",
                            sendSuccess ? "bg-emerald-500 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"
                        )}
                    >
                        {isSending ? <Loader2 size={15} className="animate-spin" /> : sendSuccess ? <CheckCircle2 size={15} /> : <Mail size={15} />}
                        {sendSuccess ? "Sent!" : "Email"}
                    </button>

                    {invoice.status === "overdue" && (
                        <button
                            onClick={handleSendReminder}
                            disabled={isSendingReminder || reminderSent}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50",
                                reminderSent ? "bg-emerald-500 text-white" : "bg-red-500 text-white hover:bg-red-600"
                            )}
                        >
                            {isSendingReminder ? <Loader2 size={15} className="animate-spin" /> : reminderSent ? <CheckCircle2 size={15} /> : <Mail size={15} />}
                            {reminderSent ? "Reminder Sent" : "Send Reminder"}
                        </button>
                    )}

                    {invoice.status === "paid" ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
                                <CheckCircle2 size={15} />
                                Paid{(invoice as any).paidAt ? ` · ${formatDate((invoice as any).paidAt)}` : ""}
                            </div>
                            <button onClick={handleMarkUnpaid} title="Revert to unpaid" className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all">
                                <RotateCcw size={15} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowPayModal((v) => !v)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all shadow-sm"
                            >
                                <Banknote size={15} />
                                Mark as Paid
                                <ChevronDown size={13} className={cn("transition-transform", showPayModal && "rotate-180")} />
                            </button>
                            {showPayModal && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPayModal(false)} />
                                    <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="px-5 pt-5 pb-3">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Payment Method</p>
                                            <div className="flex flex-wrap gap-2">
                                                {PAYMENT_METHODS.map((m) => (
                                                    <button key={m} type="button" onClick={() => setPayMethod(m)}
                                                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", payMethod === m ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400")}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-5 pb-5 pt-3 border-t border-zinc-100">
                                            <button onClick={handleMarkPaid} disabled={isMarkingPaid}
                                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isMarkingPaid ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                                Confirm — {payMethod}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Invoice canvas */}
            <div
                ref={invoiceRef}
                className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-10"
                style={{ color: "#18181b", backgroundColor: "#ffffff" }}
            >
                <style dangerouslySetInnerHTML={{ __html: `
                    #invoice-canvas, #invoice-canvas * {
                        --color-zinc-50:#fafafa !important;--color-zinc-100:#f4f4f5 !important;
                        --color-zinc-200:#e4e4e7 !important;--color-zinc-300:#d4d4d8 !important;
                        --color-zinc-400:#a1a1aa !important;--color-zinc-500:#71717a !important;
                        --color-zinc-600:#52525b !important;--color-zinc-700:#3f3f46 !important;
                        --color-zinc-800:#27272a !important;--color-zinc-900:#18181b !important;
                        box-shadow:none !important;
                    }
                `}} />

                {/* Branding */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-5 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0">
                                <span className="font-black text-lg">B</span>
                            </div>
                            <span className="font-black text-2xl tracking-tight">{settings?.companyName || "Arcocen"}</span>
                        </div>
                        <div className="text-sm text-zinc-500 space-y-1 max-w-sm">
                            <p className="font-semibold text-zinc-800">{settings?.companyName}</p>
                            <p>{settings?.addressLine1}</p>
                            {settings?.addressLine2 && <p>{settings.addressLine2}</p>}
                            <div className="pt-1 space-y-0.5 text-zinc-400">
                                {settings?.contactEmail && <p>{settings.contactEmail}</p>}
                                {settings?.phone && <p>{settings.phone}</p>}
                                {settings?.registrationNumber && <p>Reg: {settings.registrationNumber}</p>}
                                {settings?.vatNumber && <p>VAT: {settings.vatNumber}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <h2 className="text-3xl font-black uppercase tracking-tight">Invoice</h2>
                        <p className="text-lg font-bold text-zinc-500">{invoice.invoiceNumber}</p>
                        {(invoice as any).invoiceType && (
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider capitalize">{(invoice as any).invoiceType} invoice</p>
                        )}
                    </div>
                </div>

                {/* Bill to + Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Billed To</p>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-zinc-900">{client?.name}</p>
                            {client?.street && <p className="text-sm text-zinc-500">{client.street}</p>}
                            {(client?.postcode || client?.city) && (
                                <p className="text-sm text-zinc-500">{[client.postcode, client.city].filter(Boolean).join("  ")}</p>
                            )}
                            {client?.email && <p className="text-sm text-zinc-500">{client.email}</p>}
                            {client?.phone && <p className="text-sm text-zinc-500">{client.phone}</p>}
                        </div>
                        {project && (
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Project</p>
                                <p className="text-sm font-semibold text-zinc-700">{project.title}</p>
                                {project.siteAddress && <p className="text-xs text-zinc-400">{project.siteAddress}</p>}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Invoice Details</p>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">Number</p>
                                    <p className="font-bold">{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">Date Issued</p>
                                    <p className="font-bold">{formatDate(invoice.date)}</p>
                                </div>
                                {(invoice as any).dueDate && (
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Due Date</p>
                                        <p className="font-bold">{formatDate((invoice as any).dueDate)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3 relative">
                            {invoice.status === "paid" && (
                                <div className="absolute -top-2 -right-2 rotate-[-12deg] pointer-events-none select-none">
                                    <div className="px-3 py-1 border-2 border-emerald-400 rounded-lg">
                                        <span className="text-emerald-500 font-black text-xl tracking-widest uppercase opacity-70">Paid</span>
                                    </div>
                                </div>
                            )}
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Payment</p>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">
                                        {invoice.status === "paid" ? "Amount Paid" : "Amount Due"}
                                    </p>
                                    <p className={cn("text-lg font-black", invoice.status === "paid" ? "text-emerald-600" : "text-zinc-900")}>
                                        {formatCurrency(invoice.amount, settings?.currency)}
                                    </p>
                                </div>
                                {(invoice as any).paymentMethod && (
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Method</p>
                                        <p className="font-bold">{(invoice as any).paymentMethod}</p>
                                    </div>
                                )}
                                {(invoice as any).paidAt && (
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Paid On</p>
                                        <p className="font-bold text-emerald-600">{formatDate((invoice as any).paidAt)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line items */}
                <div className="space-y-4">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Line Items</p>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-zinc-100">
                                <th className="pb-3 text-sm font-black uppercase tracking-tight w-[50%]">Item & Description</th>
                                <th className="pb-3 text-sm font-black uppercase tracking-tight text-center w-[12%]">Qty</th>
                                <th className="pb-3 text-sm font-black uppercase tracking-tight text-right w-[19%]">Rate</th>
                                <th className="pb-3 text-sm font-black uppercase tracking-tight text-right w-[19%]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {items.length === 0 && (
                                <tr><td colSpan={4} className="py-6 text-center text-sm text-zinc-400">No line items</td></tr>
                            )}
                            {items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-3 pr-4">
                                        <p className="font-bold text-zinc-900">{item.name}</p>
                                        {item.description && <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>}
                                        {item.remark && <p className="text-xs text-zinc-400 italic mt-1">{item.remark}</p>}
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="text-sm font-bold text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded-lg">{item.amount}</span>
                                    </td>
                                    <td className="py-3 text-right font-bold text-zinc-700">{formatCurrency(item.unitPrice, settings?.currency)}</td>
                                    <td className="py-3 text-right font-black text-zinc-900">{formatCurrency(item.amount * item.unitPrice, settings?.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end pt-6 border-t-2 border-zinc-100">
                    <div className="w-full md:w-80 space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 font-semibold uppercase tracking-wider text-xs">Subtotal</span>
                            <span className="font-bold text-zinc-900">{formatCurrency(itemsSubtotal, settings?.currency)}</span>
                        </div>
                        {taxRate > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-xs">VAT ({taxRate}%)</span>
                                <span className="font-bold text-zinc-900">{formatCurrency(taxAmount, settings?.currency)}</span>
                            </div>
                        )}
                        {credits.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-amber-600 font-semibold text-xs uppercase tracking-wider truncate">Credit — {c.description}</span>
                                <span className="font-bold text-amber-700 shrink-0">− {formatCurrency(c.amount, settings?.currency)}</span>
                            </div>
                        ))}
                        {retainagePercent > 0 && (
                            <>
                                <div className="flex justify-between text-sm border-t border-zinc-100 pt-2">
                                    <span className="text-zinc-500 font-semibold text-xs uppercase tracking-wider">Gross Total</span>
                                    <span className="font-bold text-zinc-700">{formatCurrency(grossTotal, settings?.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className={cn("font-semibold text-xs uppercase tracking-wider", retainageReleased ? "text-emerald-600" : "text-zinc-500")}>
                                        Retainage {retainagePercent}%{retainageReleased ? " (released)" : " (held)"}
                                    </span>
                                    <span className={cn("font-bold shrink-0", retainageReleased ? "text-emerald-600" : "text-zinc-400")}>
                                        {retainageReleased ? "" : "− "}{formatCurrency(retainageAmount, settings?.currency)}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between items-end pt-3 border-t border-zinc-100">
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                                {invoice.status === "paid" ? "Amount Paid" : "Amount Due"}
                            </span>
                            <span className={cn("text-2xl font-black tracking-tight", invoice.status === "paid" ? "text-emerald-600" : "text-zinc-900")}>
                                {formatCurrency(invoice.amount, settings?.currency)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-zinc-500 font-medium leading-relaxed">
                        <div>
                            <p className="font-black text-zinc-900 mb-2 text-sm">Payment Terms</p>
                            <p>Please pay by the due date shown above.</p>
                            {settings?.bankAccounts && <p className="mt-2 whitespace-pre-wrap">{settings.bankAccounts}</p>}
                        </div>
                        <div className="md:text-right self-end">
                            <p className="mb-1">Thank you for your business!</p>
                            <p className="font-black text-zinc-800">© {new Date().getFullYear()} {settings?.companyName || "Arcocen"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project link */}
            {project && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                    <Link href={`/dashboard/projects/${project._id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500">
                            <FolderKanban size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Linked Project</p>
                            <p className="text-sm font-semibold text-zinc-900 group-hover:text-sky-500 transition-colors">{project.title}</p>
                        </div>
                        <ChevronDown size={16} className="text-zinc-300 group-hover:text-sky-500 -rotate-90 transition-colors" />
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
            <InvoiceDetail id={id as Id<"invoices">} />
        </Suspense>
    );
}
