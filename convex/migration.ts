/**
 * One-off export of a user's data for the move to Cascabel.
 *
 * Internal only — run from the CLI, never reachable from the browser:
 *
 *   npx convex run --prod migration:listOwners
 *   npx convex run --prod migration:exportUser '{"userId":"<tokenIdentifier>"}' > bundle.json
 *
 * The bundle keeps the original document ids so the importer can remap
 * references, and lists every stored file with a download URL. Nothing here
 * writes: the BuildFlow data stays as it is.
 */
import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/** Tables that belong to a user, in the order the importer needs them. */
const TABLES = [
    "settings",
    "clients",
    "suppliers",
    "subcontractors",
    "contacts",
    "purchaseOrders",
    "quotes",
    "projects",
    "orders",
    "invoices",
    "changeOrders",
    "permits",
    "timeEntries",
    "materials",
    "assets",
    "events",
    "communications",
    "clientPortals",
    "signoffs",
] as const;

// Left out on purpose: users, allowedEmails, nameChangeRequests (BuildFlow
// admin state) and notificationReads (read markers; notifications start fresh).

export const listOwners = internalQuery({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("settings").collect();
        return settings.map((s) => ({
            userId: s.userId,
            companyName: s.companyName,
            contactEmail: s.contactEmail,
        }));
    },
});

export const collectRows = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const tables: Record<string, unknown[]> = {};
        for (const table of TABLES) {
            tables[table] =
                table === "clientPortals" // no by_user index
                    ? await ctx.db.query(table).filter((q) => q.eq(q.field("userId"), userId)).collect()
                    : await ctx.db
                          .query(table)
                          .withIndex("by_user", (q: any) => q.eq("userId", userId))
                          .collect();
        }
        return tables;
    },
});

/** Every `_storage` id referenced by the rows. */
function storageIds(tables: Record<string, any[]>): string[] {
    const ids = new Set<string>();
    const add = (id: unknown) => typeof id === "string" && id && ids.add(id);
    for (const s of tables.settings) add(s.logoStorageId);
    for (const t of ["clients", "contacts", "suppliers", "subcontractors"]) {
        for (const r of tables[t]) add(r.imageStorageId);
    }
    for (const r of tables.purchaseOrders) add(r.fileStorageId);
    for (const r of [...tables.orders, ...tables.invoices]) add(r.invoiceStorageId);
    for (const r of tables.assets) add(r.storageId);
    for (const r of [...tables.projects, ...tables.signoffs]) (r.photoIds ?? []).forEach(add);
    return [...ids];
}

export const exportUser = internalAction({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const tables = (await ctx.runQuery(internal.migration.collectRows, { userId })) as Record<string, any[]>;
        if (tables.settings.length === 0) throw new Error(`No settings for ${userId}`);

        const files: { id: string; url: string | null }[] = [];
        for (const id of storageIds(tables)) {
            files.push({ id, url: await ctx.storage.getUrl(id as any) });
        }

        return {
            format: "buildflow-export",
            version: 1,
            exportedAt: Date.now(),
            userId,
            counts: Object.fromEntries(Object.entries(tables).map(([t, rows]) => [t, rows.length])),
            tables,
            files,
        };
    },
});
