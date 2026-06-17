import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { useExpenseStore } from '../store/useExpenseStore';
import { Expense } from '../types/expense.types';
import { ExpenseFormScreen } from './ExpenseFormScreen';
import { API_BASE_URL } from '../../../config/env';

interface ExpenseSection {
  title: string;
  dateKey: string;
  data: Expense[];
}

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const normalizeImageUrl = (imageUrl: string | null | undefined): string | null => {
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

const getCategoryEmoji = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('food') || name.includes('ăn') || name.includes('uống')) {
    return '🍔';
  }
  if (name.includes('transport') || name.includes('di chuyển') || name.includes('xe')) {
    return '🚗';
  }
  if (name.includes('shopping') || name.includes('mua sắm')) {
    return '🛍️';
  }
  if (name.includes('entertainment') || name.includes('giải trí') || name.includes('chơi')) {
    return '🎮';
  }
  if (name.includes('study') || name.includes('học')) {
    return '📚';
  }
  if (name.includes('health') || name.includes('sức khỏe') || name.includes('y tế')) {
    return '🏥';
  }
  return '💸';
};

const getCategoryBgColor = (colorHex?: string): string => {
  if (!colorHex || !colorHex.startsWith('#')) {
    return 'rgba(255, 255, 255, 0.1)';
  }
  try {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return 'rgba(255, 255, 255, 0.1)';
    }
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  } catch {
    return 'rgba(255, 255, 255, 0.1)';
  }
};

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) {
      return `Hôm nay (${day}/${month}/${year})`;
    }

    if (dateStr === yesterdayStr) {
      return `Hôm qua (${day}/${month}/${year})`;
    }

    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const formatVND = (amount: number): string => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  } catch (error: unknown) {
    const formatted = amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} ₫`;
  }
};

export const ExpenseListScreen: React.FC = () => {
  const expenses = useExpenseStore((state) => state.expenses);
  const categories = useExpenseStore((state) => state.categories);
  const selectedCategoryId = useExpenseStore((state) => state.selectedCategoryId);
  const isLoading = useExpenseStore((state) => state.isLoading);
  const isLoadingMore = useExpenseStore((state) => state.isLoadingMore);
  const isRefreshing = useExpenseStore((state) => state.isRefreshing);
  const hasMore = useExpenseStore((state) => state.hasMore);
  const error = useExpenseStore((state) => state.error);
  const fetchInitialData = useExpenseStore((state) => state.fetchInitialData);
  const loadMore = useExpenseStore((state) => state.loadMore);
  const refresh = useExpenseStore((state) => state.refresh);
  const setSelectedCategoryId = useExpenseStore((state) => state.setSelectedCategoryId);
  const [activeFormExpense, setActiveFormExpense] = useState<Expense | null | undefined>(undefined);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  const groupExpensesByDate = (expenseList: Expense[]): ExpenseSection[] => {
    const groups: Record<string, Expense[]> = {};

    expenseList.forEach((expense) => {
      const dateKey = expense.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => {
      return b.localeCompare(a);
    });

    return sortedDates.map((date) => {
      return {
        title: formatDate(date),
        dateKey: date,
        data: groups[date],
      };
    });
  };

  const sections = groupExpensesByDate(expenses);

  const renderSnapAttachment = (expense: Expense) => {
    const snapDetails = expense.snapDetails;
    if (!snapDetails) {
      return null;
    }

    if (snapDetails.snapDeleted === true) {
      return (
        <View style={styles.deletedSnapBadge}>
          <Text style={styles.deletedSnapText}>Ảnh nhật ký đã bị xóa</Text>
        </View>
      );
    }

    if (snapDetails.imageUrl) {
      const normalizedUrl = normalizeImageUrl(snapDetails.imageUrl);

      console.log('[ExpenseListScreen] snap image metadata', {
        hasImageUrl: true,
        imageUrlPrefix: snapDetails.imageUrl ? snapDetails.imageUrl.substring(0, 30) : '',
        isAbsoluteUrl: snapDetails.imageUrl ? snapDetails.imageUrl.startsWith('http') : false
      });

      if (!normalizedUrl) {
        return (
          <View style={styles.deletedSnapBadge}>
            <Text style={styles.deletedSnapText}>Không tải được ảnh</Text>
          </View>
        );
      }

      return (
        <Pressable
          onPress={() => {
            setSelectedPhotoUrl(normalizedUrl);
          }}
          style={styles.snapContainer}
        >
          <Image
            source={{ uri: normalizedUrl }}
            style={styles.snapThumbnail}
            resizeMode="cover"
            onError={() => {
              console.log('[ExpenseListScreen] snap image load failed');
            }}
          />
        </Pressable>
      );
    }

    return null;
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const category = categories.find((cat) => {
      return cat.id === item.categoryId;
    });

    const categoryName = category ? category.name : 'Chưa phân loại';
    const categoryColor = category ? category.color : '#94A3B8';
    const emoji = category ? getCategoryEmoji(category.name) : '💸';
    const bgColor = getCategoryBgColor(categoryColor);

    return (
      <Pressable
        onPress={() => {
          setActiveFormExpense(item);
        }}
      >
        <GlassCard style={styles.expenseCard}>
          <View style={styles.expenseRow}>
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>
 
            <View style={styles.detailsContainer}>
              <Text style={styles.categoryNameText}>{categoryName}</Text>
              {item.note ? (
                <Text style={styles.noteText}>{item.note}</Text>
              ) : null}
              {renderSnapAttachment(item)}
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{formatVND(item.amount)}</Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ExpenseSection }) => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (expenses.length === 0 || isLoading || isLoadingMore || isRefreshing || !hasMore) {
      return;
    }
    void loadMore();
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    return null;
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    return (
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📂</Text>
        <Text style={styles.emptyTitle}>Không có dữ liệu chi tiêu</Text>
        <Text style={styles.emptySubtitle}>
          Hãy thử đổi bộ lọc hoặc thêm chi tiêu mới trên thiết bị.
        </Text>
      </GlassCard>
    );
  };

  if (activeFormExpense !== undefined) {
    return (
      <ExpenseFormScreen
        mode={activeFormExpense ? 'edit' : 'create'}
        categories={categories}
        initialExpense={activeFormExpense || undefined}
        onClose={() => {
          setActiveFormExpense(undefined);
        }}
        onSaved={() => {
          setActiveFormExpense(undefined);
        }}
      />
    );
  }

  if (isLoading && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiêu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
            <Text style={styles.errorText}>{error}</Text>
            <GlassButton
              title="Thử lại"
              onPress={() => {
                fetchInitialData();
              }}
              style={styles.retryButton}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>DailySnap Expense</Text>
          <Text style={styles.headerSubtitle}>Danh sách chi tiêu cá nhân</Text>
        </View>
        <View style={styles.headerActions}>
          <GlassButton
            title="+ Thêm"
            onPress={() => {
              setActiveFormExpense(null);
            }}
            style={styles.addButton}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Pressable
            onPress={() => {
              setSelectedCategoryId(null);
            }}
            style={[
              styles.filterTab,
              selectedCategoryId === null ? styles.filterTabActive : null,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedCategoryId === null ? styles.filterTabTextActive : null,
              ]}
            >
              📂 Tất cả
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            const emoji = getCategoryEmoji(cat.name);
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                }}
                style={[
                  styles.filterTab,
                  isActive ? styles.filterTabActive : null,
                  isActive && cat.color ? { borderColor: cat.color } : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive ? styles.filterTabTextActive : null,
                  ]}
                >
                  {emoji} {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderExpenseItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => {
          return item.id;
        }}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.15}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshing={isRefreshing}
        onRefresh={() => {
          refresh();
        }}
      />

      {/* Photo Viewer Modal */}
      <Modal
        visible={selectedPhotoUrl !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSelectedPhotoUrl(null);
        }}
      >
        <View style={styles.photoModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setSelectedPhotoUrl(null);
            }}
          />
          <View style={styles.photoModalContainer} pointerEvents="box-none">
            {selectedPhotoUrl ? (
              <Image
                source={{ uri: selectedPhotoUrl }}
                style={styles.photoLarge}
                resizeMode="contain"
                onError={() => {
                  console.log('[ExpenseListScreen] snap image load failed');
                }}
              />
            ) : null}
            <GlassButton
              title="Đóng"
              onPress={() => {
                setSelectedPhotoUrl(null);
              }}
              style={styles.photoModalCloseButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGlass,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    height: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  filterContainer: {
    paddingVertical: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
    borderWidth: 1,
  },
  filterTabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  filterTabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  filterTabTextActive: {
    color: theme.colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  expenseCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  emojiText: {
    fontSize: 20,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryNameText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  noteText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  deletedSnapBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  deletedSnapText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
  },
  snapContainer: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
    width: 80,
    height: 80,
  },
  snapThumbnail: {
    width: '100%',
    height: '100%',
  },
  amountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  amountText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    padding: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    width: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    height: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  photoLarge: {
    width: '90%',
    height: '70%',
    borderRadius: theme.borderRadius.md,
  },
  photoModalCloseButton: {
    marginTop: theme.spacing.lg,
    width: '60%',
  },
});
