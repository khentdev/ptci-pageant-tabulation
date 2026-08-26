import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  AddCategoryInput,
  AddCategoryResponse,
  CategoryFieldInput,
  DeleteCategoryInput,
  DeleteCategoryResponse,
  EditCategoryInput,
  EditCategoryResponse,
  GetCategoryByIdResponse,
  GetCategoryFieldsInput,
  GetCategoryFieldsResponse,
  GetCategoryListResponse,
  SaveCategoryFieldsInput,
  SaveCategoryFieldsResponse,
} from '@/types/admin/adminSetup/category/categories';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const categoryService = {
  addCategory: async (addCategoryInput: AddCategoryInput) => {
    const res = await axiosInstance.post('/categories', addCategoryInput);
    return GetTypeResponse<AddCategoryResponse>(res);
  },

  getCategoryList: async () => {
    const res = await axiosInstance.get('/categories');
    return GetTypeResponse<GetCategoryListResponse>(res);
  },

  getCategoryId: async (id: number) => {
    const res = await axiosInstance.get(`/categories/${id}`);
    return GetTypeResponse<GetCategoryByIdResponse>(res);
  },

  editCategory: async (editCategoryInput: EditCategoryInput) => {
    const res = await axiosInstance.patch(`/categories/${editCategoryInput.id}`, editCategoryInput);
    return GetTypeResponse<EditCategoryResponse>(res);
  },

  deleteCategory: async (deleteCategoryInput: number) => {
    const res = await axiosInstance.delete(`/categories/${deleteCategoryInput}`);
    return GetTypeResponse<DeleteCategoryResponse>(res);
  },

  getCategoryFields: async (getCategoryFieldsInput: number) => {
    const res = await axiosInstance.get(`/categories/${getCategoryFieldsInput}/fields`);
    return GetTypeResponse<GetCategoryFieldsResponse>(res);
  },

  saveCategoryField: async (saveCategoryFieldInput: SaveCategoryFieldsInput) => {
    const res = await axiosInstance.put(
      `/categories/${saveCategoryFieldInput.categoryId}/fields`,
      saveCategoryFieldInput,
    );
    return GetTypeResponse<SaveCategoryFieldsResponse>(res);
  },
};
