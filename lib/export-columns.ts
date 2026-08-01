/**
 * Column definitions for the CSV / Excel exports, one config per list page.
 *
 * Rows are the objects returned by the corresponding `api.<table>.list` query,
 * so joined fields (`client`, `project`, `supplier`) are available here.
 */

import type { Column } from "./export";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

/** `in_progress` -> `In Progress` */
function titleCase(s: unknown): string {
    if (!s) return "";
    return String(s)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Quote totals are derived from line items — same maths as the quotes page. */
export function quoteTotal(quote: Row): number {
    const items = quote.items ?? [];
    const subtotal = items.reduce((sum: number, item: Row) => {
        const line = item.quantity * item.unitPrice;
        return sum + line + (item.markup ? line * (item.markup / 100) : 0);
    }, 0);
    return subtotal + (quote.taxRate ? subtotal * (quote.taxRate / 100) : 0);
}

export const invoiceColumns: Column<Row>[] = [
    { header: "Invoice #", accessor: (r) => r.invoiceNumber, width: 14 },
    { header: "Client", accessor: (r) => r.client?.name, width: 24 },
    { header: "Project", accessor: (r) => r.project?.title, width: 26 },
    { header: "Date", accessor: (r) => r.date, type: "date", width: 14 },
    { header: "Due Date", accessor: (r) => r.dueDate, type: "date", width: 14 },
    { header: "Status", accessor: (r) => titleCase(r.status), width: 12 },
    { header: "Type", accessor: (r) => titleCase(r.invoiceType), width: 12 },
    { header: "Amount", accessor: (r) => r.amount, type: "currency", width: 14 },
    { header: "VAT %", accessor: (r) => r.taxRate, type: "number", width: 9 },
    { header: "Retainage %", accessor: (r) => r.retainagePercent, type: "number", width: 12 },
    { header: "PO Number", accessor: (r) => r.purchaseOrderNumber, width: 16 },
    { header: "Payment Method", accessor: (r) => r.paymentMethod, width: 16 },
    { header: "Paid On", accessor: (r) => r.paidAt, type: "date", width: 14 },
];

export const quoteColumns: Column<Row>[] = [
    { header: "Quote #", accessor: (r) => r.quoteNumber, width: 14 },
    { header: "Client", accessor: (r) => r.client?.name, width: 24 },
    { header: "Date", accessor: (r) => r.date, type: "date", width: 14 },
    { header: "Expiry Date", accessor: (r) => r.expiryDate, type: "date", width: 14 },
    { header: "Status", accessor: (r) => titleCase(r.status), width: 12 },
    { header: "Line Items", accessor: (r) => r.items?.length ?? 0, type: "number", width: 11 },
    { header: "VAT %", accessor: (r) => r.taxRate, type: "number", width: 9 },
    { header: "Total", accessor: quoteTotal, type: "currency", width: 14 },
    { header: "Sent", accessor: (r) => r.sentAt, type: "date", width: 14 },
    { header: "Approved", accessor: (r) => r.approvedAt, type: "date", width: 14 },
    { header: "Notes", accessor: (r) => r.notes, width: 34 },
];

export const projectColumns: Column<Row>[] = [
    { header: "Title", accessor: (r) => r.title, width: 30 },
    { header: "Client", accessor: (r) => r.client?.name, width: 24 },
    { header: "Status", accessor: (r) => titleCase(r.status), width: 14 },
    { header: "Progress %", accessor: (r) => r.progress, type: "number", width: 11 },
    { header: "Start Date", accessor: (r) => r.startDate, type: "date", width: 14 },
    { header: "End Date", accessor: (r) => r.endDate, type: "date", width: 14 },
    { header: "Estimated Budget", accessor: (r) => r.estimatedBudget, type: "currency", width: 17 },
    { header: "Actual Cost", accessor: (r) => r.actualCost, type: "currency", width: 15 },
    { header: "Site Address", accessor: (r) => r.siteAddress, width: 28 },
    { header: "Site City", accessor: (r) => r.siteCity, width: 18 },
    { header: "Site Postcode", accessor: (r) => r.sitePostcode, width: 14 },
    { header: "PO Number", accessor: (r) => r.purchaseOrderNumber, width: 16 },
    { header: "Description", accessor: (r) => r.description, width: 40 },
];

export const clientColumns: Column<Row>[] = [
    { header: "Name", accessor: (r) => r.name, width: 26 },
    { header: "Type", accessor: (r) => titleCase(r.type), width: 12 },
    { header: "Email", accessor: (r) => r.email, width: 28 },
    { header: "Phone", accessor: (r) => r.phone, width: 18 },
    { header: "Street", accessor: (r) => r.street, width: 28 },
    { header: "Postcode", accessor: (r) => r.postcode, width: 12 },
    { header: "City", accessor: (r) => r.city, width: 18 },
    { header: "Website", accessor: (r) => r.website, width: 26 },
];

export const supplierColumns: Column<Row>[] = [
    { header: "Name", accessor: (r) => r.name, width: 26 },
    { header: "Type", accessor: (r) => titleCase(r.type), width: 14 },
    { header: "Email", accessor: (r) => r.email, width: 28 },
    { header: "Phone", accessor: (r) => r.phone, width: 18 },
    { header: "Street", accessor: (r) => r.street, width: 28 },
    { header: "Postcode", accessor: (r) => r.postcode, width: 12 },
    { header: "City", accessor: (r) => r.city, width: 18 },
    { header: "Website", accessor: (r) => r.website, width: 26 },
];

export const subcontractorColumns: Column<Row>[] = [
    { header: "Name", accessor: (r) => r.name, width: 26 },
    { header: "Trade", accessor: (r) => titleCase(r.trade), width: 16 },
    { header: "Email", accessor: (r) => r.email, width: 28 },
    { header: "Phone", accessor: (r) => r.phone, width: 18 },
    { header: "License Number", accessor: (r) => r.licenseNumber, width: 18 },
    { header: "Insurance Expiry", accessor: (r) => r.insuranceExpiry, type: "date", width: 16 },
    { header: "Street", accessor: (r) => r.street, width: 28 },
    { header: "Postcode", accessor: (r) => r.postcode, width: 12 },
    { header: "City", accessor: (r) => r.city, width: 18 },
    { header: "Notes", accessor: (r) => r.notes, width: 34 },
];

export const materialColumns: Column<Row>[] = [
    { header: "Name", accessor: (r) => r.name, width: 28 },
    { header: "SKU", accessor: (r) => r.sku, width: 16 },
    { header: "Category", accessor: (r) => titleCase(r.category), width: 16 },
    { header: "Quantity", accessor: (r) => r.quantity, type: "number", width: 11 },
    { header: "Unit", accessor: (r) => r.unit, width: 9 },
    { header: "Unit Cost", accessor: (r) => r.unitCost, type: "currency", width: 13 },
    {
        header: "Total Value",
        accessor: (r) => (r.unitCost != null ? r.unitCost * r.quantity : null),
        type: "currency",
        width: 14,
    },
    { header: "Reorder Threshold", accessor: (r) => r.reorderThreshold, type: "number", width: 17 },
    { header: "Supplier", accessor: (r) => r.supplier, width: 24 },
    { header: "Description", accessor: (r) => r.description, width: 36 },
];

export const orderColumns: Column<Row>[] = [
    { header: "Order #", accessor: (r) => r.orderNumber, width: 14 },
    { header: "Supplier", accessor: (r) => r.supplier?.name, width: 24 },
    { header: "Project", accessor: (r) => r.project?.title, width: 26 },
    { header: "Date", accessor: (r) => r.date, type: "date", width: 14 },
    { header: "Status", accessor: (r) => titleCase(r.status), width: 12 },
    { header: "Line Items", accessor: (r) => r.items?.length ?? 0, type: "number", width: 11 },
    { header: "Amount", accessor: (r) => r.amount, type: "currency", width: 14 },
];

export const purchaseOrderColumns: Column<Row>[] = [
    { header: "PO Number", accessor: (r) => r.poNumber, width: 16 },
    { header: "Client", accessor: (r) => r.client?.name, width: 24 },
    { header: "Project", accessor: (r) => r.project?.title, width: 26 },
    { header: "Status", accessor: (r) => titleCase(r.status), width: 14 },
    { header: "Received", accessor: (r) => r.receivedAt, type: "date", width: 14 },
    { header: "Expires", accessor: (r) => r.expiresAt, type: "date", width: 14 },
    { header: "Amount", accessor: (r) => r.amount, type: "currency", width: 14 },
    { header: "Billed", accessor: (r) => r.billedAmount, type: "currency", width: 14 },
    {
        header: "Remaining",
        accessor: (r) => r.amount - (r.billedAmount ?? 0),
        type: "currency",
        width: 14,
    },
    { header: "Billed %", accessor: (r) => r.billedPercent, type: "number", width: 10 },
    { header: "Description", accessor: (r) => r.description, width: 36 },
];

export const timeEntryColumns: Column<Row>[] = [
    { header: "Date", accessor: (r) => r.date, type: "date", width: 14 },
    { header: "Project", accessor: (r) => r.project?.title, width: 28 },
    { header: "Worker", accessor: (r) => r.workerName, width: 20 },
    {
        header: "Hours",
        accessor: (r) => Math.round((r.durationMinutes / 60) * 100) / 100,
        type: "number",
        width: 10,
    },
    { header: "Billable", accessor: (r) => r.billable, type: "boolean", width: 10 },
    { header: "Invoiced", accessor: (r) => r.invoiced, type: "boolean", width: 10 },
    { header: "Hourly Rate", accessor: (r) => r.hourlyRate, type: "currency", width: 13 },
    {
        header: "Value",
        accessor: (r) => (r.hourlyRate != null ? (r.durationMinutes / 60) * r.hourlyRate : null),
        type: "currency",
        width: 13,
    },
    { header: "Description", accessor: (r) => r.description, width: 36 },
];
