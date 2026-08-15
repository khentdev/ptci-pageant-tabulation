import { getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue';

export const useNetworkStatus = () => {

    const isOnline = ref<boolean>(navigator.onLine);

    const online = () => isOnline.value = true;
    const offline = () => isOnline.value = false;

    if (!getCurrentInstance()) {
        throw new Error('The useNetworkCheck must be used inside setup().');
    }

    onMounted(() => {
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('online', online);
        window.removeEventListener('offline', offline);
    });


    return { isOnline };
};