<template>
    <Teleport to="body">
        <div
            class="font-poppins fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 bg-linear-150 from-auth-green from-30% to-main-light-brown to-100%"
            role="status"
            aria-label="Refreshing session"
        >
            <div class="flex items-center justify-center rounded-full bg-jungle-green-900/10 p-5">
                <LoaderCircle
                    class="size-12 text-jungle-green-900 stroke-[1.5] animate-spin"
                    aria-hidden="true"
                />
            </div>

            <div class="flex flex-col gap-3 items-center text-center">
                <h2 class="text-3xl font-bold text-custom-black">
                    Refreshing Session
                </h2>
                <p class="text-base text-custom-black/60 max-w-sm">
                    Please wait while we restore your session...
                </p>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue';
</script>
