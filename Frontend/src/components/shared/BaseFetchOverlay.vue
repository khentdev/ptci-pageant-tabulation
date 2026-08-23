<template>
  <div
    class="font-poppins inset-0 flex h-full w-full items-center justify-center"
    role="status"
    aria-label="Loading"
    aria-live="polite"
  >
    <div class="flex size-16 items-center justify-center rounded-full bg-white shadow-lg">
      <div
        class="size-10 animate-spin rounded-full border-4 border-jungle-green-900/20 border-t-jungle-green-900 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
