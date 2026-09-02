<template>
  <BaseModal
    :showModal="props.showModal"
    title="Edit Judge"
    @close="modalStore.judgesModalFunction().toggleResetPasswordJudgesModal()"
  >
    <form
      @submit.prevent="saveJudge()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="h-full w-full">
        <p>Password</p>
        <input
          v-model="newJudgePassword"
          type="password"
          name="contestantTeamColor"
          id="contestantTeamColor"
          class="h-10 w-full border border-black px-3"
        />
        <div
          v-if="judgeStore.formErrors.judgePassword"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ judgeStore.formErrors.judgePassword }}
          </p>
        </div>
      </div>

      <BaseModalActions
        submitLabel="Save Changes"
        submittingLabel="Saving changes..."
        :isSubmitting="judgeStore.loadingStates.isAddingJudges"
        @cancel="modalStore.judgesModalFunction().toggleResetPasswordJudgesModal()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { type ResetJudgePasswordInput } from '@/types/admin/adminSetup/judge/judge';
import { CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';

const judgeStore = useJudgeStore();
const modalStore = useModalStore();

const newJudgePassword = ref('');

const props = defineProps<{
  showModal: boolean;
  judgeId: number;
}>();

const saveJudge = async () => {
  const payload: ResetJudgePasswordInput = {
    id: props.judgeId,
    password: newJudgePassword.value,
  };

  const success = await judgeStore.resetPassword(payload);
  if (success) {
    modalStore.judgesModalFunction().toggleResetPasswordJudgesModal();
    newJudgePassword.value = '';
  }
};

watch([newJudgePassword], () => {
  judgeStore.clearFormErrors();
});
</script>
