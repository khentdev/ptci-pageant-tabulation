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

  const judgeModalStates = reactive({
    isAddingJudgeVisible: false,
    isEditJudgeVisible: false,
    isResetPasswordJudgeVisible: false,
  });

  const judgesModalFunction = () => {
    const toggleAddingJudgesModal = () => {
      judgeModalStates.isAddingJudgeVisible = !judgeModalStates.isAddingJudgeVisible;
    };

    const toggleEditingJudgesModal = () => {
      judgeModalStates.isEditJudgeVisible = !judgeModalStates.isEditJudgeVisible;
    };

    const toggleResetPasswordJudgesModal = () => {
      judgeModalStates.isResetPasswordJudgeVisible = !judgeModalStates.isResetPasswordJudgeVisible;
    };

    return { toggleAddingJudgesModal, toggleEditingJudgesModal, toggleResetPasswordJudgesModal };
  };

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
    judgeModalStates,
    judgesModalFunction,
  };
});
