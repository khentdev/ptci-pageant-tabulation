<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader>Name</BaseTableHeader>
      <BaseTableHeader>Phase Order</BaseTableHeader>
      <BaseTableHeader wrap class="px-3 py-2 lg:px-0 lg:py-0">Contestant Limit (per gender)</BaseTableHeader>
      <BaseTableHeader>Action</BaseTableHeader>
    </template>
    <tr class="font-poppins" v-for="item in items" :key="item.id">
      <BaseTableCell>{{ item.name }}</BaseTableCell>
      <BaseTableCell>{{ item.phaseOrder }}</BaseTableCell>
      <BaseTableCell>
        {{ item.contestantLimit ?? 'Unlimited' }}
      </BaseTableCell>
      <BaseTableCell :nowrap="false">
        <div class="flex items-center justify-center gap-4">
          <button
            @click="emit('edit', item.id)"
            class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/10 px-6"
          >
            Edit
          </button>
          <button
            @click="emit('delete', item.id)"
            class="h-10 cursor-pointer rounded-xl border border-black/10 bg-red-600 px-6 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </BaseTableCell>
    </tr>
  </BaseTable>
</template>
<script setup lang="ts">
import type { GetRoundsListDTO } from '@/types/admin/adminSetup/rounds/rounds';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

defineProps<{
  items: GetRoundsListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
}>();
</script>
