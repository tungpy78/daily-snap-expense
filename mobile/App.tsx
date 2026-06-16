import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { theme } from './src/theme/theme';
import { GlassCard } from './src/components/GlassCard';
import { GlassButton } from './src/components/GlassButton';
import { GlassInput } from './src/components/GlassInput';

// LƯU Ý: File App.tsx này chỉ đóng vai trò là màn hình Showcase / Smoke Test tạm thời
// để kiểm tra hiển thị trực quan và kiểm thử các UI Core Components (Glassmorphism + Dark Mode).
// UI này không phải là giao diện chính thức của ứng dụng di động.

export default function App() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');

  const handleDemoPress = () => {
    setIsSubmitLoading(true);
    setInputError('');
    setTimeout(() => {
      setIsSubmitLoading(false);
      if (!username) {
        setInputError('Tên đăng nhập không được để trống.');
      } else {
        alert(`Xin chào ${username}!`);
      }
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>DailySnap Expense</Text>
        <Text style={styles.subtitle}>UI Core Preview (Showcase Tạm Thời)</Text>

        {/* 1. GlassCard mẫu */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin Showcase</Text>
          <Text style={styles.cardBody}>
            Màn hình này trực quan hóa các UI Component mờ (Glassmorphism) trên nền tối Sleek Dark Mode.
          </Text>
        </GlassCard>

        {/* 2. Vùng hiển thị Palette màu sắc */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Bảng màu & Tokens</Text>
          <View style={styles.paletteContainer}>
            <View style={[styles.colorBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>Teal</Text>
            </View>
            <View style={[styles.colorBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.badgeText}>Green</Text>
            </View>
            <View style={[styles.colorBadge, { backgroundColor: theme.colors.danger }]}>
              <Text style={styles.badgeText}>Rose</Text>
            </View>
            <View style={[styles.colorBadge, { backgroundColor: theme.colors.surfaceGlass }]}>
              <Text style={styles.badgeText}>Glass</Text>
            </View>
          </View>
        </GlassCard>

        {/* 3. GlassInput Components */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Input Fields</Text>
          
          <GlassInput
            label="Tên đăng nhập"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
            }}
            placeholder="Nhập tên đăng nhập..."
          />

          <GlassInput
            label="Mật khẩu (Demo Error State)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
            }}
            placeholder="Nhập mật khẩu..."
            secureTextEntry={true}
            error={inputError}
          />
        </GlassCard>

        {/* 4. GlassButton Variants */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Buttons</Text>
          
          <GlassButton
            title="Đăng Nhập (Primary)"
            variant="primary"
            loading={isSubmitLoading}
            onPress={handleDemoPress}
            style={styles.buttonSpacing}
          />

          <GlassButton
            title="Hủy Bỏ (Secondary)"
            variant="secondary"
            onPress={() => {
              setUsername('');
              setPassword('');
              setInputError('');
            }}
            style={styles.buttonSpacing}
          />

          <GlassButton
            title="Xóa Tài Khoản (Danger)"
            variant="danger"
            onPress={() => {
              alert('Danger Action Triggered!');
            }}
            style={styles.buttonSpacing}
          />

          <GlassButton
            title="Nút bị Disabled"
            variant="primary"
            disabled={true}
            onPress={() => {}}
            style={styles.buttonSpacing}
          />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  cardBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  paletteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  colorBadge: {
    flex: 1,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    borderColor: theme.colors.borderGlass,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  buttonSpacing: {
    marginBottom: theme.spacing.sm,
  },
});
