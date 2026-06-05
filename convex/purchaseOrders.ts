import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

async function nextPoNumber(ctx: any, userId: string) {
    const pos = await ctx.db.query("purchaseOrders")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();
    const year = new Date().getFullYear();
    const num = pos.length + 1;
    return `PO-${year}-${String(num).padStart(3, "0")}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const pos = await ctx.db.query("purchaseOrders")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .collect();

        // Batch billing computation — one pass over invoices
        const allInvoices = await ctx.db.query("invoices")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .collect();
        const billedByPo = new Map<string, number>();
        for (const inv of allInvoices) {
            if (inv.purchaseOrderId) {
                billedByPo.set(inv.purchaseOrderId, (billedByPo.get(inv.purchaseOrderId) ?? 0) + inv.amount);
            }
        }

        return await Promise.all(pos.map(async (po: any) => {
            const client = await ctx.db.get(po.clientId);
            const project = po.projectId ? await ctx.db.get(po.projectId) : null;
            const billedAmount = billedByPo.get(po._id) ?? 0;
            const billedPercent = po.amount > 0 ? Math.min(100, (billedAmount / po.amount) * 100) : 0;
            return { ...po, client, project, billedAmount, billedPercent };
        }));
    },
});

export const get = query({
    args: { id: v.id("purchaseOrders") },
    handler: async (ctx, { id }) => {
        const po = await ctx.db.get(id);
        if (!po) return null;
        const client = await ctx.db.get(po.clientId);
        const project = po.projectId ? await ctx.db.get(po.projectId) : null;
        const invoices = await ctx.db.query("invoices")
            .withIndex("by_purchase_order", (q: any) => q.eq("purchaseOrderId", id))
            .collect();
        const billedAmount = invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const billedPercent = po.amount > 0 ? Math.min(100, (billedAmount / po.amount) * 100) : 0;
        return { ...po, client, project, invoices, billedAmount, billedPercent };
    },
});

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        return await ctx.db.query("purchaseOrders")
            .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
            .collect();
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        projectId: v.optional(v.id("projects")),
        poNumber: v.optional(v.string()),
        description: v.optional(v.string()),
        amount: v.number(),
        status: v.optional(v.string()),
        receivedAt: v.number(),
        expiresAt: v.optional(v.number()),
        fileStorageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const { poNumber: customNumber, ...rest } = args;
        const poNumber = customNumber?.trim() || await nextPoNumber(ctx, userId);
        const poId = await ctx.db.insert("purchaseOrders", {
            ...rest,
            userId,
            poNumber,
            status: args.status ?? "received",
        });
        // If a project is linked, sync both sides
        if (args.projectId) {
            await ctx.db.patch(args.projectId, {
                purchaseOrderId: poId,
                purchaseOrderNumber: poNumber,
            });
        }
        return poId;
    },
});

export const update = mutation({
    args: {
        id: v.id("purchaseOrders"),
        description: v.optional(v.string()),
        amount: v.optional(v.number()),
        status: v.optional(v.string()),
        receivedAt: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
        fileStorageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const linkToProject = mutation({
    args: {
        id: v.id("purchaseOrders"),
        projectId: v.id("projects"),
    },
    handler: async (ctx, { id, projectId }) => {
        const po = await ctx.db.get(id);
        if (!po) throw new Error("PO not found");
        await ctx.db.patch(id, { projectId });
        await ctx.db.patch(projectId, {
            purchaseOrderId: id,
            purchaseOrderNumber: po.poNumber,
        });
    },
});

export const markStatus = mutation({
    args: {
        id: v.id("purchaseOrders"),
        status: v.string(),
    },
    handler: async (ctx, { id, status }) => {
        await ctx.db.patch(id, { status });
    },
});

export const remove = mutation({
    args: { id: v.id("purchaseOrders") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        // Clear references on linked project
        const projects = await ctx.db.query("projects")
            .withIndex("by_user", (q: any) => q.eq("userId", identity.tokenIdentifier))
            .filter((q: any) => q.eq(q.field("purchaseOrderId"), id))
            .collect();
        for (const p of projects) {
            await ctx.db.patch(p._id, { purchaseOrderId: undefined });
        }
        // Clear references on linked invoices
        const invoices = await ctx.db.query("invoices")
            .withIndex("by_purchase_order", (q: any) => q.eq("purchaseOrderId", id))
            .collect();
        for (const inv of invoices) {
            await ctx.db.patch(inv._id, { purchaseOrderId: undefined });
        }
        await ctx.db.delete(id);
    },
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export const parsePoPdf = action({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, { storageId }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        const fileBlob = await ctx.storage.get(storageId);
        if (!fileBlob) throw new Error("File not found in storage");
        const buffer = await fileBlob.arrayBuffer();
        const base64Data = arrayBufferToBase64(buffer);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are parsing a Purchase Order (PO) document. Extract the following fields and return ONLY valid JSON with no markdown formatting:
{
  "poNumber": "the PO number or order number (e.g. 50019838)",
  "amount": 0.00,
  "receivedAt": "YYYY-MM-DD",
  "expiresAt": "YYYY-MM-DD or null",
  "description": "brief summary of the work or items ordered (combine line item descriptions if needed, max 200 chars)",
  "clientName": "name of the company that issued the PO"
}

Rules:
- amount: sum of all line item amounts, as a number (no currency symbols)
- receivedAt: the PO issue/order date
- expiresAt: the delivery date, required-by date, or expiry date if present, otherwise null
- If a field cannot be found, use null
- Return ONLY the JSON object, no explanation`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } },
        ]);

        const raw = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(raw);
    },
});
