<template>
  <div class="mt-4 flex w-full flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-medium text-black/70 sm:text-xl">Judge Submissions</h2>
      <span
        v-if="(liveStore.judgeList?.totalJudges ?? 0) > 0"
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold text-nowrap"
        :class="
          liveStore.judgeList?.allJudgesSubmitted
            ? 'bg-jungle-green-800/10 text-jungle-green-800'
            : 'bg-red-600/10 text-red-700'
        "
      >
        <Check
          v-if="liveStore.judgeList?.allJudgesSubmitted"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <X v-else class="size-4 shrink-0" aria-hidden="true" />
        {{ liveStore.judgeList?.fullySubmittedCount ?? 0 }}/{{
          liveStore.judgeList?.totalJudges ?? 0
        }}
        submitted
      </span>
    </div>

    <BaseEmptyState
      v-if="(liveStore.judgeList?.judgeSubmissions.length ?? 0) === 0"
      variant="inline"
      :icon="Users"
      title="No judge submissions yet"
      description="Add judges and contestants to this round to begin scoring."
    />
    <!-- Scrolls sideways on its own on small screens; from md up the sticky head keeps working. -->
    <div v-else class="overflow-x-auto md:overflow-visible">
      <BaseTable>
        <template #head>
          <BaseTableHeader>Judge</BaseTableHeader>
          <BaseTableHeader
            class="px-3 py-2 lg:px-0 lg:py-0"
            v-for="categories in liveStore.judgeList?.judgeSubmissions[0]?.categories"
            :key="categories.id"
            align="center"
            wrap
          >
            {{ categories.name }}
          </BaseTableHeader>
          <BaseTableHeader align="center">Submitted</BaseTableHeader>
        </template>
        <tr
          class="font-poppins"
          v-for="j in liveStore.judgeList?.judgeSubmissions"
          :key="j.judge.id"
        >
          <BaseTableCell>{{ j.judge.name }}</BaseTableCell>
          <BaseTableCell v-for="categories in j.categories" :key="categories.id">
            <div class="flex items-center justify-center">
              <Check
                v-if="categories.submitted"
                class="stroke-jungle-green-800 size-5"
                aria-hidden="true"
              />
              <X v-else class="size-5 stroke-red-500" aria-hidden="true" />
              <span class="sr-only">{{
                categories.submitted ? 'Submitted' : 'Not submitted'
              }}</span>
            </div>
          </BaseTableCell>
          <BaseTableCell>
            <div class="flex items-center justify-center">
              <Check
                v-if="j.fullySubmitted"
                class="stroke-jungle-green-800 size-5"
                aria-hidden="true"
              />
              <X v-else class="size-5 stroke-red-500" aria-hidden="true" />
              <span class="sr-only">{{ j.fullySubmitted ? 'Submitted' : 'Not submitted' }}</span>
            </div>
          </BaseTableCell>
        </tr>
      </BaseTable>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';
import { Check, Users, X } from '@lucide/vue';
const liveStore = useLiveStore();
</script>
