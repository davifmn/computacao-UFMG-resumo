import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import workerRoutes from './workerRoutes.js';
import { Worker } from '../packages/worker.js';

let mongoServer;
let app;

// Вспомогательная функция для создания полного расписания
function createFullSchedule(occupiedDays = [], occupiedHours = []) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
  const schedule = {};
  days.forEach(day => {
    schedule[day] = {};
    hours.forEach(hour => {
      const isOccupied = occupiedDays.includes(day) && occupiedHours.includes(hour);
      schedule[day][hour] = isOccupied ? 'occupied' : 'free';
    });
  });
  return schedule;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = express();
  app.use(express.json());
  app.use('/api/workers', workerRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Worker.deleteMany({});
});

describe('Worker Routes', () => {
  describe('GET /api/workers', () => {
    test('should return empty array when no workers', async () => {
      const res = await request(app).get('/api/workers');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should return list of workers with name and specialties', async () => {
      const schedule1 = createFullSchedule();
      const schedule2 = createFullSchedule();
      await Worker.create([
        { name: 'João', specialties: ['Corte'], schedule: schedule1 },
        { name: 'Maria', specialties: ['Barba'], schedule: schedule2 },
      ]);
      const res = await request(app).get('/api/workers');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('name', 'João');
      expect(res.body[0]).toHaveProperty('specialties');
      expect(res.body[0]).not.toHaveProperty('schedule');
    });
  });

  describe('POST /api/workers/board', () => {
    let testWorkers;

    beforeEach(async () => {
      // Создаём тестовых воркеров с полным расписанием
      const scheduleFree = createFullSchedule(); // все свободны
      const scheduleOccupied = createFullSchedule(['Seg'], ['08:00']); // только Seg 08:00 занят
      testWorkers = await Worker.create([
        { name: 'Worker1', specialties: ['Corte', 'Barba'], schedule: scheduleFree },
        { name: 'Worker2', specialties: ['Corte'], schedule: scheduleOccupied },
      ]);
    });

    test('should return board for a specific worker (workerId)', async () => {
      const res = await request(app)
        .post('/api/workers/board')
        .send({ workerId: testWorkers[0]._id.toString(), services: ['Corte'] });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('days');
      expect(res.body).toHaveProperty('hours');
      expect(res.body).toHaveProperty('schedule');
      // Проверяем, что все слоты свободны (Worker1 free)
      const schedule = res.body.schedule;
      expect(schedule.Seg['08:00']).toBe('free');
      expect(schedule.Seg['09:00']).toBe('free');
    });

    test('should return board for any worker with required services (workerId: "any")', async () => {
      const res = await request(app)
        .post('/api/workers/board')
        .send({ workerId: 'any', services: ['Corte'] });
      expect(res.status).toBe(200);
      const schedule = res.body.schedule;
      // Worker1 free, Worker2 occupied at 08:00, so for 'any' it should be free (at least one free)
      expect(schedule.Seg['08:00']).toBe('free');
      expect(schedule.Seg['09:00']).toBe('free');
    });

    test('should return 404 if no worker has all required specialties', async () => {
      const res = await request(app)
        .post('/api/workers/board')
        .send({ workerId: 'any', services: ['Corte', 'Barba', 'Sobrancelha'] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Nenhum especialista disponível para esses serviços.');
    });

    test('should return 404 if specific worker not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/workers/board')
        .send({ workerId: fakeId, services: ['Corte'] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Nenhum especialista disponível para esses serviços.');
    });

    test('should return 500 on server error (e.g., invalid workerId format)', async () => {
      const res = await request(app)
        .post('/api/workers/board')
        .send({ workerId: 'invalid-id', services: ['Corte'] });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro ao gerar o quadro de horários.');
    });
  });
});