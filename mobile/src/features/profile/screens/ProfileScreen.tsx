import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useExpenseStore } from '../../expenses/store/useExpenseStore';

export const ProfileScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const resetExpenseState = useExpenseStore((state) => state.resetExpenseState);

  const handleLogout = async () => {
    resetExpenseState();
    await logout();
    // RootNavigator will automatically navigate to AuthStack
    // when isAuthenticated becomes false
  };

  const displayName = user?.username ?? 'Người dùng';
  const displayEmail = user?.email ?? '';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cá nhân</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar + info */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          </View>
          <Text style={styles.username}>{displayName}</Text>
          {displayEmail.length > 0 ? (
            <Text style={styles.email}>{displayEmail}</Text>
          ) : null}
        </GlassCard>

        {/* App info card */}
        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>DailySnap Expense</Text>
          <Text style={styles.infoText}>Camera-first photo journal</Text>
          <Text style={styles.infoText}>Dark mode · Glassmorphism</Text>
        </GlassCard>

        {/* Logout button */}
        <GlassButton
          title={isLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}
          variant="danger"
          onPress={handleLogout}
          disabled={isLoading}
          style={styles.logoutButton}
        />

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.loadingIndicator}
          />
        ) : null}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Tab bar clearance
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 148, 136, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  username: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: '100%',
  },
  loadingIndicator: {
    marginTop: theme.spacing.md,
  },
});
