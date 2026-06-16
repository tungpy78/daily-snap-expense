import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { OnboardingScreen } from './src/features/auth/screens/OnboardingScreen';
import { GlassCard } from './src/components/GlassCard';
import { GlassButton } from './src/components/GlassButton';

// LƯU Ý: File App.tsx này hiện tại đóng vai trò là container chính để mount OnboardingScreen
// và mock chuyển đổi trạng thái khi nhấn "Bắt đầu" (onFinish).
// Khi onFinish kích hoạt, màn hình sẽ hiển thị mock Login.

export default function App() {
  const [isOnboardingFinished, setIsOnboardingFinished] = useState<boolean>(false);

  if (!isOnboardingFinished) {
    return (
      <OnboardingScreen
        onFinish={() => {
          setIsOnboardingFinished(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={styles.mockTitle}>Đăng nhập Mockup</Text>
          <Text style={styles.mockBody}>
            Màn hình Đăng nhập (Login Screen) sẽ được triển khai chính thức ở task sau (T-12.2).
          </Text>
          <GlassButton
            title="Quay lại Onboarding"
            variant="secondary"
            onPress={() => {
              setIsOnboardingFinished(false);
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
});
