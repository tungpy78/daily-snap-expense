import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { OnboardingScreen } from './src/features/auth/screens/OnboardingScreen';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { RegisterScreen } from './src/features/auth/screens/RegisterScreen';
import { useAuthStore } from './src/features/auth/store/useAuthStore';
import { ExpenseListScreen } from './src/features/expenses/screens/ExpenseListScreen';

// LƯU Ý: App.tsx hiện là root container tạm thời để điều phối:
// - restore auth session
// - authenticated app screen
// - auth flow onboarding/login/register
//
// React Navigation chính thức sẽ được triển khai ở task sau.

type AppScreen = 'onboarding' | 'login' | 'register';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const restoreSession = useAuthStore((state) => {
    return state.restoreSession;
  });
  const isAuthenticated = useAuthStore((state) => {
    return state.isAuthenticated;
  });
  const isLoading = useAuthStore((state) => {
    return state.isLoading;
  });

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

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
    return <ExpenseListScreen />;
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
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
