export interface CreateSnapExpenseDto {
  amount: number;
  categoryId: string;
  note?: string | null;
  date?: string;
}

export interface CreateSnapDto {
  caption?: string | null;
  isPrivate: boolean;
  expenses: CreateSnapExpenseDto[];
}

export interface SnapDto {
  id: string;
  imageUrl: string;
  caption: string | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface SnapExpenseDto {
  id: string;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string;
}

export interface CreateSnapResponseDto {
  snap: SnapDto;
  expenses: SnapExpenseDto[];
}

export interface CreateSnapData {
  user_id: string;
  image_url: string;
  caption: string | null;
  is_private: boolean;
}
