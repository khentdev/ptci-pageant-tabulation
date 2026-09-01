<template>
  <teleport to="body">
    <div
      @click.self="modalStore.judgesModalFunction().toggleEditingJudgesModal()"
      v-if="props.showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-amber-200 sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between px-4 text-2xl">
          <p>Edit Judge</p>
          <button
            @click="modalStore.judgesModalFunction().toggleEditingJudgesModal()"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

        <form
          @submit.prevent="saveJudge()"
          class="flex h-full w-full flex-col justify-start gap-4 p-4"
        >
          <div class="h-full w-full">
            <p>Name</p>
            <input
              v-model="newJudgeName"
              type="text"
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

          <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              @click="modalStore.judgesModalFunction().toggleEditingJudgesModal()"
              class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="judgeStore.loadingStates.isAddingJudges"
              class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:opacity-50"
            >
              {{ judgeStore.loadingStates.isAddingJudges ? 'Saving changes...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/Toast/useToast';
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { type GetJudgeListDTO, type EditJudgeInput } from '@/types/admin/adminSetup/judge/judge';
import { X, CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';

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
