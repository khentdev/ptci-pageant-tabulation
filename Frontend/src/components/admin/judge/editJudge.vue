<template>
  <BaseModal
    :showModal="props.showModal"
    title="Edit Judge"
    @close="modalStore.judgesModalFunction().toggleEditingJudgesModal()"
  >
    <form
      @submit.prevent="saveJudge()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="h-full w-full">
        <p>Name</p>
        <input
          v-model="newJudgeName"
          type="text"
          placeholder="e.g. Maria Santos (name shown in judge list)"
          name="contestantName"
          id="contestantName"
          class="h-10 w-full border border-black px-3"
        />
        <div v-if="judgeStore.formErrors.judgeName" class="mt-1 flex w-full items-start gap-1">
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ judgeStore.formErrors.judgeName }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <p>Username</p>
        <input
          v-model="newJudgeUsername"
          type="text"
          placeholder="e.g. judge.maria (login username)"
          name="contestantTeamName"
          id="contestantTeamName"
          class="h-10 w-full border border-black px-3"
        />
        <div
          v-if="judgeStore.formErrors.judgeUsername"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ judgeStore.formErrors.judgeUsername }}
          </p>
        </div>
      </div>

      <BaseModalActions
        submitLabel="Save Changes"
        submittingLabel="Saving changes..."
        :isSubmitting="judgeStore.loadingStates.isAddingJudges"
        @cancel="modalStore.judgesModalFunction().toggleEditingJudgesModal()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { type EditJudgeInput } from '@/types/admin/adminSetup/judge/judge';
import { CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';

const judgeStore = useJudgeStore();
const modalStore = useModalStore();

const newJudgeName = ref('');
const newJudgeUsername = ref('');
const props = defineProps<{
  showModal: boolean;
  judgeId: number;
}>();

const saveJudge = async () => {
  const payload: EditJudgeInput = {
    id: props.judgeId,
    name: newJudgeName.value.trim(),
    username: newJudgeUsername.value.trim(),
  };

  const success = await judgeStore.editJudges(payload);
  if (success) {
    modalStore.judgesModalFunction().toggleEditingJudgesModal();
    newJudgeName.value = '';
    newJudgeUsername.value = '';
  }
};

watch([newJudgeName, newJudgeUsername], () => {
  judgeStore.clearFormErrors();
});
</script>
