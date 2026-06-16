import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { OnboardingScreen } from './src/features/auth/screens/OnboardingScreen';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { GlassCard } from './src/components/GlassCard';
import { GlassButton } from './src/components/GlassButton';

// LƯU Ý: File App.tsx này hiện tại đóng vai trò là container quản lý trạng thái luồng màn hình tạm thời
// (onboarding -> login -> timeline mockup) phục vụ việc nghiệm thu T-12.2.
// Luồng điều hướng chính thức sẽ sử dụng React Navigation ở các task sau.

type AppScreen = 'onboarding' | 'login' | 'timeline';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [loggedInUser, setLoggedInUser] = useState<string>('');

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
        onLoginSuccess={(username) => {
          setLoggedInUser(username);
          setCurrentScreen('timeline');
        }}
        onNavigateToRegister={() => {
          alert('Đăng ký Mockup - sẽ triển khai chính thức ở task sau (T-12.3).');
        }}
        onNavigateToOnboarding={() => {
          setCurrentScreen('onboarding');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={styles.mockTitle}>Timeline Mockup</Text>
          <Text style={styles.mockBody}>
            Đăng nhập thành công với tài khoản:{"\n"}
            <Text style={styles.usernameHighlight}>{loggedInUser}</Text>
          </Text>
          <Text style={styles.mockBody}>
            Dòng thời gian (Timeline Screen) sẽ được phát triển ở các task sau.
          </Text>
          <GlassButton
            title="Đăng xuất"
            variant="danger"
            onPress={() => {
              setLoggedInUser('');
              setCurrentScreen('login');
            }}
          />
        </GlassCard>
      </View>
    </SafeAreaView>
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
});
