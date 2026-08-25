import {
  type GetCategoryListDTO,
  type AddCategoryInput,
  type GetCategoryByIdDTO,
  type EditCategoryInput,
  type GetCategoryFieldsDTO,
  type SaveCategoryFieldsInput,
  type CategoryFieldInput,
} from '@/types/admin/adminSetup/category/categories';
import { defineStore } from 'pinia';
import { categoryService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import type { CategoryErrorCodes } from '@/types/admin/adminSetup/category/error';
import { errorHandler } from '@/api/errors/errorHandler';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import { ref, watch, computed } from 'vue';

const { toast } = useToast();

export const useCategoryStore = defineStore('categoryStore', () => {
  const isCategoryNameInvalid = ref('');
  const isCategoryRoundInvalid = ref('');
  const categoryList = ref<GetCategoryListDTO[]>([]);
  const categoryId = ref<GetCategoryByIdDTO | null>(null);
  const categoryFields = ref<GetCategoryFieldsDTO | null>(null);
  const categoryFieldInput = ref<CategoryFieldInput[]>([]);
  const selectedCategoryId = ref<number>(0);

  const buttonDisabled = computed(() => ['disabled:opacity-50', 'disabled:cursor-not-allowed']);

  watch(
    () => categoryFields.value?.fields,
    (newFields) => {
      if (newFields && newFields.length > 0) {
        categoryFieldInput.value = newFields.map((f) => ({
          name: f.name,
          maxValue: String(f.maxValue),
        }));
      } else if (categoryFieldInput.value.length === 0) {
        categoryFieldInput.value = [{ name: '', maxValue: '' }];
      }
    },
    { immediate: true },
  );

  const addCategory = async (addCategoryInput: AddCategoryInput) => {
    try {
      const res = await categoryService.addCategory(addCategoryInput);
      getCategoryList();
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_NAME_REQUIRED') {
        isCategoryNameInvalid.value = message;
      } else if (code === 'CATEGORY_ROUND_ID_REQUIRED') {
        isCategoryRoundInvalid.value = message;
      }

      if (code === 'CATEGORY_ADD_ERROR') {
        toast.error(message, { title: 'Error' });
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      }
    }
  };

  const getCategoryList = async () => {
    try {
      const res = await categoryService.getCategoryList();
      categoryList.value = res.data;

      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_GET_LIST_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const getCategoryId = async (id: number) => {
    try {
      const res = await categoryService.getCategoryId(id);
      categoryId.value = res.data;
      //toast.success(res.message, { title: 'Success' });
      console.log(res.data);
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_GET_BY_ID_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const editCategory = async (editCategoryInput: EditCategoryInput) => {
    try {
      const res = await categoryService.editCategory(editCategoryInput);
      toast.success(res.message, { title: 'Success' });
      console.log();
      await getCategoryList();
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );
      if (code === 'CATEGORY_NAME_REQUIRED') {
        isCategoryNameInvalid.value = message;
      }

      if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_EDIT_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const res = await categoryService.deleteCategory(id);
      await getCategoryList();
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_DELETE_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const getCategoryFieldsId = async (categoryFieldsInput: number) => {
    try {
      const res = await categoryService.getCategoryFields(categoryFieldsInput);
      categoryFields.value = res.data;
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELDS_GET_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const saveCategoryFields = async (saveCategoryFieldInput: SaveCategoryFieldsInput) => {
    try {
      const res = await categoryService.saveCategoryField(saveCategoryFieldInput);
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (code === 'CATEGORY_FIELDS_REQUIRED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELD_NAME_REQUIRED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELD_MAX_VALUE_REQUIRED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELD_MAX_VALUE_INVALID') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELDS_TOTAL_INVALID') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'CATEGORY_FIELDS_SAVE_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  return {
    selectedCategoryId,
    categoryFieldInput,
    saveCategoryFields,
    categoryFields,
    getCategoryFieldsId,
    deleteCategory,
    editCategory,
    getCategoryId,
    addCategory,
    isCategoryNameInvalid,
    isCategoryRoundInvalid,
    getCategoryList,
    categoryList,
    categoryId,
    buttonDisabled,
  };
});
