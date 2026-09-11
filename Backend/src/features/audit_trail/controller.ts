import type { Context } from "hono";
import { getAuditLogsService } from "./service.js";
import type { GetAuditLogsResponse } from "./types.js";

export async function getAuditLogsController(c: Context) {
    const data = await getAuditLogsService()
    return c.json<GetAuditLogsResponse>({
        data,
        message: "Audit logs retrieved successfully",
    }, 200)
}
