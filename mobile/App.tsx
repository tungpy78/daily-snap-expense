import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { OnboardingScreen } from './src/features/auth/screens/OnboardingScreen';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { RegisterScreen } from './src/features/auth/screens/RegisterScreen';
import { GlassCard } from './src/components/GlassCard';
import { GlassButton } from './src/components/GlassButton';
import { useAuthStore } from './src/features/auth/store/useAuthStore';

// LƯU Ý: File App.tsx này hiện tại đóng vai trò là container quản lý trạng thái luồng màn hình tạm thời
// (onboarding -> login -> register -> timeline mockup) phục vụ việc nghiệm thu T-12.4.
// Luồng điều hướng chính thức sẽ sử dụng React Navigation ở các task sau.

type AppScreen = 'onboarding' | 'login' | 'register' | 'timeline';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const { restoreSession, isAuthenticated, isLoading, user, logout } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải phiên làm việc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <GlassCard style={styles.card}>
            <Text style={styles.mockTitle}>Timeline Mockup</Text>
            <Text style={styles.mockBody}>
              Đăng nhập thành công với tài khoản:{"\n"}
              <Text style={styles.usernameHighlight}>{user?.username || ''}</Text>
            </Text>
            <Text style={styles.mockBody}>
              Dòng thời gian (Timeline Screen) sẽ được phát triển ở các task sau.
            </Text>
            <GlassButton
              title="Đăng xuất"
              variant="danger"
              onPress={async () => {
                await logout();
                setCurrentScreen('login');
              }}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'onboarding') {
    return (
      <OnboardingScreen
        onFinish={() => {
          setCurrentScreen('login');
        }}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onNavigateToRegister={() => {
          setCurrentScreen('register');
        }}
        onNavigateToOnboarding={() => {
          setCurrentScreen('onboarding');
        }}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onNavigateToLogin={() => {
          setCurrentScreen('login');
        }}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateToRegister={() => {
        setCurrentScreen('register');
      }}
      onNavigateToOnboarding={() => {
        setCurrentScreen('onboarding');
      }}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  mockTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  mockBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  usernameHighlight: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
