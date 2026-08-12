import type { Context } from "hono"
import type { AppContext } from "../../types/context.js"
import { addContestantService } from "./service.js"
import type { AddContestantInputVariables } from "./types.js"

export async function addContestantController(c: Context<AppContext<AddContestantInputVariables>>) {
    const input = c.var.addContestantInput
    await addContestantService(input)
    return c.json({ message: "Contestant added successfully" }, 201)
}
