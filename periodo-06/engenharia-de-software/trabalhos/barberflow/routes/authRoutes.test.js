import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from './authRoutes.js';
import { User } from '../packages/user.js';

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Usuário cadastrado com sucesso!');
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    test('should return 400 if email already exists', async () => {
      await User.create({ name: 'Existing', email: 'existing@example.com', password: 'pass' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another',
          email: 'existing@example.com',
          password: 'pass',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('E-mail já cadastrado!');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'secret',
      });
    });

    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'secret' });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login realizado com sucesso!');
      expect(res.body.user).toHaveProperty('email', 'login@example.com');
    });

    test('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('E-mail ou senha inválidos!');
    });
  });
});