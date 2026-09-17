<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader>Candidate Number</BaseTableHeader>
      <BaseTableHeader>Name</BaseTableHeader>
      <BaseTableHeader>Gender</BaseTableHeader>
      <BaseTableHeader>Team</BaseTableHeader>
      <BaseTableHeader>Actions</BaseTableHeader>
    </template>
    <tr class="font-poppins" v-for="contestant in items" :key="contestant.id">
      <BaseTableCell class="font-bold">
        {{ contestant.candidateNumber }}
      </BaseTableCell>
      <BaseTableCell>{{ contestant.name }}</BaseTableCell>
      <BaseTableCell>{{ contestant.gender }}</BaseTableCell>
      <BaseTableCell>{{ contestant.teamName }}</BaseTableCell>
      <BaseTableCell :nowrap="false">
        <div class="flex items-center justify-center gap-4">
          <button
            @click="emit('edit', contestant.id)"
            class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/10 px-6"
          >
            Edit
          </button>
          <button
            @click="emit('delete', contestant.id)"
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
import type { GetAllContestantsDTO } from '@/types/admin/adminSetup/contestants/contestants';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

defineProps<{
  items: GetAllContestantsDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
}>();
</script>
