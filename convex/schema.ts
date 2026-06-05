import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
        tokenIdentifier: v.string(),
    }).index("by_token", ["tokenIdentifier"]),

    clients: defineTable({
        name: v.string(),
        email: v.string(),
        type: v.string(), // 'individual' | 'business'
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        userId: v.string(),
    }).index("by_user", ["userId"]),

    contacts: defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        subcontractorId: v.optional(v.id("subcontractors")),
        userId: v.string(),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"])
        .index("by_supplier", ["supplierId"])
        .index("by_subcontractor", ["subcontractorId"]),

    suppliers: defineTable({
        name: v.string(),
        email: v.string(),
        type: v.string(), // 'regular' | 'distributor'
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        userId: v.string(),
    }).index("by_user", ["userId"]),

    subcontractors: defineTable({
        name: v.string(),
        trade: v.string(), // 'electrical' | 'plumbing' | 'hvac' | 'carpentry' | 'masonry' | 'roofing' | 'painting' | 'tiling' | 'other'
        email: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        licenseNumber: v.optional(v.string()),
        insuranceExpiry: v.optional(v.number()), // timestamp
        notes: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        userId: v.string(),
    }).index("by_user", ["userId"]),

    projects: defineTable({
        userId: v.string(),
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(), // 'planning' | 'permitting' | 'in_progress' | 'punch_list' | 'completed' | 'closed'
        // Site
        siteAddress: v.optional(v.string()),
        siteCity: v.optional(v.string()),
        sitePostcode: v.optional(v.string()),
        // Dates
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        // Budget
        estimatedBudget: v.optional(v.number()),
        actualCost: v.optional(v.number()),
        // Progress
        progress: v.optional(v.number()), // 0-100
        // Links
        quoteId: v.optional(v.id("quotes")),
        purchaseOrderNumber: v.optional(v.string()),
        // Subcontractors assigned
        subcontractorIds: v.optional(v.array(v.id("subcontractors"))),
        // Photos
        photoIds: v.optional(v.array(v.id("_storage"))),
        // Notes
        internalNotes: v.optional(v.string()),
        // Intake flag
        fromIntake: v.optional(v.boolean()),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"])
        .index("by_status", ["status"]),

    quotes: defineTable({
        userId: v.string(),
        clientId: v.id("clients"),
        quoteNumber: v.string(),
        date: v.number(),
        expiryDate: v.optional(v.number()),
        status: v.string(), // 'draft' | 'sent' | 'approved' | 'rejected' | 'converted'
        items: v.optional(v.array(v.object({
            category: v.string(), // 'labor' | 'materials' | 'subcontractor' | 'other'
            description: v.string(),
            quantity: v.number(),
            unitPrice: v.number(),
            markup: v.optional(v.number()), // markup % on top
        }))),
        taxRate: v.optional(v.number()),
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
        sentAt: v.optional(v.number()),
        approvedAt: v.optional(v.number()),
        convertedToProjectId: v.optional(v.id("projects")),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"])
        .index("by_status", ["status"]),

    invoices: defineTable({
        clientId: v.id("clients"),
        projectId: v.optional(v.id("projects")),
        quoteId: v.optional(v.id("quotes")),
        invoiceNumber: v.string(),
        date: v.number(),
        dueDate: v.optional(v.number()),
        amount: v.number(),
        status: v.string(), // 'pending' | 'paid' | 'overdue'
        invoiceType: v.optional(v.string()), // 'progress' | 'final' | 'deposit'
        paymentMethod: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
            fromOrderId: v.optional(v.id("orders")),
        }))),
        credits: v.optional(v.array(v.object({
            description: v.string(),
            amount: v.number(),
        }))),
        // Retainage
        retainagePercent: v.optional(v.number()),
        retainageAmount: v.optional(v.number()),
        retainageReleased: v.optional(v.boolean()),
        // Storage
        invoiceStorageId: v.optional(v.id("_storage")),
        orderIds: v.optional(v.array(v.id("orders"))),
        taxRate: v.optional(v.number()),
        paidAt: v.optional(v.number()),
        purchaseOrderNumber: v.optional(v.string()),
        userId: v.string(),
    })
        .index("by_client", ["clientId"])
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"]),

    changeOrders: defineTable({
        userId: v.string(),
        projectId: v.id("projects"),
        coNumber: v.string(),
        description: v.string(),
        amount: v.number(), // positive = extra cost, negative = credit
        status: v.string(), // 'draft' | 'submitted' | 'approved' | 'rejected'
        submittedAt: v.optional(v.number()),
        approvedAt: v.optional(v.number()),
        notes: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"]),

    permits: defineTable({
        userId: v.string(),
        projectId: v.id("projects"),
        type: v.string(), // 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'zoning' | 'other'
        permitNumber: v.optional(v.string()),
        status: v.string(), // 'pending' | 'applied' | 'issued' | 'inspected' | 'closed'
        appliedAt: v.optional(v.number()),
        issuedAt: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
        notes: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"]),

    orders: defineTable({
        supplierId: v.id("suppliers"),
        projectId: v.optional(v.id("projects")),
        orderNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(), // 'pending' | 'paid' | 'cancelled'
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
        userId: v.string(),
    })
        .index("by_supplier", ["supplierId"])
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"]),

    timeEntries: defineTable({
        userId: v.string(),
        projectId: v.id("projects"),
        date: v.number(),
        durationMinutes: v.number(),
        description: v.optional(v.string()),
        billable: v.boolean(),
        invoiced: v.optional(v.boolean()),
        hourlyRate: v.optional(v.number()),
        workerName: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"])
        .index("by_user_date", ["userId", "date"]),

    materials: defineTable({
        userId: v.string(),
        projectId: v.optional(v.id("projects")),
        name: v.string(),
        description: v.optional(v.string()),
        sku: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.number(),
        unit: v.optional(v.string()), // 'm', 'm²', 'm³', 'kg', 'pcs', etc.
        unitCost: v.optional(v.number()),
        reorderThreshold: v.optional(v.number()),
        supplier: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"]),

    assets: defineTable({
        userId: v.string(),
        projectId: v.optional(v.id("projects")),
        name: v.string(),
        category: v.string(), // 'contract' | 'permit' | 'plan' | 'photo' | 'report' | 'other'
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"]),

    events: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        start: v.number(),
        end: v.optional(v.number()),
        type: v.string(), // 'appointment' | 'milestone' | 'supplier_order' | 'inspection'
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        projectId: v.optional(v.id("projects")),
        userId: v.string(),
    })
        .index("by_user", ["userId"])
        .index("by_project", ["projectId"]),

    settings: defineTable({
        userId: v.string(),
        companyName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        contactEmail: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        registrationNumber: v.optional(v.string()),
        vatNumber: v.optional(v.string()),
        defaultTaxRate: v.optional(v.number()),
        bankAccounts: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        language: v.optional(v.string()),
        currency: v.optional(v.string()),
        emailSenderName: v.optional(v.string()),
        // Email templates
        invoiceEmailSubject: v.optional(v.string()),
        invoiceEmailIntro: v.optional(v.string()),
        quoteEmailSubject: v.optional(v.string()),
        quoteEmailIntro: v.optional(v.string()),
        overdueEmailSubject: v.optional(v.string()),
        overdueEmailIntro: v.optional(v.string()),
        projectReadyEmailSubject: v.optional(v.string()),
        projectReadyEmailIntro: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    clientPortals: defineTable({
        clientId: v.id("clients"),
        userId: v.string(),
        token: v.string(),
    })
        .index("by_token", ["token"])
        .index("by_client", ["clientId"]),

    communications: defineTable({
        userId: v.string(),
        clientId: v.id("clients"),
        type: v.string(), // 'call' | 'email' | 'message' | 'in_person' | 'site_visit' | 'other'
        notes: v.string(),
        date: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"]),

    notificationReads: defineTable({
        userId: v.string(),
        key: v.string(),
    })
        .index("by_user", ["userId"])
        .index("by_user_key", ["userId", "key"]),

    signoffs: defineTable({
        projectId: v.id("projects"),
        userId: v.string(),
        token: v.string(),
        status: v.string(), // "pending" | "completed"
        clientEmail: v.string(),
        clientName: v.string(),
        sentAt: v.optional(v.number()),
        // Filled on completion by client/supervisor
        supervisorName: v.optional(v.string()),
        workDescription: v.optional(v.string()),
        checkIn: v.optional(v.string()),
        checkOut: v.optional(v.string()),
        signatureData: v.optional(v.string()), // base64 PNG
        photoIds: v.optional(v.array(v.id("_storage"))),
        completedAt: v.optional(v.number()),
    })
        .index("by_token", ["token"])
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"]),
});
