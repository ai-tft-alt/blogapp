import request from 'supertest';
import { app } from '../src/app.js';

export const api = () => request(app);

let counter = 0;

export async function registerUser(name = 'Tester') {
  counter += 1;
  const email = `user${Date.now()}-${counter}@test.com`;
  const res = await api()
    .post('/api/v1/auth/register')
    .send({ email, name, password: 'password123' });
  return { token: res.body.data.token as string, email };
}

export async function loginAlice() {
  const res = await api()
    .post('/api/v1/auth/login')
    .send({ email: 'alice@blogapp.com', password: 'password123' });
  return res.body.data.token as string;
}
