import {
  type GetCategoryListDTO,
  type AddCategoryInput,
  type GetCategoryByIdDTO,
  type EditCategoryInput,
  type GetCategoryFieldsDTO,
  type SaveCategoryFieldsInput,
} from '@/types/admin/adminSetup/category/categories';
import { defineStore } from 'pinia';
import { categoryService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import type { CategoryErrorCodes } from '@/types/admin/adminSetup/category/error';
import { errorHandler } from '@/api/errors/errorHandler';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import { reactive, ref } from 'vue';

const { toast } = useToast();

export const useCategoryStore = defineStore('categoryStore', () => {
  const categoryList = ref<GetCategoryListDTO[]>([]);

  const formErrors = reactive({
    categoryName: '',
    categoryRound: '',
  });

  const clearFormErrors = () => {
    formErrors.categoryName = '';
    formErrors.categoryRound = '';
  };

  const loadingStates = reactive({
    isAddingCategory: false,
    isEditingCategory: false,
    isDeletingCategory: false,
    isFetchingCategoryList: false,
    isFetchingCategoryById: false,
    isFetchingCategoryFields: false,
    isSavingCategoryFields: false,
  });

  const errorStates = reactive({
    isFetchingCategoryListError: false,
    isFetchingCategoryByIdError: false,
    isFetchingCategoryFieldsError: false,
  });

  const addCategory = async (addCategoryInput: AddCategoryInput): Promise<boolean> => {
    if (loadingStates.isAddingCategory) {
      return false;
    }

    loadingStates.isAddingCategory = true;
    try {
      const res = await categoryService.addCategory(addCategoryInput);
      getCategoryList();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CATEGORY_NAME_REQUIRED') {
        formErrors.categoryName = message;
      } else if (code === 'CATEGORY_ROUND_ID_REQUIRED') {
        formErrors.categoryRound = message;
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Round Phase Not Found' });
      }
      return false;
    } finally {
      loadingStates.isAddingCategory = false;
    }
  };

  const getCategoryList = async () => {
    if (loadingStates.isFetchingCategoryList) {
      return;
    }

    loadingStates.isFetchingCategoryList = true;
    try {
      const res = await categoryService.getCategoryList();
      categoryList.value = res.data;
      errorStates.isFetchingCategoryListError = false;
    } catch (error) {
      const { type } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );
      if (type === 'offline' || type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        errorStates.isFetchingCategoryListError = true;
      }

    } finally {
      loadingStates.isFetchingCategoryList = false;
    }
  };

  const getCategoryId = async (id: number, closeModal?: () => void): Promise<GetCategoryByIdDTO | null> => {
    if (loadingStates.isFetchingCategoryById) {
      return null;
    }
    loadingStates.isFetchingCategoryById = true;
    try {
      const res = await categoryService.getCategoryId(id);
      errorStates.isFetchingCategoryByIdError = false;
      return res.data;
    } catch (error) {
      const { code, type, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );
      if (type === 'offline' || type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        errorStates.isFetchingCategoryByIdError = true;
      }
      if (code === 'CATEGORY_NOT_FOUND') {
        closeModal?.();
        toast.warning(message, { title: 'Category Not Found' });
      }
      return null;
    } finally {
      loadingStates.isFetchingCategoryById = false;
    }
  };

  const editCategory = async (editCategoryInput: EditCategoryInput): Promise<boolean> => {
    if (loadingStates.isEditingCategory) {
      return false;
    }

    loadingStates.isEditingCategory = true;
    try {
      const res = await categoryService.editCategory(editCategoryInput);
      toast.success(res.message);
      await getCategoryList();
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } else if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      } else if (code === 'CATEGORY_NAME_REQUIRED') {
        formErrors.categoryName = message;
      } else if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Category Locked' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Category Not Found' });
      }
      return false;
    } finally {
      loadingStates.isEditingCategory = false;
    }
  };

  const deleteCategory = async (id: number) => {
    if (loadingStates.isDeletingCategory) {
      return;
    }

    loadingStates.isDeletingCategory = true;
    try {
      const res = await categoryService.deleteCategory(id);
      await getCategoryList();
      toast.success(res.message);
    } catch (error) {
      const { type, code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } else if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      } else if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Category Locked' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Category Not Found' });
        await getCategoryList();
      }
    } finally {
      loadingStates.isDeletingCategory = false;
    }
  };

  const getCategoryFieldsId = async (
    categoryFieldsInput: number,
    closeModal?: () => void,
  ): Promise<GetCategoryFieldsDTO | null> => {
    if (loadingStates.isFetchingCategoryFields) {
      return null;
    }

    loadingStates.isFetchingCategoryFields = true;
    errorStates.isFetchingCategoryFieldsError = false;
    try {
      const res = await categoryService.getCategoryFields(categoryFieldsInput);
      return res.data;
    } catch (error) {
      const { type, code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } else if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        errorStates.isFetchingCategoryFieldsError = true;
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Category Not Found' });
        closeModal?.();
        await getCategoryList();
      }
      return null;
    } finally {
      loadingStates.isFetchingCategoryFields = false;
    }
  };

  const saveCategoryFields = async (
    saveCategoryFieldInput: SaveCategoryFieldsInput,
    closeModal?: () => void,
  ): Promise<boolean> => {
    if (loadingStates.isSavingCategoryFields) {
      return false;
    }

    loadingStates.isSavingCategoryFields = true;
    try {
      const res = await categoryService.saveCategoryField(saveCategoryFieldInput);
      await getCategoryList();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<CategoryErrorCodes>(
        error as AxiosError<ErrorResponse<CategoryErrorCodes>>,
      );

      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } else if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'CATEGORY_FIELDS_REQUIRED') {
        toast.warning(message);
      } else if (code === 'CATEGORY_FIELD_NAME_REQUIRED') {
        toast.warning(message);
      } else if (code === 'CATEGORY_FIELD_MAX_VALUE_REQUIRED') {
        toast.warning(message);
      } else if (code === 'CATEGORY_FIELD_MAX_VALUE_INVALID') {
        toast.warning(message);
      } else if (code === 'CATEGORY_FIELDS_TOTAL_INVALID') {
        toast.warning(message);
      } else if (code === 'CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Category Locked' });
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.warning(message, { title: 'Category Not Found' });
        closeModal?.();
        await getCategoryList();
      }

      return false;
    } finally {
      loadingStates.isSavingCategoryFields = false;
    }
  };

  return {
    saveCategoryFields,
    getCategoryFieldsId,
    deleteCategory,
    editCategory,
    getCategoryId,
    addCategory,
    getCategoryList,
    categoryList,
    loadingStates,
    errorStates,
    clearFormErrors,
    formErrors,
  };
});
