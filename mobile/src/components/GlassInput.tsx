import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

export interface GlassInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  editable?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputContainerStyle = (): StyleProp<ViewStyle> => {
    return [
      styles.inputContainer,
      isFocused ? styles.inputFocused : null,
      error ? styles.inputError : null,
      !editable ? styles.inputDisabled : null,
    ];
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={getInputContainerStyle()}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          style={styles.input}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    height: '100%',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
