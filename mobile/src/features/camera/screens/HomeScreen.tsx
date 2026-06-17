import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { compressImage } from '../utils/imageCompression';
import { SnapComposerModal } from '../components/SnapComposerModal';
import { useHomeFeedStore } from '../../feed/store/useHomeFeedStore';
import { FeedItem } from '../../feed/types/feed.types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - 2 * CARD_MARGIN;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 4 / 3);

// Helper to get current date greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Chào buổi sáng ☀️';
  }
  if (hour < 18) {
    return 'Chào buổi chiều 🌤';
  }
  return 'Chào buổi tối 🌙';
};

const getFormattedDate = (): string => {
  const now = new Date();
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = dayNames[now.getDay()];
  const day = now.getDate();
  const month = now.getMonth() + 1;
  return `${dayName}, ${day} tháng ${month}`;
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

const formatAmount = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

const formatTimeAgo = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Vừa xong';
    }
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    }
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    if (diffDays === 1) {
      return 'Hôm qua';
    }
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export const HomeScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const parentFlatListRef = useRef<FlatList<FeedItem>>(null);

  // Layout visible height state to dynamically adjust to bottom tab bar
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  // Camera active state to prevent black view on mount/tab switch
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Scroll locks/flags to manage scroll behavior
  const isScrollingToTopRef = useRef<boolean>(false);

  // Home Feed Store state and actions
  const feedItems = useHomeFeedStore((state) => state.feedItems);
  const isLoadingFeed = useHomeFeedStore((state) => state.isLoading);
  const isRefreshingFeed = useHomeFeedStore((state) => state.isRefreshing);
  const isLoadingMoreFeed = useHomeFeedStore((state) => state.isLoadingMore);
  const feedError = useHomeFeedStore((state) => state.error);
  const hasMoreFeed = useHomeFeedStore((state) => state.hasMore);
  const fetchInitialFeed = useHomeFeedStore((state) => state.fetchInitialFeed);
  const refreshFeed = useHomeFeedStore((state) => state.refreshFeed);
  const loadMoreFeed = useHomeFeedStore((state) => state.loadMoreFeed);

  useEffect(() => {
    if (isFocused && feedItems.length === 0) {
      void fetchInitialFeed();
    }
  }, [isFocused, feedItems.length, fetchInitialFeed]);

  // Activate camera preview with a slight delay when screen is focused
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        setCameraActive(true);
      }, 300);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setCameraActive(false);
    }
  }, [isFocused]);

  const toggleFacing = () => {
    setFacing((prev) => {
      return prev === 'back' ? 'front' : 'back';
    });
  };

  const toggleFlash = () => {
    setFlash((prev) => {
      return prev === 'off' ? 'on' : 'off';
    });
  };

  const handleCapture = async () => {
    if (isCapturing || isCompressing || !cameraRef.current) {
      return;
    }

    try {
      setIsCapturing(true);
      const options = { quality: 1, skipProcessing: false };
      const photo = await cameraRef.current.takePictureAsync(options);

      if (photo) {
        setIsCompressing(true);
        const compressed = await compressImage(photo.uri, photo.width, photo.height);
        setCapturedUri(compressed.uri);
      }
    } catch (error) {
      console.log('Lỗi khi chụp ảnh:', error);
    } finally {
      setIsCapturing(false);
      setIsCompressing(false);
    }
  };

  const handleSnapSaved = () => {
    setCapturedUri(null);
    void refreshFeed();
  };

  // Camera section inside the card
  const renderCameraCard = () => {
    // Camera permission not yet determined
    if (!permission) {
      return (
        <View style={styles.cameraCardLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.cameraLoadingText}>Đang khởi động camera...</Text>
        </View>
      );
    }

    // Camera permission denied
    if (!permission.granted) {
      return (
        <View style={styles.cameraCardPermission}>
          <Text style={styles.cameraPermissionEmoji}>📷</Text>
          <Text style={styles.cameraPermissionTitle}>Cần quyền camera</Text>
          <Text style={styles.cameraPermissionText}>
            Cho phép truy cập camera để chụp khoảnh khắc của bạn.
          </Text>
          <GlassButton
            title="Cho phép Camera"
            onPress={() => { void requestPermission(); }}
            style={styles.permissionButton}
          />
        </View>
      );
    }

    // Camera is not fully initialized or tab is unfocused — render inactive screen
    if (!isFocused || !cameraActive) {
      return (
        <View style={styles.cameraCardInactive}>
          <Text style={styles.cameraInactiveEmoji}>📷</Text>
          <Text style={styles.cameraInactiveText}>Đang khởi động...</Text>
        </View>
      );
    }

    return (
      <View style={StyleSheet.absoluteFillObject}>
        {/* Live camera view fills the card */}
        <CameraView
          key={isFocused ? 'active' : 'inactive'}
          ref={cameraRef}
          style={styles.cameraPreview}
          facing={facing}
          flash={flash}
        />

        {/* Sibling absolute overlay with pointerEvents box-none */}
        <View pointerEvents="box-none" style={styles.cameraOverlay}>
          {/* Top controls overlay */}
          <View style={styles.cameraTopControls}>
            <View style={styles.cameraTopLeft}>
              <Text style={styles.appName}>DailySnap</Text>
            </View>
            <View style={styles.cameraTopRight}>
              <Pressable
                onPress={toggleFlash}
                style={[
                  styles.cameraControlBtn,
                  flash === 'on' && styles.cameraControlBtnActive,
                  { marginRight: theme.spacing.sm },
                ]}
              >
                <Text style={styles.cameraControlBtnText}>⚡</Text>
              </Pressable>
              <Pressable
                onPress={toggleFacing}
                style={styles.cameraControlBtn}
              >
                <Text style={styles.cameraControlBtnText}>🔄</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom capture controls overlay */}
          <View style={styles.cameraBottomControls}>
            <Pressable
              onPress={handleCapture}
              disabled={isCapturing || isCompressing}
              style={({ pressed }) => {
                if (pressed) {
                  return [styles.captureOrb, styles.captureOrbPressed];
                }
                return styles.captureOrb;
              }}
            >
              <View style={styles.captureOrbInner}>
                {(isCapturing || isCompressing) ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : null}
              </View>
            </Pressable>
            <Text style={styles.captureHint}>Chạm để chụp</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFeedItem = ({ item, index }: { item: FeedItem; index: number }) => {
    const avatarLetter = item.author.username
      ? item.author.username.charAt(0).toUpperCase()
      : '?';

    return (
      <View style={[styles.feedCard, { height: pageHeight }]}>
        <View style={styles.feedCardInner}>

          {/* Author Metadata Row */}
          <View style={styles.feedMetaRow}>
            <View style={styles.feedAuthorLeft}>
              <View style={styles.feedAvatar}>
                {item.author.avatarUrl ? (
                  <Image source={{ uri: item.author.avatarUrl }} style={styles.feedAvatarImage} />
                ) : (
                  <Text style={styles.feedAvatarText}>{avatarLetter}</Text>
                )}
              </View>
              <View style={styles.feedAuthorDetails}>
                <Text style={styles.feedAuthorName}>
                  {item.isOwn ? 'Tôi' : item.author.username}
                </Text>
                <Text style={styles.feedTime}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
            {item.isOwn && (
              <View style={styles.privacyTag}>
                <Text style={styles.privacyTagText}>
                  {item.isPrivate ? '🔒 Riêng tư' : '👥 Bạn bè'}
                </Text>
              </View>
            )}
          </View>

          {/* Photo Area with bo góc lớn */}
          <View style={styles.feedImageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.feedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.feedImagePlaceholder}>
                <Text style={styles.feedImagePlaceholderText}>Không tải được ảnh</Text>
              </View>
            )}

            {/* Floating Caption Overlay/Pill near the bottom of image */}
            {item.caption ? (
              <View style={styles.feedCaptionBubble}>
                <Text style={styles.feedCaptionText}>{item.caption}</Text>
              </View>
            ) : null}
          </View>

          {/* Expense tags horizontal scroll if there are expenses and isOwn */}
          <View style={styles.expenseTagsWrapper}>
            {item.expenses && item.expenses.length > 0 ? (
              <View style={styles.expenseTagsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expenseTagsScroll}>
                  {item.expenses.map((exp) => {
                    return (
                      <View key={exp.id} style={styles.expenseTag}>
                        <Text style={styles.expenseTagText}>
                          {getCategoryEmoji(exp.categoryName || '')} {exp.categoryName || 'Chi tiêu'}: {formatAmount(exp.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.expenseTagsPlaceholder} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const pageHeight = measuredHeight > 0 ? measuredHeight : SCREEN_HEIGHT - insets.top - 80;

  const renderListHeader = () => {
    return (
      /* PAGE 1: Camera Home UI inside header to ensure layout consistency */
      <View style={[styles.pageOneContent, { height: pageHeight }]}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.dateLabel}>{getFormattedDate()}</Text>
        </View>

        {/* Camera card — compact, rounded */}
        <View style={styles.cameraCardWrapper}>
          <View style={styles.cameraCard}>
            {renderCameraCard()}
          </View>
          {/* Teal glow ring under card */}
          <View style={styles.cardGlow} />
        </View>

        {/* Bottom Swiping Indicator */}
        <View style={styles.swipeIndicatorContainer}>
          <Text style={styles.swipeIndicatorText}>Vuốt xuống để xem khoảnh khắc ⬇️</Text>
        </View>
      </View>
    );
  };

  // Scroll handler to detect scroll past last item
  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;

    // Trigger scroll back to top if scrolled past the last item (threshold 50px)
    if (
      feedItems.length > 0 &&
      layoutHeight > 0 &&
      y + layoutHeight >= contentHeight + 50 &&
      !isScrollingToTopRef.current
    ) {
      isScrollingToTopRef.current = true;
      parentFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      setTimeout(() => {
        isScrollingToTopRef.current = false;
      }, 1500); // 1.5s cooldown
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0 && height !== measuredHeight) {
          setMeasuredHeight(height);
        }
      }}
    >
      <FlatList
        ref={parentFlatListRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          isLoadingFeed ? (
            <View style={[styles.centerContainer, { height: pageHeight }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Đang tải bảng tin...</Text>
            </View>
          ) : feedError ? (
            <View style={[styles.centerContainer, { height: pageHeight }]}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorText}>Không tải được bảng tin.</Text>
              <Text style={styles.errorSubtext}>{feedError}</Text>
              <GlassButton
                title="Thử lại"
                onPress={fetchInitialFeed}
                style={styles.retryBtn}
              />
            </View>
          ) : (
            <View style={[styles.emptyContainer, { height: pageHeight }]}>
              <Text style={styles.emptyEmoji}>🌅</Text>
              <Text style={styles.emptyTitle}>Chưa có khoảnh khắc nào</Text>
              <Text style={styles.emptyText}>
                Chụp snap đầu tiên hoặc kết bạn để thấy feed ở đây.
              </Text>
              <GlassButton
                title="Bật Camera 📷"
                onPress={() => {
                  parentFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }}
                style={styles.cameraGoBtn}
              />
            </View>
          )
        }
        ListFooterComponent={
          feedItems.length > 0 && isLoadingMoreFeed ? (
            <ActivityIndicator style={{ marginVertical: 16 }} size="small" color={theme.colors.primary} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFeed}
            onRefresh={refreshFeed}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.4}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        pagingEnabled={true}
        decelerationRate="fast"
        snapToInterval={pageHeight}
        snapToAlignment="start"
        style={styles.scrollView}
        contentContainerStyle={styles.flatListContentContainer}
      />

      {/* SnapComposerModal */}
      <SnapComposerModal
        visible={capturedUri !== null}
        imageUri={capturedUri}
        onClose={() => {
          setCapturedUri(null);
        }}
        onSaved={handleSnapSaved}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  flatListContentContainer: {
    paddingBottom: 0,
  },
  pageOneContent: {
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  pageTwoContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    paddingBottom: 96,
  },

  // Page header
  pageHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  greeting: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  dateLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Camera card wrapper
  cameraCardWrapper: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  cameraCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0A0E18',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
    position: 'relative',
  },
  cameraPreview: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraControlBtnActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.45)',
    borderColor: theme.colors.primary,
  },
  cardGlow: {
    position: 'absolute',
    bottom: -6,
    left: 20,
    right: 20,
    height: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  },

  // Swipe indicators
  swipeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  swipeIndicatorText: {
    color: 'rgba(13, 148, 136, 0.6)',
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.5,
  },
  swipeUpIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  swipeUpIndicatorText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.5,
    opacity: 0.6,
  },

  // Camera permission / loading states inside card
  cameraCardLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cameraLoadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  cameraCardPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  cameraPermissionEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  cameraPermissionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  cameraPermissionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  permissionButton: {
    width: '100%',
  },
  cameraCardInactive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#0A0E18',
  },
  cameraInactiveEmoji: {
    fontSize: 40,
    opacity: 0.4,
  },
  cameraInactiveText: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.25)',
  },

  // Camera overlay controls
  cameraTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cameraTopLeft: {
    flex: 1,
  },
  appName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  cameraControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControlBtnText: {
    fontSize: 18,
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: theme.colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  captureOrbPressed: {
    transform: [{ scale: 0.93 }],
    backgroundColor: 'rgba(13, 148, 136, 0.3)',
    borderColor: theme.colors.primary,
  },
  captureOrbInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.white,
  },
  captureHint: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.3,
  },

  // Feed section header
  feedSectionHeader: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    height: 35,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  feedSectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },

  // Real feed list styling
  feedList: {
    flex: 1,
    width: '100%',
  },
  feedListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  feedCard: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    justifyContent: 'center', // Vertically center the cardInner content!
  },
  feedCardInner: {
    paddingTop: theme.spacing.sm,
    paddingBottom: 40,
  },
  feedCardTopSpacing: {
    height: 35,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  feedAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  feedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  feedAvatarText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  feedAuthorDetails: {
    justifyContent: 'center',
  },
  feedAuthorName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  feedTime: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  privacyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  privacyTagText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
  },
  feedImageContainer: {
    width: '100%',
    height: CARD_HEIGHT - 30,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedImagePlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  feedCaptionBubble: {
    position: 'absolute',
    bottom: theme.spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: '85%',
  },
  feedCaptionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
  expenseTagsWrapper: {
    height: 35,
    justifyContent: 'center',
  },
  expenseTagsContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  expenseTagsScroll: {
    flexDirection: 'row',
  },
  expenseTagsPlaceholder: {
    height: 35,
  },
  expenseTag: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    marginRight: theme.spacing.sm,
    height: 26,
    justifyContent: 'center',
  },
  expenseTagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },

  // Loading & Error States center UI
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.sm,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  errorSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryBtn: {
    minWidth: 120,
  },

  // Empty State UI
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  cameraGoBtn: {
    minWidth: 160,
  },

  endOfFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  endOfFeedText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    opacity: 0.5,
  },
});
