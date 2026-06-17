import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';
import { useExpenseStore } from '../store/useExpenseStore';
import { Expense, Category } from '../types/expense.types';

export interface ExpenseFormScreenProps {
  mode: 'create' | 'edit';
  categories: Category[];
  initialExpense?: Expense;
  onClose: () => void;
  onSaved: () => void;
}

const getCategoryEmoji = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('food') || name.includes('ăn') || name.includes('uống')) {
    return '🍔';
  }
  if (name.includes('transport') || name.includes('di chuyển') || name.includes('xe')) {
    return '🚗';
  }
  if (name.includes('shopping') || name.includes('mua sắm')) {
    return '🛍️';
  }
  if (name.includes('entertainment') || name.includes('giải trí') || name.includes('chơi')) {
    return '🎮';
  }
  if (name.includes('study') || name.includes('học')) {
    return '📚';
  }
  if (name.includes('health') || name.includes('sức khỏe') || name.includes('y tế')) {
    return '🏥';
  }
  return '💸';
};

const getCategoryBgColor = (colorHex?: string): string => {
  if (!colorHex || !colorHex.startsWith('#')) {
    return 'rgba(255, 255, 255, 0.1)';
  }
  try {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return 'rgba(255, 255, 255, 0.1)';
    }
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  } catch {
    return 'rgba(255, 255, 255, 0.1)';
  }
};

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

