<template>
  <teleport to="body">
    <div
      @click.self="modalStore.toggleAddCategory()"
      v-if="props.showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-amber-200 sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between p-4 text-2xl">
          <p>Add Category</p>
          <button
            @click="modalStore.toggleAddCategory()"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

        <ModalFetchOverlay v-if="roundStore.loadingStates.isFetchingRounds" />
        <ServerErrorOverlayModal
          v-else-if="roundStore.errorStates.isFetchingRoundsError"
          title="Failed to Load Rounds"
          description="We couldn't load the rounds. Please try again."
          :onRetry="loadRounds"
        />
        <form
          v-else
          @submit.prevent="addCategory()"
          class="flex h-full w-full flex-col justify-start gap-4 p-4"
        >
          <div class="flex flex-col">
            <p>Round Name</p>
            <select v-model="selectedRound" class="h-10 w-full border border-black px-3">
              <option :value="''" disabled>Select a round</option>
              <option v-for="item in roundStore.roundList" :key="item.id" :value="String(item.id)">
                {{ item.name }}
              </option>
            </select>
            <div
              v-if="categoryStore.formErrors.categoryRound"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ categoryStore.formErrors.categoryRound }}
              </p>
            </div>
          </div>

          <div class="flex flex-col">
            <p>Category Name</p>
            <input
              v-model="newCategoryName"
              type="text"
              name="categoryName"
              id="categoryName"
              class="h-10 w-full border border-black px-3"
            />
            <div
              v-if="categoryStore.formErrors.categoryName"
              class="mt-1 flex w-full items-start gap-1"
            >
              <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
              <p class="text-sm text-red-500">
                {{ categoryStore.formErrors.categoryName }}
              </p>
            </div>
          </div>

          <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              @click="modalStore.toggleAddCategory()"
              class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="categoryStore.loadingStates.isAddingCategory"
              class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:opacity-50"
            >
              {{
                categoryStore.loadingStates.isAddingCategory ? 'Adding category...' : 'Add Category'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { ref, watch } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import type { AddCategoryInput } from '@/types/admin/adminSetup/category/categories';
import { CircleAlert, X } from '@lucide/vue';
import ModalFetchOverlay from './ModalFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const categoryStore = useCategoryStore();

const props = defineProps<{
  showModal: boolean;
}>();

const newCategoryName = ref('');
const selectedRound = ref('');

const loadRounds = async () => {
  await roundStore.getRound();
};

const addCategory = async () => {
  if (!selectedRound.value) {
    return;
  }

  const payload: AddCategoryInput = {
    name: newCategoryName.value.trim(),
    roundId: selectedRound.value,
  };

  const success = await categoryStore.addCategory(payload);
  if (success) {
    modalStore.toggleAddCategory();
    newCategoryName.value = '';
    selectedRound.value = '';
  }
};

watch([newCategoryName, selectedRound], () => {
  categoryStore.clearFormErrors();
});

watch(
  () => props.showModal,
  async (isOpen) => {
    if (isOpen) {
      await loadRounds();
    } else {
      newCategoryName.value = '';
      selectedRound.value = '';
    }
  },
);
</script>
