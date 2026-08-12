import type { Context, Next } from "hono";
import type { AddCategoryRequestBody, CategoryFieldInput, EditCategoryRequestBody, SaveCategoryFieldsRequestBody } from "./types.js";
import { AppError } from '../../errors/appError.js';
import { isCriteriaFieldsTotalValid, parseCriteriaMaxValue, sumCriteriaMaxValues } from '../../utils/decimal.js';
import { isNotEmpty } from '../../utils/validation.js';

export async function validateAddCategoryInput(c: Context, next: Next) {
    const { name, roundId } = await c.req.json<AddCategoryRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("CATEGORY_NAME_REQUIRED", { field: "add_category_input_name" })
    if (!isNotEmpty(roundId)) throw new AppError("CATEGORY_ROUND_ID_REQUIRED", { field: "add_category_input_round_id" })
    const parsedRoundId = Number(roundId)
    if (!Number.isInteger(parsedRoundId) || parsedRoundId <= 0) throw new AppError("CATEGORY_ROUND_ID_INVALID", { field: "add_category_input_round_id" })

    c.set("addCategoryInput", { name: (name as string).trim(), roundId: parsedRoundId })
    await next()
}

export async function validateEditCategoryInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const { name } = await c.req.json<EditCategoryRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("CATEGORY_NAME_REQUIRED", { field: "edit_category_input_name" })
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("CATEGORY_ID_INVALID", { field: "edit_category_input_id" })

    c.set("editCategoryInput", { id: parsedId, name: (name as string).trim() })
    await next()
}

export async function validateGetCategoryByIdInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("CATEGORY_ID_INVALID", { field: "get_category_by_id_input_id" })

    c.set("getCategoryByIdInput", { id: parsedId })
    await next()
}

export async function validateGetCategoryFieldsInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new AppError("CATEGORY_ID_INVALID", { field: "get_category_fields_input_id" })
    }

    c.set("getCategoryFieldsInput", { categoryId: parsedId })
    await next()
}

export async function validateSaveCategoryFieldsInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0)
        throw new AppError("CATEGORY_ID_INVALID", { field: "save_category_fields_input_id" })

    const { fields } = await c.req.json<SaveCategoryFieldsRequestBody>()
    if (!Array.isArray(fields) || fields.length === 0)
        throw new AppError("CATEGORY_FIELDS_REQUIRED", { field: "save_category_fields_input_fields" })

    const parsedFields: CategoryFieldInput[] = fields.map((field, index) => {
        const { name, maxValue } = field as { name: unknown; maxValue: unknown }

        if (!isNotEmpty(name))
            throw new AppError("CATEGORY_FIELD_NAME_REQUIRED", {
                field: `save_category_fields_input_fields_${index}_name`,
            })


        if (!isNotEmpty(maxValue))
            throw new AppError("CATEGORY_FIELD_MAX_VALUE_REQUIRED", {
                field: `save_category_fields_input_fields_${index}_max_value`,
            })


        const parsedMaxValue = parseCriteriaMaxValue(maxValue as string)
        if (!parsedMaxValue) {
            throw new AppError("CATEGORY_FIELD_MAX_VALUE_INVALID", {
                field: `save_category_fields_input_fields_${index}_max_value`,
            })
        }

        return {
            name: (name as string).trim(),
            maxValue: parsedMaxValue,
        }
    })

    const total = sumCriteriaMaxValues(parsedFields)
    if (!isCriteriaFieldsTotalValid(total))
        throw new AppError("CATEGORY_FIELDS_TOTAL_INVALID")


    c.set("saveCategoryFieldsInput", { categoryId: parsedId, fields: parsedFields })
    await next()
}