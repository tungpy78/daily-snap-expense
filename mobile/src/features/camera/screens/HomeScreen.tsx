import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { compressImage } from '../utils/imageCompression';
import { SnapComposerModal } from '../components/SnapComposerModal';

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

    // Camera is focused and permission granted — render live preview
    if (!isFocused) {
      // Return minimal placeholder when tab is unfocused to release hardware
      return (
        <View style={styles.cameraCardInactive}>
          <Text style={styles.cameraInactiveEmoji}>📷</Text>
          <Text style={styles.cameraInactiveText}>Camera</Text>
        </View>
      );
    }

    return (
      <View style={StyleSheet.absoluteFillObject}>
        {/* Live camera view fills the card */}
        <CameraView
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

  const pageHeight = SCREEN_HEIGHT - insets.top;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        pagingEnabled={true}
        decelerateRate="fast"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* PAGE 1: Camera Home */}
        <View style={[styles.pageContainer, { height: pageHeight }]}>
          <View style={styles.pageOneContent}>
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
        </View>

        {/* PAGE 2: Moments Feed */}
        <View style={[styles.pageContainer, { height: pageHeight }]}>
          <View style={styles.pageTwoContent}>
            {/* Feed Section Header */}
            <View style={styles.feedSectionHeader}>
              <Text style={styles.feedSectionTitle}>Khoảnh khắc gần đây</Text>
              <View style={styles.feedComingBadge}>
                <Text style={styles.feedComingBadgeText}>Sắp ra mắt</Text>
              </View>
            </View>

            {/* Mock Snap Feed Card (Locket-style similar to Image 3) */}
            <View style={styles.mockFeedCardContainer}>
              <GlassCard style={styles.mockFeedCard}>
                {/* Photo Area */}
                <View style={styles.mockFeedImagePlaceholder}>
                  <Text style={styles.mockFeedEmoji}>🌅</Text>
                  <Text style={styles.mockFeedPlaceholderText}>Feed sẽ hoàn thiện ở T-14.3</Text>
                  
                  {/* Overlaid Caption Bubble */}
                  <View style={styles.mockFeedCaptionBubble}>
                    <Text style={styles.mockFeedCaptionText}>Bữa tối vui vẻ 🥂</Text>
                  </View>
                </View>

                {/* Author Metadata Row */}
                <View style={styles.mockFeedMetaRow}>
                  <View style={styles.mockFeedAvatar}>
                    <Text style={styles.mockFeedAvatarText}>TA</Text>
                  </View>
                  <View style={styles.mockFeedAuthorDetails}>
                    <Text style={styles.mockFeedAuthorName}>Trần Anh</Text>
                    <Text style={styles.mockFeedTime}>2 giờ trước</Text>
                  </View>
                </View>

                {/* Mock Message/Reaction Bar */}
                <View style={styles.mockMessageBar}>
                  <View style={styles.mockMessageInput}>
                    <Text style={styles.mockMessagePlaceholder}>Gửi tin nhắn...</Text>
                  </View>
                  <View style={styles.mockEmojiRow}>
                    <Text style={styles.mockEmoji}>❤️</Text>
                    <Text style={styles.mockEmoji}>🙌</Text>
                    <Text style={styles.mockEmoji}>😍</Text>
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Top Swiping Indicator to go back */}
            <View style={styles.swipeUpIndicatorContainer}>
              <Text style={styles.swipeUpIndicatorText}>Vuốt lên để chụp ảnh ⬆️</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  pageContainer: {
    width: SCREEN_WIDTH,
  },
  pageOneContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 96,
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
    width: '100%',
    height: '100%',
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
    // soft glow below card
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
    paddingVertical: theme.spacing.xs,
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
    // subtle top gradient feel
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

  // Feed section
  feedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  feedSectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  feedComingBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  feedComingBadgeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },

  // Mock snap feed styling (Locket-style)
  mockFeedCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: theme.spacing.sm,
  },
  mockFeedCard: {
    width: CARD_WIDTH,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mockFeedImagePlaceholder: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mockFeedEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  mockFeedPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  mockFeedCaptionBubble: {
    position: 'absolute',
    bottom: theme.spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockFeedCaptionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  mockFeedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  mockFeedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  mockFeedAvatarText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  mockFeedAuthorDetails: {
    flex: 1,
  },
  mockFeedAuthorName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  mockFeedTime: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  mockMessageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mockMessageInput: {
    flex: 1,
  },
  mockMessagePlaceholder: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: theme.typography.sizes.xs,
  },
  mockEmojiRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  mockEmoji: {
    fontSize: 18,
  },
});
