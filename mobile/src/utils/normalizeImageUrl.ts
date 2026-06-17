import { API_BASE_URL } from '../config/env';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const normalizeImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return null;
  }

  const trimmedUrl = imageUrl.trim();

  if (trimmedUrl.startsWith('http://localhost')) {
    return trimmedUrl.replace('http://localhost:5001', API_ORIGIN);
  }

  if (trimmedUrl.startsWith('http://127.0.0.1')) {
    return trimmedUrl.replace('http://127.0.0.1:5001', API_ORIGIN);
  }

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('/')) {
    return `${API_ORIGIN}${trimmedUrl}`;
  }

  return `${API_ORIGIN}/${trimmedUrl}`;
};
