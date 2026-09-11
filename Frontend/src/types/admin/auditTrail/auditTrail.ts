export type AuditContestantSnapshot = {
  id: number;
  candidateNumber: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
};

export type AuditTieResolution = {
  advancementTie?: {
    requiredSelections: number;
    tiedContestants: AuditContestantSnapshot[];
    selectedContestants: AuditContestantSnapshot[];
  };
  placementTie?: {
    gender: 'MALE' | 'FEMALE';
    tiedContestants: AuditContestantSnapshot[];
    placementOrder: AuditContestantSnapshot[];
  }[];
};

export type GetAuditLogsDTO = {
  id: number;
  action: 'ROUND_ADVANCED' | 'WINNERS_DECLARED';
  actor: { id: number; name: string };
  actorRole: 'ADMIN' | 'JUDGE' | 'CHAIRMAN';
  round: { id: number; name: string };
  tieResolution: AuditTieResolution | null;
  createdAt: string;
};

export type GetAuditLogsResponse = {
  data: GetAuditLogsDTO[];
  message: string;
};
