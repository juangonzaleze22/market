import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra sin revelar token de sesión y bloquea el login sin verificar', async () => {
    const email = uniqueEmail('e2e-register');
    const password = 'Market1234';

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, firstName: 'E2E', lastName: 'Register' })
      .expect(202);

    expect(register.body.message).toBeTruthy();
    expect(register.body.token).toBeUndefined();
    expect(register.body.devVerificationToken).toBeTruthy();

    const blocked = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(403);
    expect(blocked.body.code).toBe('EMAIL_NOT_VERIFIED');

    const verify = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: register.body.devVerificationToken })
      .expect(200);
    expect(verify.body.user.emailVerified).toBe(true);
    expect(verify.body.token).toBeTruthy();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: password.toUpperCase() })
      .expect(401);
    expect(login.body.message).toBeDefined();

    const ok = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    expect(ok.body.user.email).toBe(email);
  });

  it('normaliza el correo y responde genéricamente ante duplicados', async () => {
    const email = uniqueEmail('e2e-dup');
    const password = 'Market1234';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, firstName: 'Dup', lastName: 'User' })
      .expect(202);

    const duplicate = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `  ${email.toUpperCase()} `,
        password,
        firstName: 'Dup',
        lastName: 'User',
      })
      .expect(202);

    expect(duplicate.body.message).toBeTruthy();
    expect(duplicate.body.devVerificationToken).toBeUndefined();
  });

  it('rechaza contraseñas débiles', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('e2e-weak'),
        password: 'abcdefgh',
        firstName: 'Weak',
        lastName: 'User',
      })
      .expect(400);
  });

  it('responde genéricamente a forgot-password', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail('e2e-missing') })
      .expect(202);

    expect(response.body.message).toBeTruthy();
  });
});
