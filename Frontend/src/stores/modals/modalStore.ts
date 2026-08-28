import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useModalStore = defineStore('modalStore', () => {
  // Round
  const isAddRoundsVisible = ref(false);
  const isEditRoundsVisible = ref(false);

  // Categories
  const isAddCategoryVisible = ref(false);
  const isEditCategoryVisible = ref(false);
  const isFieldCategoryVisible = ref(false);

  const contestantModalStates = reactive({
    isAddContestantVisible: false,
    isEditContestantVisible: false,
  });

  const toggleAddRoundsModal = () => {
    isAddRoundsVisible.value = !isAddRoundsVisible.value;
  };

  const toggleEditRoundsModal = () => {
    isEditRoundsVisible.value = !isEditRoundsVisible.value;
    //localStorage.removeItem('round-id');
  };

  const toggleAddCategory = () => {
    isAddCategoryVisible.value = !isAddCategoryVisible.value;
  };

  const toggleEditCategory = () => {
    isEditCategoryVisible.value = !isEditCategoryVisible.value;
  };

  const toggleFieldCategory = () => {
    isFieldCategoryVisible.value = !isFieldCategoryVisible.value;
  };

  const toggleAddContestant = () => {
    contestantModalStates.isAddContestantVisible = !contestantModalStates.isAddContestantVisible;
  };

  const toggleEditContestant = () => {
    contestantModalStates.isEditContestantVisible = !contestantModalStates.isEditContestantVisible;
  };

  return {
    toggleEditContestant,
    toggleAddContestant,
    isFieldCategoryVisible,
    toggleFieldCategory,
    isAddRoundsVisible,
    toggleAddRoundsModal,
    isEditRoundsVisible,
    toggleEditRoundsModal,
    isAddCategoryVisible,
    toggleAddCategory,
    isEditCategoryVisible,
    toggleEditCategory,
    contestantModalStates,
  };
});
