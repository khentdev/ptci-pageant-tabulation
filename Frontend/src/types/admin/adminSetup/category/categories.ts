export interface FieldRow {
  name: string;
  maxValue: string;
}

// Add
export type AddCategoryRequestBody = {
  name: unknown;
  roundId: unknown;
};
export type AddCategoryInput = {
  name: string;
  roundId: string;
};
export type AddCategoryInputVariables = {
  addCategoryInput: AddCategoryInput;
};
export type AddCategoryResponse = {
  message: string;
};

// Edit Category
export type EditCategoryRequestBody = {
  name: unknown;
};
export type EditCategoryInput = {
  id: number;
  name: string;
};
export type EditCategoryInputVariables = {
  editCategoryInput: EditCategoryInput;
};
export type EditCategoryResponse = {
  message: string;
};

// Get Category by ID
export type GetCategoryByIdInput = {
  id: number;
};
export type GetCategoryByIdInputVariables = {
  getCategoryByIdInput: GetCategoryByIdInput;
};
export type GetCategoryByIdDTO = {
  id: number;
  roundId: number;
  name: string;
  roundName: string;
  isLocked: boolean;
};
export type GetCategoryByIdResponse = {
  data: GetCategoryByIdDTO;
  message: string;
};

// Get Category List
export type CategoryDTO = {
  id: number;
  name: string;
  fieldCount: number;
  totalScore: number;
  isLocked: boolean;
};
export type GetCategoryListDTO = {
  id: number;
  name: string;
  phaseOrder: number;
  categories: CategoryDTO[];
};
export type GetCategoryListResponse = {
  data: GetCategoryListDTO[];
  message: string;
};

// Add Criteria Field
export type SaveCategoryFieldsRequestBody = {
  fields: unknown;
};
export type CategoryFieldInput = {
  name: string;
  maxValue: string;
};
export type SaveCategoryFieldsInputVariables = {
  saveCategoryFieldsInput: SaveCategoryFieldsInput;
};
export type SaveCategoryFieldsInput = {
  categoryId: number;
  fields: CategoryFieldInput[];
};
export type SaveCategoryFieldsResponse = {
  message: string;
};

// Get Category Fields
export type CategoryFieldDTO = {
  id: number;
  name: string;
  maxValue: number;
};

export type GetCategoryFieldsInput = {
  categoryId: number;
};
export type GetCategoryFieldsInputVariables = {
  getCategoryFieldsInput: GetCategoryFieldsInput;
};
export type GetCategoryFieldsDTO = {
  categoryName: string;
  isLocked: boolean;
  fields: CategoryFieldDTO[];
};
export type GetCategoryFieldsResponse = {
  data: GetCategoryFieldsDTO;
  message: string;
};

// Delete Category
export type DeleteCategoryInput = {
  id: number;
};
export type DeleteCategoryInputVariables = {
  deleteCategoryInput: DeleteCategoryInput;
};
export type DeleteCategoryResponse = {
  message: string;
};
