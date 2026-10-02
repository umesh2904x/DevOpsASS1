'use strict';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../src/app');
const cartService = require('../src/services/cartService');
const orderService = require('../src/services/orderService');

const api = () => request(app());
const SID = 'x-session-id';

test.beforeEach(() => {
  cartService.reset();
  orderService.reset();
});

test('health endpoint reports ok', async () => {
  const res = await api().get('/api/health').expect(200);
  assert.strictEqual(res.body.status, 'ok');
});

test('lists the seeded catalogue', async () => {
  const res = await api().get('/api/products').expect(200);
  assert.ok(res.body.count >= 8);
});

test('filters catalogue by category and search', async () => {
  const res = await api().get('/api/products?category=Wearables').expect(200);
  assert.ok(res.body.items.every((p) => p.category === 'Wearables'));

  const search = await api().get('/api/products?search=keyboard').expect(200);
  assert.strictEqual(search.body.count, 1);
});

test('returns 404 for unknown product', async () => {
  const res = await api().get('/api/products/P-9999').expect(404);
  assert.strictEqual(res.body.error, 'PRODUCT_NOT_FOUND');
});

test('adds items to cart and computes totals', async () => {
  await api().post('/api/cart/items').set(SID, 'a').send({ productId: 'P-1003', qty: 2 }).expect(201);
  const res = await api().get('/api/cart').set(SID, 'a').expect(200);
  assert.strictEqual(res.body.itemCount, 2);
  assert.strictEqual(res.body.pricing.subtotal, 2 * 4299);
});

test('rejects invalid quantity', async () => {
  const res = await api().post('/api/cart/items').set(SID, 'b').send({ productId: 'P-1003', qty: 0 }).expect(400);
  assert.strictEqual(res.body.error, 'INVALID_QUANTITY');
});

test('rejects quantity above available stock', async () => {
  const res = await api().post('/api/cart/items').set(SID, 'c').send({ productId: 'P-1004', qty: 8 }).expect(409);
  assert.strictEqual(res.body.error, 'INSUFFICIENT_STOCK');
});

test('rejects quantity above the per-order cap', async () => {
  const res = await api().post('/api/cart/items').set(SID, 'c2').send({ productId: 'P-1001', qty: 11 }).expect(400);
  assert.strictEqual(res.body.error, 'MAX_QUTY_EXCEEDED');
});

test('applies 10% discount above 4999', async () => {
  await api().post('/api/cart/items').set(SID, 'd').send({ productId: 'P-1001', qty: 1 }).expect(201);
  const res = await api().get('/api/cart').set(SID, 'd').expect(200);
  assert.strictEqual(res.body.pricing.discount, Math.round(7499 * 0.1));
});

test('removes an item from the cart', async () => {
  await api().post('/api/cart/items').set(SID, 'e').send({ productId: 'P-1005', qty: 1 }).expect(201);
  await api().delete('/api/cart/items/P-1005').set(SID, 'e').expect(200);
  const res = await api().get('/api/cart').set(SID, 'e').expect(200);
  assert.strictEqual(res.body.itemCount, 0);
});

test('places a COD order and empties the cart', async () => {
  await api().post('/api/cart/items').set(SID, 'f').send({ productId: 'P-1005', qty: 3 }).expect(201);
  const res = await api()
    .post('/api/orders')
    .set(SID, 'f')
    .send({
      customer: { name: 'Aarav Sharma', email: 'aarav@example.com', address: 'Pune' },
      paymentMethod: 'COD'
    })
    .expect(201);

  assert.match(res.body.id, /^ORD-/);
  assert.strictEqual(res.body.status, 'CONFIRMED');
  const cart = await api().get('/api/cart').set(SID, 'f').expect(200);
  assert.strictEqual(cart.body.itemCount, 0);
});

test('rejects order with invalid email', async () => {
  await api().post('/api/cart/items').set(SID, 'g').send({ productId: 'P-1005', qty: 1 }).expect(201);
  const res = await api()
    .post('/api/orders')
    .set(SID, 'g')
    .send({ customer: { name: 'X', email: 'not-an-email', address: 'Pune' }, paymentMethod: 'COD' })
    .expect(400);
  assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
});

test('rejects order on empty cart', async () => {
  const res = await api()
    .post('/api/orders')
    .set(SID, 'h')
    .send({ customer: { name: 'X', email: 'x@example.com', address: 'Pune' }, paymentMethod: 'CARD' })
    .expect(400);
  assert.strictEqual(res.body.error, 'EMPTY_CART');
});

test('unknown route returns 404', async () => {
  await api().get('/api/does-not-exist').expect(404);
});

test('creates a tracking timeline when an order is placed', async () => {
  await api().post('/api/cart/items').set(SID, 't1').send({ productId: 'P-1005', qty: 1 }).expect(201);
  const placed = await api()
    .post('/api/orders')
    .set(SID, 't1')
    .send({ customer: { name: 'Rahul', email: 'rahul@example.com', address: 'Mumbai' }, paymentMethod: 'COD' })
    .expect(201);

  const res = await api().get(`/api/orders/${placed.body.id}/tracking`).expect(200);
  assert.strictEqual(res.body.events[0].status, 'PLACED');
  assert.match(res.body.trackingNumber, /^SVE/);
});

test('advances shipment status and refuses to move backwards', async () => {
  await api().post('/api/cart/items').set(SID, 't2').send({ productId: 'P-1005', qty: 1 }).expect(201);
  const placed = await api()
    .post('/api/orders')
    .set(SID, 't2')
    .send({ customer: { name: 'Rahul', email: 'rahul@example.com', address: 'Mumbai' }, paymentMethod: 'COD' })
    .expect(201);

  await api().post(`/api/orders/${placed.body.id}/tracking`).set(SID, 't2').send({ status: 'SHIPPED' }).expect(200);

  const back = await api().post(`/api/orders/${placed.body.id}/tracking`).set(SID, 't2').send({ status: 'PACKED' }).expect(409);
  assert.strictEqual(back.body.error, 'INVALID_STATUS_TRANSITION');

  const unknown = await api().post(`/api/orders/${placed.body.id}/tracking`).set(SID, 't2').send({ status: 'TELEPORTED' }).expect(400);
  assert.strictEqual(unknown.body.error, 'INVALID_STATUS');
});
