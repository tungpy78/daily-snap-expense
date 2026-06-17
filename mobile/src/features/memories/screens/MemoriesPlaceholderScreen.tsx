import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';

// Static day data for mockup grid
const MONTH_LABEL = 'tháng 6 2026';
const DAYS_IN_MONTH = 30;

// Simulated days that "have snaps" for visual effect only
const MOCK_SNAP_DAYS = new Set([3, 7, 8, 11, 14, 16, 17]);

interface DayCellProps {
  day: number;
  hasSnap: boolean;
}

const DayCell: React.FC<DayCellProps> = ({ day, hasSnap }) => {
  return (
    <View style={[styles.dayCell, hasSnap ? styles.dayCellActive : null]}>
      {hasSnap ? (
        <>
          <View style={styles.snapDot} />
          <Text style={styles.dayTextActive}>{day}</Text>
        </>
      ) : (
        <Text style={styles.dayText}>{day}</Text>
      )}
    </View>
  );
};

export const MemoriesPlaceholderScreen: React.FC = () => {
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kỷ niệm</Text>
        <Text style={styles.headerSubtitle}>Nhìn lại hành trình của bạn</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming soon banner */}
        <GlassCard style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>📅</Text>
          <Text style={styles.comingSoonTitle}>Sắp ra mắt</Text>
          <Text style={styles.comingSoonText}>
            Kỷ niệm sẽ hoàn thiện ở T-14.4.{'\n'}
            Mỗi ngày bạn chụp snap sẽ được đánh dấu trên lịch!
          </Text>
        </GlassCard>

        {/* Mockup memory grid */}
        <GlassCard style={styles.calendarCard}>
          <Text style={styles.monthLabel}>{MONTH_LABEL}</Text>
          <View style={styles.calendarGrid}>
            {days.map((day) => (
              <DayCell
                key={day}
                day={day}
                hasSnap={MOCK_SNAP_DAYS.has(day)}
              />
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Ngày có kỷ niệm (minh họa)</Text>
          </View>
        </GlassCard>
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
  calendarCard: {
    padding: theme.spacing.md,
  },
  monthLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.18)',
    borderColor: 'rgba(13, 148, 136, 0.45)',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  dayText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  dayTextActive: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  snapDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  legendText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
});
