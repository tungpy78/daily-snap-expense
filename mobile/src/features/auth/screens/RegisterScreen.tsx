import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type RegisterFormErrors = Partial<Record<keyof RegisterFormState, string>>;

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, { message: 'Vui lòng nhập tên đăng nhập.' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới.',
      }),
    email: z
      .string()
      .trim()
      .min(1, { message: 'Vui lòng nhập email.' })
      .email({ message: 'Email không hợp lệ.' }),
    password: z
      .string()
      .min(1, { message: 'Vui lòng nhập mật khẩu.' })
      .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [form, setForm] = useState<RegisterFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const updateField = (field: keyof RegisterFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear lỗi của field ngay khi người dùng bắt đầu sửa
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRegister = () => {
    setErrors({});

    const validation = registerSchema.safeParse(form);

    if (!validation.success) {
      const fieldErrors: RegisterFormErrors = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string' && path in form) {
          // Chỉ lấy lỗi đầu tiên cho mỗi field
          const key = path as keyof RegisterFormState;
          if (!fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
      });
      setErrors(fieldErrors);
    } else {
      // Validate thành công — mock: không gọi API, không lưu token
      onRegisterSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>DailySnap Expense</Text>
            <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu hành trình của bạn</Text>
          </View>

          {/* Form card */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Đăng Ký</Text>

            <GlassInput
              label="Tên đăng nhập"
              value={form.username}
              onChangeText={(text) => {
                updateField('username', text);
              }}
              placeholder="Nhập tên đăng nhập..."
              autoCapitalize="none"
              error={errors.username}
            />

            <GlassInput
              label="Email"
              value={form.email}
              onChangeText={(text) => {
                updateField('email', text);
              }}
              placeholder="Nhập địa chỉ email..."
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />

            <GlassInput
              label="Mật khẩu"
              value={form.password}
              onChangeText={(text) => {
                updateField('password', text);
              }}
              placeholder="Nhập mật khẩu..."
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.password}
            />

            <GlassInput
              label="Xác nhận mật khẩu"
              value={form.confirmPassword}
              onChangeText={(text) => {
                updateField('confirmPassword', text);
              }}
              placeholder="Nhập lại mật khẩu..."
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <GlassButton
              title="Đăng ký"
              variant="primary"
              onPress={handleRegister}
              style={styles.registerButton}
            />

            {/* Link quay lại Đăng nhập */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <Pressable onPress={onNavigateToLogin}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    textAlign: 'center',
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
  registerButton: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});
