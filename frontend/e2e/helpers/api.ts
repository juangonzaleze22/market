import { APIRequestContext, expect } from '@playwright/test';
import './env';

export const API_URL = process.env['API_URL'] ?? 'http://localhost:3000/api';

export const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD'] ?? 'admin123';
export const DELIVERY_EMAIL = process.env['E2E_DELIVERY_EMAIL'] ?? 'delivery@example.com';
export const DELIVERY_PASSWORD = process.env['E2E_DELIVERY_PASSWORD'] ?? 'delivery123';
export const WAREHOUSE_EMAIL = process.env['E2E_WAREHOUSE_EMAIL'] ?? 'bodega@example.com';
export const WAREHOUSE_PASSWORD = process.env['E2E_WAREHOUSE_PASSWORD'] ?? 'bodega123';

export interface Credentials {
  email: string;
  password: string;
  token: string;
  userId: string;
}

export async function login(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `login ${email} failed`).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}

export async function adminToken(request: APIRequestContext): Promise<string> {
  return login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function registerCustomer(
  request: APIRequestContext,
): Promise<Credentials> {
  const email = `e2e-chat-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const password = 'E2ePassword123';
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { email, password, firstName: 'E2E', lastName: 'Chat' },
  });
  expect(res.status(), 'register customer failed').toBe(202);
  const body = await res.json();

  if (body.devVerificationToken) {
    const verified = await request.post(`${API_URL}/auth/verify-email`, {
      data: { token: body.devVerificationToken },
    });
    expect(verified.ok(), 'verify customer failed').toBeTruthy();
  } else {
    expect(
      false,
      'AUTH_EXPOSE_VERIFICATION_TOKEN debe estar activo en el backend de pruebas',
    ).toBeTruthy();
  }

  const loginRes = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  expect(loginRes.ok(), `login ${email} failed`).toBeTruthy();
  const auth = await loginRes.json();
  return { email, password, token: auth.token, userId: auth.user.id };
}

export async function ensureAddress(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const headers = { Authorization: `Bearer ${token}` };
  const existing = await request.get(`${API_URL}/addresses`, { headers });
  const list = await existing.json();
  if (Array.isArray(list) && list.length > 0) {
    return list[0].id as string;
  }

  const created = await request.post(`${API_URL}/addresses`, {
    headers,
    data: {
      street: 'Calle E2E 123',
      city: 'Caracas',
      state: 'Distrito Capital',
      zipCode: '1010',
      country: 'Venezuela',
      isDefault: true,
    },
  });
  expect(created.ok(), 'create address failed').toBeTruthy();
  const body = await created.json();
  return body.id as string;
}

export async function firstProductId(
  request: APIRequestContext,
): Promise<string> {
  const res = await request.get(`${API_URL}/products?inStock=true`);
  const body = await res.json();
  const list = Array.isArray(body) ? body : body?.data;
  expect(Array.isArray(list) && list.length > 0, 'no products seeded').toBeTruthy();
  return list[0].id as string;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
}

export async function createOrder(
  request: APIRequestContext,
  customer: Credentials,
): Promise<CreatedOrder> {
  const headers = { Authorization: `Bearer ${customer.token}` };
  const addressId = await ensureAddress(request, customer.token);
  const productId = await firstProductId(request);

  await request.delete(`${API_URL}/cart`, { headers });
  const added = await request.post(`${API_URL}/cart`, {
    headers,
    data: { productId, quantity: 1 },
  });
  expect(added.ok(), 'add to cart failed').toBeTruthy();

  const res = await request.post(`${API_URL}/orders`, {
    headers,
    data: { shippingAddressId: addressId, paymentMethod: 'Efectivo' },
  });
  expect(res.ok(), 'create order failed').toBeTruthy();
  const body = await res.json();
  return { id: body.id as string, orderNumber: body.orderNumber as string };
}

export async function acceptOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const token = await adminToken(request);
  const res = await request.patch(`${API_URL}/admin/orders/${orderId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status: 'paid' },
  });
  expect(res.ok(), 'accept order failed').toBeTruthy();
}

export async function deliveryToken(
  request: APIRequestContext,
): Promise<string> {
  return login(request, DELIVERY_EMAIL, DELIVERY_PASSWORD);
}

export async function warehouseToken(
  request: APIRequestContext,
): Promise<string> {
  return login(request, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);
}

export async function startWarehousePreparation(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const token = await warehouseToken(request);
  const res = await request.post(
    `${API_URL}/warehouse/orders/${orderId}/start`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(res.ok(), 'warehouse start failed').toBeTruthy();
}

export async function shipOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const token = await adminToken(request);
  const res = await request.patch(`${API_URL}/admin/orders/${orderId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status: 'shipped' },
  });
  expect(res.ok(), 'ship order failed').toBeTruthy();
}

export async function deliverOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const token = await adminToken(request);
  const res = await request.patch(`${API_URL}/admin/orders/${orderId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status: 'delivered' },
  });
  expect(res.ok(), 'deliver order failed').toBeTruthy();
}

export async function deliveryAccept(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const token = await deliveryToken(request);
  const res = await request.post(`${API_URL}/delivery/orders/${orderId}/accept`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), 'delivery accept failed').toBeTruthy();
}

export async function deliverySetLocation(
  request: APIRequestContext,
  orderId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const token = await deliveryToken(request);
  const res = await request.patch(
    `${API_URL}/delivery/orders/${orderId}/location`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { latitude, longitude },
    },
  );
  expect(res.ok(), 'delivery location failed').toBeTruthy();
}

export async function sendCustomerMessage(
  request: APIRequestContext,
  customer: Credentials,
  orderId: string,
  body: string,
): Promise<void> {
  const res = await request.post(`${API_URL}/orders/${orderId}/messages`, {
    headers: { Authorization: `Bearer ${customer.token}` },
    data: { body },
  });
  expect(res.ok(), 'send customer message failed').toBeTruthy();
}

export async function sendAdminMessage(
  request: APIRequestContext,
  orderId: string,
  body: string,
): Promise<void> {
  const token = await adminToken(request);
  const res = await request.post(`${API_URL}/admin/orders/${orderId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { body },
  });
  expect(res.ok(), 'send admin message failed').toBeTruthy();
}
