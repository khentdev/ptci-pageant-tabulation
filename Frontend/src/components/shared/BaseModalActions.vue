<script setup lang="ts">
withDefaults(
  defineProps<{
    submitLabel: string;
    submittingLabel: string;
    isSubmitting: boolean;
    disabled?: boolean;
    cancelLabel?: string;
  }>(),
  {
    disabled: false,
    cancelLabel: 'Cancel',
  },
);

const emit = defineEmits<{
  cancel: [];
}>();
</script>

<template>
  <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
    <button
      type="button"
      @click="emit('cancel')"
      class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
    >
      {{ cancelLabel }}
    </button>
    <button
      type="submit"
      :disabled="isSubmitting || disabled"
      class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ isSubmitting ? submittingLabel : submitLabel }}
    </button>
  </div>
</template>
