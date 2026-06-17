export type SnapPrivacy = 'private' | 'public';

export interface QuickExpenseDraft {
  amount: number;
  categoryId: string;
  categoryName: string;
  note: string | null;
  date: string; // YYYY-MM-DD
}

export interface CreateSnapPayload {
  uri: string;
  caption: string | null;
  isPrivate: boolean;
  expenses: QuickExpenseDraft[];
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

export interface CreateSnapResponse {
  success: boolean;
  data: {
    snap: SnapDto;
    expenses: SnapExpenseDto[];
  };
}

export interface CompressedImageInfo {
  uri: string;
  width: number;
  height: number;
  size: number;
}
