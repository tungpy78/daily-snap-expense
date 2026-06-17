import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';

// Placeholder snap card for visual direction
const MockSnapCard: React.FC<{ imageEmoji: string; caption: string; amount: string; category: string }> = ({
  imageEmoji,
  caption,
  amount,
  category,
}) => {
  return (
    <GlassCard style={styles.snapCard}>
      {/* Image area */}
      <View style={styles.imageArea}>
        <Text style={styles.imageEmoji}>{imageEmoji}</Text>
        {/* Caption overlay */}
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText}>{caption}</Text>
        </View>
        {/* Privacy pill */}
        <View style={styles.privacyPill}>
          <Text style={styles.privacyText}>🔒 Riêng tư</Text>
        </View>
      </View>
      {/* Expense tags */}
      <View style={styles.expenseTags}>
        <View style={styles.expenseTag}>
          <Text style={styles.expenseTagText}>
            {category} {amount}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

export const TimelinePlaceholderScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dòng thời gian</Text>
        <Text style={styles.headerSubtitle}>Nhật ký khoảnh khắc của bạn</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming soon banner */}
        <GlassCard style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>⏰</Text>
          <Text style={styles.comingSoonTitle}>Sắp ra mắt</Text>
          <Text style={styles.comingSoonText}>
            Dòng thời gian sẽ hoàn thiện ở T-14.3.{'\n'}
            Chụp snap ngay để lưu khoảnh khắc của bạn!
          </Text>
        </GlassCard>

        {/* Direction mockup cards */}
        <Text style={styles.directionLabel}>Giao diện dự kiến</Text>
        <MockSnapCard
          imageEmoji="🍜"
          caption="Bữa sáng ngon quá đi 🥰"
          amount="45.000 đ"
          category="🍔"
        />
        <MockSnapCard
          imageEmoji="☕"
          caption="Cà phê sáng nay đặc biệt"
          amount="35.000 đ"
          category="☕"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Tab bar clearance
  },
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  comingSoonEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
  },
  comingSoonTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  comingSoonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  directionLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  snapCard: {
    marginBottom: theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  imageArea: {
    height: 200,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageEmoji: {
    fontSize: 60,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  captionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  privacyPill: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  privacyText: {
    fontSize: theme.typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expenseTags: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  expenseTag: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  expenseTagText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});
