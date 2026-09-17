<template>
  <BaseModal
    :showModal="showModal"
    :title="`${categoryFields?.categoryName ?? ''} — Scoring Fields`"
    :showCloseButton="false"
    cardClass="bg-main-light-brown"
    titleClass="font-bold text-xl md:text-2xl"
    @close="modalStore.toggleFieldCategory()"
  >
    <BaseModalFetchOverlay v-if="categoryStore.loadingStates.isFetchingCategoryFields" />
    <BaseModalServerErrorOverlay
      v-else-if="categoryStore.errorStates.isFetchingCategoryFieldsError"
      title="Failed to Load Scoring Fields"
      description="We couldn't load the scoring fields. Please try again."
      :onRetry="retryFetchCategoryFields"
    />
    <form
      v-else
      @submit.prevent="handleSaveCategoryFields"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="h-full w-full overflow-y-auto">
        <CategoryFieldsTable
          :fieldRows
          :isLocked="categoryFields?.isLocked === true"
          @remove-row="removeRow"
        />
      </div>
      <div class="mt-auto flex flex-col gap-4">
        <button
          type="button"
          :disabled="categoryFields?.isLocked === true"
          @click="addRow"
          class="bg-jungle-green-600 hover:bg-jungle-green-700 w-fit cursor-pointer rounded-lg px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Row
        </button>

        <!-- Total Score & Status Banner -->
        <div
          class="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm"
          :class="
            isTotalValid
              ? 'border-jungle-green-700/30 bg-jungle-green-800/10 text-jungle-green-900'
              : 'border-red-300 bg-red-50/80 text-red-800'
          "
        >
          <div class="flex items-center gap-2">
            <span class="font-medium text-black/60">Total Score:</span>
            <span class="font-bold">{{ totalMaxValue }} / 100</span>
          </div>

          <div class="flex items-center gap-1.5 text-xs font-semibold">
            <template v-if="isTotalValid">
              <Check class="size-4 text-jungle-green-700 stroke-[2.5]" />
              <span>Balanced</span>
            </template>
            <template v-else>
              <TriangleAlert class="size-4 text-red-600" />
              <span>
                {{ totalMaxValue < 100 ? `Need ${totalDiscrepancy} more` : `Exceeds by ${totalDiscrepancy}` }}
              </span>
            </template>
          </div>
        </div>

        <BaseModalActions
          submitLabel="Save Fields"
          submittingLabel="Saving..."
          :isSubmitting="categoryStore.loadingStates.isSavingCategoryFields"
          :disabled="categoryFields?.isLocked === true || !props.categoryId || !isTotalValid"
          @cancel="modalStore.toggleFieldCategory()"
        />
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { computed, ref, watch } from 'vue';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import type {
  CategoryFieldInput,
  GetCategoryFieldsDTO,
  SaveCategoryFieldsInput,
} from '@/types/admin/adminSetup/category/categories';
import { Check, TriangleAlert } from '@lucide/vue';
import CategoryFieldsTable from './CategoryFieldsTable.vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';
import BaseModalFetchOverlay from '@/components/shared/modal/BaseModalFetchOverlay.vue';
import BaseModalServerErrorOverlay from '@/components/shared/modal/BaseModalServerErrorOverlay.vue';
import { useToast } from '@/composables/Toast/useToast';

type FieldRowSnapshot = {
  name: string;
  maxValue: string;
};

const props = defineProps<{
  showModal: boolean;
  categoryId: number;
}>();

const modalStore = useModalStore();
const categoryStore = useCategoryStore();
const { toast } = useToast();

const categoryFields = ref<GetCategoryFieldsDTO | null>(null);
const fieldRows = ref<CategoryFieldInput[]>([]);
const baselineFieldRows = ref<FieldRowSnapshot[]>([]);

const totalMaxValue = computed(() => {
  const sum = fieldRows.value.reduce((acc, row) => {
    const val = parseFloat(row.maxValue);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  return Math.round(sum * 100) / 100;
});

const isTotalValid = computed(() => totalMaxValue.value === 100);

const totalDiscrepancy = computed(() => {
  const diff = 100 - totalMaxValue.value;
  return Math.round(Math.abs(diff) * 100) / 100;
});

const normalizeFieldRows = (rows: CategoryFieldInput[]): FieldRowSnapshot[] => {
  return rows.map((row) => ({
    name: row.name.trim(),
    maxValue: String(row.maxValue).trim(),
  }));
};

const initializeFieldRows = (fields: GetCategoryFieldsDTO | null) => {
  if (fields?.fields && fields.fields.length > 0) {
    fieldRows.value = fields.fields.map((f) => ({
      name: f.name,
      maxValue: String(f.maxValue),
    }));
  } else {
    fieldRows.value = [{ name: '', maxValue: '' }];
  }

  baselineFieldRows.value = normalizeFieldRows(fieldRows.value);
};

const resetFieldsState = () => {
  categoryFields.value = null;
  fieldRows.value = [];
  baselineFieldRows.value = [];
};

const loadCategoryFields = async () => {
  if (!props.categoryId) {
    return;
  }

  const fields = await categoryStore.getCategoryFieldsId(props.categoryId, () =>
    modalStore.toggleFieldCategory(),
  );
  categoryFields.value = fields;
  initializeFieldRows(fields);
};

const retryFetchCategoryFields = async () => {
  await loadCategoryFields();
};

const hasChanges = (): boolean => {
  const currentRows = normalizeFieldRows(fieldRows.value);

  if (currentRows.length !== baselineFieldRows.value.length) {
    return true;
  }

  return currentRows.some((row, index) => {
    const baseline = baselineFieldRows.value[index];
    return row.name !== baseline?.name || row.maxValue !== baseline?.maxValue;
  });
};

watch(
  () => [props.showModal, props.categoryId] as const,
  ([isOpen]) => {
    if (isOpen) {
      void loadCategoryFields();
    } else {
      resetFieldsState();
    }
  },
);

const addRow = () => {
  fieldRows.value.push({ name: '', maxValue: '' });
};

const removeRow = (index: number) => {
  fieldRows.value.splice(index, 1);
};

const handleSaveCategoryFields = async () => {
  if (
    categoryStore.loadingStates.isSavingCategoryFields ||
    categoryFields.value?.isLocked === true ||
    !props.categoryId ||
    !isTotalValid.value
  ) {
    return;
  }

  if (!hasChanges()) {
    toast.info('No changes detected.');
    return;
  }

  const payload: SaveCategoryFieldsInput = {
    categoryId: props.categoryId,
    fields: fieldRows.value.map((f) => ({
      name: f.name,
      maxValue: String(f.maxValue),
    })),
  };

  const success = await categoryStore.saveCategoryFields(payload, () =>
    modalStore.toggleFieldCategory(),
  );

  if (success) {
    modalStore.toggleFieldCategory();
    resetFieldsState();
  }
};
</script>
