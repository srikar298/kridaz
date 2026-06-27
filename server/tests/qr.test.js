import request from 'supertest';
import app from '../app.js';
import { prisma } from '../config/prisma.js';
import { generateToken } from '../utils/generateJwtToken.js';

describe('QR Code API Endpoints', () => {
  let adminToken;
  let qrCodeId;

  beforeAll(async () => {
    // Generate an admin token for testing
    adminToken = generateToken({ id: 'test-admin-id', role: 'ADMIN' });
  });

  afterAll(async () => {
    // Clean up created QR codes
    if (qrCodeId) {
      await prisma.dynamicQRCode.deleteMany({ where: { id: qrCodeId } });
    }
    await prisma.$disconnect();
  });

  it('should create a new QR code (Admin)', async () => {
    const res = await request(app)
      .post('/api/admin/qr')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test QR Code',
        targetUrl: 'https://example.com',
        fallbackUrl: 'https://example.com/fallback'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    qrCodeId = res.body.data.id;
  });

  it('should retrieve all QR codes (Admin)', async () => {
    const res = await request(app)
      .get('/api/admin/qr')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some(qr => qr.id === qrCodeId)).toBe(true);
  });

  it('should resolve a QR code and redirect (Public)', async () => {
    const res = await request(app)
      .get(`/api/qr/${qrCodeId}`);

    expect(res.statusCode).toEqual(302);
    expect(res.header.location).toBe('https://example.com');
  });

});
