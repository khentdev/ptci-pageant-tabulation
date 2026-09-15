import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import type { Component } from 'vue';

export interface FilterButtons {
  label: string;
  value: Gender | undefined;
}

export type CandidatesItems = {
  canPicture: string | Component;
  canNumber: string;
  canName: string;
  canTeamLogo: string | Component;
  canTeamName: string;
  canCourse: string;
};
