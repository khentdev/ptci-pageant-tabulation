<template>
  <div
    class="font-poppins flex h-full w-full items-center justify-center rounded-xl p-5"
    role="status"
    aria-label="Loading category details"
    aria-live="polite"
  >
    <div class="flex size-10 items-center justify-center rounded-full bg-white shadow-lg">
      <div
        class="size-6 animate-spin rounded-full border-2 border-jungle-green-900/20 border-t-jungle-green-900 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
