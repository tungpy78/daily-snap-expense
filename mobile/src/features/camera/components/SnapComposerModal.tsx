import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { GlassInput } from '../../../components/GlassInput';
import { useExpenseStore } from '../../expenses/store/useExpenseStore';
import { useSnapStore } from '../store/useSnapStore';
import { QuickExpenseDraft } from '../types/snap.types';

export type SnapComposerModalProps = {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSaved: () => void;
};

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

const quickExpenseSchema = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0.'),
  categoryId: z.string().uuid('Vui lòng chọn danh mục hợp lệ.'),
  note: z.string().trim().max(1000, 'Ghi chú không được vượt quá 1000 ký tự.').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD.'),
});

export const SnapComposerModal: React.FC<SnapComposerModalProps> = ({
  visible,
  imageUri,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  
  // States cho Snap Preview & Attach details
  const [caption, setCaption] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [attachedExpenses, setAttachedExpenses] = useState<QuickExpenseDraft[]>([]);
  
  // States cho BottomSheet custom
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { categories, fetchCategories } = useExpenseStore();
  const { createSnap, isLoading: isSavingSnap, error: storeError, clearError } = useSnapStore();

  useEffect(() => {
    if (categories.length === 0) {
      void fetchCategories();
    }
  }, [categories, fetchCategories]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === '') {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleCancel = () => {
    setCaption('');
    setIsPrivate(true);
    setAttachedExpenses([]);
    clearError();
    onClose();
  };

  const handleAddExpense = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const numAmount = parseAmountInput(amountStr);
    const draftPayload = {
      amount: numAmount,
      categoryId: selectedCategoryId,
      note: note.trim() === '' ? undefined : note.trim(),
      date: todayStr,
    };

    const result = quickExpenseSchema.safeParse(draftPayload);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);

        if (fieldName === 'amount') {
          nextErrors.amount = issue.message;
        }

        if (fieldName === 'categoryId') {
          nextErrors.categoryId = issue.message;
        }

        if (fieldName === 'date') {
          nextErrors.date = issue.message;
        }
      });

      setErrors(nextErrors);
      return;
    }

    const categoryObj = categories.find((cat) => {
      return cat.id === selectedCategoryId;
    });
    const categoryName = categoryObj ? categoryObj.name : 'Unknown';

    const newExpense: QuickExpenseDraft = {
      amount: numAmount,
      categoryId: selectedCategoryId,
      categoryName,
      note: note.trim() === '' ? null : note.trim(),
      date: todayStr,
    };

    setAttachedExpenses((prev) => {
      return [...prev, newExpense];
    });
    
    // Reset BottomSheet state
    setAmountStr('');
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    } else {
      setSelectedCategoryId('');
    }
    setNote('');
    setErrors({});
    setIsExpenseModalOpen(false);
  };

  const handleRemoveExpense = (index: number) => {
    setAttachedExpenses((prev) => {
      return prev.filter((_, i) => {
        return i !== index;
      });
    });
  };

  const handleSaveSnap = async () => {
    if (!imageUri) {
      return;
    }

    try {
      await createSnap({
        uri: imageUri,
        caption: caption.trim() === '' ? null : caption.trim(),
        isPrivate,
        expenses: attachedExpenses,
      });

      // Refresh expense list
      await useExpenseStore.getState().refresh();

      // Reset local state
      setCaption('');
      setIsPrivate(true);
      setAttachedExpenses([]);
      clearError();

      onSaved();
    } catch (err) {
      console.log('Lỗi khi lưu snap:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.headerBtn} disabled={isSavingSnap}>
            <Text style={styles.headerBtnText}>✕ Đóng</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Xem Trước & Đăng Snap</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {/* Image Preview */}
            <View style={styles.previewContainerMini}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImageMini}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            {/* Caption Input */}
            <GlassCard style={styles.formCard}>
              <Text style={styles.inputLabel}>Caption hình ảnh</Text>
              <GlassInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Nhập mô tả cho khoảnh khắc này..."
                multiline={true}
                numberOfLines={3}
                editable={!isSavingSnap}
              />

              {/* Privacy/Visibility Selector */}
              <View style={styles.privacyRow}>
                <Text style={styles.inputLabel}>Quyền riêng tư</Text>
                <View style={styles.privacyButtons}>
                  <Pressable
                    onPress={() => {
                      if (!isSavingSnap) {
                        setIsPrivate(true);
                      }
                    }}
                    style={[
                      styles.privacyBtn,
                      isPrivate && styles.privacyBtnActive,
                    ]}
                  >
                    <Text style={[styles.privacyBtnText, isPrivate && styles.privacyBtnTextActive]}>
                      🔒 Riêng tư
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (!isSavingSnap) {
                        setIsPrivate(false);
                      }
                    }}
                    style={[
                      styles.privacyBtn,
                      !isPrivate && styles.privacyBtnActive,
                    ]}
                  >
                    <Text style={[styles.privacyBtnText, !isPrivate && styles.privacyBtnTextActive]}>
                      👥 Bạn bè
                    </Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>

            {/* Attached Expenses List */}
            <GlassCard style={styles.expensesCard}>
              <View style={styles.expensesHeader}>
                <Text style={styles.expensesTitle}>💰 Chi tiêu đính kèm</Text>
                <Pressable
                  onPress={() => {
                    if (!isSavingSnap) {
                      setIsExpenseModalOpen(true);
                    }
                  }}
                  style={styles.addExpenseBtn}
                  disabled={isSavingSnap}
                >
                  <Text style={styles.addExpenseBtnText}>➕ Đính kèm</Text>
                </Pressable>
              </View>

              {attachedExpenses.length === 0 ? (
                <Text style={styles.noExpensesText}>Chưa có chi tiêu nào được đính kèm</Text>
              ) : (
                <View style={styles.attachedExpensesList}>
                  {attachedExpenses.map((exp, index) => {
                    return (
                      <View key={index} style={styles.attachedExpenseItem}>
                        <View style={styles.attachedExpenseLeft}>
                          <Text style={styles.attachedExpenseEmoji}>
                            {getCategoryEmoji(exp.categoryName)}
                          </Text>
                          <View style={styles.attachedExpenseDetails}>
                            <Text style={styles.attachedExpenseCategory}>
                              {exp.categoryName}
                            </Text>
                            {exp.note ? (
                              <Text style={styles.attachedExpenseNote} numberOfLines={1}>
                                {exp.note}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.attachedExpenseRight}>
                          <Text style={styles.attachedExpenseAmount}>
                            {formatAmountInput(exp.amount.toString())} đ
                          </Text>
                          <Pressable
                            onPress={() => {
                              if (!isSavingSnap) {
                                handleRemoveExpense(index);
                              }
                            }}
                            style={styles.removeExpenseBtn}
                            disabled={isSavingSnap}
                          >
                            <Text style={styles.removeExpenseText}>✕</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </GlassCard>

            {/* Error Message */}
            {storeError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{storeError}</Text>
              </View>
            ) : null}

            {/* Bottom Actions */}
            <View style={styles.actionButtons}>
              <GlassButton
                title="Chụp lại"
                variant="secondary"
                onPress={handleCancel}
                style={styles.retakeBtn}
                disabled={isSavingSnap}
              />
              <GlassButton
                title={isSavingSnap ? "Đang lưu..." : "Lưu Snap & Chi tiêu"}
                onPress={handleSaveSnap}
                style={styles.saveBtn}
                disabled={isSavingSnap}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Quick Expense BottomSheet Custom */}
        <Modal
          visible={isExpenseModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setIsExpenseModalOpen(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                setIsExpenseModalOpen(false);
              }}
            />
            <View style={styles.modalPanel}>
              <GlassCard style={styles.modalCard}>
                <Text style={styles.modalTitle}>➕ Đính kèm chi tiêu nhanh</Text>
                
                {/* Amount Input */}
                <Text style={styles.inputLabel}>Số tiền (đ)</Text>
                <GlassInput
                  value={amountStr}
                  onChangeText={(val) => {
                    setAmountStr(formatAmountInput(val));
                    if (errors.amount) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.amount;
                        return next;
                      });
                    }
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.amount}
                />

                {/* Category Grid */}
                <Text style={styles.inputLabel}>Danh mục</Text>
                {errors.categoryId ? (
                  <Text style={styles.errorText}>{errors.categoryId}</Text>
                ) : null}
                {categories.length === 0 ? (
                  <Text style={styles.noCategoriesText}>Chưa có danh mục để chọn</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    <View style={styles.categoryGrid}>
                      {categories.map((cat) => {
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => {
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
                              styles.categoryItem,
                              {
                                backgroundColor: getCategoryBgColor(cat.color),
                                borderColor: isSelected ? cat.color || theme.colors.primary : 'transparent',
                                borderWidth: isSelected ? 2 : 1,
                              },
                            ]}
                          >
                            <Text style={styles.categoryEmoji}>{getCategoryEmoji(cat.name)}</Text>
                            <Text style={[styles.categoryName, isSelected && { color: cat.color || theme.colors.textPrimary }]}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* Note Input */}
                <Text style={styles.inputLabel}>Ghi chú (tùy chọn)</Text>
                <GlassInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ví dụ: Mua trà sữa, Ăn trưa..."
                />

                <View style={styles.modalActions}>
                  <GlassButton
                    title="Hủy"
                    variant="secondary"
                    onPress={() => {
                      setIsExpenseModalOpen(false);
                    }}
                    style={styles.modalBtn}
                  />
                  <GlassButton
                    title="Thêm khoản chi"
                    onPress={handleAddExpense}
                    style={styles.modalBtn}
                  />
                </View>
              </GlassCard>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
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
  headerBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  headerBtnText: {
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
    width: 60,
  },
  previewContainerMini: {
    height: 220,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  previewImageMini: {
    width: '100%',
    height: '100%',
  },
  scrollContentContainer: {
    paddingBottom: theme.spacing.xl * 2,
  },
  formCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  privacyRow: {
    marginTop: theme.spacing.md,
  },
  privacyButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  privacyBtn: {
    flex: 1,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyBtnActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: theme.colors.primary,
  },
  privacyBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
  },
  privacyBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  expensesCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  expensesTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  addExpenseBtn: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  addExpenseBtnText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  noExpensesText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  attachedExpensesList: {
    gap: theme.spacing.sm,
  },
  attachedExpenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  attachedExpenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  attachedExpenseEmoji: {
    fontSize: 20,
  },
  attachedExpenseDetails: {
    flex: 1,
  },
  attachedExpenseCategory: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  attachedExpenseNote: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  attachedExpenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  attachedExpenseAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  removeExpenseBtn: {
    padding: theme.spacing.xs,
  },
  removeExpenseText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  retakeBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.xs,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    width: '100%',
    maxHeight: '80%',
  },
  modalCard: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(23, 23, 33, 0.95)',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  categoryScroll: {
    maxHeight: 100,
    marginBottom: theme.spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  categoryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  noCategoriesText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontStyle: 'italic',
    marginVertical: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalBtn: {
    flex: 1,
  },
});
