/**
 * Read-only export endpoints for Cascabel's daily sync.
 *
 * Cascabel pulls a user's bundle (the same one migration.exportUser builds)
 * once a day until the company switches over. Both routes need
 *
 *   Authorization: Bearer <CASCABEL_EXPORT_SECRET>
 *
 * and answer 404 when the secret isn't set, so the routes are off by default.
 *
 *   GET /cascabel/owners              → [{ userId, companyName, contactEmail }]
 *   GET /cascabel/export?userId=<id>  → the export bundle
 *
 * Nothing here writes.
 */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { buildBundle } from "./migration";

/** Compares in time that depends only on the lengths, not on where they differ. */
function sameSecret(given: string, expected: string): boolean {
    let diff = given.length ^ expected.length;
    for (let i = 0; i < expected.length; i++) {
        diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
    }
    return diff === 0;
}

function denied(request: Request): Response | null {
    const secret = process.env.CASCABEL_EXPORT_SECRET;
    if (!secret) return new Response("Not found", { status: 404 });
    const header = request.headers.get("Authorization") ?? "";
    const given = header.startsWith("Bearer ") ? header.slice(7) : "";
    return sameSecret(given, secret) ? null : new Response("Unauthorized", { status: 401 });
}

const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

const http = httpRouter();

http.route({
    path: "/cascabel/owners",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const refused = denied(request);
        if (refused) return refused;
        return json(await ctx.runQuery(internal.migration.listOwners, {}));
    }),
});

http.route({
    path: "/cascabel/export",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const refused = denied(request);
        if (refused) return refused;
        const userId = new URL(request.url).searchParams.get("userId");
        if (!userId) return new Response("userId is required", { status: 400 });
        try {
            return json(await buildBundle(ctx, userId));
        } catch (err) {
            return new Response(err instanceof Error ? err.message : "Export failed", { status: 404 });
        }
    }),
});

export default http;
