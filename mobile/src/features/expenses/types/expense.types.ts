export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
}

export interface SnapDetails {
  snapDeleted: boolean;
  imageUrl: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string; // YYYY-MM-DD
  snapId: string | null;
  snapDetails: SnapDetails | null;
  createdAt: string;
  category?: Category; // Trả kèm thông tin category nếu backend có join
}

export interface ExpensePagination {
  total: number;
  limit: number;
  offset: number;
}

export interface ExpenseListResponse {
  success: boolean;
  data: {
    expenses: Expense[];
    pagination: ExpensePagination;
  };
}

export interface CategoryListResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

export interface ExpenseGroupByDate {
  date: string; // Định dạng YYYY-MM-DD
  expenses: Expense[];
}

export interface ExpenseFilters {
  categoryId: string | null;
  startDate?: string;
  endDate?: string;
}

export interface CreateExpensePayload {
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string | null;
}

export interface UpdateExpensePayload {
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string | null;
}

export type ExpenseFormMode = 'create' | 'edit';

export interface ExpenseFormInitialValues {
  amount: string;
  categoryId: string;
  date: string;
  note: string;
}

