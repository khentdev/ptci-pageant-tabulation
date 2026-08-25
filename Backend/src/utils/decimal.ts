import { Decimal } from "@prisma/client/runtime/client"

const CRITERIA_MAX_VALUE_MIN = new Decimal(1)
const CRITERIA_MAX_VALUE_MAX_DECIMAL_PLACES = 2
const CRITERIA_FIELDS_REQUIRED_TOTAL = new Decimal(100)

const isValidDecimalString = (value: string): boolean =>
    /^\d+(\.\d{1,2})?$/.test(value)

export const parseCriteriaMaxValue = (value: string): Decimal | null => {
    const trimmed = value.trim()

    if (!isValidDecimalString(trimmed)) return null

    try {
        const parsed = new Decimal(trimmed)
        if (parsed.decimalPlaces() > CRITERIA_MAX_VALUE_MAX_DECIMAL_PLACES) return null
        if (parsed.lessThan(CRITERIA_MAX_VALUE_MIN)) return null

        return parsed
    } catch {
        return null
    }
}

export const sumCriteriaMaxValues = (fields: Array<{ maxValue: Decimal }>): Decimal =>
    fields.reduce(
        (total, field) => total.plus(field.maxValue),
        new Decimal(0),
    )

export const isCriteriaFieldsTotalValid = (total: Decimal): boolean =>
    total.equals(CRITERIA_FIELDS_REQUIRED_TOTAL)
