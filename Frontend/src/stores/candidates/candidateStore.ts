import { defineStore } from 'pinia';
import type { FilterButtons, MaleCandidatesItems } from '@/types/candidates/candidates';

export const useCandidateStore = defineStore('candidateStore', () => {
  const genderFilterButtons: FilterButtons[] = [
    { label: 'All', value: undefined },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
  ];

  const maleCandidatesItems: MaleCandidatesItems[] = [
    {
      canPicture: '/Males/LOUIE_ALANGILAN.jpg',
      canNumber: '#1',
      canName: 'Louie Alangilan',
      canTeamLogo: '',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '',
      canNumber: '#2',
      canName: 'David Imanuel Senador',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Males/REY_ELDRINE_PANIZA.jpg',
      canNumber: '#3',
      canName: 'Rey Eldrine Paniza',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Males/FROILAN_NUHAY.jpg',
      canNumber: '#4',
      canName: 'Froilan Nuhay',
      canTeamLogo: '',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Males/GABRIEL_RAMISO.jpg',
      canNumber: '#5',
      canName: 'Gabriel Ramiso',
      canTeamLogo: '',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Males/JOHN_ISRAEL_MIGUEL.jpg',
      canNumber: '#6',
      canName: 'John Israel Miguel',
      canTeamLogo: '',
      canTeamName: 'Red Vipers',
    },
    {
      canPicture: '/Males/JOHN_CALEB_LOPEZ.jpg',
      canNumber: '#7',
      canName: 'John Caleb Lopez',
      canTeamLogo: '',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Males/JADE_AZRYLL_RUBIA.jpg',
      canNumber: '#8',
      canName: 'Jade Azryll Rubia',
      canTeamLogo: '',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Males/KIANN_JAY_CAÑETE.jpg',
      canNumber: '#9',
      canName: 'Kiann Jay Cañete',
      canTeamLogo: '',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '/Males/RALPH_LOUIE_CHAN.jpg',
      canNumber: '#10',
      canName: 'Ralph Louie Chan',
      canTeamLogo: '',
      canTeamName: 'Red Vipers',
    },
  ];
  return { genderFilterButtons, maleCandidatesItems };
});
