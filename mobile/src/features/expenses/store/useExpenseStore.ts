import { create } from 'zustand';
import { apiClient } from '../../../services/api';
import { extractApiErrorMessage } from '../../auth/store/useAuthStore';
import { Expense, Category, ExpenseListResponse, CategoryListResponse, CreateExpensePayload, UpdateExpensePayload } from '../types/expense.types';
import axios from 'axios';

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  selectedCategoryId: string | null;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isInitializing: boolean;
  hasInitialized: boolean;
  error: string | null;

  fetchInitialData: () => Promise<void>;
  fetchExpenses: (options?: { reset?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setSelectedCategoryId: (categoryId: string | null) => void;
  clearError: () => void;
  resetExpenseState: () => void;
  createExpense: (payload: CreateExpensePayload) => Promise<void>;
  updateExpense: (expenseId: string, payload: UpdateExpensePayload) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  categories: [],
  selectedCategoryId: null,
  limit: 10,
  offset: 0,
  total: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  isInitializing: false,
  hasInitialized: false,
  error: null,

  fetchInitialData: async () => {
    const state = get();

    if (state.isInitializing) {
      console.log('[ExpenseStore] fetchInitialData skipped', {
        reason: 'isInitializing',
      });
      return;
    }

    if (state.hasInitialized) {
      console.log('[ExpenseStore] fetchInitialData skipped', {
        reason: 'hasInitialized',
      });
      return;
    }

    set({ isInitializing: true, isLoading: true, error: null });
    try {
      console.log('[ExpenseStore] fetchInitialData start');
      await Promise.all([
        get().fetchCategories(),
        get().fetchExpenses({ reset: true }),
      ]);
      set({ hasInitialized: true });
      console.log('[ExpenseStore] fetchInitialData success');
    } catch (error: unknown) {
      console.log('[ExpenseStore] fetchInitialData error:', error);
    } finally {
      set({ isInitializing: false, isLoading: false });
    }
  },

  fetchExpenses: async (options) => {
    const isReset = options?.reset ?? false;
    const { limit, offset, selectedCategoryId, expenses, isLoading, isLoadingMore, isRefreshing } = get();

    // Chống gọi trùng request khi đang load
    if (!isReset && (isLoading || isLoadingMore || isRefreshing)) {
      return;
    }

    if (isReset) {
      set({
        isLoading: !get().isRefreshing && expenses.length === 0,
        error: null,
      });
    } else {
      set({
        isLoadingMore: true,
        error: null,
      });
    }

    try {
      const currentOffset = isReset ? 0 : offset;
      const params: { limit: number; offset: number; categoryId?: string } = {
        limit,
        offset: currentOffset,
      };

      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId;
      }

      const response = await apiClient.get<ExpenseListResponse>('/expenses', { params });

      if (response.data && response.data.success) {
        const newExpenses = response.data.data.expenses;
        const total = response.data.data.pagination.total;

        const updatedExpenses = isReset ? newExpenses : [...expenses, ...newExpenses];
        const hasMore = newExpenses.length > 0 && updatedExpenses.length < total;

        console.log('[ExpenseStore] fetchExpenses success metadata', {
          reset: isReset,
          offset: currentOffset,
          limit,
          selectedCategoryId,
          received: newExpenses.length,
          total,
          hasMore,
        });

        set({
          expenses: updatedExpenses,
          total,
          offset: isReset ? newExpenses.length : currentOffset + newExpenses.length,
          hasMore,
          error: null,
        });
      } else {
        throw new Error('Không thể tải danh sách chi tiêu.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      set({ error: message });
      console.log('[ExpenseStore] fetchExpenses failed metadata', {
        message,
        hasBackendResponse: axios.isAxiosError(error) && Boolean(error.response),
      });
    } finally {
      set({
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      });
    }
  },

  loadMore: async () => {
    const { hasMore, isLoading, isLoadingMore, isRefreshing } = get();
    if (!hasMore || isLoading || isLoadingMore || isRefreshing) {
      return;
    }
    await get().fetchExpenses({ reset: false });
  },

  refresh: async () => {
    set({ isRefreshing: true });
    await get().fetchExpenses({ reset: true });
  },

  fetchCategories: async () => {
    try {
      const response = await apiClient.get<CategoryListResponse>('/categories');
      if (response.data && response.data.success) {
        const categories = response.data.data.categories;
        console.log('[ExpenseStore] fetchCategories success metadata', { count: categories.length });
        set({ categories });
      } else {
        throw new Error('Không thể tải danh sách danh mục.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      console.log('[ExpenseStore] fetchCategories failed metadata', {
        message,
        hasBackendResponse: axios.isAxiosError(error) && Boolean(error.response),
      });
    }
  },

  setSelectedCategoryId: (categoryId) => {
    set({ selectedCategoryId: categoryId, offset: 0, expenses: [], hasMore: true });
    get().fetchExpenses({ reset: true });
  },

  clearError: () => {
    set({ error: null });
  },

  resetExpenseState: () => {
    set({
      expenses: [],
      categories: [],
      selectedCategoryId: null,
      offset: 0,
      total: 0,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      isInitializing: false,
      hasInitialized: false,
      error: null,
    });
  },

  createExpense: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/expenses', payload);
      if (response.data && response.data.success) {
        await get().refresh();
      } else {
        throw new Error('Không thể tạo khoản chi tiêu.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  updateExpense: async (expenseId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/expenses/${expenseId}`, payload);
      if (response.data && response.data.success) {
        await get().refresh();
      } else {
        throw new Error('Không thể cập nhật khoản chi tiêu.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },
}));
