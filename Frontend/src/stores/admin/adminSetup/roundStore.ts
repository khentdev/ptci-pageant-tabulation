import { defineStore } from 'pinia';
import { roundService } from './service';
import {
  type GetRoundByIdDTO,
  type AddRoundInput,
  type GetRoundsListDTO,
  type EditRoundInput,
} from '@/types/admin/adminSetup/rounds';
import { ref } from 'vue';

export const useRoundStore = defineStore('roundStore', () => {
  const roundList = ref<GetRoundsListDTO[]>([]);
  const roundId = ref<GetRoundByIdDTO | null>(null);
  const addRound = async (addRoundInput: AddRoundInput) => {
    try {
      const res = await roundService.addRound(addRoundInput);
      await getRound();
    } catch (error) {}
  };

  const getRound = async () => {
    try {
      const res = await roundService.getRound();
      roundList.value = res.data;
    } catch (error) {}
  };

  const getRoundId = async (id: number) => {
    try {
      const res = await roundService.getRoundId(id);
      roundId.value = res.data;
    } catch (error) {}
  };

  const editRound = async (editRoundInput: EditRoundInput) => {
    try {
      const res = await roundService.editRound(editRoundInput);
      await getRound();
    } catch (error) {}
  };

  const deleteRound = async (id: number) => {
    try {
      const res = await roundService.deleteRound(id);
      roundList.value = roundList.value.filter((item) => item.id !== id);
    } catch (error) {}
  };
  return { addRound, roundList, getRound, getRoundId, roundId, editRound, deleteRound };
});
