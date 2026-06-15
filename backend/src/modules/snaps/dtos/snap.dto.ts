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

export interface TimelineExpenseDto {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string | null;
  note: string | null;
  date: string;
}

export interface TimelineSnapDto {
  id: string;
  imageUrl: string;
  caption: string | null;
  isPrivate: boolean;
  createdAt: string;
  expenses: TimelineExpenseDto[];
  reactions: [];
}

export interface TimelineQueryDto {
  startDate?: string;
  endDate?: string;
  search?: string;
  limit: number;
  offset: number;
}

export interface TimelineResponseDto {
  snaps: TimelineSnapDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
