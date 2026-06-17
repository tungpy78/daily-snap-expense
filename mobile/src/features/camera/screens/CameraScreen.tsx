import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../../theme/theme';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';

interface CameraScreenProps {
  onClose: () => void;
}

interface PhotoInfo {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const [originalPhoto, setOriginalPhoto] = useState<PhotoInfo | null>(null);
  const [compressedPhoto, setCompressedPhoto] = useState<PhotoInfo | null>(null);

  const cameraRef = useRef<CameraView>(null);

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

  // Màn hình hiển thị preview ảnh sau nén và so sánh
  if (originalPhoto && compressedPhoto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>✕ Đóng</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Kết Quả Nén Ảnh</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.previewContainer}>
          <Image
            source={{ uri: compressedPhoto.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 So Sánh Thông Số</Text>
          
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

          <View style={styles.previewActions}>
            <GlassButton
              title="Chụp lại"
              variant="secondary"
              onPress={handleRetake}
              style={styles.retakeBtn}
            />
            <GlassButton
              title="Đồng ý"
              onPress={onClose}
              style={styles.confirmBtn}
            />
          </View>
        </GlassCard>
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
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    margin: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
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
  previewActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  retakeBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