const formatDateToVietnamese = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const formatAmountInput = (val: string): string => {
  const clean = val.replace(/\D/g, '');
  if (clean === '') {
    return '';
  }
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseAmountInput = (val: string): number => {
  const clean = val.replace(/\D/g, '');
  if (clean === '') {
    return 0;
  }
  return parseInt(clean, 10);
};

const expenseValidationSchema = z.object({
  amount: z.number().gt(0, { message: 'Vui lòng nhập số tiền hợp lệ.' }),
  categoryId: z.string().min(1, { message: 'Vui lòng chọn danh mục.' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Vui lòng chọn ngày chi tiêu.' }),
  note: z.string().nullable().optional(),
});

export const ExpenseFormScreen: React.FC<ExpenseFormScreenProps> = ({
  mode,
  categories,
  initialExpense,
  onClose,
  onSaved,
}) => {
  const { createExpense, updateExpense, error: storeError, clearError } = useExpenseStore();

  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // States cho DatePicker custom modal
  const [isDatePickerVisible, setIsDatePickerVisible] = useState<boolean>(false);
  const [pickerDay, setPickerDay] = useState<number>(1);
  const [pickerMonth, setPickerMonth] = useState<number>(1);
  const [pickerYear, setPickerYear] = useState<number>(2026);

  useEffect(() => {
    clearError();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (mode === 'edit' && initialExpense) {
      setAmountStr(formatAmountInput(initialExpense.amount.toString()));
      setSelectedCategoryId(initialExpense.categoryId);
      setDateStr(initialExpense.date);
      setNote(initialExpense.note || '');
    } else {
      setAmountStr('');
      if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      } else {
        setSelectedCategoryId('');
      }
      setDateStr(todayStr);
      setNote('');
    }
  }, [mode, initialExpense, categories]);

  const handleQuickDateSelect = (type: 'today' | 'yesterday') => {
    const target = new Date();
    if (type === 'yesterday') {
      target.setDate(target.getDate() - 1);
    }
    const targetStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    setDateStr(targetStr);
    
    if (errors.date) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.date;
        return next;
      });
    }
  };

  const handleOpenCustomDatePicker = () => {
    let currentDay = 1;
    let currentMonth = 6;
    let currentYear = 2026;

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      currentYear = parseInt(parts[0], 10);
      currentMonth = parseInt(parts[1], 10);
      currentDay = parseInt(parts[2], 10);
    }

    setPickerDay(currentDay);
    setPickerMonth(currentMonth);
    setPickerYear(currentYear);
    setIsDatePickerVisible(true);
  };

  const handleConfirmCustomDate = () => {
    const cleanDateStr = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`;
    setDateStr(cleanDateStr);
    setIsDatePickerVisible(false);

    if (errors.date) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.date;
        return next;
      });
    }
  };

  const adjustPickerDate = (
    type: 'day' | 'month' | 'year',
    direction: 'up' | 'down'
  ) => {
    if (type === 'day') {
      const maxDays = getDaysInMonth(pickerMonth, pickerYear);
      let nextDay = direction === 'up' ? pickerDay + 1 : pickerDay - 1;
      if (nextDay > maxDays) {
        nextDay = 1;
      }
      if (nextDay < 1) {
        nextDay = maxDays;
      }
      setPickerDay(nextDay);
    }

    if (type === 'month') {
      let nextMonth = direction === 'up' ? pickerMonth + 1 : pickerMonth - 1;
      if (nextMonth > 12) {
        nextMonth = 1;
      }
      if (nextMonth < 1) {
        nextMonth = 12;
      }
      setPickerMonth(nextMonth);

      // Điều chỉnh pickerDay nếu ngày hiện tại vượt quá số ngày của tháng mới
      const maxDaysInNewMonth = getDaysInMonth(nextMonth, pickerYear);
      if (pickerDay > maxDaysInNewMonth) {
        setPickerDay(maxDaysInNewMonth);
      }
    }

    if (type === 'year') {
      let nextYear = direction === 'up' ? pickerYear + 1 : pickerYear - 1;
      if (nextYear > 2100) {
        nextYear = 2100;
      }
      if (nextYear < 1970) {
        nextYear = 1970;
      }
      setPickerYear(nextYear);

      // Điều chỉnh pickerDay đề phòng nhuận/không nhuận tháng 2
      const maxDaysInNewYear = getDaysInMonth(pickerMonth, nextYear);
      if (pickerDay > maxDaysInNewYear) {
        setPickerDay(maxDaysInNewYear);
      }
    }
  };

  const handleSave = async () => {
    setErrors({});
    setGeneralError(null);
    clearError();

    const amount = parseAmountInput(amountStr);
    const payload = {
      amount,
      categoryId: selectedCategoryId,
      date: dateStr,
      note: note.trim() === '' ? null : note.trim(),
    };

    const validation = expenseValidationSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await createExpense(payload);
      } else {
        if (initialExpense) {
          await updateExpense(initialExpense.id, payload);
        }
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu chi tiêu.';
      setGeneralError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const displayError = generalError || storeError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕ Hủy</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Ghi Chi Tiêu' : 'Sửa Chi Tiêu'}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {displayError ? (
            <GlassCard style={styles.errorCard}>
              <Text style={styles.errorText}>{displayError}</Text>
            </GlassCard>
          ) : null}

          {/* Ô nhập số tiền lớn ở đỉnh */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionLabel}>Số tiền (VND)</Text>
            <View style={styles.amountInputRow}>
              <TextInput
                value={amountStr}
                onChangeText={(text) => {
                  setAmountStr(formatAmountInput(text));
                  if (errors.amount) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.amount;
                      return next;
                    });
                  }
                }}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                style={styles.amountInput}
                editable={!isSaving}
              />
              <Text style={styles.currencySymbol}>₫</Text>
            </View>
            {errors.amount ? (
              <Text style={styles.errorFieldText}>{errors.amount}</Text>
            ) : null}
          </View>

          {/* Lưới chọn Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Danh mục chi tiêu</Text>
            {categories.length === 0 ? (
              <Text style={styles.emptyCategoriesText}>
                Bạn chưa có danh mục chi tiêu. Hãy tạo danh mục hoặc seed dữ liệu test cho tài khoản này.
              </Text>
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isActive = selectedCategoryId === cat.id;
                  const emoji = getCategoryEmoji(cat.name);
                  const activeColor = cat.color || theme.colors.primary;
                  const bgColor = isActive ? getCategoryBgColor(activeColor) : theme.colors.surfaceGlass;

                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        if (isSaving) {
                          return;
                        }
                        setSelectedCategoryId(cat.id);
                        if (errors.categoryId) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.categoryId;
                            return next;
                          });
                        }
                      }}
                      style={[
                        styles.categoryCard,
                        { backgroundColor: bgColor },
                        isActive ? { borderColor: activeColor, borderWidth: 1.5 } : null,
                      ]}
                    >
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.categoryName,
                          isActive ? { color: theme.colors.textPrimary, fontWeight: theme.typography.weights.semibold } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {errors.categoryId ? (
              <Text style={styles.errorFieldText}>{errors.categoryId}</Text>
            ) : null}
          </View>

          {/* Bộ chọn Ngày Custom */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ngày chi tiêu</Text>
            <GlassCard style={styles.dateSelectorCard}>
              <View style={styles.dateHeaderRow}>
                <Text style={styles.dateLabel}>Ngày đã chọn:</Text>
                <Text style={styles.dateValue}>{formatDateToVietnamese(dateStr)}</Text>
              </View>

              <View style={styles.quickDateButtonsRow}>
                <Pressable
                  onPress={() => {
                    if (!isSaving) {
                      handleQuickDateSelect('today');
                    }
                  }}
                  style={styles.quickDateButton}
                >
                  <Text style={styles.quickDateButtonText}>Hôm nay</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!isSaving) {
                      handleQuickDateSelect('yesterday');
                    }
                  }}
                  style={styles.quickDateButton}
                >
                  <Text style={styles.quickDateButtonText}>Hôm qua</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!isSaving) {
                      handleOpenCustomDatePicker();
                    }
                  }}
                  style={[styles.quickDateButton, styles.customDatePickerButton]}
                >
                  <Text style={styles.quickDateButtonText}>Ngày khác...</Text>
                </Pressable>
              </View>
            </GlassCard>
            {errors.date ? (
              <Text style={styles.errorFieldText}>{errors.date}</Text>
            ) : null}
          </View>

          {/* Ô nhập ghi chú */}
          <View style={styles.section}>
            <GlassInput
              label="Ghi chú (Tùy chọn)"
              value={note}
              onChangeText={(text) => {
                setNote(text);
              }}
              placeholder="Nhập ghi chú chi tiết..."
              editable={!isSaving}
            />
          </View>

          {/* Nút lưu */}
          <View style={styles.submitSection}>
            <GlassButton
              title={mode === 'create' ? 'Tạo Chi Tiêu' : 'Lưu Thay Đổi'}
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving || categories.length === 0}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Custom Date Picker */}
      <Modal
        visible={isDatePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsDatePickerVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.pickerModalContainer}>
            <Text style={styles.pickerModalTitle}>Chọn Ngày Chi Tiêu</Text>

            <View style={styles.pickerColumnsRow}>
              {/* Ngày */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Ngày</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('day', 'up');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▲</Text>
                </Pressable>
                <Text style={styles.pickerValueText}>{String(pickerDay).padStart(2, '0')}</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('day', 'down');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▼</Text>
                </Pressable>
              </View>

              {/* Tháng */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Tháng</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('month', 'up');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▲</Text>
                </Pressable>
                <Text style={styles.pickerValueText}>{String(pickerMonth).padStart(2, '0')}</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('month', 'down');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▼</Text>
                </Pressable>
              </View>

              {/* Năm */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Năm</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('year', 'up');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▲</Text>
                </Pressable>
                <Text style={styles.pickerValueText}>{pickerYear}</Text>
                <Pressable
                  onPress={() => {
                    adjustPickerDate('year', 'down');
                  }}
                  style={styles.adjustButton}
                >
                  <Text style={styles.adjustButtonText}>▼</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.pickerModalActions}>
              <GlassButton
                title="Hủy"
                variant="secondary"
                onPress={() => {
                  setIsDatePickerVisible(false);
                }}
                style={styles.modalCancelBtn}
              />
              <GlassButton
                title="Xác nhận"
                onPress={handleConfirmCustomDate}
                style={styles.modalConfirmBtn}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGlass,
  },
  backButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerRightPlaceholder: {
    width: 50,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  errorCard: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.error,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.borderGlass,
    paddingHorizontal: theme.spacing.md,
    width: '85%',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xs,
    minWidth: 120,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginLeft: 6,
  },
  errorFieldText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.xs,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  emptyCategoriesText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
    lineHeight: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryCard: {
    width: '30%',
    height: 75,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  dateSelectorCard: {
    padding: theme.spacing.md,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  dateValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  quickDateButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  quickDateButton: {
    flex: 1,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.borderGlass,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDatePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  quickDateButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
  },
  submitSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  saveButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: theme.spacing.lg,
  },
  pickerModalContainer: {
    width: '90%',
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: '#1A2234',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerModalTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  pickerColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  pickerColumn: {
    alignItems: 'center',
    width: 70,
  },
  pickerColumnLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
  },
  adjustButton: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  adjustButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  pickerValueText: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginVertical: theme.spacing.sm,
  },
  pickerModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalConfirmBtn: {
    flex: 1,
  },
});
