import { AppError } from "../../errors/appError.js";
import logger from "../../infra/logger.js";
import { getAuditLogs } from "./data.js";
import type { GetAuditLogsDTO } from "./types.js";

export async function getAuditLogsService(): Promise<GetAuditLogsDTO[]> {
    try {
        const rows = await getAuditLogs()
        return rows.map(row => ({
            id: row.id,
            action: row.action,
            actor: row.actor,
            actorRole: row.actorRole,
            round: row.round,
            tieResolution: (row.tieResolution as GetAuditLogsDTO["tieResolution"]) ?? null,
            createdAt: row.createdAt.toISOString(),
        }))
    } catch (err) {
        logger.error({ err }, "Error getting audit logs")
        throw new AppError("AUDIT_LOGS_GET_ERROR")
    }
}
