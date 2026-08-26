import {
  type Gender,
  type GetAllContestantsDTO,
} from '@/types/admin/adminSetup/contestants/contestants';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { contestantService } from './service';
import { useToast } from '@/composables/Toast/useToast';

export const useContestantStore = defineStore('contestantStore', () => {
  const { toast } = useToast();
  const contestantList = ref<GetAllContestantsDTO[]>([]);

  const getContestants = async (filter?: Gender) => {
    try {
      const params = filter ? { filter } : undefined;
      const res = await contestantService.getContestants(params);
      contestantList.value = res.data;
      console.log(contestantList);
      toast.success(res.message);
    } catch (error) {}
  };

  return { contestantList, getContestants };
});
