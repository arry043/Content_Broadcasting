const request = require('supertest');
const app = require('../server');
const { User } = require('../src/models');
const authService = require('../src/services/auth.service');

// Mock the auth service to prevent actual DB calls during simple API tests
jest.mock('../src/services/auth.service');
// Mock uuid to prevent ESM syntax error in CommonJS jest
jest.mock('uuid', () => ({ v4: () => 'fake-uuid' }));

describe('API Endpoints Testing', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 and server running message', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'password123' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Email is required');
    });

    it('should return 200 and token on successful login', async () => {
      // Mock successful login response
      authService.loginUser.mockResolvedValue({
        token: 'fake-jwt-token',
        user: { id: '1', name: 'Test', email: 'test@school.com', role: 'teacher' }
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@school.com', password: 'password123' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('fake-jwt-token');
    });
  });

  describe('GET /api/v1/content/live/:teacherId', () => {
    it('should pass through rate limiter and return no content for invalid teacher', async () => {
      // Assuming DB fails or returns null for teacher
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      const res = await request(app).get('/api/v1/content/live/fake-uuid');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.available).toBe(false);
      expect(res.body.message).toBe('No content available');
    });
  });
});
