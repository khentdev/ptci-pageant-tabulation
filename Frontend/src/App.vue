<script setup lang="ts">
import { RouterView } from 'vue-router';
import BaseSessionOverlay from './components/System/BaseSessionOverlay.vue';
import VToast from './components/Toast/VToast.vue';
import AddRounds from './components/admin/rounds/addRounds.vue';
import { useModalStore } from './stores/modals/modalStore.ts';
import EditRounds from './components/admin/rounds/editRounds.vue';
import AddCategory from './components/admin/categories/addCategory.vue';
import EditCategory from './components/admin/categories/editCategory.vue';
import FieldsCategory from './components/admin/categories/fieldsCategory.vue';
import { useCategoryStore } from './stores/admin/adminSetup/category/categoryStore.ts';
const modalStore = useModalStore();
const categoryStore = useCategoryStore();
</script>

<template>
  <AddRounds :showModal="modalStore.isAddRoundsVisible"></AddRounds>
  <EditRounds :showModal="modalStore.isEditRoundsVisible"></EditRounds>
  <AddCategory :showModal="modalStore.isAddCategoryVisible"></AddCategory>
  <EditCategory :showModal="modalStore.isEditCategoryVisible"></EditCategory>
  <FieldsCategory
    :showModal="modalStore.isFieldCategoryVisible"
    :categoryId="categoryStore.selectedCategoryId"
  ></FieldsCategory>
  <router-view v-slot="{ Component }">
    <VToast />
    <BaseSessionOverlay>
      <component :is="Component" />
    </BaseSessionOverlay>
  </router-view>
</template>
