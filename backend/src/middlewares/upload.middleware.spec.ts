import express from 'express';
import request from 'supertest';
import { uploadImageMiddleware } from './upload.middleware';
import { errorHandler } from './error.middleware';

// Initialize a separate test Express app to isolate middleware testing
const testApp = express();
testApp.use(express.json());

// Mount the test route using the upload middleware
testApp.post('/test-upload', uploadImageMiddleware('image'), (req, res) => {
  res.status(200).json({
    success: true,
    file: req.file
      ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null,
  });
});

// Register standard global error handler to format errors to JSON
testApp.use(errorHandler);

describe('uploadImageMiddleware Unit Tests', () => {
  describe('POST /test-upload', () => {
    it('should successfully pass when uploading a valid .png image', async () => {
      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', Buffer.from('fake-png-data'), 'avatar.png');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.file).toHaveProperty('originalname', 'avatar.png');
      expect(response.body.file).toHaveProperty('mimetype', 'image/png');
    });

    it('should successfully pass when uploading a valid .jpg image', async () => {
      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', Buffer.from('fake-jpg-data'), 'photo.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.file).toHaveProperty('originalname', 'photo.jpg');
      expect(response.body.file).toHaveProperty('mimetype', 'image/jpeg');
    });

    it('should successfully pass when uploading a valid .jpeg image', async () => {
      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', Buffer.from('fake-jpeg-data'), 'photo.jpeg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.file).toHaveProperty('originalname', 'photo.jpeg');
      expect(response.body.file).toHaveProperty('mimetype', 'image/jpeg');
    });

    it('should return HTTP 400 and INVALID_FILE_TYPE when uploading an invalid file extension (e.g. .txt)', async () => {
      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', Buffer.from('text content'), 'document.txt');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_FILE_TYPE');
      expect(response.body.error.message).toContain('Định dạng ảnh không hợp lệ');
    });

    it('should return HTTP 400 and INVALID_FILE_TYPE when uploading an invalid mimetype (e.g. text/plain)', async () => {
      // Sending a file named fake.png but with text/plain mimetype
      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', Buffer.from('plain text'), {
          filename: 'fake.png',
          contentType: 'text/plain',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_FILE_TYPE');
    });

    it('should return HTTP 400 and FILE_TOO_LARGE when file size exceeds 5MB limit', async () => {
      // Generate large buffer exceeding 5MB (5 * 1024 * 1024 + 1 bytes)
      const largeSize = 5 * 1024 * 1024 + 100;
      const largeBuffer = Buffer.alloc(largeSize);

      const response = await request(testApp)
        .post('/test-upload')
        .attach('image', largeBuffer, 'huge-image.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_TOO_LARGE');
      expect(response.body.error.message).toContain('Kích thước ảnh quá lớn');
    });

    it('should pass successfully without a file, leaving req.file as null (optional upload)', async () => {
      const response = await request(testApp).post('/test-upload').send({}); // Send no multipart file

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.file).toBeNull();
    });
  });
});
