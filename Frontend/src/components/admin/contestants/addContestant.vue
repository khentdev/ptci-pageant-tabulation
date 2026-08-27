<template>
  <teleport to="body">
    <div
      @click.self="modalStore.toggleAddContestant()"
      v-if="props.showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-amber-200 sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between px-4 text-2xl">
          <p>Add Contestant</p>
          <button
            @click="modalStore.toggleAddCategory()"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

        <form
          @submit.prevent="saveContestant()"
          class="flex h-full w-full flex-col justify-start gap-4 p-4"
        >
          <div class="h-full w-full">
            <p>Contestant No.</p>
            <input
              v-model="newContestantNumber"
              type="number"
              name="contestantNumber"
              id="contestantNumber"
              class="h-10 w-full border border-black px-3"
            />
            <div
              v-if="contestantStore.formErrors.contestantNumber"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ contestantStore.formErrors.contestantNumber }}
              </p>
            </div>
          </div>

          <div class="h-full w-full">
            <p>Name</p>
            <input
              v-model="newContestantName"
              type="text"
              name="contestantName"
              id="contestantName"
              class="h-10 w-full border border-black px-3"
            />
            <div
              v-if="contestantStore.formErrors.contestantName"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ contestantStore.formErrors.contestantName }}
              </p>
            </div>
          </div>

          <div class="h-full w-full">
            <p>Gender</p>
            <select v-model="selectedGender" class="h-10 w-full border border-black px-3">
              <option :value="''" disabled>Select a gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div
              v-if="contestantStore.formErrors.contestantGender"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ contestantStore.formErrors.contestantGender }}
              </p>
            </div>
          </div>

          <div class="h-full w-full">
            <p>Team Name</p>
            <input
              v-model="newContestantTeamName"
              type="text"
              name="contestantTeamName"
              id="contestantTeamName"
              class="h-10 w-full border border-black px-3"
            />
            <div
              v-if="contestantStore.formErrors.contestantTeamName"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ contestantStore.formErrors.contestantTeamName }}
              </p>
            </div>
          </div>

          <div class="h-full w-full">
            <p>Team Color</p>
            <input
              v-model="newContestantTeamColor"
              type="text"
              name="contestantTeamColor"
              id="contestantTeamColor"
              class="h-10 w-full border border-black px-3"
            />
            <div
              v-if="contestantStore.formErrors.contestantTeamColor"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ contestantStore.formErrors.contestantTeamColor }}
              </p>
            </div>
          </div>
          <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              @click="modalStore.toggleAddContestant()"
              class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="contestantStore.loadingStates.isAddingContestants"
              class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:opacity-50"
            >
              {{
                contestantStore.loadingStates.isAddingContestants
                  ? 'Saving contestant...'
                  : 'Save Contestant'
              }}
            </button>
          </div>
        </form>
      </div>

      <!--<ModalFetchOverlay v-if="roundStore.loadingStates.isFetchingRounds" />-->
      <!-- <ServerErrorOverlayModal
          v-else-if="roundStore.errorStates.isFetchingRoundsError"
          title="Failed to Load Rounds"
          description="We couldn't load the rounds. Please try again."
          :onRetry="loadRounds"
        />
        <form
          v-else
          @submit.prevent="addCategory()"
          class="flex h-full w-full flex-col justify-start gap-4 p-4"
        >-->
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import { useModalStore } from '@/stores/modals/modalStore';
import type { AddContestantInput } from '@/types/admin/adminSetup/contestants/contestants';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { X, CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';

const contestantStore = useContestantStore();
const modalStore = useModalStore();

const newContestantNumber = ref('');
const newContestantName = ref('');
const selectedGender = ref<Gender>();
const newContestantTeamName = ref('');
const newContestantTeamColor = ref('');

const saveContestant = async () => {
  if (!selectedGender.value) {
    return;
  }
  if (!newContestantNumber.value) {
    return;
  }

  const payload: AddContestantInput = {
    candidateNumber: String(newContestantNumber.value),
    name: newContestantName.value.trim(),
    gender: selectedGender.value,
    teamName: newContestantTeamName.value.trim(),
    teamColor: newContestantTeamColor.value.trim(),
  };
  console.log(payload);

  const success = await contestantStore.addContestant(payload);
  if (success) {
    modalStore.toggleAddContestant();
    ((newContestantNumber.value = ''),
      (newContestantName.value = ''),
      (newContestantTeamName.value = ''));
    newContestantTeamColor.value = '';
  }
};

watch(
  [newContestantNumber, newContestantName, newContestantTeamName, newContestantTeamColor],
  () => {
    contestantStore.clearFormErrors();
  },
);

const props = defineProps<{
  showModal: boolean;
}>();
</script>
