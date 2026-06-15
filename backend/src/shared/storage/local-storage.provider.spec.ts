import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { LocalStorageProvider } from './local-storage.provider';
import { AppError } from '../utils/appError';

describe('LocalStorageProvider Unit Tests', () => {
  let provider: LocalStorageProvider;
  const testFolder = 'test-temp-folder';
  const uploadRoot = path.resolve(process.cwd(), 'public/uploads');
  const testUploadDir = path.join(uploadRoot, testFolder);
  const createdUrls: string[] = [];

  beforeAll(() => {
    provider = new LocalStorageProvider();
    process.env.BACKEND_URL = 'http://localhost:5001';
  });

  afterAll(() => {
    // Clean up all test files and directory to ensure no garbage is left on disk
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  const getMockFile = (originalname = 'test.png', mimetype = 'image/png'): Express.Multer.File => {
    return {
      fieldname: 'image',
      originalname,
      encoding: '7bit',
      mimetype,
      buffer: Buffer.from('mock-image-buffer-data'),
      size: 22,
      destination: '',
      filename: '',
      path: '',
      stream: Readable.from([]),
    };
  };

  describe('uploadImage', () => {
    it('should successfully upload an image and return absolute URL', async () => {
      const mockFile = getMockFile('avatar.png', 'image/png');
      const imageUrl = await provider.uploadImage(mockFile, testFolder);
      createdUrls.push(imageUrl);

      expect(imageUrl).toContain('http://localhost:5001/public/uploads/test-temp-folder/');
      expect(imageUrl.endsWith('.png')).toBe(true);

      // Verify file exists on disk
      const fileName = path.basename(imageUrl);
      const filePath = path.join(testUploadDir, fileName);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath).toString()).toBe('mock-image-buffer-data');
    });

    it('should reject file upload when extension is not allowed', async () => {
      const mockFile = getMockFile('document.txt', 'text/plain');

      await expect(provider.uploadImage(mockFile, testFolder)).rejects.toThrow(
        new AppError(
          'Định dạng ảnh không hợp lệ. Chỉ cho phép .jpg, .jpeg, .png.',
          400,
          'INVALID_FILE_TYPE',
        ),
      );
    });

    it('should block path traversal directory folderPath containing ..', async () => {
      const mockFile = getMockFile('avatar.png', 'image/png');

      await expect(provider.uploadImage(mockFile, '../dangerous-path')).rejects.toThrow(
        new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH'),
      );
    });

    it('should block absolute directory folderPath', async () => {
      const mockFile = getMockFile('avatar.png', 'image/png');
      const absolutePath = path.resolve(process.cwd(), 'dangerous');

      await expect(provider.uploadImage(mockFile, absolutePath)).rejects.toThrow(
        new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH'),
      );
    });

    it('should block backslash Windows path folderPath', async () => {
      const mockFile = getMockFile('avatar.png', 'image/png');

      await expect(provider.uploadImage(mockFile, 'abc\\def')).rejects.toThrow(
        new AppError('Đường dẫn thư mục không hợp lệ.', 400, 'INVALID_UPLOAD_PATH'),
      );
    });

    it('should block directory folderPath with invalid characters', async () => {
      const mockFile = getMockFile('avatar.png', 'image/png');

      await expect(provider.uploadImage(mockFile, 'test$folder')).rejects.toThrow(
        new AppError('Đường dẫn thư mục chứa ký tự không hợp lệ.', 400, 'INVALID_UPLOAD_PATH'),
      );
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete an existing image', async () => {
      const mockFile = getMockFile('delete-me.jpg', 'image/jpeg');
      const imageUrl = await provider.uploadImage(mockFile, testFolder);

      // Verify file exists first
      const fileName = path.basename(imageUrl);
      const filePath = path.join(testUploadDir, fileName);
      expect(fs.existsSync(filePath)).toBe(true);

      // Delete the image
      await provider.deleteImage(imageUrl);

      // Verify file is gone
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should not crash when deleting a non-existent image file', async () => {
      const nonExistentUrl = 'http://localhost:5001/public/uploads/test-temp-folder/not-found.png';

      await expect(provider.deleteImage(nonExistentUrl)).resolves.not.toThrow();
    });

    it('should refuse to delete outside of the uploads directory (path traversal defense)', async () => {
      // imageUrl targeting a path traversal location
      const maliciousUrl = 'http://localhost:5001/public/uploads/../../package.json';

      // package.json exists, but delete should refuse to touch it
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      await provider.deleteImage(maliciousUrl);

      // package.json must still exist
      expect(fs.existsSync(packageJsonPath)).toBe(true);
    });
  });
});
