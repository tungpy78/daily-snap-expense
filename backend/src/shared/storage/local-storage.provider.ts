import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageService } from './storage.service';
import { AppError } from '../utils/appError';

export class LocalStorageProvider implements StorageService {
  private readonly uploadRoot: string;

  constructor() {
    this.uploadRoot = path.resolve(process.cwd(), 'public/uploads');
  }

  /**
   * Validates and sanitizes a folder path to prevent Path Traversal attacks.
   * Throws HTTP 400 AppError on invalid folder paths.
   */
  private sanitizeFolderPath(folderPath: string): string {
    // 1. Block backslashes Windows '\'
    if (folderPath.includes('\\')) {
      throw new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH');
    }

    // 2. Block parent directory traversal '..'
    if (folderPath.includes('..')) {
      throw new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH');
    }

    // 3. Block absolute paths
    if (path.isAbsolute(folderPath) || folderPath.startsWith('/')) {
      throw new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH');
    }

    // 4. Match only safe characters (a-z, A-Z, 0-9, _, -, /)
    const safeRegex = /^[a-zA-Z0-9_/-]+$/;
    if (!safeRegex.test(folderPath)) {
      throw new AppError('Đường dẫn thư mục chứa ký tự không hợp lệ.', 400, 'INVALID_UPLOAD_PATH');
    }

    // 5. Verify resolved target path starts with uploadRoot
    const targetDir = path.resolve(this.uploadRoot, folderPath);
    if (!targetDir.startsWith(this.uploadRoot)) {
      throw new AppError(
        'Đường dẫn thư mục nằm ngoài phạm vi cho phép.',
        400,
        'INVALID_UPLOAD_PATH',
      );
    }

    return folderPath;
  }

  /**
   * Uploads an image using memory buffer, saving it to disk,
   * and returns the absolute URL.
   */
  public async uploadImage(file: Express.Multer.File, folderPath: string): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];

    if (!allowedExtensions.includes(ext)) {
      throw new AppError(
        'Định dạng ảnh không hợp lệ. Chỉ cho phép .jpg, .jpeg, .png.',
        400,
        'INVALID_FILE_TYPE',
      );
    }

    const sanitizedFolder = this.sanitizeFolderPath(folderPath);
    const fileName = `${crypto.randomUUID()}${ext}`;

    const targetDir = path.resolve(this.uploadRoot, sanitizedFolder);

    // Ensure upload directory exists
    fs.mkdirSync(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, fileName);
    fs.writeFileSync(targetFilePath, file.buffer);

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;

    return `${baseUrl}/public/uploads/${sanitizedFolder}/${fileName}`;
  }

  /**
   * Deletes an image file by its URL.
   * Prevents deletion of files outside of the public/uploads directory.
   */
  public async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl || imageUrl.trim() === '') {
      return;
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;

    let relativePath = '';
    if (imageUrl.startsWith(baseUrl)) {
      relativePath = imageUrl.slice(baseUrl.length);
    } else if (imageUrl.startsWith('/public/uploads')) {
      relativePath = imageUrl;
    } else if (imageUrl.startsWith('public/uploads')) {
      relativePath = '/' + imageUrl;
    } else {
      // Ignore invalid image URL safely
      console.warn(`[Storage] Skip deleting invalid image URL: ${imageUrl}`);
      return;
    }

    const cleanRelativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const targetFilePath = path.resolve(process.cwd(), cleanRelativePath);

    // Security guard: Check resolved path is strictly inside the upload root directory
    if (!targetFilePath.startsWith(this.uploadRoot)) {
      console.warn(`[Storage] Prevented path traversal delete attempt: ${targetFilePath}`);
      return;
    }

    try {
      if (fs.existsSync(targetFilePath)) {
        await fs.promises.unlink(targetFilePath);
      }
    } catch (error) {
      console.error(`[Storage] Failed to delete file at ${targetFilePath}:`, error);
    }
  }
}
