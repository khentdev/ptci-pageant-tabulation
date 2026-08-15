<template>
    <Teleport to="body">
        <TransitionGroup
            tag="div"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-x-full"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-full"
            move-class="transition-transform duration-300 ease-out"
            class="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-100 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-3 py-3 sm:p-0"
        >
            <div
                v-for="toast in toasts"
                :key="toast.id"
                :class="[
                    'font-poppins pointer-events-auto w-full rounded-xl px-4 py-3 shadow-md shadow-black/10 border flex items-start gap-3',
                    toastVariantClasses(toast.type),
                ]"
                role="alert"
                :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
            >
                <div class="shrink-0 mt-0.5">
                    <component :is="getIconVariants(toast.type)" class="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
                </div>

                <div class="flex-1 min-w-0">
                    <p v-if="toast.title" class="text-sm font-bold text-custom-black mb-0.5">
                        {{ toast.title }}
                    </p>
                    <p :class="toast.title ? 'text-xs text-custom-black/60' : 'text-sm font-medium text-custom-black'">
                        {{ toast.message }}
                    </p>
                </div>

                <button
                    type="button"
                    @click="removeToast(toast.id)"
                    class="shrink-0 -mr-1 -mt-0.5 p-1 rounded-lg hover:bg-black/8 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Close notification"
                >
                    <XIcon class="w-4 h-4 text-custom-black/40" aria-hidden="true" />
                </button>
            </div>
        </TransitionGroup>
    </Teleport>
</template>

<script setup lang="ts">
    import { useToast } from '@/composables/Toast/useToast';
    import {
        CheckCircle as CheckCircleIcon,
        AlertCircle as AlertCircleIcon,
        AlertTriangle as AlertTriangleIcon,
        Info as InfoIcon,
        X as XIcon,
    } from '@lucide/vue';
    import type { ToastType } from '@/composables/Toast/';

    const { toasts, removeToast } = useToast();

    const toastVariantClasses = (type: ToastType): string => {
        return {
            success: 'bg-jungle-green-50 border-jungle-green-200 [&_svg]:text-jungle-green-700',
            error:   'bg-red-50 border-red-200 [&_svg]:text-red-500',
            warning: 'bg-amber-50 border-amber-200 [&_svg]:text-amber-600',
            info:    'bg-main-light-brown border-black/10 [&_svg]:text-custom-black/50',
        }[type];
    };

    const getIconVariants = (type: ToastType) => {
        return {
            success: CheckCircleIcon,
            error:   AlertCircleIcon,
            warning: AlertTriangleIcon,
            info:    InfoIcon,
        }[type];
    };
</script>