/**
 * Invoice and sign-off PDF generation.
 *
 * These build the document from data with real jsPDF text rather than
 * screenshotting the DOM, so they can run anywhere — a list row, a bulk export,
 * or the detail page — and produce small files with selectable, searchable text.
 */

import jsPDF from "jspdf";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 14;
/** Y below which we break to a new page. */
const BOTTOM_LIMIT = PAGE_H - 26;

const C = {
    ink: [24, 24, 27],
    zinc800: [39, 39, 42],
    zinc700: [63, 63, 70],
    zinc500: [113, 113, 122],
    zinc400: [161, 161, 170],
    zinc200: [228, 228, 231],
    zinc100: [244, 244, 245],
    sky: [14, 165, 233],
    emerald: [5, 150, 105],
    amber: [217, 119, 6],
} as const;

type RGB = readonly [number, number, number] | readonly number[];

/** Points to millimetres. */
const pt = (n: number) => n * 0.3528;

export interface InvoicePdfSettings {
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    contactEmail?: string;
    phone?: string;
    registrationNumber?: string;
    vatNumber?: string;
    bankAccounts?: string;
    currency?: string;
}

class Doc {
    pdf: jsPDF;
    y = MARGIN;

    constructor() {
        this.pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
        this.accentBar();
    }

    accentBar() {
        this.pdf.setFillColor(...(C.sky as unknown as [number, number, number]));
        this.pdf.rect(0, 0, PAGE_W, 2, "F");
    }

    font(size: number, style: "normal" | "bold" | "italic" = "normal", color: RGB = C.ink) {
        this.pdf.setFontSize(size);
        this.pdf.setFont("helvetica", style);
        this.pdf.setTextColor(color[0], color[1], color[2]);
        return this;
    }

    text(s: string, x: number, y: number, opts?: any) {
        this.pdf.text(s, x, y, opts);
    }

    /** Draws wrapped text and returns the height consumed. */
    wrapped(s: string, x: number, y: number, width: number, size: number, opts?: any): number {
        const lines = this.pdf.splitTextToSize(s, width);
        this.pdf.text(lines, x, y, opts);
        return lines.length * pt(size) * 1.2;
    }

    rule(y: number, color: RGB = C.zinc200, width = 0.2, x1 = MARGIN, x2 = PAGE_W - MARGIN) {
        this.pdf.setDrawColor(color[0], color[1], color[2]);
        this.pdf.setLineWidth(width);
        this.pdf.line(x1, y, x2, y);
    }

    newPage() {
        this.pdf.addPage();
        this.accentBar();
        this.y = MARGIN;
    }

    /** Breaks to a new page if `needed` mm won't fit. Returns true if it broke. */
    ensure(needed: number): boolean {
        if (this.y + needed <= BOTTOM_LIMIT) return false;
        this.newPage();
        return true;
    }
}

function currencyFormatter(currency = "EUR") {
    const fmt = new Intl.NumberFormat("en-IE", { style: "currency", currency });
    // Intl emits non-breaking / narrow spaces that jsPDF's core fonts render as
    // stray glyphs — fold them to plain spaces.
    return (n: number) => fmt.format(n || 0).replace(/[  ]/g, " ");
}

function formatDay(ts: number): string {
    return new Date(ts).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/** Small uppercase section label, e.g. BILLED TO. */
function sectionLabel(d: Doc, label: string, x: number, y: number, align?: "right") {
    d.font(7.5, "bold", C.zinc400);
    d.text(label.toUpperCase(), x, y, align ? { align } : undefined);
}

/** Label above value, as used in the details columns. */
function field(d: Doc, label: string, value: string, x: number, y: number, bold = true): number {
    d.font(7, "normal", C.zinc400);
    d.text(label, x, y);
    d.font(9, bold ? "bold" : "normal", C.ink);
    d.text(value, x, y + 4);
    return 9;
}

/** Rotated "PAID" stamp, mirroring the badge on the invoice detail page. */
function paidStamp(d: Doc, cx: number, cy: number) {
    const angle = 12;
    const rad = (angle * Math.PI) / 180;
    const w = 30;
    const h = 11;
    const corners: [number, number][] = [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
    ];
    const points = corners.map(
        ([x, y]) =>
            [
                cx + x * Math.cos(rad) + y * Math.sin(rad),
                cy - x * Math.sin(rad) + y * Math.cos(rad),
            ] as [number, number]
    );

    d.pdf.setDrawColor(52, 211, 153);
    d.pdf.setLineWidth(0.7);
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        d.pdf.line(x1, y1, x2, y2);
    }

    d.font(15, "bold", [16, 185, 129]);
    d.text("PAID", cx, cy + 2, { align: "center", angle });
}

