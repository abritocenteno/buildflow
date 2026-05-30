/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as changeOrders from "../changeOrders.js";
import type * as clients from "../clients.js";
import type * as communications from "../communications.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as invoiceJobs from "../invoiceJobs.js";
import type * as invoices from "../invoices.js";
import type * as materials from "../materials.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as permits from "../permits.js";
import type * as portal from "../portal.js";
import type * as projects from "../projects.js";
import type * as quotes from "../quotes.js";
import type * as reports from "../reports.js";
import type * as resend from "../resend.js";
import type * as search from "../search.js";
import type * as settings from "../settings.js";
import type * as signoffs from "../signoffs.js";
import type * as subcontractors from "../subcontractors.js";
import type * as suppliers from "../suppliers.js";
import type * as timeEntries from "../timeEntries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  changeOrders: typeof changeOrders;
  clients: typeof clients;
  communications: typeof communications;
  contacts: typeof contacts;
  crons: typeof crons;
  events: typeof events;
  files: typeof files;
  invoiceJobs: typeof invoiceJobs;
  invoices: typeof invoices;
  materials: typeof materials;
  notifications: typeof notifications;
  orders: typeof orders;
  permits: typeof permits;
  portal: typeof portal;
  projects: typeof projects;
  quotes: typeof quotes;
  reports: typeof reports;
  resend: typeof resend;
  search: typeof search;
  settings: typeof settings;
  signoffs: typeof signoffs;
  subcontractors: typeof subcontractors;
  suppliers: typeof suppliers;
  timeEntries: typeof timeEntries;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
