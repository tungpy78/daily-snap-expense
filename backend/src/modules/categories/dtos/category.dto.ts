export interface CategoryDto {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
}

export interface CreateCategoryDto {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface CreateCategoryData {
  name: string;
  color?: string | null;
  icon?: string | null;
  user_id: string;
}
