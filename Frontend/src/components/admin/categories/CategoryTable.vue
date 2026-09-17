<script setup lang="ts">
import { Check, Tags } from '@lucide/vue';
import type { GetCategoryListDTO } from '@/types/admin/adminSetup/category/categories';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

defineProps<{
  items: GetCategoryListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  openFields: [id: number];
}>();
</script>

<template>
  <BaseEmptyState
    v-if="items.length === 0"
    :icon="Tags"
    title="No rounds yet"
    description="Create a round first, then add categories to it."
    actionLabel="Add Rounds"
    :to="{ name: 'rounds' }"
  />
  <div v-else class="flex flex-col gap-8">
    <BaseTable v-for="round in items" :key="round.id">
      <template #head>
        <BaseTableHeader>{{ round.name }}</BaseTableHeader>
        <BaseTableHeader>Criteria Fields</BaseTableHeader>
        <BaseTableHeader>Actions</BaseTableHeader>
      </template>
      <tr v-if="round.categories.length === 0" class="font-poppins">
        <BaseTableCell colspan="3" flush>
          <BaseEmptyState
            variant="inline"
            :icon="Tags"
            title="No categories yet for this round."
            description="Use Add Category above and select this round."
          />
        </BaseTableCell>
      </tr>
      <tr v-for="categories in round.categories" :key="categories.id" class="font-poppins">
        <BaseTableCell>
          {{ categories.name }}
        </BaseTableCell>
        <BaseTableCell>
          <div class="flex h-full w-full items-center justify-center gap-4">
            {{ categories.fieldCount === 0 ? 'No fields' : categories.fieldCount
            }}<Check
              v-if="categories.fieldCount > 0 && categories.totalScore === 100"
              class="stroke stroke-jungle-green-700"
            />
          </div>
        </BaseTableCell>
        <BaseTableCell :nowrap="false">
          <div class="flex items-center justify-center gap-4">
            <button
              @click="emit('edit', categories.id)"
              class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/10 px-6"
            >
              Edit
            </button>
            <button
              @click="emit('openFields', categories.id)"
              class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/10 px-6"
            >
              Fields
            </button>
            <button
              @click="emit('delete', categories.id)"
              class="h-10 cursor-pointer rounded-xl border border-black/10 bg-red-600 px-6 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </BaseTableCell>
      </tr>
    </BaseTable>
  </div>
</template>
