import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modalStore', () => {
  const isAddRoundsVisible = ref(false);
  const isEditRoundsVisible = ref(false);

  const toggleAddRoundsModal = () => {
    isAddRoundsVisible.value = !isAddRoundsVisible.value;
  };

  const toggleEditRoundsModal = () => {
    isEditRoundsVisible.value = !isEditRoundsVisible.value;
    //localStorage.removeItem('round-id');
  };

  return { isAddRoundsVisible, toggleAddRoundsModal, isEditRoundsVisible, toggleEditRoundsModal };
});
