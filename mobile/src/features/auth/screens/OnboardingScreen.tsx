import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

interface SlideData {
  id: number;
  title: string;
  description: string;
  renderIllustration: () => React.ReactNode;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: SlideData[] = [
    {
      id: 1,
      title: 'Chụp khoảnh khắc mỗi ngày',
      description: 'Locket-style photo journal giúp bạn lưu lại những khoảnh khắc nhỏ trong ngày.',
      renderIllustration: () => {
        return (
          <View style={styles.illustrationContainer}>
            {/* Giả lập Camera Photo Card */}
            <View style={styles.photoFrame}>
              <View style={styles.cameraLensOuter}>
                <View style={styles.cameraLensInner} />
              </View>
              <View style={styles.cameraFlash} />
              <View style={styles.photoCaptionPlaceholder} />
            </View>
          </View>
        );
      },
    },
    {
      id: 2,
      title: 'Ghi chép chi tiêu trực quan',
      description: 'Gắn chi tiêu vào từng khoảnh khắc để hiểu rõ tiền của bạn đang đi đâu.',
      renderIllustration: () => {
        return (
          <View style={styles.illustrationContainer}>
            {/* Giả lập Chi tiêu / Biểu đồ */}
            <View style={styles.chartContainer}>
              <View style={styles.amountCard}>
                <Text style={styles.amountText}>+ 50.000 đ</Text>
                <Text style={styles.categoryText}>Trà sữa</Text>
              </View>
              <View style={styles.chartBarRow}>
                <View style={[styles.chartBar, { height: 40, backgroundColor: theme.colors.primary }]} />
                <View style={[styles.chartBar, { height: 80, backgroundColor: theme.colors.success }]} />
                <View style={[styles.chartBar, { height: 60, backgroundColor: theme.colors.borderGlass }]} />
              </View>
            </View>
          </View>
        );
      },
    },
    {
      id: 3,
      title: 'Chia sẻ cùng nhóm bạn',
      description: 'Theo dõi cuộc sống và cảm xúc của bạn bè qua timeline riêng tư.',
      renderIllustration: () => {
        return (
          <View style={styles.illustrationContainer}>
            {/* Giả lập Friend Timeline / Avatars */}
            <View style={styles.friendsContainer}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, styles.avatar1]}>
                  <Text style={styles.avatarInitial}>T</Text>
                </View>
                <View style={[styles.avatar, styles.avatar2]}>
                  <Text style={styles.avatarInitial}>V</Text>
                </View>
                <View style={[styles.avatar, styles.avatar3]}>
                  <Text style={styles.avatarInitial}>A</Text>
                </View>
              </View>
              <View style={styles.postBubble}>
                <Text style={styles.postBubbleText}>vietanh đã thả ❤️ vào ảnh của bạn</Text>
              </View>
            </View>
          </View>
        );
      },
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        y: 0,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      onFinish();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => {
          return (
            <View key={slide.id} style={styles.slideWrapper}>
              <View style={styles.illustrationWrapper}>
                {slide.renderIllustration()}
              </View>

              <GlassCard style={styles.contentCard}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </GlassCard>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer chứa Pagination Dots & Button điều hướng */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : null,
                ]}
              />
            );
          })}
        </View>

        {/* Button */}
        <GlassButton
          title={currentIndex === slides.length - 1 ? 'Bắt đầu' : 'Tiếp tục'}
          variant="primary"
          onPress={handleNext}
          style={styles.button}
        />
      </View>
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
  slideWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  illustrationWrapper: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustrationContainer: {
    width: '80%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.borderGlass,
    marginHorizontal: theme.spacing.xs,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  button: {
    width: '100%',
  },
  // Style cho minh họa Slide 1 (Camera)
  photoFrame: {
    width: 160,
    height: 190,
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  cameraLensOuter: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLensInner: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
    opacity: 0.8,
  },
  cameraFlash: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 16,
    height: 16,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.success,
  },
  photoCaptionPlaceholder: {
    width: '80%',
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.borderGlass,
    marginTop: theme.spacing.md,
  },
  // Style cho minh họa Slide 2 (Chart / Expense)
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  amountCard: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.light,
  },
  amountText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: '#34D399',
  },
  categoryText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'center',
  },
  chartBar: {
    width: 24,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
  },
  // Style cho minh họa Slide 3 (Friends)
  friendsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.round,
    borderWidth: 2,
    borderColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar1: {
    backgroundColor: theme.colors.primary,
    marginRight: -16,
  },
  avatar2: {
    backgroundColor: theme.colors.success,
    marginRight: -16,
    zIndex: 1,
  },
  avatar3: {
    backgroundColor: theme.colors.danger,
    zIndex: 2,
  },
  avatarInitial: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  postBubble: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.light,
  },
  postBubbleText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textPrimary,
  },
});