export function buildInvoicePdf(invoice: any, settings?: InvoicePdfSettings | null): jsPDF {
    const d = new Doc();
    const money = currencyFormatter(settings?.currency);
    const company = settings?.companyName || "Arcocen";

    const client = invoice.client;
    const project = invoice.project;
    const items: any[] = invoice.items ?? [];
    const credits: any[] = invoice.credits ?? [];
    const taxRate: number = invoice.taxRate ?? 0;
    const retainagePercent: number = invoice.retainagePercent ?? 0;
    const retainageReleased: boolean = invoice.retainageReleased ?? false;
    const isPaid = invoice.status === "paid";

    const itemsSubtotal = items.reduce((s, i) => s + i.amount * i.unitPrice, 0);
    const taxAmount = itemsSubtotal * (taxRate / 100);
    const creditsTotal = credits.reduce((s, c) => s + c.amount, 0);
    const grossTotal = itemsSubtotal + taxAmount - creditsTotal;
    const retainageAmount = invoice.retainageAmount ?? (grossTotal * retainagePercent) / 100;

    /* ---------------- Branding ---------------- */

    d.y = MARGIN + 6;

    d.pdf.setFillColor(...(C.sky as unknown as [number, number, number]));
    d.pdf.roundedRect(MARGIN, d.y - 6, 9, 9, 2, 2, "F");
    d.font(11, "bold", [255, 255, 255]);
    d.text((company[0] || "B").toUpperCase(), MARGIN + 4.5, d.y + 0.4, { align: "center" });

    d.font(17, "bold", C.ink);
    d.text(company, MARGIN + 12, d.y + 0.8);

    d.font(20, "bold", C.ink);
    d.text("INVOICE", PAGE_W - MARGIN, d.y + 1, { align: "right" });

    d.y += 9;
    d.font(11, "bold", C.zinc500);
    d.text(invoice.invoiceNumber ?? "", PAGE_W - MARGIN, d.y, { align: "right" });

    if (invoice.invoiceType) {
        d.y += 4.5;
        d.font(7.5, "bold", C.zinc400);
        d.text(`${String(invoice.invoiceType).toUpperCase()} INVOICE`, PAGE_W - MARGIN, d.y, {
            align: "right",
        });
    }

    // Company address block, left column.
    let leftY = MARGIN + 12;
    d.font(8.5, "bold", C.zinc800);
    d.text(company, MARGIN, leftY);
    leftY += 4;

    d.font(8.5, "normal", C.zinc500);
    for (const line of [settings?.addressLine1, settings?.addressLine2]) {
        if (!line) continue;
        d.text(line, MARGIN, leftY);
        leftY += 4;
    }

    d.font(8, "normal", C.zinc400);
    const meta = [
        settings?.contactEmail,
        settings?.phone,
        settings?.registrationNumber ? `Reg: ${settings.registrationNumber}` : null,
        settings?.vatNumber ? `VAT: ${settings.vatNumber}` : null,
    ].filter(Boolean) as string[];
    for (const line of meta) {
        d.text(line, MARGIN, leftY);
        leftY += 3.6;
    }

    d.y = Math.max(leftY, d.y) + 8;
    d.rule(d.y, C.zinc200);
    d.y += 8;

    /* ---------------- Billed to / details ---------------- */

    const colRightX = MARGIN + 96;
    const blockTop = d.y;

    sectionLabel(d, "Billed To", MARGIN, blockTop);
    let by = blockTop + 6.5;

    d.font(12, "bold", C.ink);
    by += d.wrapped(client?.name ?? "—", MARGIN, by, 88, 12);

    d.font(8.5, "normal", C.zinc500);
    const clientLines = [
        client?.street,
        [client?.postcode, client?.city].filter(Boolean).join("  "),
        client?.email,
        client?.phone,
    ].filter(Boolean) as string[];
    for (const line of clientLines) {
        by += d.wrapped(line, MARGIN, by, 88, 8.5);
    }

    if (project) {
        by += 3;
        d.rule(by, C.zinc100, 0.2, MARGIN, MARGIN + 88);
        by += 5;
        sectionLabel(d, "Project", MARGIN, by);
        by += 5;
        d.font(9, "bold", C.zinc700);
        by += d.wrapped(project.title ?? "", MARGIN, by, 88, 9);
        if (project.siteAddress) {
            d.font(7.5, "normal", C.zinc400);
            by += d.wrapped(project.siteAddress, MARGIN, by, 88, 7.5);
        }
    }

    // Right half: invoice details and payment, side by side.
    const subColW = 40;
    const detailX = colRightX;
    const payX = colRightX + subColW + 6;

    sectionLabel(d, "Invoice Details", detailX, blockTop);
    let dy = blockTop + 6.5;
    dy += field(d, "Number", invoice.invoiceNumber ?? "—", detailX, dy);
    dy += field(d, "Date Issued", invoice.date ? formatDay(invoice.date) : "—", detailX, dy);
    if (invoice.dueDate) dy += field(d, "Due Date", formatDay(invoice.dueDate), detailX, dy);
    if (invoice.purchaseOrderNumber) {
        dy += field(d, "PO Number", invoice.purchaseOrderNumber, detailX, dy);
    }

    sectionLabel(d, "Payment", payX, blockTop);
    let py = blockTop + 6.5;
    d.font(7, "normal", C.zinc400);
    d.text(isPaid ? "Amount Paid" : "Amount Due", payX, py);
    d.font(12, "bold", isPaid ? C.emerald : C.ink);
    d.text(money(invoice.amount), payX, py + 5);
    py += 11;
    if (invoice.paymentMethod) py += field(d, "Method", invoice.paymentMethod, payX, py);
    if (invoice.paidAt) {
        d.font(7, "normal", C.zinc400);
        d.text("Paid On", payX, py);
        d.font(9, "bold", C.emerald);
        d.text(formatDay(invoice.paidAt), payX, py + 4);
        py += 9;
    }

    if (isPaid) paidStamp(d, PAGE_W - MARGIN - 16, blockTop - 3);

    d.y = Math.max(by, dy, py) + 8;

    /* ---------------- Line items ---------------- */

    const colQtyX = MARGIN + 96;
    const colRateX = MARGIN + 130;
    const colTotalX = PAGE_W - MARGIN;
    const descW = 90;

    const drawItemsHeader = () => {
        sectionLabel(d, "Line Items", MARGIN, d.y);
        d.y += 6;
        d.font(8.5, "bold", C.ink);
        d.text("ITEM & DESCRIPTION", MARGIN, d.y);
        d.text("QTY", colQtyX + 8, d.y, { align: "center" });
        d.text("RATE", colRateX + 20, d.y, { align: "right" });
        d.text("TOTAL", colTotalX, d.y, { align: "right" });
        d.y += 2;
        d.rule(d.y, C.zinc200, 0.5);
        d.y += 5;
    };

    d.ensure(30);
    drawItemsHeader();

    if (items.length === 0) {
        d.font(9, "normal", C.zinc400);
        d.text("No line items", PAGE_W / 2, d.y + 4, { align: "center" });
        d.y += 12;
    }

    for (const item of items) {
        const nameLines = d.pdf.splitTextToSize(item.name ?? "", descW);
        const descLines = item.description ? d.pdf.splitTextToSize(item.description, descW) : [];
        const remarkLines = item.remark ? d.pdf.splitTextToSize(item.remark, descW) : [];
        const rowH =
            nameLines.length * pt(9.5) * 1.2 +
            descLines.length * pt(7.5) * 1.2 +
            remarkLines.length * pt(7.5) * 1.2 +
            5;

        if (d.ensure(rowH + 6)) drawItemsHeader();

        const rowTop = d.y;
        let ty = d.y;

        d.font(9.5, "bold", C.ink);
        d.text(nameLines, MARGIN, ty);
        ty += nameLines.length * pt(9.5) * 1.2;

        if (descLines.length) {
            d.font(7.5, "normal", C.zinc500);
            d.text(descLines, MARGIN, ty);
            ty += descLines.length * pt(7.5) * 1.2;
        }
        if (remarkLines.length) {
            d.font(7.5, "italic", C.zinc400);
            d.text(remarkLines, MARGIN, ty);
            ty += remarkLines.length * pt(7.5) * 1.2;
        }

        d.font(9, "bold", C.zinc700);
        d.text(String(item.amount ?? ""), colQtyX + 8, rowTop, { align: "center" });
        d.text(money(item.unitPrice), colRateX + 20, rowTop, { align: "right" });
        d.font(9, "bold", C.ink);
        d.text(money((item.amount ?? 0) * (item.unitPrice ?? 0)), colTotalX, rowTop, {
            align: "right",
        });

        d.y = ty + 3;
        d.rule(d.y, C.zinc100, 0.15);
        d.y += 3;
    }

    /* ---------------- Summary ---------------- */

    const summaryRows: { label: string; value: string; color?: RGB; bold?: boolean }[] = [
        { label: "SUBTOTAL", value: money(itemsSubtotal) },
    ];
    if (taxRate > 0) {
        summaryRows.push({ label: `VAT (${taxRate}%)`, value: money(taxAmount) });
    }
    for (const c of credits) {
        summaryRows.push({
            label: `CREDIT — ${c.description ?? ""}`,
            value: `- ${money(c.amount)}`,
            color: C.amber,
        });
    }
    if (retainagePercent > 0) {
        summaryRows.push({ label: "GROSS TOTAL", value: money(grossTotal) });
        summaryRows.push({
            label: `RETAINAGE ${retainagePercent}% ${retainageReleased ? "(RELEASED)" : "(HELD)"}`,
            value: `${retainageReleased ? "" : "- "}${money(retainageAmount)}`,
            color: retainageReleased ? C.emerald : C.zinc400,
        });
    }

    const summaryH = summaryRows.length * 5.5 + 22;
    d.ensure(summaryH);

    d.y += 4;
    d.rule(d.y, C.zinc200, 0.5);
    d.y += 7;

    const sumLabelX = PAGE_W - MARGIN - 76;
    for (const row of summaryRows) {
        d.font(7.5, "bold", row.color ?? C.zinc500);
        d.text(row.label, sumLabelX, d.y);
        d.font(9, "bold", row.color ?? C.ink);
        d.text(row.value, PAGE_W - MARGIN, d.y, { align: "right" });
        d.y += 5.5;
    }

    d.y += 2;
    d.rule(d.y, C.zinc200, 0.2, sumLabelX, PAGE_W - MARGIN);
    d.y += 7;

    d.font(7.5, "bold", C.zinc400);
    d.text(isPaid ? "AMOUNT PAID" : "AMOUNT DUE", sumLabelX, d.y);
    d.font(16, "bold", isPaid ? C.emerald : C.ink);
    d.text(money(invoice.amount), PAGE_W - MARGIN, d.y + 1, { align: "right" });
    d.y += 12;

    /* ---------------- Footer ---------------- */

    d.ensure(30);
    d.rule(d.y, C.zinc200, 0.2);
    d.y += 6;

    d.font(9, "bold", C.ink);
    d.text("Payment Terms", MARGIN, d.y);
    d.font(7.5, "normal", C.zinc500);
    let fy = d.y + 4.5;
    fy += d.wrapped("Please pay by the due date shown above.", MARGIN, fy, 95, 7.5);
    if (settings?.bankAccounts) {
        fy += 2;
        fy += d.wrapped(settings.bankAccounts, MARGIN, fy, 95, 7.5);
    }

    d.font(7.5, "normal", C.zinc500);
    d.text("Thank you for your business!", PAGE_W - MARGIN, d.y + 4.5, { align: "right" });
    d.font(8, "bold", C.zinc800);
    d.text(`© ${new Date().getFullYear()} ${company}`, PAGE_W - MARGIN, d.y + 9, {
        align: "right",
    });

    /* ---------------- Page numbers ---------------- */

    const pageCount = d.pdf.getNumberOfPages();
    if (pageCount > 1) {
        for (let p = 1; p <= pageCount; p++) {
            d.pdf.setPage(p);
            d.font(7, "normal", C.zinc400);
            d.text(
                `${invoice.invoiceNumber ?? "Invoice"} — Page ${p} of ${pageCount}`,
                PAGE_W / 2,
                FOOTER_Y,
                { align: "center" }
            );
        }
    }

    return d.pdf;
}

