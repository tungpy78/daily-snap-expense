import { create } from 'zustand';
import { apiClient } from '../../../services/api';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { normalizeImageUrl } from '../../../utils/normalizeImageUrl';
import {
  FeedItem,
  TimelineResponse,
  FriendFeedResponse,
  FeedPagination,
  TimelineSnapDto,
  FriendSnapDto,
} from '../types/feed.types';
import { extractApiErrorMessage } from '../../auth/store/useAuthStore';

interface HomeFeedState {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: FeedPagination;

  fetchInitialFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  clearFeedError: () => void;
  resetFeedState: () => void;
}

const DEFAULT_LIMIT = 15;

const initialPagination: FeedPagination = {
  total: 0,
  limit: DEFAULT_LIMIT,
  offset: 0,
};

export const useHomeFeedStore = create<HomeFeedState>((set, get) => {
  // Helper to fetch timeline & friend feed concurrently and merge
  const fetchFeedData = async (offset: number, limit: number) => {
    const timelinePromise = apiClient.get<TimelineResponse>(
      `/snaps/timeline?limit=${limit}&offset=${offset}`
    );
    const friendFeedPromise = apiClient.get<FriendFeedResponse>(
      `/friends/feed?limit=${limit}&offset=${offset}`
    );

    const [timelineResult, friendFeedResult] = await Promise.allSettled([
      timelinePromise,
      friendFeedPromise,
    ]);

    // Check if both endpoints failed
    if (
      timelineResult.status === 'rejected' &&
      friendFeedResult.status === 'rejected'
    ) {
      const errorMsg = extractApiErrorMessage(
        timelineResult.reason || friendFeedResult.reason
      );
      throw new Error(errorMsg);
    }

    let rawOwnSnaps: TimelineSnapDto[] = [];
    let rawFriendSnaps: FriendSnapDto[] = [];
    let ownTotal = 0;
    let friendTotal = 0;

    if (
      timelineResult.status === 'fulfilled' &&
      timelineResult.value.data?.success
    ) {
      rawOwnSnaps = timelineResult.value.data.data.snaps || [];
      ownTotal = timelineResult.value.data.data.pagination?.total || 0;
    }

    if (
      friendFeedResult.status === 'fulfilled' &&
      friendFeedResult.value.data?.success
    ) {
      rawFriendSnaps = friendFeedResult.value.data.data.feed || [];
      friendTotal = friendFeedResult.value.data.data.pagination?.total || 0;
    }

    // Fallback info for own author
    const currentUser = useAuthStore.getState().user;
    const ownUsername = currentUser?.username || 'Tôi';
    const ownAvatar = currentUser?.avatarUrl ? normalizeImageUrl(currentUser.avatarUrl) : null;

    // Map own snaps to FeedItem structure
    const ownFeedItems: FeedItem[] = rawOwnSnaps.map((snap) => {
      return {
        id: snap.id,
        imageUrl: normalizeImageUrl(snap.imageUrl) || '',
        caption: snap.caption,
        createdAt: snap.createdAt,
        isPrivate: snap.isPrivate,
        expenses: snap.expenses || [],
        reactions: snap.reactions || [],
        author: {
          username: ownUsername,
          avatarUrl: ownAvatar,
        },
        isOwn: true,
      };
    });

    // Map friend snaps to FeedItem structure
    const friendFeedItems: FeedItem[] = rawFriendSnaps.map((snap) => {
      return {
        id: snap.id,
        imageUrl: normalizeImageUrl(snap.imageUrl) || '',
        caption: snap.caption,
        createdAt: snap.createdAt,
        reactions: snap.reactions || [],
        author: {
          username: snap.username,
          avatarUrl: normalizeImageUrl(snap.avatarUrl),
        },
        isOwn: false,
      };
    });

    // Merge and deduplicate by id
    const mergedMap = new Map<string, FeedItem>();
    
    // Add friend items first
    friendFeedItems.forEach((item) => {
      if (item.id) {
        mergedMap.set(item.id, item);
      }
    });

    // Add own items, overriding if ID collision occurs
    ownFeedItems.forEach((item) => {
      if (item.id) {
        mergedMap.set(item.id, item);
      }
    });

    const mergedItems = Array.from(mergedMap.values());

    // Sort descending by createdAt
    mergedItems.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Determine hasMore based on count of items returned versus total available
    const hasMoreOwn = offset + rawOwnSnaps.length < ownTotal;
    const hasMoreFriends = offset + rawFriendSnaps.length < friendTotal;
    const hasMore = hasMoreOwn || hasMoreFriends;

    return {
      items: mergedItems,
      hasMore,
      total: ownTotal + friendTotal,
    };
  };

  return {
    feedItems: [],
    isLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    pagination: initialPagination,

    fetchInitialFeed: async () => {
      set({ isLoading: true, error: null });
      try {
        const { items, hasMore, total } = await fetchFeedData(0, DEFAULT_LIMIT);
        set({
          feedItems: items,
          hasMore,
          pagination: {
            total,
            limit: DEFAULT_LIMIT,
            offset: 0,
          },
          error: null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không tải được feed.';
        set({ error: message });
      } finally {
        set({ isLoading: false });
      }
    },

    refreshFeed: async () => {
      set({ isRefreshing: true, error: null });
      try {
        const { items, hasMore, total } = await fetchFeedData(0, DEFAULT_LIMIT);
        set({
          feedItems: items,
          hasMore,
          pagination: {
            total,
            limit: DEFAULT_LIMIT,
            offset: 0,
          },
          error: null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không tải được feed.';
        set({ error: message });
      } finally {
        set({ isRefreshing: false });
      }
    },

    loadMoreFeed: async () => {
      const { isLoading, isRefreshing, isLoadingMore, hasMore, pagination, feedItems } = get();
      if (isLoading || isRefreshing || isLoadingMore || !hasMore) {
        return;
      }

      set({ isLoadingMore: true });
      try {
        const nextOffset = pagination.offset + DEFAULT_LIMIT;
        const { items, hasMore: newHasMore, total } = await fetchFeedData(
          nextOffset,
          DEFAULT_LIMIT
        );

        if (items.length === 0) {
          set({ hasMore: false });
          return;
        }

        // Merge with existing items and deduplicate
        const mergedMap = new Map<string, FeedItem>();
        feedItems.forEach((item) => {
          if (item.id) {
            mergedMap.set(item.id, item);
          }
        });
        items.forEach((item) => {
          if (item.id) {
            mergedMap.set(item.id, item);
          }
        });

        const finalItems = Array.from(mergedMap.values());
        finalItems.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        set({
          feedItems: finalItems,
          hasMore: newHasMore,
          pagination: {
            total,
            limit: DEFAULT_LIMIT,
            offset: nextOffset,
          },
          error: null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không tải được thêm feed.';
        set({ error: message });
      } finally {
        set({ isLoadingMore: false });
      }
    },

    clearFeedError: () => {
      set({ error: null });
    },

    resetFeedState: () => {
      set({
        feedItems: [],
        isLoading: false,
        isRefreshing: false,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        pagination: initialPagination,
      });
    },
  };
});
