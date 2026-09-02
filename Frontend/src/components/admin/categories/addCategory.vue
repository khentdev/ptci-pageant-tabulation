<template>
  <BaseModal
    :showModal="props.showModal"
    title="Add Category"
    @close="modalStore.toggleAddCategory()"
  >
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

      <BaseModalActions
        submitLabel="Add Category"
        submittingLabel="Adding category..."
        :isSubmitting="categoryStore.loadingStates.isAddingCategory"
        @cancel="modalStore.toggleAddCategory()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { ref, watch } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import type { AddCategoryInput } from '@/types/admin/adminSetup/category/categories';
import { CircleAlert } from '@lucide/vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';
import ModalFetchOverlay from '@/components/shared/modal/ModalFetchOverlay.vue';
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
