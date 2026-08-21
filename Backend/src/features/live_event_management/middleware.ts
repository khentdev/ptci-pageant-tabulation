import type { Context, Next } from "hono";
import { AppError } from '../../errors/appError.js';

import type { AdvanceRoundRequestBody } from "./types.js";

export async function validateGetJudgeSubmissions(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("ROUND_ID_INVALID", { field: "get_judge_submissions_input_id" })

    c.set("getJudgeSubmissions", { id: parsedId })
    await next()
}
export async function validateGetRoundResultsById(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("ROUND_ID_INVALID", { field: "get_round_results_input_id" })

    c.set("getRoundResults", { id: parsedId })
    await next()
}
export async function validateAdvanceRound(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new AppError("ROUND_ID_INVALID", { field: "advance_round_input_id" })
    }

    let body: AdvanceRoundRequestBody = {}
    try {
        body = await c.req.json<AdvanceRoundRequestBody>()
    } catch {
        body = {}
    }

    const { selectedContestantIds } = body
    let parsedSelectedIds: number[] | undefined

    if (selectedContestantIds !== undefined) {
        if (!Array.isArray(selectedContestantIds)) {
            throw new AppError("SELECTED_CONTESTANT_IDS_INVALID", {
                field: "advance_round_input_selected_contestant_ids",
            })
        }

        parsedSelectedIds = selectedContestantIds.map((contestantId, index) => {
            const parsed = Number(contestantId)
            if (!Number.isInteger(parsed) || parsed <= 0) {
                throw new AppError("SELECTED_CONTESTANT_ID_INVALID", {
                    field: `advance_round_input_selected_contestant_ids_${index}`,
                })
            }
            return parsed
        })

        if (new Set(parsedSelectedIds).size !== parsedSelectedIds.length) {
            throw new AppError("SELECTED_CONTESTANT_IDS_DUPLICATE", {
                field: "advance_round_input_selected_contestant_ids",
            })
        }

        if (parsedSelectedIds.length === 0) {
            parsedSelectedIds = undefined
        }
    }

    c.set("advanceRound", {
        id: parsedId,
        selectedContestantIds: parsedSelectedIds,
    })

    await next()
}