import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';
import { useAuthStore } from '../store/useAuthStore';

interface LoginScreenProps {
  onLoginSuccess?: (username: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToOnboarding: () => void;
}

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, { message: 'Tên đăng nhập hoặc email không được để trống.' }),
  password: z.string().min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }),
});

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToOnboarding,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { login, isLoading, error: storeError, clearError } = useAuthStore();

  const displayError = generalError || storeError;

  const handleLogin = async () => {
    setErrors({});
    setGeneralError(null);
    clearError();
    const validation = loginSchema.safeParse({ usernameOrEmail: usernameOrEmail.trim(), password });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
    } else {
      try {
        await login(usernameOrEmail.trim(), password);
        // Do not call onLoginSuccess because App.tsx listens to useAuthStore.isAuthenticated
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : 'Đăng nhập thất bại. Vui lòng thử lại.';
        setGeneralError(message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.title}>DailySnap Expense</Text>
            <Text style={styles.subtitle}>Sleek Dark Mode & Glassmorphism</Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Đăng Nhập</Text>

            <GlassInput
              label="Tên đăng nhập hoặc Email"
              value={usernameOrEmail}
              onChangeText={(text) => {
                setUsernameOrEmail(text);
                setGeneralError(null);
                clearError();
                if (errors.usernameOrEmail) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.usernameOrEmail;
                    return next;
                  });
                }
              }}
              placeholder="Nhập username hoặc email..."
              autoCapitalize="none"
              error={errors.usernameOrEmail}
              editable={!isLoading}
            />

            <GlassInput
              label="Mật khẩu"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setGeneralError(null);
                clearError();
                if (errors.password) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }
              }}
              placeholder="Nhập mật khẩu..."
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.password}
              editable={!isLoading}
            />

            {displayError ? (
              <Text style={styles.generalError}>{displayError}</Text>
            ) : null}

            <GlassButton
              title="Đăng nhập"
              variant="primary"
              onPress={handleLogin}
              style={styles.loginButton}
              loading={isLoading}
              disabled={isLoading}
            />

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <Pressable onPress={onNavigateToRegister} disabled={isLoading}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </GlassCard>

          <Pressable onPress={onNavigateToOnboarding} style={styles.backButton} disabled={isLoading}>
            <Text style={styles.backButtonText}>← Quay lại Onboarding</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  card: {
    width: '100%',
    paddingVertical: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  generalError: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
