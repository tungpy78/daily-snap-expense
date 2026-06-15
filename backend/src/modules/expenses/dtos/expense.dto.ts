export interface ExpenseDto {
  id: string;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string;
  snapId: string | null;
  createdAt: string;
}

export interface CreateExpenseDto {
  amount: number;
  categoryId: string;
  note?: string | null;
  date?: string;
  snapId?: string | null;
}

export interface CreateExpenseData {
  user_id: string;
  category_id: string;
  amount: number;
  note: string | null;
  date: string;
  snap_id: string | null;
}

export interface ExpenseSnapDetailsDto {
  snapDeleted: boolean;
  imageUrl: string | null;
}

export interface ExpenseListItemDto {
  id: string;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string;
  snapId: string | null;
  snapDetails: ExpenseSnapDetailsDto | null;
  createdAt: string;
}

export interface ExpenseListQueryDto {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  limit: number;
  offset: number;
}

export interface ExpenseListResponseDto {
  expenses: ExpenseListItemDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UpdateExpenseDto {
  amount?: number;
  categoryId?: string;
  note?: string | null;
  date?: string;
  snapId?: string | null;
}

export interface UpdateExpenseData {
  amount?: number;
  category_id?: string;
  note?: string | null;
  date?: string;
  snap_id?: string | null;
}

export interface DeleteExpenseResponseDto {
  message: string;
}
