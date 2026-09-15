import { defineStore } from 'pinia';
import type { FilterButtons, CandidatesItems } from '@/types/candidates/candidates';

export const useCandidateStore = defineStore('candidateStore', () => {
  const genderFilterButtons: FilterButtons[] = [
    { label: 'All', value: undefined },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
  ];

  const malesCandidatesItems: CandidatesItems[] = [
    {
      canPicture: '/Males/candidate1.jpg',
      canNumber: 'No.1',
      canName: 'Louie Alangilan',
      canTeamLogo: '',
      canCourse: 'SHS',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '/Males/candidate2.jpg',
      canNumber: 'No.2',
      canName: 'David Imanuel Senador',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canCourse: 'SHS',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Males/candidate3.jpg',
      canNumber: 'No.3',
      canName: 'Rey Eldrine Paniza',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canCourse: 'BSIT',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Males/candidate4.jpg',
      canNumber: 'No.4',
      canName: 'Froilan Nuhay',
      canTeamLogo: '',
      canCourse: 'BSIT',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Males/candidate5.jpg',
      canNumber: 'No.5',
      canName: 'Gabriel Ramiso',
      canTeamLogo: '',
      canCourse: 'BSIT',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Males/candidate6.jpg',
      canNumber: 'No.6',
      canName: 'John Israel Miguel',
      canTeamLogo: '',
      canCourse: 'BSIT',
      canTeamName: 'Red Vipers',
    },
    {
      canPicture: '/Males/candidate7.jpg',
      canNumber: 'No.7',
      canName: 'John Caleb Lopez',
      canTeamLogo: '',
      canCourse: 'BSIS',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Males/candidate8.jpg',
      canNumber: 'No.8',
      canName: 'Jade Azryll Rubia',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Males/candidate9.jpg',
      canNumber: 'No.9',
      canName: 'Kiann Jay Cañete',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '/Males/candidate10.jpg',
      canNumber: 'No.10',
      canName: 'Ralph Louie Chan',
      canTeamLogo: '',
      canCourse: 'BSIS',
      canTeamName: 'Red Vipers',
    },
  ];

  const femalesCandidatesItems: CandidatesItems[] = [
    {
      canPicture: '/Females/candidate1.jpg',
      canNumber: 'No.1',
      canName: 'Venus Nicole Ferrer',
      canTeamLogo: '',
      canCourse: 'BSOA',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '/Females/candidate2.jpg',
      canNumber: 'No.2',
      canName: 'Laarni Vergara',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canCourse: 'SHS',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Females/candidate3.jpg',
      canNumber: 'No.3',
      canName: 'Jade Cabuenas',
      canTeamLogo: '/TeamLogo/white_wolves.png',
      canCourse: 'BSIT',
      canTeamName: 'White Wolves',
    },
    {
      canPicture: '/Females/candidate4.jpg',
      canNumber: 'No.4',
      canName: 'Princess Jamaica Susing',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Females/candidate5.jpg',
      canNumber: 'No.5',
      canName: 'Rhean Faith Orca',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Females/candidate6.jpg',
      canNumber: 'No.6',
      canName: 'Carmela Samonte',
      canTeamLogo: '',
      canCourse: 'BSOA',
      canTeamName: 'Red Vipers',
    },
    {
      canPicture: '/Females/candidate7.jpg',
      canNumber: 'No.7',
      canName: 'Jean Ryaen Felipe',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Green Dragon',
    },
    {
      canPicture: '/Females/candidate8.jpg',
      canNumber: 'No.8',
      canName: 'Althea Panagsagan',
      canTeamLogo: '',
      canCourse: 'BSHM',
      canTeamName: 'Purple Hawk',
    },
    {
      canPicture: '/Females/candidate9.jpg',
      canNumber: 'No.9',
      canName: 'Yashira Coleen Sena',
      canTeamLogo: '',
      canCourse: 'SHS',
      canTeamName: 'Black Stallion',
    },
    {
      canPicture: '/Females/candidate10.jpg',
      canNumber: 'No.10',
      canName: 'Alleria Bernardo',
      canTeamLogo: '',
      canCourse: 'BSOA',
      canTeamName: 'Red Vipers',
    },
  ];

  return { genderFilterButtons, malesCandidatesItems, femalesCandidatesItems };
});
