<template>
    <Teleport to="body">
        <div
            class="font-poppins fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 bg-linear-150 from-auth-green from-30% to-main-light-brown to-100%"
            role="dialog"
            aria-labelledby="error-title"
            aria-describedby="error-description"
        >
            <div class="flex items-center justify-center rounded-full bg-red-100/60 p-5">
                <AlertCircleIcon class="size-12 text-red-500 stroke-[1.5]" aria-hidden="true" />
            </div>

            <div class="flex flex-col gap-3 items-center text-center">
                <h2 id="error-title" class="text-3xl font-bold text-custom-black">
                    Something went wrong
                </h2>
                <p id="error-description" class="text-base text-custom-black/60 max-w-sm">
                    We're having trouble connecting right now. Give it another try.
                </p>
            </div>

            <button
                type="button"
                @click="handleRetry"
                class="h-14 w-full max-w-xs font-semibold rounded-xl transition-opacity bg-jungle-green-900 hover:opacity-85 active:opacity-70 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-jungle-green-700 cursor-pointer"
            >
                Reload Page
            </button>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { AlertCircleIcon } from '@lucide/vue';

const handleRetry = (): void => {
    window.location.reload();
};
</script>