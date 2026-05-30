import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { api } from "./_generated/api";

function replaceVars(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{{${k}}}`, v), template);
}

function fromAddress(senderName: string): string {
    const domain = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";
    if (domain.includes("@")) return domain; // full address already
    return `${senderName} <billing@${domain}>`;
}

export const sendInvoiceEmail = action({
    args: {
        invoiceNumber: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        replyToEmail: v.string(),
        pdfBase64: v.string(),
        companyName: v.optional(v.string()),
        amount: v.optional(v.number()),
        projectTitle: v.optional(v.string()),
        extraAttachments: v.optional(v.array(v.object({
            filename: v.string(),
            content: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const resend = new Resend(resendApiKey);
        const settings = await ctx.runQuery(api.settings.get);
        const company = args.companyName || settings?.companyName || "Arcocen";
        const senderName = settings?.emailSenderName || company;
        const currency = settings?.currency ?? "EUR";
        const bankAccounts = settings?.bankAccounts ?? "";

        const formatAmt = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);

        const intro = replaceVars(
            settings?.invoiceEmailIntro || "Please find your invoice attached to this email. If you have any questions, feel free to reply to this message.",
            { clientName: args.clientName, companyName: company, invoiceNumber: args.invoiceNumber }
        );

        const amountLine = args.amount != null
            ? `<tr><td style="padding:8px 0;color:#71717a;font-size:14px;">Amount due</td><td style="padding:8px 0;text-align:right;font-size:20px;font-weight:900;color:#18181b;">${formatAmt(args.amount)}</td></tr>`
            : "";

        const projectLine = args.projectTitle
            ? `<tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Project</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#52525b;">${args.projectTitle}</td></tr>`
            : "";

        const bankBlock = bankAccounts
            ? `<div style="margin:24px 0;padding:16px;background:#f4f4f5;border-radius:8px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:900;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Payment details</p>
                <pre style="margin:0;font-family:sans-serif;font-size:13px;color:#18181b;white-space:pre-wrap;">${bankAccounts}</pre>
               </div>`
            : "";

        const subject = replaceVars(
            settings?.invoiceEmailSubject || "Invoice {{invoiceNumber}} — {{companyName}}",
            { invoiceNumber: args.invoiceNumber, companyName: company, clientName: args.clientName }
        );

        await resend.emails.send({
            from: fromAddress(senderName),
            to: [args.clientEmail],
            replyTo: args.replyToEmail,
            subject,
            text: `Dear ${args.clientName},\n\nPlease find attached invoice ${args.invoiceNumber} from ${company}.\n\n${args.amount != null ? `Amount due: ${formatAmt(args.amount)}\n` : ""}${args.projectTitle ? `Project: ${args.projectTitle}\n` : ""}\n${bankAccounts ? `Payment details:\n${bankAccounts}\n\n` : ""}${intro}\n\nThank you!\n${company}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                    <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Invoice ${args.invoiceNumber}</h2>
                    <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${company}</p>
                    <p style="margin:0 0 16px;">Dear <strong>${args.clientName}</strong>,</p>
                    <p style="margin:0 0 24px;line-height:1.6;">${intro}</p>
                    ${amountLine || projectLine ? `<table style="width:100%;border-top:1px solid #e4e4e7;margin:0 0 8px;">${amountLine}${projectLine}</table>` : ""}
                    ${bankBlock}
                    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">Thank you for your business! — © ${new Date().getFullYear()} ${company}</p>
                </div>
            `,
            attachments: [
                { filename: `Invoice_${args.invoiceNumber}.pdf`, content: args.pdfBase64 },
                ...(args.extraAttachments || []),
            ],
        });

        return { success: true };
    },
});

