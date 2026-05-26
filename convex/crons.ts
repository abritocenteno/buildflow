import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for overdue invoices daily at 8am UTC
crons.daily(
    "mark overdue invoices",
    { hourUTC: 8, minuteUTC: 0 },
    internal.invoiceJobs.markOverdueInvoices
);

export default crons;
