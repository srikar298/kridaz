import { jest } from '@jest/globals';

// 1. Mock AWS S3 client
const sendMock = jest.fn();
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: sendMock
  })),
  PutObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, type: 'PutObjectCommand' })),
  DeleteObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, type: 'DeleteObjectCommand' }))
}));

// 2. Mock Sharp
const toBufferMock = jest.fn().mockResolvedValue(Buffer.from('resized'));
const webpMock = jest.fn().mockReturnValue({ toBuffer: toBufferMock });
const resizeMock = jest.fn().mockReturnValue({ webp: webpMock });
const sharpMock = jest.fn().mockReturnValue({ resize: resizeMock });

jest.unstable_mockModule('sharp', () => ({
  default: sharpMock
}));

// 3. Mock Logger
jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('r2Upload Unit Tests', () => {
  let r2Upload;

  beforeAll(async () => {
    // Import dynamically after mocks are set
    r2Upload = await import('../utils/r2Upload.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadToR2 Edge Cases', () => {
    it('should throw error if buffer is empty', async () => {
      await expect(r2Upload.uploadToR2(null)).rejects.toThrow("File buffer is empty");
    });

    it('should upload original and variants for normal image (image/jpeg)', async () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff]); // Fake JPEG buffer
      const url = await r2Upload.uploadToR2(buffer, 'test-folder', 'image/jpeg');
      
      expect(url).toContain('test-folder/');
      // Should call S3 send 3 times (Original, 800px variant, 400px variant)
      expect(sendMock).toHaveBeenCalledTimes(3);
      
      const calls = sendMock.mock.calls;
      expect(calls[0][0].ContentType).toBe('image/jpeg'); // Original
      expect(calls[1][0].Key).toMatch(/_800\.webp$/);       // Medium variant
      expect(calls[2][0].Key).toMatch(/_400\.webp$/);       // Thumbnail variant
    });

    it('should NOT create variants for GIF images (image/gif)', async () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46]); // Fake GIF buffer
      await r2Upload.uploadToR2(buffer, 'test-folder', 'image/gif');
      
      // Should only upload original
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].ContentType).toBe('image/gif');
    });

    it('should NOT create variants for non-images (application/pdf)', async () => {
      const buffer = Buffer.from('fake pdf');
      await r2Upload.uploadToR2(buffer, 'test-folder', 'application/pdf');
      
      // Should only upload original
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].ContentType).toBe('application/pdf');
    });

    it('should gracefully handle sharp processing errors without failing original upload', async () => {
      const buffer = Buffer.from('corrupted image');
      // Force sharp mock to throw
      toBufferMock.mockRejectedValueOnce(new Error("Sharp parsing error"));
      
      const url = await r2Upload.uploadToR2(buffer, 'test-folder', 'image/png');
      
      expect(url).toBeDefined();
      // Should only call S3 send once (for the original), variants fail
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].ContentType).toBe('image/png');
    });
  });

  describe('deleteFromR2 Edge Cases', () => {
    it('should ignore urls that do not match the R2 public url format', async () => {
      await r2Upload.deleteFromR2('https://some-other-domain.com/image.jpg');
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should issue delete commands for original and both variants when valid R2 url provided', async () => {
      const publicUrl = process.env.R2_PUBLIC_DEV_URL || 'https://pub-mock.r2.dev';
      await r2Upload.deleteFromR2(`${publicUrl}/test-folder/123-abc.png`);
      
      // Should attempt 3 deletions (original, _400, _800)
      expect(sendMock).toHaveBeenCalledTimes(3);
      
      const calls = sendMock.mock.calls;
      expect(calls[0][0].Key).toBe('test-folder/123-abc.png');
      expect(calls[1][0].Key).toBe('test-folder/123-abc.png_400.webp');
      expect(calls[2][0].Key).toBe('test-folder/123-abc.png_800.webp');
    });
  });
});