/** Filename used for a single invoice PDF, in downloads and inside bulk zips. */
export function invoiceFileName(invoice: any): string {
    return `${invoice.invoiceNumber ?? "invoice"}.pdf`;
}

/* ------------------------------------------------------------------ */
/* Sign-off                                                            */
/* ------------------------------------------------------------------ */

export function buildSignoffPdf(
    signoff: any,
    projectTitle: string,
    companyName: string
): jsPDF {
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const margin = 20;
    let y = margin;

    pdf.setFillColor(14, 165, 233);
    pdf.rect(0, 0, PAGE_W, 2, "F");

    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(24, 24, 27);
    pdf.text("Work Sign-Off", margin, y + 8);
    y += 18;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(113, 113, 122);
    pdf.text(companyName, margin, y);
    y += 10;

    pdf.setDrawColor(228, 228, 231);
    pdf.line(margin, y, PAGE_W - margin, y);
    y += 10;

    const field_ = (label: string, value: string) => {
        if (!value) return;
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(161, 161, 170);
        pdf.text(label.toUpperCase(), margin, y);
        y += 5;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(24, 24, 27);
        const lines = pdf.splitTextToSize(value, PAGE_W - margin * 2);
        pdf.text(lines, margin, y);
        y += lines.length * 6 + 6;
    };

    field_("Project", projectTitle || "—");
    field_("Signed by", signoff.supervisorName || "—");
    if (signoff.completedAt) {
        field_(
            "Date signed",
            new Date(signoff.completedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
        );
    }
    if (signoff.checkIn || signoff.checkOut) {
        const times = [
            signoff.checkIn && `Check-in: ${signoff.checkIn}`,
            signoff.checkOut && `Check-out: ${signoff.checkOut}`,
        ]
            .filter(Boolean)
            .join("   ·   ");
        field_("Times", times as string);
    }
    if (signoff.workDescription) field_("Work Description", signoff.workDescription);

    if (signoff.signatureData) {
        y += 4;
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(161, 161, 170);
        pdf.text("SIGNATURE", margin, y);
        y += 5;
        try {
            pdf.addImage(signoff.signatureData, "PNG", margin, y, 70, 28);
        } catch {
            /* skip if image fails */
        }
    }

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(161, 161, 170);
    pdf.text(`© ${new Date().getFullYear()} ${companyName}`, margin, 285);
    pdf.text("Work Sign-Off Document", PAGE_W - margin, 285, { align: "right" });

    return pdf;
}

/** Base64 payload (no data-URI prefix) — what the Resend action expects. */
export function pdfToBase64(pdf: jsPDF): string {
    return pdf.output("datauristring").split(",")[1];
}

export function pdfToBytes(pdf: jsPDF): Uint8Array {
    return new Uint8Array(pdf.output("arraybuffer"));
}
