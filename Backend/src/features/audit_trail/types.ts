import type { AuditActionType, Gender, Role } from "../../../generated/prisma/enums.js"

export type ContestantSnapshot = {
    id: number
    candidateNumber: number
    name: string
    gender: Gender
}

export type AuditTieResolution = {
    advancementTie?: {
        requiredSelections: number
        tiedContestants: ContestantSnapshot[]
        selectedContestants: ContestantSnapshot[]
    }
    placementTie?: {
        gender: Gender
        tiedContestants: ContestantSnapshot[]
        placementOrder: ContestantSnapshot[]
    }[]
}

export type GetAuditLogsDTO = {
    id: number
    action: AuditActionType
    actor: { id: number, name: string }
    actorRole: Role
    round: { id: number, name: string }
    tieResolution: AuditTieResolution | null
    createdAt: string
}

export type GetAuditLogsResponse = {
    data: GetAuditLogsDTO[]
    message: string
}

// Write-side only — consumed by live_event_management when inserting a row
// inside its own advance/declare transactions.
export type CreateAuditLogInput = {
    action: AuditActionType
    actorId: number
    actorRole: Role
    roundId: number
    tieResolution?: AuditTieResolution | null
}