export const sendOverdueReminderEmail = action({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, { invoiceId }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const invoice = await ctx.runQuery(api.invoices.get, { id: invoiceId });
        if (!invoice) throw new Error("Invoice not found");

        const client = (invoice as any).client;
        if (!client?.email) throw new Error("Client has no email address on file");

        const settings = await ctx.runQuery(api.settings.get);
        const companyName = settings?.companyName ?? "Arcocen";
        const contactEmail = settings?.contactEmail ?? "";
        const phone = settings?.phone ?? "";
        const bankAccounts = settings?.bankAccounts ?? "";
        const currency = settings?.currency ?? "EUR";
        const senderName = settings?.emailSenderName || companyName;

        const formatAmt = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);
        const dueDate = (invoice as any).dueDate
            ? new Date((invoice as any).dueDate).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
            : new Date((invoice as any).date + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" });

        const overdueIntro = replaceVars(
            settings?.overdueEmailIntro || "We'd like to remind you that invoice {{invoiceNumber}} was due on {{dueDate}} and is still outstanding.",
            { invoiceNumber: (invoice as any).invoiceNumber, dueDate, clientName: client.name, companyName }
        );

        const resend = new Resend(resendApiKey);

        await resend.emails.send({
            from: fromAddress(senderName),
            to: [client.email],
            replyTo: contactEmail || undefined,
            subject: replaceVars(
                settings?.overdueEmailSubject || "Payment reminder: Invoice {{invoiceNumber}} — {{companyName}}",
                { invoiceNumber: (invoice as any).invoiceNumber, companyName, clientName: client.name }
            ),
            text: `Dear ${client.name},\n\nThis is a reminder that invoice ${(invoice as any).invoiceNumber} (${formatAmt((invoice as any).amount)}) was due on ${dueDate} and is still outstanding.\n\n${bankAccounts ? `Payment details:\n${bankAccounts}\n\n` : ""}${contactEmail ? `Contact: ${contactEmail}\n` : ""}${phone}\n\n${companyName}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                    <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Payment reminder</h2>
                    <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${companyName}</p>
                    <p style="margin:0 0 16px;">Dear <strong>${client.name}</strong>,</p>
                    <p style="margin:0 0 24px;line-height:1.6;">${overdueIntro}</p>
                    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                        <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#92400e;">Amount Due</p>
                        <p style="margin:0;font-size:28px;font-weight:900;color:#92400e;">${formatAmt((invoice as any).amount)}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#b45309;">Invoice ${(invoice as any).invoiceNumber} · Due ${dueDate}</p>
                    </div>
                    ${bankAccounts ? `<p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">Please arrange payment using the details below:<br><pre style="font-family:sans-serif;color:#18181b;">${bankAccounts}</pre></p>` : ""}
                    <p style="margin:0 0 4px;font-size:14px;color:#52525b;">Questions? Contact us:</p>
                    ${contactEmail ? `<p style="margin:0 0 2px;font-size:14px;"><a href="mailto:${contactEmail}" style="color:#18181b;">${contactEmail}</a></p>` : ""}
                    ${phone ? `<p style="margin:0;font-size:14px;">${phone}</p>` : ""}
                    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${companyName}</p>
                </div>
            `,
        });

        return { success: true };
    },
});

export const sendIntakeNotificationEmail = action({
    args: {
        ownerEmail: v.string(),
        companyName: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        clientPhone: v.string(),
        projectType: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const resend = new Resend(resendApiKey);
        const settings = await ctx.runQuery(api.settings.get);
        const senderName = settings?.emailSenderName || args.companyName;

        await resend.emails.send({
            from: fromAddress(senderName),
            to: [args.ownerEmail],
            subject: `New project request: ${args.projectType} — ${args.clientName}`,
            text: `New project request from ${args.clientName} (${args.clientEmail}${args.clientPhone ? `, ${args.clientPhone}` : ""}).\n\nProject type: ${args.projectType}\n\n${args.description}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                    <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">New Project Request</h2>
                    <p style="color:#71717a;margin:0 0 32px;font-size:14px;">${args.companyName} — via intake form</p>
                    <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                        <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Client</p>
                        <p style="margin:0 0 4px;font-weight:700;font-size:16px;">${args.clientName}</p>
                        <p style="margin:0 0 2px;font-size:14px;color:#52525b;">${args.clientEmail}</p>
                        ${args.clientPhone ? `<p style="margin:0;font-size:14px;color:#52525b;">${args.clientPhone}</p>` : ""}
                    </div>
                    <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                        <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Request</p>
                        <p style="margin:0 0 4px;font-weight:700;font-size:16px;">${args.projectType}</p>
                        <p style="margin:0;font-size:14px;color:#52525b;line-height:1.6;">${args.description}</p>
                    </div>
                    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${args.companyName}</p>
                </div>
            `,
        });

        return { success: true };
    },
});

export const sendSignoffRequestEmail = action({
    args: {
        clientName: v.string(),
        clientEmail: v.string(),
        projectTitle: v.string(),
        projectAddress: v.optional(v.string()),
        signoffUrl: v.string(),
        note: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const resend = new Resend(resendApiKey);
        const settings = await ctx.runQuery(api.settings.get);
        const company = settings?.companyName ?? "Arcocen";
        const senderName = settings?.emailSenderName || company;
        const replyTo = settings?.contactEmail;

        const noteBlock = args.note
            ? `<p style="margin:0 0 24px;line-height:1.6;color:#52525b;">${args.note}</p>`
            : "";

        const addressLine = args.projectAddress
            ? `<p style="margin:4px 0 0;font-size:13px;color:#71717a;">${args.projectAddress}</p>`
            : "";

        await resend.emails.send({
            from: fromAddress(senderName),
            to: [args.clientEmail],
            ...(replyTo ? { replyTo } : {}),
            subject: `Sign-off requested: ${args.projectTitle} — ${company}`,
            text: `Dear ${args.clientName},\n\nWork has been completed on "${args.projectTitle}" and your sign-off is required.\n\n${args.note ? `${args.note}\n\n` : ""}Please review and sign off using the link below:\n${args.signoffUrl}\n\nThank you,\n${company}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                    <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Sign-off requested</h2>
                    <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${company}</p>
                    <p style="margin:0 0 16px;">Dear <strong>${args.clientName}</strong>,</p>
                    <p style="margin:0 0 24px;line-height:1.6;">Work has been completed on the following project and your sign-off is required.</p>
                    ${noteBlock}
                    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#0369a1;">Project</p>
                        <p style="margin:0;font-weight:700;font-size:18px;color:#0c4a6e;">${args.projectTitle}</p>
                        ${addressLine}
                    </div>
                    <a href="${args.signoffUrl}" style="display:block;background:#0ea5e9;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:28px;">
                        Review &amp; Sign Off
                    </a>
                    <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">Or copy this link into your browser:</p>
                    <p style="margin:0;font-size:12px;color:#0ea5e9;word-break:break-all;">${args.signoffUrl}</p>
                    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${company}</p>
                </div>
            `,
        });

        return { success: true };
    },
});

export const sendSignoffCompletionEmail = action({
    args: { signoffId: v.id("signoffs") },
    handler: async (ctx, { signoffId }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const signoff = await ctx.runQuery(api.signoffs.getById, { id: signoffId });
        if (!signoff) throw new Error("Sign-off not found");
        if (signoff.status !== "completed") throw new Error("Sign-off is not yet completed");

        const settings = await ctx.runQuery(api.settings.get);
        const company = settings?.companyName ?? "Arcocen";
        const senderName = settings?.emailSenderName || company;
        const replyTo = settings?.contactEmail;

        const resend = new Resend(resendApiKey);

        const signedAt = signoff.completedAt
            ? new Date(signoff.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "—";

        const workBlock = signoff.workDescription
            ? `<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Work performed</p>
                <p style="margin:0;font-size:14px;color:#18181b;line-height:1.6;">${signoff.workDescription}</p>
               </div>`
            : "";

        const timesBlock = (signoff.checkIn || signoff.checkOut)
            ? `<p style="margin:0 0 16px;font-size:13px;color:#52525b;">
                ${signoff.checkIn ? `Check-in: <strong>${signoff.checkIn}</strong>` : ""}
                ${signoff.checkIn && signoff.checkOut ? " &nbsp;·&nbsp; " : ""}
                ${signoff.checkOut ? `Check-out: <strong>${signoff.checkOut}</strong>` : ""}
               </p>`
            : "";

        const sigBlock = signoff.signatureData
            ? `<div style="border:1px solid #e4e4e7;border-radius:8px;padding:12px;margin-top:8px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#18181b;">${signoff.supervisorName ?? ""}</p>
                <img src="${signoff.signatureData}" style="max-height:80px;width:auto;" />
               </div>`
            : `<p style="font-size:14px;font-weight:700;">${signoff.supervisorName ?? ""}</p>`;

        await resend.emails.send({
            from: fromAddress(senderName),
            to: [signoff.clientEmail],
            ...(replyTo ? { replyTo } : {}),
            subject: `Sign-off confirmed: ${signoff.project?.title ?? "Project"} — ${company}`,
            text: `Dear ${signoff.clientName},\n\nThank you for signing off on "${signoff.project?.title ?? "your project"}".\n\nSigned by: ${signoff.supervisorName ?? ""}\nDate: ${signedAt}\n${signoff.workDescription ? `\nWork performed:\n${signoff.workDescription}\n` : ""}\n${company}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                    <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Sign-off confirmed</h2>
                    <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${company}</p>
                    <p style="margin:0 0 16px;">Dear <strong>${signoff.clientName}</strong>,</p>
                    <p style="margin:0 0 24px;line-height:1.6;">Thank you for signing off on <strong>${signoff.project?.title ?? "your project"}</strong>. A record of this sign-off is included below.</p>
                    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#0369a1;">Project</p>
                        <p style="margin:0;font-weight:700;font-size:16px;color:#0c4a6e;">${signoff.project?.title ?? ""}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#0369a1;">Signed ${signedAt}</p>
                    </div>
                    ${workBlock}
                    ${timesBlock}
                    <div style="margin-bottom:24px;">
                        <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Signature</p>
                        ${sigBlock}
                    </div>
                    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${company}</p>
                </div>
            `,
        });

        return { success: true };
    },
});
