import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { z } from 'zod';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { GlassInput } from '../../../components/GlassInput';
import { useExpenseStore } from '../../expenses/store/useExpenseStore';
import { useSnapStore } from '../store/useSnapStore';
import { QuickExpenseDraft } from '../types/snap.types';

interface CameraScreenProps {
  onClose: () => void;
  onCreated?: () => void;
}

interface PhotoInfo {
  uri: string;
  width: number;
  height: number;
  size: number;
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

export const CameraScreen: React.FC<CameraScreenProps> = ({ onClose, onCreated }) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const [originalPhoto, setOriginalPhoto] = useState<PhotoInfo | null>(null);
  const [compressedPhoto, setCompressedPhoto] = useState<PhotoInfo | null>(null);

  const cameraRef = useRef<CameraView>(null);

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

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
    } catch (err) {
      console.log('Lỗi yêu cầu quyền camera:', err);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.log('Không thể mở Settings:', err);
    }
  };

  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.log('Không thể đo dung lượng file:', error);
      return 0;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) {
      return 'Không xác định';
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const handleCapture = async () => {
    if (isCapturing || isCompressing || !cameraRef.current) {
      return;
    }

    try {
      setIsCapturing(true);
      const options = { quality: 1, skipProcessing: false };
      const photo = await cameraRef.current.takePictureAsync(options);
      
      if (photo) {
        const origSize = await getFileSize(photo.uri);
        setOriginalPhoto({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          size: origSize,
        });

        await handleCompress(photo.uri, photo.width, photo.height);
      }
    } catch (error) {
      console.log('Lỗi khi chụp ảnh:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCompress = async (uri: string, width: number, height: number) => {
    try {
      setIsCompressing(true);
      
      const actions = [];
      const maxSize = 1200;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          actions.push({ resize: { width: maxSize } });
        } else {
          actions.push({ resize: { height: maxSize } });
        }
      }

      // Bắt đầu nén chất lượng ở mức 0.8
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const compSize = await getFileSize(manipulated.uri);
      
      setCompressedPhoto({
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        size: compSize,
      });
    } catch (error) {
      console.log('Lỗi khi nén ảnh:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRetake = () => {
    setOriginalPhoto(null);
    setCompressedPhoto(null);
    setCaption('');
    setIsPrivate(true);
    setAttachedExpenses([]);
    clearError();
  };

  const toggleFacing = () => {
    setFacing((prev) => {
      return prev === 'back' ? 'front' : 'back';
    });
  };

  const toggleFlash = () => {
    setFlash((prev) => {
      return prev === 'off' ? 'on' : 'off';
    });
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
        const fieldName = issue.path[0];

        if (fieldName === 'amount') {
          nextErrors.amount = issue.message;
          return;
        }

        if (fieldName === 'categoryId') {
          nextErrors.categoryId = issue.message;
          return;
        }

        if (fieldName === 'date') {
          nextErrors.date = issue.message;
          return;
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
    if (!compressedPhoto) {
      return;
    }

    try {
      await createSnap({
        uri: compressedPhoto.uri,
        caption: caption.trim() === '' ? null : caption.trim(),
        isPrivate,
        expenses: attachedExpenses,
      });

      // Refresh expense list
      await useExpenseStore.getState().refresh();

      // Reset preview state so camera is ready for next shot
      handleRetake();

      // Navigate to Timeline via onCreated callback (set by CameraHomeScreen)
      if (onCreated) {
        onCreated();
      } else {
        onClose();
      }
    } catch (err) {
      console.log('Lỗi khi lưu snap:', err);
    }
  };

  // Màn hình loading quyền
  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang khởi tạo camera...</Text>
      </SafeAreaView>
    );
  }

  // Màn hình chưa cấp quyền
  if (!permission.granted) {
    const isPermanentlyDenied = !permission.canAskAgain;
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <GlassCard style={styles.permissionCard}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Quyền truy cập Camera</Text>
          <Text style={styles.permissionSubtitle}>
            Ứng dụng cần quyền camera để chụp ảnh nhật ký hằng ngày và theo dõi chi tiêu trực quan.
          </Text>
          
          {isPermanentlyDenied ? (
            <View style={styles.actionContainer}>
              <Text style={styles.deniedText}>
                Bạn đã từ chối quyền truy cập camera trước đó. Vui lòng mở Cài đặt của máy để bật lại quyền.
              </Text>
              <GlassButton
                title="Mở Cài đặt hệ thống"
                onPress={handleOpenSettings}
                style={styles.permissionButton}
              />
            </View>
          ) : (
            <GlassButton
              title="Cho phép truy cập"
              onPress={handleRequestPermission}
              style={styles.permissionButton}
            />
          )}

          <GlassButton
            title="Quay lại"
            variant="secondary"
            onPress={onClose}
            style={styles.permissionBackButton}
          />
        </GlassCard>
      </SafeAreaView>
    );
  }

  // Màn hình hiển thị preview ảnh sau nén và so sánh kèm form upload
  if (originalPhoto && compressedPhoto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} disabled={isSavingSnap}>
            <Text style={styles.headerBtnText}>✕ Đóng</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Xem Trước & Đăng Snap</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {/* Image Preview */}
            <View style={styles.previewContainerMini}>
              <Image
                source={{ uri: compressedPhoto.uri }}
                style={styles.previewImageMini}
                resizeMode="contain"
              />
            </View>

            {/* Comparison Details */}
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>📊 So Sánh Thông Số Nén</Text>
              <View style={styles.comparisonTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableHeader}>Thông số</Text>
                  <Text style={styles.tableHeader}>Ảnh gốc</Text>
                  <Text style={styles.tableHeader}>Ảnh nén</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Kích thước</Text>
                  <Text style={styles.tableCell}>{originalPhoto.width}x{originalPhoto.height}</Text>
                  <Text style={styles.tableCell}>{compressedPhoto.width}x{compressedPhoto.height}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Dung lượng</Text>
                  <Text style={styles.tableCell}>{formatSize(originalPhoto.size)}</Text>
                  <Text style={[styles.tableCell, styles.compressedSizeText]}>
                    {formatSize(compressedPhoto.size)}
                  </Text>
                </View>
              </View>
            </GlassCard>

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
                onPress={handleRetake}
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
    );
  }

  // Giao diện Camera chính
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      />
      <View style={[styles.cameraOverlay, { paddingTop: insets.top || theme.spacing.md, paddingBottom: insets.bottom || theme.spacing.lg }]}>
        {/* Header Controls */}
        <View style={styles.topControls}>
          <Pressable onPress={onClose} style={styles.topBtn}>
            <Text style={styles.topBtnText}>✕</Text>
          </Pressable>

          <View style={styles.topRightControls}>
            <Pressable onPress={toggleFlash} style={styles.topBtn}>
              <Text style={styles.topBtnText}>
                {flash === 'on' ? '⚡ Bật' : '⚡ Tắt'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomControls}>
          <Pressable onPress={toggleFacing} style={styles.sideBtn}>
            <Text style={styles.sideBtnText}>🔄</Text>
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing || isCompressing}
            style={({ pressed }) => {
              return [
                styles.captureButtonOuter,
                pressed ? styles.captureButtonPressed : null,
              ];
            }}
          >
            <View style={styles.captureButtonInner}>
              {(isCapturing || isCompressing) ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : null}
            </View>
          </Pressable>

          <View style={styles.sideBtnPlaceholder} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  permissionCard: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  permissionEmoji: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  permissionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  permissionSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  deniedText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  permissionButton: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  permissionBackButton: {
    width: '100%',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  topBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  sideBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnText: {
    fontSize: 20,
  },
  sideBtnPlaceholder: {
    width: 50,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  captureButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  comparisonTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGlass,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableHeader: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  tableCellLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  tableCell: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  compressedSizeText: {
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
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
