<template>
  <Teleport to="body">
    <div
      @click.self="modalStore.toggleFieldCategory()"
      v-if="showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-main-light-brown sm:w-lg md:h-auto"
      >
        <div class="flex w-full justify-between p-4 font-bold text-xl md:text-2xl">
          <p>{{ categoryFields?.categoryName }} — Scoring Fields</p>
        </div>

        <ModalFetchOverlay v-if="categoryStore.loadingStates.isFetchingCategoryFields" />
        <ServerErrorOverlayModal
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
            <FieldTable
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
              class="bg-jungle-green-600 w-fit cursor-pointer rounded-xl px-6 py-2 text-white hover:bg-jungle-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Row
            </button>

            <div class="flex gap-2 px-2">
              <p>Total: {{ totalMaxValue }} / 100</p>
              <Check v-if="totalMaxValue === 100" class="stroke-jungle-green-700" />
              <TriangleAlert v-if="totalMaxValue < 100" class="h-5 w-5 stroke-red-500" />
            </div>
            <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
              <button
                type="button"
                @click="modalStore.toggleFieldCategory()"
                class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="
                  categoryStore.loadingStates.isSavingCategoryFields ||
                  categoryFields?.isLocked === true ||
                  !props.categoryId
                "
                class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{
                  categoryStore.loadingStates.isSavingCategoryFields ? 'Saving...' : 'Save Fields'
                }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
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
import FieldTable from './fieldTable.vue';
import ModalFetchOverlay from './ModalFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';
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
  return fieldRows.value.reduce((sum, row) => {
    const val = parseFloat(row.maxValue);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
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

  const fields = await categoryStore.getCategoryFieldsId(
    props.categoryId,
    () => modalStore.toggleFieldCategory(),
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
    !props.categoryId
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

  const success = await categoryStore.saveCategoryFields(
    payload,
    () => modalStore.toggleFieldCategory(),
  );

  if (success) {
    modalStore.toggleFieldCategory();
    resetFieldsState();
  }
};
</script>
