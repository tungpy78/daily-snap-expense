import { create } from 'zustand';
import { apiClient } from '../../../services/api';
import { extractApiErrorMessage } from '../../auth/store/useAuthStore';
import { CreateSnapPayload, CreateSnapResponse } from '../types/snap.types';

interface SnapState {
  isLoading: boolean;
  error: string | null;
  createSnap: (payload: CreateSnapPayload) => Promise<void>;
  clearError: () => void;
}

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

export const useSnapStore = create<SnapState>((set, get) => ({
  isLoading: false,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  createSnap: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      if (!payload.uri || payload.uri.trim() === '') {
        const message = 'File ảnh là bắt buộc.';
        set({ error: message });
        throw new Error(message);
      }

      console.log('[SnapStore] createSnap metadata:', {
        hasImageUri: payload.uri.trim().length > 0,
        imageFieldName: 'image',
        captionLength: payload.caption?.trim().length ?? 0,
        isPrivate: payload.isPrivate,
        expensesCount: payload.expenses.length,
      });

      const formData = new FormData();
      
      const filePart: ReactNativeFile = {
        uri: payload.uri,
        name: 'snap.jpg',
        type: 'image/jpeg',
      };
      
      formData.append('image', filePart as unknown as Blob);
      
      if (payload.caption !== null && payload.caption !== undefined) {
        const trimmed = payload.caption.trim();
        if (trimmed !== '') {
          formData.append('caption', trimmed);
        }
      }
      
      formData.append('isPrivate', payload.isPrivate ? 'true' : 'false');
      
      if (payload.expenses && payload.expenses.length > 0) {
        const backendExpenses = payload.expenses.map((exp) => {
          return {
            amount: exp.amount,
            categoryId: exp.categoryId,
            note: exp.note,
            date: exp.date,
          };
        });
        formData.append('expenses', JSON.stringify(backendExpenses));
      }

      const response = await apiClient.post<CreateSnapResponse>('/snaps', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        set({ error: null });
      } else {
        throw new Error('Đăng snap thất bại.');
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
