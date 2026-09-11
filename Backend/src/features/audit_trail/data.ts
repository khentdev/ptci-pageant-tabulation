import { prisma } from "../../infra/prisma.js";
import type { CreateAuditLogInput } from "./types.js";

export async function getAuditLogs() {
    return prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            action: true,
            actorRole: true,
            createdAt: true,
            tieResolution: true,
            actor: { select: { id: true, name: true } },
            round: { select: { id: true, name: true } },
        },
    })
}

// Builds the Prisma `create` data shape for an audit row. The actual
// `tx.auditLog.create(...)` call happens inside live_event_management's own
// advance/declare transactions (a Prisma transaction can't span two
// independently-called `$transaction` blocks), so this stays a pure mapper
// imported from there rather than a standalone write function here.
export function buildAuditLogCreateData(input: CreateAuditLogInput) {
    return {
        action: input.action,
        actorId: input.actorId,
        actorRole: input.actorRole,
        roundId: input.roundId,
        tieResolution: input.tieResolution ?? undefined,
    }
}
