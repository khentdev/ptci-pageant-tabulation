<template>
  <BaseModal
    :showModal="props.showModal"
    title="Edit Category"
    @close="modalStore.toggleEditCategory()"
  >
    <ModalFetchOverlay v-if="categoryStore.loadingStates.isFetchingCategoryById" />
    <ServerErrorOverlayModal
      v-else-if="categoryStore.errorStates.isFetchingCategoryByIdError"
      title="Failed to Load Category Details"
      description="We couldn't load the category details. Please try again."
      :onRetry="retryFetchCategoryById"
    />
    <form
      v-else
      @submit.prevent="editCategory()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="flex flex-col">
        <p>Round Name</p>
        <input
          readonly
          type="text"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
          :value="category?.roundName ?? ''"
          placeholder="Loading..."
        />
      </div>

      <div class="flex flex-col">
        <p>Category Name</p>
        <input
          v-model="newCategoryName"
          :readonly="category?.isLocked === true"
          type="text"
          name="categoryName"
          id="categoryName"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
          :placeholder="category?.name ?? ''"
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
        submitLabel="Save Changes"
        submittingLabel="Saving..."
        :isSubmitting="categoryStore.loadingStates.isEditingCategory"
        :disabled="!category || category.isLocked"
        @cancel="modalStore.toggleEditCategory()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import { useModalStore } from '@/stores/modals/modalStore';
import type {
  EditCategoryInput,
  GetCategoryByIdDTO,
} from '@/types/admin/adminSetup/category/categories';
import { ref, watch } from 'vue';
import { CircleAlert } from '@lucide/vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';
import ModalFetchOverlay from '@/components/shared/modal/ModalFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';
import { useToast } from '@/composables/Toast/useToast';

const modalStore = useModalStore();
const categoryStore = useCategoryStore();
const { toast } = useToast();

const props = defineProps<{
  showModal: boolean;
  categoryId: number;
}>();

const newCategoryName = ref('');
const category = ref<GetCategoryByIdDTO | null>(null);

const loadCategory = async () => {
  if (!props.categoryId) {
    return;
  }

  categoryStore.clearFormErrors();
  const fetchedCategory = await categoryStore.getCategoryId(props.categoryId, () =>
    modalStore.toggleEditCategory(),
  );
  category.value = fetchedCategory;
  newCategoryName.value = fetchedCategory?.name ?? '';
};

const retryFetchCategoryById = async () => {
  await loadCategory();
};

const hasChanges = (): boolean => {
  if (!category.value) {
    return false;
  }

  return newCategoryName.value.trim() !== category.value.name;
};

const editCategory = async () => {
  if (!category.value?.id || category.value.isLocked) {
    return;
  }

  if (!hasChanges()) {
    toast.info('No changes detected.');
    return;
  }

  const payload: EditCategoryInput = {
    id: category.value.id,
    name: newCategoryName.value.trim(),
  };

  const success = await categoryStore.editCategory(payload);
  if (success) {
    modalStore.toggleEditCategory();
    newCategoryName.value = '';
    category.value = null;
  }
};

watch(
  () => [props.showModal, props.categoryId] as const,
  ([isOpen]) => {
    if (isOpen) {
      void loadCategory();
    }
  },
  { immediate: true },
);

watch(newCategoryName, () => {
  categoryStore.clearFormErrors();
});
</script>
