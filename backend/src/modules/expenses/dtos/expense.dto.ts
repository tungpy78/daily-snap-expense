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
