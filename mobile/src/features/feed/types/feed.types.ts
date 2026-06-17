export interface FeedItemExpense {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string | null;
  note: string | null;
  date: string;
}

export interface FeedItemReaction {
  username: string;
  emoji: string;
}

export interface FeedItemAuthor {
  id?: string;
  username: string;
  avatarUrl: string | null;
}

export interface FeedItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  isPrivate?: boolean;
  expenses?: FeedItemExpense[];
  reactions: FeedItemReaction[];
  author: FeedItemAuthor;
  isOwn: boolean;
}

// Backend Response DTOs
export interface TimelineSnapDto {
  id: string;
  imageUrl: string;
  caption: string | null;
  isPrivate: boolean;
  createdAt: string;
  expenses: FeedItemExpense[];
  reactions: FeedItemReaction[];
}

export interface TimelineResponse {
  success: boolean;
  data: {
    snaps: TimelineSnapDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export interface FriendSnapDto {
  id: string;
  username: string;
  avatarUrl: string | null;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  reactions: FeedItemReaction[];
}

export interface FriendFeedResponse {
  success: boolean;
  data: {
    feed: FriendSnapDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export interface FeedPagination {
  total: number;
  limit: number;
  offset: number;
}
