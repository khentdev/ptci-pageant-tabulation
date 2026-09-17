<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader>Name</BaseTableHeader>
      <BaseTableHeader>Username</BaseTableHeader>
      <BaseTableHeader>Role</BaseTableHeader>
      <BaseTableHeader class="min-w-100">Actions</BaseTableHeader>
    </template>
    <tr class="font-poppins" v-for="judge in items" :key="judge.id">
      <BaseTableCell>{{ judge.name }}</BaseTableCell>
      <BaseTableCell>{{ judge.username }}</BaseTableCell>
      <BaseTableCell>
        {{ judge.role === 'CHAIRMAN' ? 'Chairman' : 'Judge' }}
      </BaseTableCell>
      <BaseTableCell :nowrap="false">
        <div class="flex items-center justify-center gap-4">
          <button
            @click="emit('edit', judge.id)"
            class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/1 px-6"
          >
            Edit
          </button>
          <button
            @click="emit('resetPassword', judge.id)"
            class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 shrink-0 cursor-pointer rounded-xl border border-black/1 px-6"
          >
            Reset Password
          </button>
          <button
            @click="emit('delete', judge.id)"
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
import type { GetJudgeListDTO } from '@/types/admin/adminSetup/judge/judge';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

defineProps<{
  items: GetJudgeListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  resetPassword: [id: number];
}>();
</script>
