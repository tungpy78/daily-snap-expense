import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { LocalStorageProvider } from './local-storage.provider';
import { AppError } from '../utils/appError';

describe('Snap Upload via LocalStorageProvider Unit Tests', () => {
  let provider: LocalStorageProvider;
  const folderPath = 'snaps';
  const uploadRoot = path.resolve(process.cwd(), 'public/uploads');
  const snapsUploadDir = path.join(uploadRoot, folderPath);
  const createdUrls: string[] = [];

  beforeAll(() => {
    provider = new LocalStorageProvider();
    process.env.BACKEND_URL = 'http://localhost:5001';
  });

  afterAll(async () => {
    // Clean up only the specific uploaded test files to ensure no garbage is left
    for (const url of createdUrls) {
      await provider.deleteImage(url);
    }
  });

  const getMockFile = (
    originalname: string,
    mimetype: string,
    bufferContent = 'mock-snap-buffer-data',
  ): Express.Multer.File => {
    const buffer = Buffer.from(bufferContent);
    return {
      fieldname: 'image',
      originalname,
      encoding: '7bit',
      mimetype,
      buffer,
      size: buffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: Readable.from([]),
    };
  };

  it('should successfully upload a .jpg image and return a valid static URL', async () => {
    const mockFile = getMockFile('test-snap.jpg', 'image/jpeg');
    const imageUrl = await provider.uploadImage(mockFile, folderPath);
    createdUrls.push(imageUrl);

    expect(imageUrl).toContain('/public/uploads/snaps/');
    expect(imageUrl.endsWith('.jpg')).toBe(true);

    const fileName = path.basename(imageUrl);
    const filePath = path.join(snapsUploadDir, fileName);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath).toString()).toBe('mock-snap-buffer-data');
  });

  it('should successfully upload a .jpeg image and return a valid static URL', async () => {
    const mockFile = getMockFile('test-snap.jpeg', 'image/jpeg');
    const imageUrl = await provider.uploadImage(mockFile, folderPath);
    createdUrls.push(imageUrl);

    expect(imageUrl).toContain('/public/uploads/snaps/');
    expect(imageUrl.endsWith('.jpeg')).toBe(true);

    const fileName = path.basename(imageUrl);
    const filePath = path.join(snapsUploadDir, fileName);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath).toString()).toBe('mock-snap-buffer-data');
  });

  it('should successfully upload a .png image and return a valid static URL', async () => {
    const mockFile = getMockFile('test-snap.png', 'image/png');
    const imageUrl = await provider.uploadImage(mockFile, folderPath);
    createdUrls.push(imageUrl);

    expect(imageUrl).toContain('/public/uploads/snaps/');
    expect(imageUrl.endsWith('.png')).toBe(true);

    const fileName = path.basename(imageUrl);
    const filePath = path.join(snapsUploadDir, fileName);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath).toString()).toBe('mock-snap-buffer-data');
  });

  it('should delete uploaded image successfully', async () => {
    const mockFile = getMockFile('test-delete.png', 'image/png');
    const imageUrl = await provider.uploadImage(mockFile, folderPath);

    const fileName = path.basename(imageUrl);
    const filePath = path.join(snapsUploadDir, fileName);
    expect(fs.existsSync(filePath)).toBe(true);

    await provider.deleteImage(imageUrl);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('should reject file upload when extension is not allowed (.txt)', async () => {
    const mockFile = getMockFile('test-file.txt', 'text/plain');

    await expect(provider.uploadImage(mockFile, folderPath)).rejects.toThrow(
      new AppError(
        'Định dạng ảnh không hợp lệ. Chỉ cho phép .jpg, .jpeg, .png.',
        400,
        'INVALID_FILE_TYPE',
      ),
    );
  });
});
