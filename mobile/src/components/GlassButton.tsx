import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/theme';

export interface GlassButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}) => {
  const getButtonStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    return [
      styles.button,
      variant === 'primary' ? styles.primaryButton : null,
      variant === 'secondary' ? styles.secondaryButton : null,
      variant === 'danger' ? styles.dangerButton : null,
      disabled || loading ? styles.disabled : null,
      pressed ? styles.pressed : null,
      style,
    ];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    return [
      styles.text,
      variant === 'primary' ? styles.primaryText : null,
      variant === 'secondary' ? styles.secondaryText : null,
      variant === 'danger' ? styles.dangerText : null,
    ];
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={theme.colors.textPrimary} size="small" />;
    }

    if (title) {
      return <Text style={getTextStyle()}>{title}</Text>;
    }

    return children;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => {
        return getButtonStyle(pressed);
      }}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(13, 148, 136, 0.4)',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  primaryText: {
    color: '#34D399', // Bright teal/green text to stand out
  },
  secondaryText: {
    color: theme.colors.textPrimary,
  },
  dangerText: {
    color: '#FB7185', // Coral/rose text
  },
});
